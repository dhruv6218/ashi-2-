# Astrix AI — Backend Architecture

This document covers the complete backend implementation for ASTRIX AI — a B2B SaaS product for product teams.

## Stack

- **Database + Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Row Level Security**: Enforced on every table
- **File Storage**: Supabase Storage (private `uploads` bucket, public `avatars` bucket)
- **Server-Side Logic**: Supabase Edge Functions (Deno)
- **AI Providers**: Gemini (free tier / all plans), Groq (paid plans), OpenRouter (fallback)
- **Email**: Resend
- **Payments**: Stripe-compatible webhook design

---

## Core Workflow

```
Signals → Problems → Opportunities → Decisions → Artifacts → Launches → Reviews → Verdicts
```

---

## Database Schema

### Phase 1 — Auth Foundation
| Table | Description |
|-------|-------------|
| `profiles` | One per auth user. Auto-created by trigger on `auth.users` insert. |
| `workspaces` | Teams/organizations. Owner-tracked. |
| `workspace_members` | Many-to-many: users ↔ workspaces. Roles: `owner`, `member`. |
| `invitations` | Token-based email invites with expiry and status tracking. |

### Phase 2 — Signals & Accounts
| Table | Description |
|-------|-------------|
| `product_areas` | Workspace-defined classification tags. |
| `segments` | Workspace-defined account segments. |
| `accounts` | Customer accounts with ARR, plan, health score, churn risk. |
| `signals` | Customer feedback with source, sentiment, severity, product area. |
| `file_uploads` | Tracks CSV ingestion jobs with status and error details. |

### Phase 3 — Problems & Opportunities
| Table | Description |
|-------|-------------|
| `problems` | Identified product problems with severity, trend, evidence count. |
| `problem_signal_links` | Many-to-many: signals ↔ problems. |
| `opportunities` | Scored opportunities with transparent breakdown. |

### Phase 4 — Decisions & Artifacts
| Table | Description |
|-------|-------------|
| `decisions` | Product decisions linking problem + opportunity + action. |
| `artifacts` | Versioned documents (PRDs, specs, memos) tied to decisions. |
| `jira_configs` | Workspace-level Jira integration config (server-side only). |

### Phase 5 — Launches & Outcomes
| Table | Description |
|-------|-------------|
| `launches` | Launch tracking tied to decisions. |
| `launch_reviews` | Day-7 and Day-30 checkpoints with signal/ARR delta. |
| `launch_verdicts` | Final immutable verdict: Solved / Partially Solved / Not Solved / Regressed. |
| `proof_summaries` | AI-generated outcome summary per launch. |

### Phase 6 — Subscriptions & Usage
| Table | Description |
|-------|-------------|
| `subscriptions` | One per workspace. Auto-created as `free` on workspace creation. |
| `plan_limits` | Reference table: what each plan tier allows. |
| `usage_events` | Tracks AI calls, uploads, and other quota-relevant events. |
| `activity_logs` | Immutable audit trail of important workspace actions. |
| `notifications` | In-app notification records for users. |

---

## Access Control

### Roles
- **Owner**: Full workspace control — manage billing, invite/remove members, delete records, configure Jira.
- **Member**: Full workflow access — create signals, problems, decisions, artifacts, launches, reviews, verdicts. Cannot manage billing or workspace-level settings.

### RLS Enforcement
Every table has Row Level Security enabled. Key rules:
- Users only see data from workspaces they belong to.
- `workspace_members` join is used to check membership via helper functions.
- Verdicts and activity logs are insert-only (no update/delete policies).
- Jira config is owner-only.
- Subscriptions can be read by all members (for UI gates) but only written by owners.
- Sensitive operations (invite send/accept, CSV ingestion, AI generation) go through Edge Functions using the service role key.

---

## Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `invite-create` | Create invitation + send email | Bearer (owner) |
| `invite-accept` | Accept invite token, add user to workspace | Bearer (invitee) |
| `ingest-signals-csv` | Parse + import signals CSV from storage | Bearer (member) |
| `ingest-accounts-csv` | Parse + import accounts CSV from storage | Bearer (member) |
| `classify-signal` | AI classify signal sentiment/severity/category | Bearer (member) |
| `score-opportunity` | Calculate transparent weighted opportunity score | Bearer (member) |
| `generate-artifact` | AI draft PRD/spec/memo from decision context | Bearer (member) |
| `generate-proof-summary` | AI outcome summary after launch reviews | Bearer (member) |
| `jira-push` | Push artifact to workspace Jira project | Bearer (member) |
| `payment-webhook` | Handle Stripe payment webhooks | HMAC signature |
| `send-reminders` | Dispatch review-due reminders (cron) | Cron secret |

---

## AI Architecture

| Plan | Primary | Fallback |
|------|---------|---------|
| Free | Gemini 1.5 Flash | OpenRouter (Mistral 7B) |
| Starter/Growth/Scale | Groq (LLaMA 3.1) | Gemini |

**Limits enforced server-side:**
- Free: 10 AI calls/day per workspace
- Starter: 50/day
- Growth: 200/day
- Scale: Unlimited

AI is used only in: signal classification, opportunity summary, artifact generation, proof summary generation.

---

## Opportunity Scoring

Transparent weighted model. Scores are stored and explainable.

| Dimension | Weight |
|-----------|--------|
| Signal count | 30% |
| Affected ARR | 35% |
| Severity | 20% |
| Recency | 15% |

Each dimension is normalized to 0–100. Final score is 0–100. Score breakdown is stored in `score_breakdown` JSONB field.

---

## CSV Ingestion

### Signals CSV
Required: `raw_text`, `source_type`  
Optional: `account_domain`, `account_name`, `sentiment_label`, `severity_label`, `category`, `product_area`

### Accounts CSV
Required: `name`  
Optional: `domain`, `arr`, `plan`, `segment`, `health_score`, `churn_risk`, `renewal_date`, `notes`

Ingestion:
1. File uploaded to private `uploads` storage bucket
2. `file_uploads` record created with `pending` status
3. Edge Function invoked to parse and import rows
4. Row errors are stored in `error_details` JSONB — partial imports succeed
5. Status updated to `complete` or `failed`

---

## Billing

| Plan | Price | Members | AI Calls/Day | Jira | Advanced AI |
|------|-------|---------|--------------|------|-------------|
| Free | $0 | 1 | 10 | ✗ | ✗ |
| Starter | $59/mo | 5 | 50 | ✓ | ✗ |
| Growth | $179/mo | 15 | 200 | ✓ | ✓ |
| Scale | $399/mo | 100 | Unlimited | ✓ | ✓ |

Subscription state is kept in `subscriptions` table. Stripe webhooks update it automatically. Manual override available for support/sales cases via `override_plan` field.

---

## Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy the project URL and anon key

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 3. Run Migrations
In the Supabase Dashboard → SQL Editor, run each migration in order:
1. `supabase/migrations/001_phase1_auth_workspaces.sql`
2. `supabase/migrations/002_phase2_signals_accounts.sql`
3. `supabase/migrations/003_phase3_problems_opportunities.sql`
4. `supabase/migrations/004_phase4_decisions_artifacts.sql`
5. `supabase/migrations/005_phase5_launches.sql`
6. `supabase/migrations/006_phase6_subscriptions_usage.sql`

Or with the Supabase CLI:
```bash
supabase db push
```

### 4. Create Storage Buckets
In Supabase Dashboard → Storage:
- Create bucket `uploads` — **Private**
- Create bucket `avatars` — **Public**

Then add storage policies:
- `uploads`: INSERT for authenticated users who are workspace members; SELECT/DELETE for uploader or workspace owner
- `avatars`: Public SELECT; INSERT/DELETE by owner only

### 5. Deploy Edge Functions
```bash
supabase functions deploy invite-create
supabase functions deploy invite-accept
supabase functions deploy ingest-signals-csv
supabase functions deploy ingest-accounts-csv
supabase functions deploy classify-signal
supabase functions deploy score-opportunity
supabase functions deploy generate-artifact
supabase functions deploy generate-proof-summary
supabase functions deploy jira-push
supabase functions deploy payment-webhook
supabase functions deploy send-reminders
```

### 6. Set Edge Function Secrets
In Supabase Dashboard → Project Settings → Edge Functions → Secrets:
```
SUPABASE_SERVICE_ROLE_KEY = <service_role_key>
GEMINI_API_KEY = <gemini_key>
OPENROUTER_API_KEY = <openrouter_key>
GROQ_API_KEY = <groq_key>
RESEND_API_KEY = <resend_key>
EMAIL_FROM = noreply@yourdomain.com
APP_URL = https://yourdomain.com
STRIPE_WEBHOOK_SECRET = <stripe_webhook_secret>
STRIPE_PLAN_MAP = {"price_xxx":"starter","price_yyy":"growth","price_zzz":"scale"}
CRON_SECRET = <random_secret_for_cron>
```

### 7. Enable Google OAuth (Optional)
In Supabase Dashboard → Authentication → Providers → Google:
- Enable and add Client ID + Secret from Google Cloud Console

### 8. Configure Stripe Webhook (Optional)
- In Stripe Dashboard, add webhook endpoint: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 9. Set Up Review Reminders Cron
Use a cron service (e.g., cron-job.org, GitHub Actions schedule, Supabase pg_cron) to call:
```
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders
Authorization: Bearer <CRON_SECRET>
```
Run daily at 9 AM.

---

## Security Checklist

- [x] Service role key never exposed to frontend
- [x] AI provider keys never exposed to frontend
- [x] Stripe webhook secret verified server-side with HMAC
- [x] Jira API tokens stored in DB, never returned to frontend
- [x] RLS enabled on every table
- [x] Workspace membership checked before every data operation
- [x] AI quota enforced per workspace per day in Edge Functions
- [x] Invitation tokens are random 32-byte hex strings
- [x] Invitations expire after 7 days
- [x] Email must match invitation before acceptance
- [x] Verdicts are immutable (no update/delete RLS policies)
- [x] Activity logs are insert-only

---

## Definition of Done

A real user can:
- [x] Sign up with email/password or Google OAuth
- [x] Reset password
- [x] Create a workspace during onboarding
- [x] Join a workspace via invitation
- [x] Upload signals CSV and accounts CSV
- [x] View and manage signals/accounts scoped to their workspace
- [x] Create problems from evidence
- [x] View opportunities with transparent score breakdown
- [x] Create decisions
- [x] Generate and version artifacts (AI-assisted)
- [x] Push artifact to Jira (if configured)
- [x] Create launches
- [x] Submit Day 7 and Day 30 reviews
- [x] Submit final verdict
- [x] See proof summary stored
- [x] Receive review reminder notifications
- [x] Have billing/plan state reflected in backend
