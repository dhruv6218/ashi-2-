// Edge Function: generate-artifact
// Uses AI to draft a product artifact from decision context
// POST /functions/v1/generate-artifact
// Body: { workspace_id, decision_id, artifact_type }
// Auth: Bearer token required; caller must be workspace member

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  getAuthUser,
  getWorkspaceMembership,
  trackUsage,
  logActivity,
} from '../_shared/utils.ts';

const ARTIFACT_PROMPTS: Record<string, string> = {
  prd: `You are a senior product manager. Write a clear, evidence-based Product Requirements Document (PRD) in Markdown.
Structure: ## Problem Statement, ## Goals & Success Metrics, ## Scope (In/Out), ## User Stories, ## Acceptance Criteria.
Be specific. Ground every claim in the evidence provided. No fluff.`,

  spec: `You are a senior engineer. Write a focused Technical Specification in Markdown.
Structure: ## Overview, ## Architecture Decision, ## Data Model Changes, ## API Changes, ## Implementation Plan, ## Risks.
Be precise. Reference the problem context provided.`,

  brief: `You are a product strategist. Write a concise Product Brief in Markdown (max 400 words).
Structure: ## One-liner, ## Problem, ## Solution, ## Why Now, ## Metrics.`,

  memo: `You are a product lead writing an internal memo. Write in plain, direct Markdown.
Structure: ## Summary, ## Background, ## Decision, ## Next Steps.`,

  announcement: `You are writing a product launch announcement. Keep it clear, benefit-focused, and professional.
Structure: ## What We Built, ## Why It Matters, ## How to Use It, ## What's Next.`,

  retro: `You are facilitating a product retrospective. Write an honest, balanced retro in Markdown.
Structure: ## What We Did, ## What Worked, ## What Didn't Work, ## What We'll Do Differently.`,
};

async function generateWithGroq(prompt: string, context: string): Promise<string> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: context },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function generateWithGemini(prompt: string, context: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\n${context}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const user = await getAuthUser(req, supabase);
  if (!user) return errorResponse('Unauthorized', 401);

  let body: { workspace_id: string; decision_id: string; artifact_type: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { workspace_id, decision_id, artifact_type = 'prd' } = body;
  if (!workspace_id || !decision_id) {
    return errorResponse('workspace_id and decision_id are required');
  }

  const membership = await getWorkspaceMembership(supabase, workspace_id, user.id);
  if (!membership) return errorResponse('Not a workspace member', 403);

  // Check plan for advanced AI
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type')
    .eq('workspace_id', workspace_id)
    .single();
  const planType = sub?.plan_type ?? 'free';

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('max_ai_calls_per_day, advanced_ai_enabled')
    .eq('plan_type', planType)
    .single();

  const dailyLimit = limits?.max_ai_calls_per_day ?? 10;
  if (dailyLimit > 0) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id)
      .eq('event_type', 'ai_call')
      .gte('created_at', dayStart.toISOString());
    if ((count ?? 0) >= dailyLimit) {
      return errorResponse(`Daily AI limit (${dailyLimit}) reached. Upgrade for more.`, 429);
    }
  }

  // Fetch decision with context
  const { data: decision, error: decErr } = await supabase
    .from('decisions')
    .select(`
      id, title, action, rationale, workspace_id,
      problems:problem_id(title, description, severity, evidence_count, affected_arr),
      opportunities:opportunity_id(opportunity_score, score_breakdown, recommended_action)
    `)
    .eq('id', decision_id)
    .single();

  if (decErr || !decision || decision.workspace_id !== workspace_id) {
    return errorResponse('Decision not found', 404);
  }

  const systemPrompt = ARTIFACT_PROMPTS[artifact_type] ?? ARTIFACT_PROMPTS.prd;

  const context = `
Decision Title: ${decision.title}
Action: ${decision.action}
Rationale: ${decision.rationale}

Problem: ${(decision.problems as any)?.title ?? 'N/A'}
Problem Description: ${(decision.problems as any)?.description ?? 'N/A'}
Severity: ${(decision.problems as any)?.severity ?? 'N/A'}
Evidence Count: ${(decision.problems as any)?.evidence_count ?? 0} customer signals
Affected ARR: $${Number((decision.problems as any)?.affected_arr ?? 0).toLocaleString()}

Opportunity Score: ${(decision.opportunities as any)?.opportunity_score ?? 'N/A'}/100
Recommended Action: ${(decision.opportunities as any)?.recommended_action ?? 'N/A'}
`.trim();

  // Use Groq for paid plans, Gemini for free
  const useGroq = limits?.advanced_ai_enabled && Deno.env.get('GROQ_API_KEY');
  let content: string;

  try {
    if (useGroq) {
      content = await generateWithGroq(systemPrompt, context);
    } else {
      content = await generateWithGemini(systemPrompt, context);
    }
  } catch (err) {
    console.error('Artifact generation failed:', err);
    // Try fallback
    try {
      content = await generateWithGemini(systemPrompt, context);
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
      return errorResponse('AI generation unavailable. Please try again later.', 503);
    }
  }

  if (!content || content.trim().length === 0) {
    return errorResponse('AI returned empty content. Please try again.', 500);
  }

  await trackUsage(supabase, { workspace_id, user_id: user.id, event_type: 'ai_call', feature: 'generate_artifact' });
  await logActivity(supabase, {
    workspace_id,
    actor_id: user.id,
    event_type: 'artifact_generated',
    entity_type: 'decision',
    entity_id: decision_id,
    metadata: { artifact_type },
  });

  return jsonResponse({ content, artifact_type, decision_id });
});
