export interface Signal {
  id: string;
  workspace_id: string;
  source_type: string;
  raw_text: string;
  normalized_text: string | null;
  sentiment_label: string | null;
  severity_label: string | null;
  category: string | null;
  product_area: string | null;
  created_at: string;
  account_id: string | null;
  accounts?: { name: string; arr: number; plan: string; };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logo_url: string | null;
  product_areas?: string[];
  segments?: string[];
  created_at: string;
}

export interface Account {
  id: string;
  workspace_id: string;
  name: string;
  domain: string | null;
  arr: number;
  plan: string | null;
  health_score: string | null;
  signal_count?: number;
  last_signal_date?: string;
  renewal_date?: string;
  created_at: string;
}

export interface Problem {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string | null;
  trend: string | null;
  product_area: string | null;
  evidence_count: number;
  affected_arr: number;
  created_at: string;
}

export interface Opportunity {
  id: string;
  workspace_id: string;
  problem_id: string;
  opportunity_score: number;
  demand_score: number;
  pain_score: number;
  arr_score: number;
  trend_score: number;
  recommended_action: string | null;
  problems?: { id: string; title: string; evidence_count: number; affected_arr: number; };
}

export interface Decision {
  id: string;
  workspace_id: string;
  opportunity_id?: string;
  problem_id?: string;
  title: string;
  action: string;
  rationale: string;
  author_id: string;
  created_at: string;
  users?: { full_name: string };
}

export interface Artifact {
  id: string;
  workspace_id: string;
  decision_id: string;
  title: string;
  type: string;
  content: string;
  author_id: string;
  external_url: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  decisions?: { title: string };
  users?: { full_name: string };
}

export interface Launch {
  id: string;
  workspace_id: string;
  decision_id: string;
  launched_at: string;
  created_by: string;
  created_at: string;
  title: string;
  action: string;
  status: 'active' | 'pending_review' | 'complete';
  expected_outcome?: string;
  before_count?: number;
  after_count?: number;
  pm_verdict?: string;
  notes?: string;
}

export interface TeamMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  users?: { full_name: string; email?: string; avatar_url?: string };
}

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  token: string;
  created_at: string;
  expires_at: string;
}
