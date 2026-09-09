# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Everyone in the company, from a new employee to the managing director. Confirmed:
this is not a tool where a curator role maintains knowledge for everyone else.
The same person asks and contributes.

- **Asking** is the everyday act: someone is mid-task, needs an answer that holds
  up, and cannot afford a plausible guess.
- **Curating** is the same product, not a second one: approving what colleagues
  propose, recording decisions, granting branch access.

System roles, in ascending authority: `EMPLOYEE`, `MANAGER`, `DEPARTMENT_ADMIN`,
`COMPANY_ADMIN`, `SUPER_ADMIN`. Role is the ceiling; branch membership is the
scope. Both must permit a request.

Target customer: German *Mittelstand* / KMU. Grown structures, knowledge sitting
in individual heads and mail folders rather than in a system.

## Product Purpose

Company Brain is a company's operating memory. Scattered knowledge, decisions and
context become one permission-aware source of truth.

Success is a question answered truthfully from verified company knowledge — or an
explicit statement that the evidence is not there. A confident invented answer is
a product failure, not a rough edge.

## Positioning

Three mechanisms, all implemented in the codebase rather than aspirational:

1. **Permission is resolved before retrieval, not after.** Organization, role and
   the allowed branch set become a SQL predicate that is applied before the
   vector similarity operation. Rows a user may not read never reach the model's
   prompt. Retrieving globally and filtering in application code is explicitly
   rejected in `ARCHITECTURE.md`.
2. **Decision Memory with validity and supersession.** A replaced decision is not
   edited or deleted; it stays readable as `SUPERSEDED` and linked through
   `supersedesDecisionId`. "Why do we do it this way, and what did we do before"
   is answerable.
3. **The answer contract has honest non-answers.** `UNKNOWN` when evidence falls
   below the retrieval threshold, `CONFLICT` when active decisions contradict
   each other. The model is not permitted to silently pick a winner.

## Operating Context

- Branches form a tree: Company → Department → Team → Personal. Every user gets a
  personal branch under their team.
- Inheritance is a **visibility rule, not a copy**. Knowledge stays owned by its
  originating branch and is resolved at read time, so approvals, audit history
  and later permission changes stay correct.
- An explicit `DENY` grant beats an inherited `READ`.
- Knowledge an employee shares beyond their personal branch enters
  `PENDING_REVIEW` and becomes visible on approval. Personal knowledge stays
  private to its creator.
- Knowledge and decisions carry sources: document, email, meeting, chat, CRM,
  ERP, manual entry, employee input, decision.
- Deletion archives rather than destroys. The audit log is append-only.

## Capabilities and Constraints

- **Product language is German.** Confirmed. The current interface copy on the
  landing page and the authenticated screens is English and is technical debt to
  be translated, not a finished state. Domain identifiers in code are English
  (`Branch`, `KnowledgeUnit`, `Decision`, `Review`, `Source`); whether the
  surfaces keep those words or take German equivalents is **undecided** and needs
  a glossary decision before the translation.
- Multi-tenant. Every tenant-owned row carries `organizationId`, enforced in the
  query layer.
- Knowledge types: `FACT`, `PROCESS`, `RULE`, `DECISION`, `CUSTOMER`, `PRODUCT`,
  `PERSON`, `EXCEPTION`, `PROCEDURE`, `LESSON`, `POLICY`.
  Scopes: `PERSONAL`, `TEAM`, `DEPARTMENT`, `COMPANY`.
  Statuses: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`.
- The OpenAI key stays server-side. Without it the chat is honestly disabled
  (`AI_NOT_CONFIGURED`) rather than faked; authorized retrieval still works and
  stays testable.
- Vector retrieval requires PostgreSQL with the `pgvector` extension.
- Planned but not built: integrations with an encrypted-token boundary, an
  outbox for reliable background work and n8n hooks, onboarding plans. No
  "connected" state may be shown for an integration that does not exist.
- **Undecided:** accessibility standard; German glossary for the domain terms;
  where inside KMU the size band sits.

## Brand Commitments

- Name: **Company Brain**.
- No logo file, wordmark, colour specification or brand guideline exists in the
  repository. The visual world currently in the code was established during
  design work in this project, not handed down as an identity — it is recorded in
  `DESIGN.md`, and nothing about it is a binding brand constraint yet.

## Evidence on Hand

- `ARCHITECTURE.md` — the project's own architecture decision record covering
  phases 2–6, the permission model, the retrieval order and the data model.
- `README.md` — setup and the API surface.
- Working implementation: 22 routes, the permission policy, the retrieval
  pipeline, and `tests/security/permissions.test.ts` (13 passing unit tests).
- `index.html`, `app.js`, `styles.css` — the original static prototype, kept as a
  reference. Its demo company is "Northstar Co." with Sales, Product & Tech,
  Service, Finance and Leadership.
- **Absences future work must not fill in:** there are no customers, testimonials,
  case studies, benchmarks, pricing, press or usage numbers. There are also no
  committed database migrations (`prisma/migrations/` does not exist), despite
  the README instructing `pnpm db:migrate`.

## Product Principles

1. **Permission before retrieval.** Filter in the query, never in application
   code afterwards.
2. **An honest non-answer beats a plausible one.** `UNKNOWN` and `CONFLICT` are
   features to be shown clearly, not errors to be smoothed over.
3. **Knowledge keeps its origin.** Inheritance is visibility, archiving is not
   deleting, and a superseded decision stays readable.
4. **One product for the whole hierarchy.** The employee and the managing
   director use the same surfaces; the tree decides what each of them sees.
5. **Never claim what is not in the record.** No invented sources, citations,
   customers or confidence.

## Accessibility & Inclusion

No standard has been established for this product. Recorded as undecided rather
than assumed; the contrast and keyboard work done so far targets WCAG 2.2 AA by
default, not by requirement.
