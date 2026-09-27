# Company Brain — Architecture Decision Record

**Status:** Phase 6 — secure retrieval and AI chat implemented; Phases 2–5 complete  
**Date:** 2026-08-30  
**Scope:** Multi-tenant B2B SaaS MVP; this record describes the implementation boundary and current server slices.

## 1. Repository analysis

The repository started as a self-contained static prototype (`index.html`,
`styles.css`, `app.js`). It has been removed. It answered "what does this
product look like" in a different visual language, a different product
language, and with hardcoded data — a second source of truth that could only
mislead. The Next.js/TypeScript/Prisma implementation described below is the
only one.

## 2. Architectural direction

The target implementation should be a modular Next.js application with a clear server boundary:

```text
Browser UI (React / TypeScript / Tailwind / shadcn)
              │
       Server Actions + Route Handlers
              │
   ┌──────────┼───────────┐
   │          │           │
Domain     Retrieval    Integrations
services   service      + outbox/jobs
   │          │           │
Prisma     AIProvider   n8n/webhooks
   │          │
PostgreSQL + pgvector
```

Recommended initial runtime:

- Next.js App Router, React, TypeScript
- Tailwind CSS and shadcn/ui for the UI system
- Auth.js (or an equivalent established Next.js auth provider) for sessions
- PostgreSQL with Prisma and the pgvector extension
- OpenAI accessed only from server-side `AIProvider` implementations
- Vercel-compatible deployment with managed PostgreSQL
- Background work represented by an outbox/job boundary so n8n can be added without coupling the UI to integrations

The current static prototype should be migrated incrementally: preserve its visual language and flows, then replace local demo data with typed server contracts.

## 3. Target repository structure

```text
src/
  app/
    (auth)/login/page.tsx
    (app)/dashboard/page.tsx
    (app)/brain/[branchId]/page.tsx
    (app)/knowledge/page.tsx
    (app)/decisions/page.tsx
    (app)/people/page.tsx
    (app)/reviews/page.tsx
    (app)/integrations/page.tsx
    (app)/settings/page.tsx
    api/{organizations,branches,users,knowledge,decisions,sources,search,chat,reviews,integrations}/route.ts
  components/          Reusable UI and feature components
  lib/
    auth/               Session and identity helpers
    db/                 Prisma client and transaction helpers
    permissions/        Policy evaluation and branch scopes
    retrieval/          Secure retrieval pipeline
    ai/                 AIProvider and prompt/response contracts
    integrations/       Provider interfaces and adapters
    audit/              Append-only audit events
  server/
    actions/             Server Actions with authorization at entry
    services/            Application use cases
  types/                 Shared domain types and validators
prisma/schema.prisma
prisma/migrations/
tests/
  unit/
  integration/
  security/
```

### Current implementation status

- Phase 2 server foundation is implemented in `src/auth.ts`, `src/lib/auth`, `src/lib/permissions`, `src/app/api/organizations`, `src/app/api/users`, and `src/app/api/permissions`.
- Phase 3 branch layer is implemented in `src/lib/branches`, `src/app/api/branches`, and the protected `/brain` pages.
- New employees created through `POST /api/users` automatically receive a `PERSONAL` branch below the selected `parentBranchId` (or the organization root) plus a direct `READ` membership.
- `GET /api/branches` and `/brain` resolve inherited visibility server-side; explicit `DENY` overrides inherited visibility.
- AI retrieval is implemented in `src/lib/retrieval`, with the provider boundary in `src/lib/ai`.
- Phase 4 is now implemented in `src/app/api/knowledge`, `src/app/api/sources`, `src/app/api/reviews`, `src/lib/knowledge`, and `src/lib/audit`.
- Shared Knowledge Units enter `PENDING_REVIEW`; personal units remain private to their creator. Approve/Reject updates both the review and Knowledge Unit in one transaction.
- Sources are organization-scoped and linked through `KnowledgeSource`; archived knowledge is retained instead of hard-deleted.

## 4. Data model

Every tenant-owned table includes `organizationId`, either directly or through a relation that is enforced in the query layer. IDs use UUIDs. Timestamps are stored in UTC.

### Core entities

| Entity | Important fields | Relationships / constraints |
|---|---|---|
| `Organization` | `id`, `name`, `slug`, `createdAt` | Tenant root; `slug` unique. |
| `User` | `id`, `organizationId`, `email`, `name`, `role`, `status`, `createdAt` | Email is globally unique for the Auth.js identity; belongs to one organization in the MVP. |
| `Role` | `id`, `organizationId?`, `key`, `name` | Seeded system roles plus optional tenant roles later. |
| `Permission` | `key` | `READ`, `CREATE`, `EDIT`, `DELETE`, `APPROVE`, `MANAGE_USERS`, `MANAGE_BRANCH`, `MANAGE_DECISIONS`. |
| `RolePermission` | `roleId`, `permissionKey` | Composite unique key. |
| `Branch` | `id`, `organizationId`, `parentId`, `kind`, `name`, `description`, `ownerUserId?`, `path`, `depth` | Adjacency-list tree; parent must share organization. `kind` includes `COMPANY`, `DEPARTMENT`, `TEAM`, `PERSONAL`. |
| `BranchMember` | `branchId`, `userId`, `access`, `grantedBy`, `createdAt` | Explicit branch grant; `access` is `READ` or `DENY` where deny is reserved for overrides. |
| `KnowledgeUnit` | `id`, `organizationId`, `branchId`, `type`, `title`, `content`, `scope`, `status`, `createdBy`, `approvedBy?`, `confidence`, `verifiedAt?`, `embedding`, `createdAt`, `updatedAt` | `scope`: `PERSONAL`, `TEAM`, `DEPARTMENT`, `COMPANY`; `status`: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`. Embedding is pgvector. |
| `Decision` | `id`, `organizationId`, `title`, `description`, `reason`, `createdBy`, `validFrom`, `validUntil?`, `status`, `exceptions`, `supersedesDecisionId?` | Historical rows are immutable; superseding creates a new row and relationship. |
| `Process` | `id`, `organizationId`, `branchId`, `title`, `description`, `status` | Can also be represented as a typed Knowledge Unit; keep a separate entity only if process-specific fields are needed. |
| `Source` | `id`, `organizationId`, `type`, `title`, `externalUrl?`, `externalId?`, `metadata`, `createdAt`, `updatedAt` | Source types include `DOCUMENT`, `EMAIL`, `MEETING`, `CHAT`, `CRM`, `ERP`, `MANUAL`, `EMPLOYEE_INPUT`, `DECISION`. |
| `KnowledgeSource` | `knowledgeUnitId`, `sourceId`, `citation`, `relevance` | Many-to-many evidence links. |
| `DecisionSource` | `decisionId`, `sourceId`, `citation` | Many-to-many evidence links. |
| `Relationship` | `id`, `organizationId`, `type`, `fromEntityType`, `fromEntityId`, `toEntityType`, `toEntityId`, `createdBy` | Supports `RELATED_TO`, `CREATED_BY`, `OWNED_BY`, `AFFECTS`, `SUPERSEDES`, `DERIVED_FROM`, `APPLIES_TO`, `EXCEPTION_OF`, `BELONGS_TO`. Both endpoints must be tenant-owned. |
| `Review` | `id`, `organizationId`, `knowledgeUnitId`, `requestedBy`, `reviewerId?`, `status`, `targetBranchId`, `comment`, `createdAt`, `resolvedAt?` | Review transition is server-side and audited. |
| `AuditLog` | `id`, `organizationId`, `actorUserId`, `action`, `entityType`, `entityId`, `before`, `after`, `createdAt`, `requestId` | Append-only; never editable by regular users. |
| `Integration` | `id`, `organizationId`, `provider`, `status`, `externalAccountId?`, `config`, `lastSyncedAt?` | Tokens must be encrypted at rest and never returned to the client. No fake “connected” state. |
| `OnboardingPlan` | `id`, `organizationId`, `userId`, `branchId`, `generatedFromVersion`, `status` | One or more ordered `OnboardingStep` rows. |
| `OnboardingProgress` | `id`, `stepId`, `userId`, `status`, `completedAt?` | Personal progress; branch access still applies to referenced knowledge. |
| `OutboxEvent` | `id`, `organizationId`, `type`, `payload`, `status`, `attempts`, `availableAt` | Reliable boundary for embeddings, sync, onboarding, and n8n hooks. |

Recommended indexes:

- `(organizationId, parentId)` on `Branch`
- `(organizationId, branchId, status, scope)` on `KnowledgeUnit`
- pgvector HNSW/IVFFlat index on `KnowledgeUnit.embedding`, used only after the permission predicate is applied
- `(organizationId, validFrom, validUntil, status)` on `Decision`
- `(organizationId, type, fromEntityId, toEntityId)` on `Relationship`
- `(organizationId, createdAt)` on `AuditLog`

PostgreSQL row-level security may be added as defense in depth. It must not replace explicit application authorization or a tenant-aware Prisma access layer.

## 5. Permission model

System roles:

```text
SUPER_ADMIN       Full platform/tenant administration
COMPANY_ADMIN     Organization, branch, users, decisions, and reviews
DEPARTMENT_ADMIN  Assigned department management and reviews
MANAGER           Assigned branch review, create, and edit capabilities
EMPLOYEE          Read allowed context; create personal/team proposals
```

Role permissions are the ceiling. Branch membership is the scope. A request is authorized only if both conditions are true:

```text
authorize(user, organization, permission, target):
  authenticate session
  require user.organizationId === target.organizationId
  require role grants permission
  require target branch is in the user's allowed branch set
  apply explicit DENY overrides
  allow
```

The allowed branch set is calculated from:

1. the user’s personal branch;
2. explicitly granted department/team branches;
3. permitted ancestors needed for inherited context;
4. permitted cross-branch targets explicitly shared with the user’s allowed set.

An explicit deny wins over an inherited read grant. Finance, HR, and Management are not included in Max’s allowed set, so their rows are excluded before search, counts, relationship expansion, and LLM prompt construction. The client may hide controls for UX, but every read and write repeats the server-side policy check.

## 6. Branch inheritance

Branches use a parent/child tree. Every employee receives a personal branch connected to their team branch:

```text
Company → Department → Team → Personal
```

For a user in `Technical → Service → Max`, the default context path is:

```text
[Company, Technical, Service, Max]
```

Inheritance is a visibility rule, not a copy operation. Knowledge remains owned by its original branch and is resolved at read time. This keeps approvals, audit history, and later permission changes correct.

Scope resolution:

- `PERSONAL`: only the owner and authorized reviewers can read it.
- `TEAM`: visible to members of the target team after approval.
- `DEPARTMENT`: visible to permitted department members after approval.
- `COMPANY`: visible to permitted organization members after approval.

Cross-branch relationships are additive, never a permission bypass. When a relationship points to a branch or object the user cannot read, that edge and target are omitted from the response.

## 7. Secure AI retrieval flow

The chat endpoint must use this order:

```text
Request
  ↓
Validate session and input
  ↓
Resolve organization from session (never from client input)
  ↓
Load role + explicit branch permissions
  ↓
Resolve current branch and allowed ancestor path
  ↓
Build a server-side visibility predicate
  ↓
Run vector/full-text retrieval inside that predicate
  ↓
Retrieve current and historical decisions with validity metadata
  ↓
Expand only authorized relationships
  ↓
Apply confidence / retrieval thresholds
  ↓
Build a bounded, source-labelled context
  ↓
Call AIProvider on the server
  ↓
Return answer, confidence, citations, and unknown/conflict state
```

The database query must include `organizationId` and the allowed branch/scope predicate before the vector similarity operation is used. Do not retrieve globally and filter in JavaScript. Do not pass raw database rows, embeddings, private notes, or unauthorized relationship targets to the model.

The model contract should make these states explicit:

```ts
type AnswerState = "ANSWERED" | "INSUFFICIENT_EVIDENCE" | "CONFLICTING_SOURCES";

type AIAnswer = {
  state: AnswerState;
  answer: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  citations: Array<{ sourceId: string; label: string; citation?: string }>;
};
```

If evidence is below threshold, return “I don’t have enough verified company knowledge to answer this.” If sources conflict, show the conflict and both authorized sources; the model must not silently choose an internal rule.

### AI abstraction

```ts
interface AIProvider {
  embed(input: string): Promise<number[]>;
  answer(input: AIAnswerRequest): Promise<AIAnswer>;
}

class OpenAIProvider implements AIProvider {
  // Server-only implementation. Reads OPENAI_API_KEY from server env.
}
```

Prompts should include only the bounded retrieved context, source IDs/labels, user question, and answer policy. The API key and provider client are server-only modules.

## 8. API architecture

All routes validate input with a shared schema layer and authorize before touching domain data.

```text
POST   /api/organizations
GET    /api/branches
POST   /api/branches
PATCH  /api/branches/:id
GET    /api/users
POST   /api/users
GET    /api/knowledge
POST   /api/knowledge
PATCH  /api/knowledge/:id
DELETE /api/knowledge/:id
GET    /api/decisions
POST   /api/decisions
POST   /api/decisions/:id/supersede
GET    /api/sources
POST   /api/search
POST   /api/chat
GET    /api/reviews
POST   /api/reviews/:id/approve
POST   /api/reviews/:id/reject
GET    /api/integrations
POST   /api/integrations/:provider/connect
GET    /api/audit-logs
```

Route handlers should call application services rather than embedding Prisma queries in UI components. Writes use transactions for the domain change plus its audit event; decision superseding also creates the `SUPERSEDES` relationship atomically.

## 9. Integration architecture

Integrations are adapters behind a provider interface:

```ts
interface IntegrationProvider {
  authorize(input: AuthorizationInput): Promise<AuthorizationResult>;
  sync(input: SyncInput): Promise<SyncResult>;
  disconnect(input: DisconnectInput): Promise<void>;
}

MicrosoftProvider
GoogleProvider
SlackProvider
NotionProvider
CRMProvider
```

MVP integration hub:

- Microsoft 365 — `Connect` when the OAuth flow is implemented
- Google Workspace — `Connect` when the OAuth flow is implemented
- Slack — `Connect` when the OAuth flow is implemented
- Notion — `Connect` when the OAuth flow is implemented
- CRM — `Coming soon`

Until a provider is real, the UI must not persist a connected state. OAuth tokens are encrypted server-side, scoped to the organization, and omitted from logs. Imported material enters as `Source`/staging data, then becomes candidate Knowledge Units or Decisions requiring review. n8n can consume `OutboxEvent` or signed webhook events without receiving private data outside the organization scope.

## 10. Audit and security model

Audit events are written for user, branch, permission, knowledge, decision, review, employee, and integration changes. Events capture actor, organization, target, action, timestamp, request ID, and a redacted before/after snapshot.

Security requirements:

- Session identity and organization are derived server-side.
- No OpenAI key or integration secret reaches the browser.
- Every tenant query contains a tenant predicate; add database RLS as defense in depth.
- Branch authorization happens before retrieval and before LLM context creation.
- Sensitive source metadata is redacted from ordinary employee responses.
- Audit logs are append-only and hidden from employees.
- Rate-limit chat and mutation endpoints; validate payloads and cap context size.
- Treat imported documents and integration content as untrusted data, not instructions.

## 11. Implementation plan

### Phase 1 — analysis and architecture (complete)

- Completed repository analysis.
- Created this `ARCHITECTURE.md`.
- Confirmed the existing UI is a static prototype and identified the migration boundary.
- Phase 2 implementation was started after approval.

### Phase 2 — identity, organization, tenancy (complete)

- Scaffold Next.js/TypeScript and environment validation.
- Add Auth.js, organizations, seeded roles, users, and tenant-aware Prisma access.
- Add server-side authorization helpers and tenant isolation tests.

### Phase 3 — branches and employee context (complete)

- Implement branch CRUD, tree queries, branch memberships, personal branch creation, and inheritance resolution.
- Migrate the existing tree UI to server data.

- Implemented: branch CRUD, scoped branch reads, branch membership API, automatic personal branches, inherited visibility resolution, protected `/brain` tree/detail pages, and branch isolation tests.

### Phase 4 — knowledge, sources, and reviews (complete)

- Add Knowledge Units, source links, scope/status transitions, review workflows, and audit events.
- Add source-required validation for shared knowledge.

- Implemented: scoped Knowledge Unit CRUD, source links, confidence/status fields, personal privacy rules, review queue, approve/reject transitions, audit events, and API isolation checks.

### Phase 5 — Decision Memory (complete)

- Add current/historical validity, superseding transactions, exceptions, relationships, and decision history UI.
- Implemented: scoped decision CRUD, validity windows, effective expiry status, source links, exceptions, audit events, and atomic superseding that preserves the historical decision row.
- Implemented API routes: `/api/decisions`, `/api/decisions/:id`, and `/api/decisions/:id/supersede`.

### Phase 6 — secure retrieval and AI chat (complete)

- Enable pgvector, embedding jobs, permission-filtered search, AIProvider, citations, thresholds, and conflict/unknown states.
- Add tests proving unauthorized units never enter LLM context.
- Implemented: server-side authorized branch resolution before retrieval, lexical fallback, pgvector cosine retrieval, embedding endpoint, AIProvider/OpenAI adapter, citations, retrieval thresholds, and explicit `UNKNOWN`/`CONFLICT`/`AI_NOT_CONFIGURED` responses.
- Implemented API routes: `/api/search`, `/api/chat`, and `/api/knowledge/:id/embed`.

### Phase 7 — onboarding (next)

- Generate personalized onboarding plans from authorized context only.
- Track progress and knowledge checks.

### Phase 8 — integration hub, hardening, and polish

- Add real provider adapters one at a time; keep unimplemented providers as Coming Soon.
- Add outbox/n8n boundary, audit log UI, rate limiting, error handling, security regression tests, and visual migration polish.

## 12. Required acceptance tests

The implementation is not ready for production until these tests pass:

1. **Tenant isolation:** an Organization A user cannot fetch or infer Organization B rows.
2. **Permission isolation:** Max cannot retrieve Finance, HR, or Management knowledge.
3. **Branch inheritance:** Max receives Company + Technical + Service context, not unrelated branches.
4. **Personal privacy:** Max’s personal Knowledge Unit is invisible to Sarah until approved/promoted.
5. **Decision history:** Decision #2 supersedes Decision #1 without deleting #1.
6. **AI context isolation:** unauthorized units and relationships are absent from the model request payload.
7. **Source attribution:** every answered claim maps to an actually retrieved authorized source.
8. **Unknown state:** insufficient evidence returns the explicit unknown answer instead of a guess.
9. **Conflict state:** contradictory authorized sources are shown as a conflict.
10. **Auditability:** material mutations create append-only audit records in the same transaction.

## 13. Open decisions before implementation

- Confirm Auth.js versus the organization’s preferred managed auth provider.
- Confirm the managed PostgreSQL/pgvector host and backup requirements.
- Confirm whether `Process` needs a dedicated table or remains a Knowledge Unit type in the MVP.
- Confirm the initial organization admin invitation flow.
- Confirm the first real integration to implement after the hub UI.
