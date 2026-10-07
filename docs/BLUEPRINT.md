# Relaydesk Blueprint

> Sample project. Relaydesk is a fictional product built as a public portfolio demo. Every company, person and figure in it is invented. Payments run in Stripe test mode.

## 1. The product in one paragraph

Small creative and marketing agencies send work to clients (logos, ad sets, landing pages, videos) and then chase approvals over email, WhatsApp and shared drives. Feedback gets lost, nobody knows which version is final, and invoices wait on a "looks good" that never arrives in writing. Relaydesk gives each client a private space where the agency posts versioned deliverables, the client approves or requests changes from any device, and every decision is recorded with a timestamp.

## 2. Users and roles

| Role | Who | Can |
|---|---|---|
| **Owner** | Agency founder | Everything in the workspace, including billing and deleting it |
| **Member** | Agency staff | Manage clients, deliverables and comments. No billing. |
| **Client** | A person at the client company | See only their own client space. Comment, approve, request changes. |
| **Platform admin** | Relaydesk staff | Read-only view of all workspaces, the webhook log and the audit log. Can suspend a workspace. |

The platform admin flag lives in Supabase `app_metadata` (only the server can set it), never in `user_metadata` (users can edit that).

## 3. Features and "done means"

| # | Feature | Done means |
|---|---|---|
| 1 | **Workspaces, team and client invites** | Sign up creates a workspace with you as Owner. Owners invite Members and Clients by link (expires after 7 days, single use, only the token's hash is stored). A Client sees only their own space, and a test proves it. |
| 2 | **Deliverables with versions** | A Member uploads a file to a client space. Uploading again creates v2, v3, and older versions stay viewable. Files sit in a private bucket and open through short-lived signed URLs. |
| 3 | **Approvals and comments** | A Member requests approval with a due date. The Client approves or requests changes, from a phone as easily as a laptop. Comments thread under each version. Every decision lands in the activity log. |
| 4 | **Billing** | Free, Pro and Studio plans through Stripe Checkout and the Customer Portal. A verified webhook (signature checked against the raw body, deduplicated on the event id) is the only thing that changes a plan. Limits are enforced on the server and the UI explains them. |
| 5 | **Admin panel** | Platform admins see workspaces, plans, test-mode MRR, the webhook event log (processed and duplicates skipped) and the audit log, and can suspend a workspace. |
| 6 | **AI revision checklist** | One click turns a feedback thread into a checklist. Each item quotes the comment it came from. The output is labelled as AI-generated, and the feature is rate-limited and Pro-plan only. |

The $600 MVP package in the gig maps to features 1 to 3; the $1,500 Full launch package maps to all six.

## 4. Plans

| | Free | Pro | Studio |
|---|---|---|---|
| Price (test mode) | $0 | $29 / month | $79 / month |
| Client spaces | 2 | 15 | Unlimited |
| Team members | 2 | 10 | Unlimited |
| Storage | 250 MB | 20 GB | 100 GB |
| AI revision checklist | | 50 / month | 300 / month |

## 5. Data model

```text
auth.users (Supabase)
  └─ profiles                1:1, display name and avatar

workspaces                   an agency (tenant)
  ├─ memberships             user + role (owner | member | client); client rows point at one client space
  ├─ invitations             email, role, client space, token hash, expiry, accepted_at
  ├─ clients                 a client space (e.g. "Northwind Coffee")
  │   └─ deliverables        title, status, due date
  │       ├─ deliverable_versions   v1, v2... file path, size, type, uploader
  │       ├─ reviews                approve / request changes, per version
  │       ├─ comments               threaded under a version
  │       └─ ai_checklists          structured items with source comment ids
  ├─ subscriptions           1:1, Stripe customer, subscription, status, period end
  └─ audit_log               who did what, when

stripe_events                one row per Stripe event id (dedupe + admin log)
```

Deliverable status is a small state machine: `draft → in_review → (changes_requested ↔ in_review) → approved`. A new version always moves a deliverable back to `in_review` if approval was requested.

## 6. Security plan

1. **Row Level Security on every table**, with policies written per access path, not one copy-pasted `auth.uid() = user_id` rule.
2. **Explicit, least-privilege grants.** New Supabase tables are no longer exposed to the Data API automatically (changelog, 2026-04-28). Each table grants only the verbs its policies need, to `authenticated` only. `anon` gets nothing.
3. **Membership checks in one place.** Small `SECURITY DEFINER` helper functions (`private.workspace_role()`, `private.can_access_client()`) live in a schema the API doesn't expose, take no user-supplied ids they don't verify, and are indexed. Policies call them as `(select ...)` so Postgres evaluates them once per query.
4. **Storage paths carry the tenant**: `{workspace_id}/{client_id}/{deliverable_id}/v{n}-{file}`. Storage policies check those folders against the same helpers.
5. **Server-side auth uses `getClaims()`**, which verifies the JWT. `getSession()` is never trusted on the server.
6. **The service role key never reaches the browser.** It is used only in the Stripe webhook, the nightly demo reset and the admin panel, all on the server.
7. **Tests prove isolation.** pgTAP tests log in as a Client of workspace A and assert they can't read workspace B, another client's space in A, or unapproved internal data.

## 7. Architecture

```text
Browser ──> Vercel (Next.js 16, App Router, Node runtime)
              ├─ proxy.ts                  refreshes the Supabase session cookie
              ├─ Server Components         read data as the signed-in user (RLS applies)
              ├─ Server Actions            validate with zod, then write as the user
              ├─ /api/stripe/webhook       verifies signature, dedupes, writes with service role
              └─ /api/cron/reset-demo      nightly demo reset (Vercel Cron, secret header)
           ──> Supabase (Postgres + RLS, Auth, private Storage)
           ──> Stripe (test mode: Checkout, Customer Portal, webhooks)
           ──> Vercel AI Gateway (feature 6)
```

## 8. Decisions (short ADRs)

1. **Supabase over a separate auth + database + storage stack.** One service, one row-level security model covering both table rows and files. Trade-off: business logic leans on Postgres policies, so they are tested like code.
2. **Server Components + Server Actions, no separate API layer.** Fewer moving parts for an MVP. The only route handlers are for things that must be HTTP endpoints (webhook, cron).
3. **The webhook is the source of truth for plans.** The checkout success page only shows a "confirming your plan" state; it never grants anything.
4. **Invites by link first, email second.** The link works with no email provider configured. Email delivery switches on when an SMTP or Resend key is present.
5. **Demo mode: a private sandbox per visitor, not a shared demo account.** A shared demo login lets one visitor approve everything, delete files, post junk the next visitor sees, or change the shared password through the auth API. Instead, "Try the demo" creates a fresh copy of the demo agency for that visitor: four demo users, seeded clients, files and history. A "View as client" switch signs them into the client side of *their own* copy. Switching uses a server-generated one-time sign-in link, so the demo users have no known passwords. Copies are deleted after 24 hours, creation is rate-limited per IP, and uploads in demo workspaces are capped. Real sign-ups get their own empty workspace and never see demo data.

## 9. Monthly running cost

| Users | Vercel | Supabase | Stripe | AI | Total |
|---|---|---|---|---|---|
| Demo / 0 | $0 (Hobby) | $0 (Free) | $0 | about $0 | **$0** |
| 100 agencies | $20 (Pro, commercial use) | $25 (Pro) | 2.9% + 30¢ per payment | about $5 | **about $50 + Stripe fees** |
| 1,000 agencies | $20 + usage | $25 + usage (about $10 to $40) | same | about $40 | **about $120 to $150 + Stripe fees** |

Vercel's Hobby plan is for non-commercial use, so a real launch moves to Pro.

## 10. Out of scope (said up front)

Native mobile apps, invoicing and payments between agency and client, real-time co-editing, white-label custom domains, SSO.
