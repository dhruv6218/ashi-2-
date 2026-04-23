// Shared utilities for Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

/** Extract authenticated user from request. Returns null if unauthenticated. */
export async function getAuthUser(
  req: Request,
  supabase: any,
): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const { data, error } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (error || !data.user) return null;
  return data.user as { id: string; email: string };
}

/** Check workspace membership and return role, or null if not a member. */
export async function getWorkspaceMembership(
  supabase: any,
  workspaceId: string,
  userId: string,
): Promise<{ role: string } | null> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
}

/** Log an activity event (best-effort, non-blocking). */
export async function logActivity(
  supabase: any,
  params: {
    workspace_id: string;
    actor_id: string | null;
    event_type: string;
    entity_type?: string;
    entity_id?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from('activity_logs').insert(params).then(() => {});
}

/** Track a usage event for quota enforcement (best-effort). */
export async function trackUsage(
  supabase: any,
  params: {
    workspace_id: string;
    user_id: string;
    event_type: string;
    feature?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from('usage_events').insert(params).then(() => {});
}
