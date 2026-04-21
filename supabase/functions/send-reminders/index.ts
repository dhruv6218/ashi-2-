// Edge Function: send-reminders
// Dispatches review-due reminders for active launches
// POST /functions/v1/send-reminders (triggered by cron or manual call)
// Auth: Uses CRON_SECRET header for scheduled calls, or admin Bearer token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Allow cron secret or admin bearer token
  const authHeader = req.headers.get('Authorization') ?? '';
  const cronSecret = Deno.env.get('CRON_SECRET');
  const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isValidCron) {
    return errorResponse('Unauthorized', 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find launches with day_7 or day_30 review due today or overdue
  const { data: launches, error: launchErr } = await supabase
    .from('launches')
    .select(`
      id, title, workspace_id, owner_id,
      day7_review_date, day30_review_date,
      launch_reviews(checkpoint),
      launch_verdicts(id)
    `)
    .eq('status', 'active')
    .or(`day7_review_date.lte.${tomorrow.toISOString().split('T')[0]},day30_review_date.lte.${tomorrow.toISOString().split('T')[0]}`);

  if (launchErr) {
    console.error('send-reminders fetch error:', launchErr);
    return errorResponse('Failed to fetch launches', 500);
  }

  let remindersSent = 0;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM') ?? 'noreply@astrix.ai';
  const appUrl = Deno.env.get('APP_URL') ?? 'https://astrix.ai';

  for (const launch of launches ?? []) {
    // Skip if verdict already submitted
    if ((launch.launch_verdicts as any[])?.length > 0) continue;

    const completedCheckpoints = new Set(
      ((launch.launch_reviews as any[]) ?? []).map((r: any) => r.checkpoint),
    );

    const notifications: { checkpoint: string; notificationType: string }[] = [];

    if (
      launch.day7_review_date &&
      new Date(launch.day7_review_date) <= tomorrow &&
      !completedCheckpoints.has('day_7')
    ) {
      const isOverdue = new Date(launch.day7_review_date) < today;
      notifications.push({
        checkpoint: 'Day 7',
        notificationType: isOverdue ? 'review_overdue' : 'review_due',
      });
    }

    if (
      launch.day30_review_date &&
      new Date(launch.day30_review_date) <= tomorrow &&
      !completedCheckpoints.has('day_30')
    ) {
      const isOverdue = new Date(launch.day30_review_date) < today;
      notifications.push({
        checkpoint: 'Day 30',
        notificationType: isOverdue ? 'review_overdue' : 'review_due',
      });
    }

    for (const { checkpoint, notificationType } of notifications) {
      // Create in-app notification
      await supabase.from('notifications').insert({
        workspace_id: launch.workspace_id,
        user_id: launch.owner_id,
        type: notificationType,
        title: `${checkpoint} Review ${notificationType === 'review_overdue' ? 'Overdue' : 'Due'}: ${launch.title}`,
        body: `Your ${checkpoint} post-launch review for "${launch.title}" is ${notificationType === 'review_overdue' ? 'overdue' : 'due today'}.`,
        entity_type: 'launch',
        entity_id: launch.id,
      });

      // Send email reminder if Resend is configured
      if (resendKey) {
        // Fetch owner email
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', launch.owner_id)
          .single();

        if (ownerProfile?.email) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: emailFrom,
                to: [ownerProfile.email],
                subject: `${checkpoint} Review ${notificationType === 'review_overdue' ? 'OVERDUE' : 'Due'}: ${launch.title}`,
                html: `
                  <p>Hi ${ownerProfile.full_name ?? 'there'},</p>
                  <p>Your <strong>${checkpoint} post-launch review</strong> for <strong>${launch.title}</strong> is ${notificationType === 'review_overdue' ? '<strong>overdue</strong>' : 'due today'}.</p>
                  <p>Submit your review to keep your launch accountable:</p>
                  <p><a href="${appUrl}/app/launches/${launch.id}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Review Launch</a></p>
                `,
              }),
            });
          } catch (emailErr) {
            console.error('Reminder email failed:', emailErr);
          }
        }
      }

      remindersSent++;
    }
  }

  return jsonResponse({ reminders_sent: remindersSent, launches_checked: (launches ?? []).length });
});
