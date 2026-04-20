// Centralized Mock Data for Frontend-Only Prototype

export const MOCK_USER = {
  id: 'user-1',
  email: 'demo@astrix.ai',
  user_metadata: { full_name: 'Demo User' }
};

export const MOCK_WORKSPACE = {
  id: 'ws-1',
  name: 'Acme Corp',
  slug: 'acme',
  timezone: 'UTC',
  logo_url: null
};

export const MOCK_ACCOUNTS = [
  { id: 'acc-1', workspace_id: 'ws-1', name: 'CloudScale Inc', domain: 'cloudscale.com', arr: 1200000, plan: 'Enterprise', health_score: '84', signal_count: 12, last_signal_date: new Date(Date.now() - 2 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: 'acc-2', workspace_id: 'ws-1', name: 'TechFlow', domain: 'techflow.io', arr: 840000, plan: 'Enterprise', health_score: '42', signal_count: 8, last_signal_date: new Date(Date.now() - 5 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: 'acc-3', workspace_id: 'ws-1', name: 'DataSync', domain: 'datasync.co', arr: 45000, plan: 'Standard', health_score: '91', signal_count: 3, last_signal_date: new Date(Date.now() - 12 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: 'acc-4', workspace_id: 'ws-1', name: 'Loomis', domain: 'loomis.ai', arr: 250000, plan: 'Growth', health_score: '65', signal_count: 5, last_signal_date: new Date(Date.now() - 1 * 86400000).toISOString(), created_at: new Date().toISOString() },
];

export const MOCK_PROBLEMS = [
  { id: 'prob-1', workspace_id: 'ws-1', title: 'SAML SSO Integration Missing', description: 'Enterprise customers are blocked from deploying widely because we lack Okta/Azure AD SAML support.', status: 'Active', severity: 'Critical', trend: 'Rising', product_area: 'Authentication', evidence_count: 84, affected_arr: 2040000, created_at: new Date().toISOString() },
  { id: 'prob-2', workspace_id: 'ws-1', title: 'API Rate Limits Too Strict', description: 'Power users are hitting the 100 req/min limit during peak hours, causing sync failures.', status: 'Active', severity: 'High', trend: 'Stable', product_area: 'API', evidence_count: 42, affected_arr: 840000, created_at: new Date().toISOString() },
  { id: 'prob-3', workspace_id: 'ws-1', title: 'Dark Mode Support', description: 'Users are requesting a dark theme for late-night usage.', status: 'Active', severity: 'Low', trend: 'Declining', product_area: 'Core UI', evidence_count: 312, affected_arr: 45000, created_at: new Date().toISOString() },
];

export const MOCK_OPPORTUNITIES = [
  { id: 'opp-1', workspace_id: 'ws-1', problem_id: 'prob-1', opportunity_score: 92, demand_score: 85, pain_score: 95, arr_score: 98, trend_score: 80, recommended_action: 'Build', problems: MOCK_PROBLEMS[0] },
  { id: 'opp-2', workspace_id: 'ws-1', problem_id: 'prob-2', opportunity_score: 78, demand_score: 60, pain_score: 85, arr_score: 80, trend_score: 50, recommended_action: 'Fix', problems: MOCK_PROBLEMS[1] },
  { id: 'opp-3', workspace_id: 'ws-1', problem_id: 'prob-3', opportunity_score: 41, demand_score: 95, pain_score: 30, arr_score: 15, trend_score: 40, recommended_action: 'Defer', problems: MOCK_PROBLEMS[2] },
];

export const MOCK_SIGNALS = [
  { id: 'sig-1', workspace_id: 'ws-1', account_id: 'acc-1', source_type: 'Slack', raw_text: "We cannot renew our contract next quarter unless SAML SSO is implemented. IT is mandating Okta for all vendors.", normalized_text: "Customer requires SAML SSO (Okta) for contract renewal due to IT mandates.", sentiment_label: "Negative", severity_label: "Critical", category: "Feature Request", product_area: "Authentication", created_at: new Date().toISOString(), accounts: MOCK_ACCOUNTS[0] },
  { id: 'sig-2', workspace_id: 'ws-1', account_id: 'acc-2', source_type: 'Intercom', raw_text: "Our data sync keeps failing with a 429 Too Many Requests error. We need higher API limits.", normalized_text: "Data sync failing due to 429 Too Many Requests. Requesting higher API limits.", sentiment_label: "Negative", severity_label: "High", category: "Bug", product_area: "API", created_at: new Date().toISOString(), accounts: MOCK_ACCOUNTS[1] },
  { id: 'sig-3', workspace_id: 'ws-1', account_id: 'acc-3', source_type: 'Discord', raw_text: "Any updates on dark mode? My eyes are burning.", normalized_text: "User requesting dark mode theme.", sentiment_label: "Neutral", severity_label: "Low", category: "Feature Request", product_area: "Core UI", created_at: new Date().toISOString(), accounts: MOCK_ACCOUNTS[2] },
];

export const MOCK_DECISIONS = [
  { id: 'dec-1', workspace_id: 'ws-1', opportunity_id: 'opp-1', problem_id: 'prob-1', title: 'SAML SSO Integration Missing', action: 'Build', rationale: 'This is blocking $2M+ in Enterprise renewals. The engineering effort is estimated at 3 sprints, which is highly justified by the ARR retention.', author_id: 'user-1', created_at: new Date(Date.now() - 86400000).toISOString(), users: { full_name: 'Demo User' } },
];

export const MOCK_ARTIFACTS = [
  { id: 'art-1', workspace_id: 'ws-1', decision_id: 'dec-1', title: 'Generated PRD', type: 'prd', content: '# Product Requirements Document: SAML SSO\n\n## 1. Problem Statement\nEnterprise accounts are churning due to lack of SAML SSO. IT departments are mandating Okta/Azure AD compliance.\n\n## 2. Scope\n- Implement SAML 2.0 protocol\n- Support Okta and Azure AD identity providers\n- Just-in-Time (JIT) user provisioning\n\n## 3. Success Metrics\n- 0 churns citing security compliance next quarter.\n- 100% of Enterprise tier accounts migrated to SSO within 60 days of launch.', author_id: 'user-1', external_url: null, external_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), decisions: { title: 'SAML SSO Integration Missing' }, users: { full_name: 'Demo User' } }
];

export const MOCK_LAUNCHES = [
  { 
    id: 'launch-1', 
    workspace_id: 'ws-1', 
    decision_id: 'dec-1', 
    title: 'Enterprise SAML SSO', 
    action: 'Build', 
    launched_at: new Date(Date.now() - 14 * 86400000).toISOString(), 
    created_by: 'user-1', 
    created_at: new Date().toISOString(), 
    status: 'active' as const,
    expected_outcome: 'Reduce security-related churn by 30% and unblock Enterprise renewals.',
    before_count: 84,
    after_count: 12,
    pm_verdict: 'Solved',
    notes: 'Okta and Azure AD support successfully addressed the primary friction point. Large renewals are processing normally.'
  }
];

export const MOCK_MEMBERS = [
  { id: 'mem-1', workspace_id: 'ws-1', user_id: 'user-1', role: 'admin', created_at: new Date().toISOString(), users: { full_name: 'Demo User', email: 'demo@astrix.ai' } }
];
