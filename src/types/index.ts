export interface Signal {
  id: string;
  workspace_id: string;
  source_type: string;
  source_metadata?: Record<string, unknown> | null;
  raw_text: string;
  normalized_text: string | null;
  sentiment_label: 'Positive' | 'Neutral' | 'Negative' | 'Mixed' | null;
  severity_label: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' | null;
  category: string | null;
  product_area: string | null;
  created_by: string | null;
  created_at: string;
  account_id: string | null;
  accounts?: { name: string; arr: number; plan: string | null } | null;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logo_url: string | null;
  owner_id: string;
  onboarding_done: boolean;
  product_areas?: string[];
  segments?: string[];
  created_at: string;
  updated_at?: string;
}

export interface Account {
  id: string;
  workspace_id: string;
  name: string;
  domain: string | null;
  arr: number;
  plan: string | null;
  segment: string | null;
  health_score: number | null;
  churn_risk: 'low' | 'medium' | 'high' | 'critical' | null;
  renewal_date: string | null;
  notes: string | null;
  signal_count: number;
  last_signal_date: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Problem {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: 'Active' | 'Resolved' | 'Deferred' | 'Monitoring';
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | null;
  trend: 'Rising' | 'Stable' | 'Declining';
  product_area: string | null;
  evidence_count: number;
  affected_arr: number;
  first_seen: string;
  last_seen: string;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ScoreBreakdown {
  signal_count_score: number;
  affected_arr_score: number;
  severity_score: number;
  recency_score: number;
  weights: Record<string, number>;
  explanation: Record<string, string>;
}

export interface Opportunity {
  id: string;
  workspace_id: string;
  problem_id: string;
  opportunity_score: number;
  signal_count_score: number;
  affected_arr_score: number;
  severity_score: number;
  recency_score: number;
  // Legacy compat
  demand_score: number;
  pain_score: number;
  arr_score: number;
  trend_score: number;
  score_breakdown: ScoreBreakdown | null;
  affected_arr: number;
  affected_accounts: number;
  summary: string | null;
  recommended_action: 'Build' | 'Fix' | 'Improve' | 'Research' | 'Defer' | 'Kill' | null;
  last_scored_at: string;
  created_at: string;
  problems?: {
    id: string;
    title: string;
    evidence_count: number;
    affected_arr: number;
    description?: string | null;
    severity?: string | null;
  } | null;
}

export interface Decision {
  id: string;
  workspace_id: string;
  opportunity_id?: string | null;
  problem_id?: string | null;
  title: string;
  action: 'Build' | 'Fix' | 'Improve' | 'Research' | 'Defer' | 'Kill' | 'Monitor';
  rationale: string;
  author_id: string;
  created_at: string;
  updated_at?: string;
  users?: { full_name: string } | null;
  problems?: { id: string; title: string; severity?: string | null; evidence_count?: number; affected_arr?: number } | null;
  opportunities?: { id: string; opportunity_score: number; recommended_action?: string | null; score_breakdown?: ScoreBreakdown | null } | null;
}

export interface Artifact {
  id: string;
  workspace_id: string;
  decision_id: string;
  title: string;
  type: 'prd' | 'spec' | 'brief' | 'memo' | 'announcement' | 'retro' | 'other';
  content: string;
  version: number;
  author_id: string;
  external_url: string | null;
  external_id: string | null;
  jira_push_status: string | null;
  jira_pushed_at: string | null;
  created_at: string;
  updated_at: string;
  decisions?: { title: string } | null;
  users?: { full_name: string } | null;
}

export interface LaunchReview {
  id: string;
  launch_id: string;
  workspace_id: string;
  checkpoint: 'day_7' | 'day_30';
  baseline_signal_count: number;
  current_signal_count: number;
  signal_delta: number;
  affected_arr_before: number;
  affected_arr_after: number;
  affected_accounts_before: number;
  affected_accounts_after: number;
  pm_notes: string | null;
  reviewed_by: string;
  review_date: string;
  created_at: string;
}

export interface LaunchVerdict {
  id: string;
  launch_id: string;
  workspace_id: string;
  verdict: 'Solved' | 'Partially Solved' | 'Not Solved' | 'Regressed';
  notes: string | null;
  submitted_by: string;
  created_at: string;
}

export interface Launch {
  id: string;
  workspace_id: string;
  decision_id: string;
  problem_id: string | null;
  title: string;
  owner_id: string;
  launch_date: string | null;
  expected_outcome: string | null;
  target_metrics: string | null;
  status: 'active' | 'pending_review' | 'complete' | 'cancelled';
  day7_review_date: string | null;
  day30_review_date: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
  // Legacy compat
  action?: string;
  launched_at?: string;
  before_count?: number;
  after_count?: number;
  pm_verdict?: string;
  notes?: string;
  decisions?: { title: string; action: string; rationale?: string } | null;
  problems?: { title: string; severity?: string | null; affected_arr?: number } | null;
  launch_reviews?: LaunchReview[];
  launch_verdicts?: LaunchVerdict[];
  proof_summaries?: { summary: string }[];
}

export interface TeamMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  users?: { full_name: string; email?: string; avatar_url?: string } | null;
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  invited_email: string;
  invited_role: 'owner' | 'member';
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  // Legacy compat
  email?: string;
  role?: string;
}

export interface Subscription {
  id: string;
  workspace_id: string;
  plan_type: 'free' | 'starter' | 'growth' | 'scale';
  billing_status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused';
  external_sub_id: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  override_plan: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  plan_type: 'free' | 'starter' | 'growth' | 'scale';
  max_members: number;
  max_signals: number;
  max_uploads_per_month: number;
  max_ai_calls_per_day: number;
  max_ai_calls_per_month: number;
  jira_enabled: boolean;
  advanced_ai_enabled: boolean;
  custom_branding: boolean;
}

export interface Notification {
  id: string;
  workspace_id: string | null;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actors?: { full_name: string; email: string } | null;
}
