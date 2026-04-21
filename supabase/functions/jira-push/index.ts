// Edge Function: jira-push
// Pushes an artifact to a workspace's configured Jira project
// POST /functions/v1/jira-push
// Body: { workspace_id, artifact_id }
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

  let body: { workspace_id: string; artifact_id: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { workspace_id, artifact_id } = body;
  if (!workspace_id || !artifact_id) {
    return errorResponse('workspace_id and artifact_id are required');
  }

  const membership = await getWorkspaceMembership(supabase, workspace_id, user.id);
  if (!membership) return errorResponse('Not a workspace member', 403);

  // Check plan allows Jira
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type')
    .eq('workspace_id', workspace_id)
    .single();

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('jira_enabled')
    .eq('plan_type', sub?.plan_type ?? 'free')
    .single();

  if (!limits?.jira_enabled) {
    return errorResponse('Jira integration is not available on your current plan. Upgrade to Starter or higher.', 403);
  }

  // Fetch Jira config (decrypted credentials are accessed server-side only)
  const { data: jiraConfig, error: configErr } = await supabase
    .from('jira_configs')
    .select('jira_base_url, jira_email, project_key, api_token_hash, enabled')
    .eq('workspace_id', workspace_id)
    .single();

  if (configErr || !jiraConfig) {
    return errorResponse('Jira is not configured for this workspace. Set it up in Settings → Jira.', 404);
  }

  if (!jiraConfig.enabled) {
    return errorResponse('Jira integration is disabled for this workspace.', 403);
  }

  // Fetch the artifact
  const { data: artifact, error: artErr } = await supabase
    .from('artifacts')
    .select('id, title, type, content, workspace_id, decisions:decision_id(title)')
    .eq('id', artifact_id)
    .single();

  if (artErr || !artifact || artifact.workspace_id !== workspace_id) {
    return errorResponse('Artifact not found', 404);
  }

  // Mark as in-progress
  await supabase
    .from('artifacts')
    .update({ jira_push_status: 'pushing' })
    .eq('id', artifact_id);

  // Build Jira issue payload
  // The api_token_hash field stores the token (for MVP; in production use proper encryption)
  const auth = btoa(`${jiraConfig.jira_email}:${jiraConfig.api_token_hash}`);
  const issueBody = {
    fields: {
      project: { key: jiraConfig.project_key },
      summary: artifact.title,
      description: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: artifact.content.slice(0, 32000), // Jira ADF limit
          }],
        }],
      },
      issuetype: { name: artifact.type === 'prd' ? 'Story' : 'Task' },
    },
  };

  let jiraIssueKey: string | null = null;
  let pushError: string | null = null;

  try {
    const jiraResponse = await fetch(
      `${jiraConfig.jira_base_url}/rest/api/3/issue`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(issueBody),
      },
    );

    if (!jiraResponse.ok) {
      const errText = await jiraResponse.text();
      pushError = `Jira API returned ${jiraResponse.status}: ${errText.slice(0, 500)}`;
    } else {
      const jiraData = await jiraResponse.json();
      jiraIssueKey = jiraData.key;
    }
  } catch (err) {
    pushError = `Failed to reach Jira: ${(err as Error).message}`;
  }

  if (pushError) {
    await supabase
      .from('artifacts')
      .update({ jira_push_status: 'failed' })
      .eq('id', artifact_id);

    await logActivity(supabase, {
      workspace_id,
      actor_id: user.id,
      event_type: 'jira_push_failed',
      entity_type: 'artifact',
      entity_id: artifact_id,
      metadata: { error: pushError },
    });

    return errorResponse(`Jira push failed: ${pushError}`, 502);
  }

  const jiraUrl = `${jiraConfig.jira_base_url}/browse/${jiraIssueKey}`;

  await supabase
    .from('artifacts')
    .update({
      external_id: jiraIssueKey,
      external_url: jiraUrl,
      jira_push_status: 'success',
      jira_pushed_at: new Date().toISOString(),
    })
    .eq('id', artifact_id);

  await trackUsage(supabase, { workspace_id, user_id: user.id, event_type: 'jira_push' });
  await logActivity(supabase, {
    workspace_id,
    actor_id: user.id,
    event_type: 'jira_push_success',
    entity_type: 'artifact',
    entity_id: artifact_id,
    metadata: { jira_key: jiraIssueKey, jira_url: jiraUrl },
  });

  return jsonResponse({ jira_key: jiraIssueKey, jira_url: jiraUrl });
});
