// Edge Function: invite-accept
// Accepts an invitation token and adds the user to the workspace
// POST /functions/v1/invite-accept
// Body: { token }
// Auth: Bearer token required (the user who is accepting)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  getAuthUser,
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

  let body: { token: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { token } = body;
  if (!token) return errorResponse('token is required');

  // Look up the invitation
  const { data: invitation, error: fetchErr } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (fetchErr || !invitation) {
    return errorResponse('Invitation not found or already used', 404);
  }

  // Check expiry
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    return errorResponse('This invitation has expired', 410);
  }

  // Validate email matches the authenticated user
  if (invitation.invited_email.toLowerCase() !== (user as any).email.toLowerCase()) {
    return errorResponse(
      'This invitation was sent to a different email address. Please sign in with the correct account.',
      403,
    );
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invitation.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    // Mark invite accepted anyway and return success
    await supabase
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);
    return jsonResponse({ workspace_id: invitation.workspace_id, already_member: true });
  }

  // Add user to workspace
  const { error: memberErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: invitation.workspace_id,
      user_id: user.id,
      role: invitation.invited_role,
    });

  if (memberErr) {
    console.error('invite-accept member insert error:', memberErr);
    return errorResponse('Failed to add member to workspace', 500);
  }

  // Mark invitation as accepted
  const { error: updateErr } = await supabase
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitation.id);

  if (updateErr) {
    console.error('invite-accept update error:', updateErr);
  }

  // Create in-app notification for the inviter
  await supabase.from('notifications').insert({
    workspace_id: invitation.workspace_id,
    user_id: invitation.invited_by,
    type: 'invitation_accepted',
    title: 'Invitation Accepted',
    body: `${(user as any).email} has accepted your invitation to join the workspace.`,
    entity_type: 'invitation',
    entity_id: invitation.id,
  });

  await logActivity(supabase, {
    workspace_id: invitation.workspace_id,
    actor_id: user.id,
    event_type: 'invite_accepted',
    entity_type: 'invitation',
    entity_id: invitation.id,
    metadata: { role: invitation.invited_role },
  });

  return jsonResponse({ workspace_id: invitation.workspace_id });
});
