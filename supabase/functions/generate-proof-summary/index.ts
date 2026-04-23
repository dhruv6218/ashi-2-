// Edge Function: generate-proof-summary
// Generates an AI-assisted outcome summary after launch reviews
// POST /functions/v1/generate-proof-summary
// Body: { workspace_id, launch_id }
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

async function generateSummary(context: string): Promise<string> {
  // Try Gemini first
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are summarizing the outcome of a product launch for a product team.
Write a concise, honest proof summary in 3-5 sentences. Cover:
1. What was launched and why
2. What the data shows (signal count change, ARR impact)
3. An honest assessment of whether the problem was solved

Be direct and evidence-based. No marketing language.

Launch data:
${context}`,
              }],
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
          }),
        },
      );
      if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        if (text) return text;
      }
    } catch (e) {
      console.warn('Gemini failed for proof summary:', e);
    }
  }

  // OpenRouter fallback
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (openRouterKey) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://astrix.ai',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [{
          role: 'user',
          content: `Summarize this product launch outcome in 3-5 honest, evidence-based sentences:\n\n${context}`,
        }],
        temperature: 0.3,
        max_tokens: 512,
      }),
    });
    if (response.ok) {
      const result = await response.json();
      return result.choices?.[0]?.message?.content ?? '';
    }
  }

  throw new Error('No AI provider available');
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

  let body: { workspace_id: string; launch_id: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { workspace_id, launch_id } = body;
  if (!workspace_id || !launch_id) {
    return errorResponse('workspace_id and launch_id are required');
  }

  const membership = await getWorkspaceMembership(supabase, workspace_id, user.id);
  if (!membership) return errorResponse('Not a workspace member', 403);

  // Fetch launch with reviews and verdict
  const { data: launch, error: launchErr } = await supabase
    .from('launches')
    .select(`
      id, title, expected_outcome, workspace_id,
      decisions:decision_id(title, action, rationale),
      problems:problem_id(title, severity, affected_arr),
      launch_reviews(*),
      launch_verdicts(verdict, notes)
    `)
    .eq('id', launch_id)
    .single();

  if (launchErr || !launch || launch.workspace_id !== workspace_id) {
    return errorResponse('Launch not found', 404);
  }

  const reviews: any[] = (launch.launch_reviews as any[]) ?? [];
  const verdict = (launch.launch_verdicts as any)?.[0];

  const contextParts = [
    `Launch: ${launch.title}`,
    `Decision: ${(launch.decisions as any)?.title ?? 'N/A'} — Action: ${(launch.decisions as any)?.action ?? 'N/A'}`,
    `Expected Outcome: ${launch.expected_outcome ?? 'N/A'}`,
    `Problem: ${(launch.problems as any)?.title ?? 'N/A'} (Severity: ${(launch.problems as any)?.severity ?? 'N/A'}, ARR at risk: $${Number((launch.problems as any)?.affected_arr ?? 0).toLocaleString()})`,
  ];

  for (const review of reviews.sort((a, b) => a.checkpoint.localeCompare(b.checkpoint))) {
    contextParts.push(
      `${review.checkpoint.replace('_', ' ').toUpperCase()} Review:`,
      `  Signal delta: ${review.baseline_signal_count} → ${review.current_signal_count} (${review.signal_delta >= 0 ? '+' : ''}${review.signal_delta})`,
      `  ARR at risk: $${Number(review.affected_arr_before).toLocaleString()} → $${Number(review.affected_arr_after).toLocaleString()}`,
      `  PM Notes: ${review.pm_notes ?? 'None'}`,
    );
  }

  if (verdict) {
    contextParts.push(`Final Verdict: ${verdict.verdict}`, `Verdict Notes: ${verdict.notes ?? 'None'}`);
  }

  const context = contextParts.join('\n');

  let summary: string;
  try {
    summary = await generateSummary(context);
  } catch (err) {
    console.error('generate-proof-summary failed:', err);
    return errorResponse('AI summary generation unavailable.', 503);
  }

  // Upsert proof summary
  await supabase.from('proof_summaries').upsert({
    launch_id,
    workspace_id,
    summary,
    generated_by: 'ai',
  }, { onConflict: 'launch_id' });

  await trackUsage(supabase, { workspace_id, user_id: user.id, event_type: 'ai_call', feature: 'proof_summary' });
  await logActivity(supabase, {
    workspace_id,
    actor_id: user.id,
    event_type: 'proof_summary_generated',
    entity_type: 'launch',
    entity_id: launch_id,
  });

  return jsonResponse({ launch_id, summary });
});
