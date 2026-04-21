// Edge Function: invite-create
// Creates an invitation and dispatches an email
// POST /functions/v1/invite-create
// Body: { workspace_id, email, role }
// Auth: Bearer token required; caller must be workspace owner

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

  let body: { workspace_id: string; email: string; role: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { workspace_id, email, role } = body;
  if (!workspace_id || !email || !role) {
    return errorResponse('workspace_id, email, and role are required');
  }

  if (!['owner', 'member'].includes(role)) {
    return errorResponse('role must be owner or member');
  }

  // Only owners can invite
  const membership = await getWorkspaceMembership(supabase, workspace_id, user.id);
  if (!membership || membership.role !== 'owner') {
    return errorResponse('Only workspace owners can send invitations', 403);
  }

  // Fetch workspace info for the email
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', workspace_id)
    .single();
  if (wsError || !workspace) return errorResponse('Workspace not found', 404);

  // Fetch inviter profile
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id, status')
    .eq('workspace_id', workspace_id)
    .eq('invited_email', email.toLowerCase())
    .eq('status', 'pending')
    .maybeSingle();

  if (existingInvite) {
    return errorResponse('An active invitation already exists for this email', 409);
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace_id)
    .in('user_id', (
      await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
    ).data?.map((p: any) => p.id) ?? [])
    .maybeSingle();

  if (existingMember) {
    return errorResponse('This user is already a workspace member', 409);
  }

  // Create invitation
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .insert({
      workspace_id,
      invited_email: email.toLowerCase(),
      invited_role: role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (invError) {
    console.error('invite-create error:', invError);
    return errorResponse('Failed to create invitation', 500);
  }

  // Build invitation URL
  const appUrl = Deno.env.get('APP_URL') ?? 'https://astrix.ai';
  const inviteUrl = `${appUrl}/accept-invitation?token=${invitation.token}`;

  // Send invitation email via Supabase's built-in SMTP or a transactional email provider
  // For MVP, we log the invite URL and rely on Resend/SendGrid if configured
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (resendApiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('EMAIL_FROM') ?? 'noreply@astrix.ai',
          to: [email],
          subject: `You've been invited to ${workspace.name} on Astrix`,
          html: `
            <p>Hi,</p>
            <p><strong>${inviterProfile?.full_name ?? 'A team member'}</strong> has invited you to join <strong>${workspace.name}</strong> on Astrix as a <strong>${role}</strong>.</p>
            <p><a href="${inviteUrl}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
            <p>This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.</p>
          `,
        }),
      });
    } catch (emailErr) {
      // Non-fatal — invitation still created, just log
      console.error('Email send failed:', emailErr);
    }
  }

  await logActivity(supabase, {
    workspace_id,
    actor_id: user.id,
    event_type: 'invite_sent',
    entity_type: 'invitation',
    entity_id: invitation.id,
    metadata: { invited_email: email, role },
  });

  return jsonResponse({ invitation: { id: invitation.id, token: invitation.token }, invite_url: inviteUrl });
});
