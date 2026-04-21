// Edge Function: score-opportunity
// Calculates a transparent weighted opportunity score for a problem
// POST /functions/v1/score-opportunity
// Body: { workspace_id, problem_id }
// Auth: Bearer token required; caller must be workspace member

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  getAuthUser,
  getWorkspaceMembership,
  logActivity,
} from '../_shared/utils.ts';

// Weights must sum to 1.0
const WEIGHTS = {
  signal_count: 0.30,
  affected_arr:  0.35,
  severity:      0.20,
  recency:       0.15,
};

/** Map severity string to a 0-100 score */
function severityScore(severity: string | null): number {
  switch (severity) {
    case 'Critical': return 100;
    case 'High':     return 75;
    case 'Medium':   return 50;
    case 'Low':      return 25;
    default:         return 10;
  }
}

/** Recency score: 100 for signals in last 7 days, decays to 10 over 90 days */
function recencyScore(lastSeen: string | null): number {
  if (!lastSeen) return 10;
  const ageInDays = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays <= 7)  return 100;
  if (ageInDays <= 30) return 80;
  if (ageInDays <= 60) return 50;
  if (ageInDays <= 90) return 25;
  return 10;
}

/** Normalize a raw number to 0-100 using workspace max as ceiling */
function normalizeToHundred(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, (value / max) * 100);
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

  let body: { workspace_id: string; problem_id: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { workspace_id, problem_id } = body;
  if (!workspace_id || !problem_id) {
    return errorResponse('workspace_id and problem_id are required');
  }

  const membership = await getWorkspaceMembership(supabase, workspace_id, user.id);
  if (!membership) return errorResponse('Not a workspace member', 403);

  // Fetch the problem
  const { data: problem, error: probErr } = await supabase
    .from('problems')
    .select('id, evidence_count, affected_arr, severity, last_seen, workspace_id')
    .eq('id', problem_id)
    .single();

  if (probErr || !problem || problem.workspace_id !== workspace_id) {
    return errorResponse('Problem not found', 404);
  }

  // Fetch workspace-wide max values for normalization
  const { data: maxData } = await supabase
    .from('problems')
    .select('evidence_count, affected_arr')
    .eq('workspace_id', workspace_id)
    .order('evidence_count', { ascending: false })
    .limit(1);

  const maxSignals = (maxData?.[0]?.evidence_count as number) ?? 1;
  const maxArr     = (maxData?.[0]?.affected_arr as number) ?? 1;

  // Compute dimension scores
  const signalCountScore = normalizeToHundred(problem.evidence_count, maxSignals);
  const affectedArrScore = normalizeToHundred(Number(problem.affected_arr), maxArr);
  const sevScore         = severityScore(problem.severity);
  const recScore         = recencyScore(problem.last_seen);

  const opportunityScore =
    WEIGHTS.signal_count * signalCountScore +
    WEIGHTS.affected_arr  * affectedArrScore +
    WEIGHTS.severity       * sevScore +
    WEIGHTS.recency        * recScore;

  const scoreBreakdown = {
    signal_count_score: Math.round(signalCountScore * 100) / 100,
    affected_arr_score: Math.round(affectedArrScore * 100) / 100,
    severity_score:     Math.round(sevScore * 100) / 100,
    recency_score:      Math.round(recScore * 100) / 100,
    weights: WEIGHTS,
    explanation: {
      signal_count: `${problem.evidence_count} signals (max in workspace: ${maxSignals})`,
      affected_arr:  `$${Number(problem.affected_arr).toLocaleString()} ARR at risk`,
      severity:      `Severity: ${problem.severity ?? 'Unknown'}`,
      recency:       `Last seen: ${problem.last_seen ?? 'Unknown'}`,
    },
  };

  // Determine recommended action based on score
  let recommended_action: string;
  if (opportunityScore >= 80)      recommended_action = 'Build';
  else if (opportunityScore >= 60) recommended_action = 'Fix';
  else if (opportunityScore >= 40) recommended_action = 'Improve';
  else if (opportunityScore >= 20) recommended_action = 'Research';
  else                             recommended_action = 'Defer';

  const scoreRounded = Math.round(opportunityScore * 100) / 100;

  // Upsert opportunity
  const { data: existing } = await supabase
    .from('opportunities')
    .select('id')
    .eq('problem_id', problem_id)
    .eq('workspace_id', workspace_id)
    .maybeSingle();

  const opportunityData = {
    workspace_id,
    problem_id,
    opportunity_score: scoreRounded,
    signal_count_score: signalCountScore,
    affected_arr_score: affectedArrScore,
    severity_score: sevScore,
    recency_score: recScore,
    demand_score: signalCountScore,
    pain_score: sevScore,
    arr_score: affectedArrScore,
    trend_score: recScore,
    score_breakdown: scoreBreakdown,
    affected_arr: problem.affected_arr,
    recommended_action,
    last_scored_at: new Date().toISOString(),
  };

  let opportunityId: string;

  if (existing) {
    await supabase.from('opportunities').update(opportunityData).eq('id', existing.id);
    opportunityId = existing.id;
  } else {
    const { data: inserted } = await supabase
      .from('opportunities')
      .insert(opportunityData)
      .select('id')
      .single();
    opportunityId = inserted?.id;
  }

  await logActivity(supabase, {
    workspace_id,
    actor_id: user.id,
    event_type: 'opportunity_scored',
    entity_type: 'opportunity',
    entity_id: opportunityId,
    metadata: { score: scoreRounded, problem_id },
  });

  return jsonResponse({
    opportunity_id: opportunityId,
    opportunity_score: scoreRounded,
    score_breakdown: scoreBreakdown,
    recommended_action,
  });
});
