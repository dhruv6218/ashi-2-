// Edge Function: payment-webhook
// Handles incoming payment webhooks (Stripe-compatible)
// POST /functions/v1/payment-webhook
// No auth header — uses webhook secret verification instead

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, errorResponse, logActivity } from '../_shared/utils.ts';

/** Verify Stripe webhook signature using the raw body and secret */
async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(',').map(p => { const [k, v] = p.split('='); return [k, v]; }),
    );
    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    const payload = `${timestamp}.${rawBody}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return computed === signature;
  } catch {
    return false;
  }
}

const PLAN_MAP: Record<string, string> = {
  // Map your Stripe Price IDs to plan types here
  // e.g. 'price_starter_monthly': 'starter'
  // Configure via environment variable STRIPE_PLAN_MAP as JSON
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return errorResponse('Webhook not configured', 500);
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('stripe-signature') ?? '';

  const isValid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
  if (!isValid) {
    console.warn('Invalid Stripe webhook signature');
    return errorResponse('Invalid signature', 400);
  }

  let event: { type: string; data: { object: any } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Load plan map from env (JSON string) or use default
  let planMap = { ...PLAN_MAP };
  try {
    const envMap = Deno.env.get('STRIPE_PLAN_MAP');
    if (envMap) planMap = { ...planMap, ...JSON.parse(envMap) };
  } catch {}

  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const workspaceId = obj.metadata?.workspace_id;
      const customerId = obj.customer;
      const subscriptionId = obj.subscription;
      const priceId = obj.metadata?.price_id ?? obj.line_items?.data?.[0]?.price?.id;
      const planType = planMap[priceId] ?? 'starter';

      if (!workspaceId) break;

      await supabase.from('subscriptions').upsert({
        workspace_id: workspaceId,
        plan_type: planType,
        billing_status: 'active',
        external_sub_id: subscriptionId,
      }, { onConflict: 'workspace_id' });

      await logActivity(supabase, {
        workspace_id: workspaceId,
        actor_id: null,
        event_type: 'plan_changed',
        entity_type: 'subscription',
        metadata: { plan_type: planType, stripe_customer: customerId },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const workspaceId = obj.metadata?.workspace_id;
      if (!workspaceId) break;

      const priceId = obj.items?.data?.[0]?.price?.id;
      const planType = planMap[priceId] ?? 'starter';
      const statusMap: Record<string, string> = {
        active: 'active', trialing: 'trialing', past_due: 'past_due',
        canceled: 'cancelled', paused: 'paused',
      };

      await supabase.from('subscriptions').upsert({
        workspace_id: workspaceId,
        plan_type: planType,
        billing_status: statusMap[obj.status] ?? 'active',
        external_sub_id: obj.id,
        current_period_start: new Date(obj.current_period_start * 1000).toISOString(),
        current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
      }, { onConflict: 'workspace_id' });
      break;
    }

    case 'customer.subscription.deleted': {
      const workspaceId = obj.metadata?.workspace_id;
      if (!workspaceId) break;

      await supabase.from('subscriptions').upsert({
        workspace_id: workspaceId,
        plan_type: 'free',
        billing_status: 'cancelled',
        external_sub_id: null,
      }, { onConflict: 'workspace_id' });

      await logActivity(supabase, {
        workspace_id: workspaceId,
        actor_id: null,
        event_type: 'plan_changed',
        entity_type: 'subscription',
        metadata: { plan_type: 'free', reason: 'subscription_cancelled' },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const workspaceId = obj.metadata?.workspace_id;
      if (!workspaceId) break;
      await supabase
        .from('subscriptions')
        .update({ billing_status: 'past_due' })
        .eq('workspace_id', workspaceId);
      break;
    }

    default:
      // Unhandled event types are silently ignored
      break;
  }

  return jsonResponse({ received: true });
});
