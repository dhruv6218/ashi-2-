// Edge Function: classify-signal
// Uses AI to classify a signal's sentiment, severity, category, and product area
// POST /functions/v1/classify-signal
// Body: { workspace_id, signal_id }
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
} from '../_shared/utils.ts';

async function classifyWithGemini(text: string, productAreas: string[]): Promise<Record<string, string>> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const prompt = `You are a product signal classifier. Analyze this customer feedback and return a JSON object with these exact keys:
- sentiment_label: one of "Positive", "Neutral", "Negative", "Mixed"
- severity_label: one of "Critical", "High", "Medium", "Low", "Info"
- category: one of "Bug", "Feature Request", "Complaint", "Praise", "Question", "Other"
- product_area: the most relevant area from this list: ${productAreas.join(', ')}. If none apply, pick the closest match or use "General".

Return ONLY valid JSON, no explanation.

Customer feedback: """${text.slice(0, 1000)}"""`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const result = await response.json();
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response');
  return JSON.parse(jsonMatch[0]);
}

async function classifyWithOpenRouter(text: string, productAreas: string[]): Promise<Record<string, string>> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const prompt = `You are a product signal classifier. Analyze this customer feedback and return a JSON object with these exact keys:
- sentiment_label: one of "Positive", "Neutral", "Negative", "Mixed"
- severity_label: one of "Critical", "High", "Medium", "Low", "Info"
- category: one of "Bug", "Feature Request", "Complaint", "Praise", "Question", "Other"
- product_area: the most relevant area from this list: ${productAreas.join(', ')}. If none apply, use "General".

Return ONLY valid JSON.

Customer feedback: """${text.slice(0, 1000)}"""`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://astrix.ai',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 256,
    }),
  });

  if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
  const result = await response.json();
  const content = result.choices?.[0]?.message?.content ?? '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in OpenRouter response');
  return JSON.parse(jsonMatch[0]);
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

  let body: { workspace_id: string; signal_id: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { workspace_id, signal_id } = body;
  if (!workspace_id || !signal_id) {
    return errorResponse('workspace_id and signal_id are required');
  }

  const membership = await getWorkspaceMembership(supabase, workspace_id, user.id);
  if (!membership) return errorResponse('Not a workspace member', 403);

  // Check AI quota (daily limit)
  const plan = await supabase
    .from('subscriptions')
    .select('plan_type')
    .eq('workspace_id', workspace_id)
    .single();
  const planType = plan.data?.plan_type ?? 'free';

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('max_ai_calls_per_day')
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
      return errorResponse(`Daily AI call limit (${dailyLimit}) reached for this workspace. Upgrade your plan for higher limits.`, 429);
    }
  }

  // Fetch signal
  const { data: signal, error: signalErr } = await supabase
    .from('signals')
    .select('raw_text, workspace_id')
    .eq('id', signal_id)
    .single();

  if (signalErr || !signal || signal.workspace_id !== workspace_id) {
    return errorResponse('Signal not found', 404);
  }

  // Fetch workspace product areas
  const { data: areas } = await supabase
    .from('product_areas')
    .select('name')
    .eq('workspace_id', workspace_id);
  const productAreas = (areas ?? []).map((a: any) => a.name);

  // Try Gemini first, fall back to OpenRouter
  let classification: Record<string, string>;
  try {
    classification = await classifyWithGemini(signal.raw_text, productAreas);
  } catch (primaryErr) {
    console.warn('Gemini failed, trying OpenRouter fallback:', primaryErr);
    try {
      classification = await classifyWithOpenRouter(signal.raw_text, productAreas);
    } catch (fallbackErr) {
      console.error('Both AI providers failed:', fallbackErr);
      return errorResponse('AI classification unavailable. Please try again later.', 503);
    }
  }

  // Validate and sanitize AI output
  const VALID_SENTIMENTS = ['Positive', 'Neutral', 'Negative', 'Mixed'];
  const VALID_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info'];
  const update: Record<string, string | null> = {
    sentiment_label: VALID_SENTIMENTS.includes(classification.sentiment_label) ? classification.sentiment_label : null,
    severity_label: VALID_SEVERITIES.includes(classification.severity_label) ? classification.severity_label : null,
    category: classification.category ?? null,
    product_area: classification.product_area ?? null,
  };

  const { error: updateErr } = await supabase
    .from('signals')
    .update(update)
    .eq('id', signal_id)
    .eq('workspace_id', workspace_id);

  if (updateErr) {
    return errorResponse('Failed to update signal classification', 500);
  }

  await trackUsage(supabase, { workspace_id, user_id: user.id, event_type: 'ai_call', feature: 'classify_signal' });

  return jsonResponse({ signal_id, classification: update });
});
