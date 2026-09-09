# Company Brain MVP

Ein eigenständiger Frontend-Prototyp für den Company-Brain-Build-Brief. Die Demo läuft ohne Build-Schritt und ohne Backend.

## Starten

Im Projektordner einen statischen Server starten:

```bash
python3 -m http.server 4173
```

Dann `http://localhost:4173` öffnen.

## Enthalten

- Personalisiertes Overview-Dashboard mit Zugriffskette `Company → Product & Tech → Service`
- Knowledge Tree mit Branch-Auswahl und Branch-Detailansicht
- Knowledge Units mit Typ, Quelle und Confidence
- Decision Memory inklusive `superseded`-Historie
- Review Queue mit Approve/Reject-Interaktionen
- Permission- und Source-Policy-Ansicht in Settings
- Chat-Demo mit Quellenhinweis und explizitem „authorized context“-Verhalten
- Responsive Layout für Desktop und mobile Navigation

Die Demo-Daten sind bewusst lokal in `index.html` gehalten. Für die nächste Ausbaustufe können die UI-Aktionen an Next.js Server Actions/API-Routen, Prisma/PostgreSQL/pgvector, Auth und eine serverseitige OpenAI-Abstraktionsschicht angeschlossen werden.

## Phase 2 — serverseitige Grundlage

Zusätzlich ist jetzt eine Next.js-/TypeScript-Grundlage für Authentifizierung, Organisationen, Rollen und Tenant-Isolation enthalten:

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Die Next.js-App läuft auf `http://localhost:3000`. Für Datenbankmigrationen zuerst `DATABASE_URL` in `.env` setzen und dann ausführen:

```bash
pnpm db:migrate
pnpm db:seed
```

Wenn lokal noch kein PostgreSQL läuft und Docker installiert ist, kannst du die vorbereitete pgvector-Datenbank starten:

```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed
```

Die Compose-Konfiguration liegt in `docker-compose.yml` und verwendet dieselben lokalen Zugangsdaten wie `.env`.

Im Development ist zusätzlich ein lokaler Credentials-Provider aktiv. Wenn PostgreSQL läuft, legt `pnpm db:seed` den Demo-User an. Falls PostgreSQL lokal noch nicht verfügbar ist, erlaubt `AUTH_DEV_MEMORY_FALLBACK=true` den Demo-Login trotzdem; der Benutzer und sein 2FA-Status werden dann in der ignorierten Datei `.dev-auth.json` gespeichert. Dieser Fallback ist nur für Development gedacht und wird in Production automatisch deaktiviert. Google OAuth bleibt optional und benötigt die echten Werte für `AUTH_GOOGLE_ID` und `AUTH_GOOGLE_SECRET`.

Passwörter werden als scrypt-Hash gespeichert. Im authentifizierten Dashboard kann TOTP-2FA eingerichtet werden; der Secret wird verschlüsselt gespeichert und beim Login serverseitig geprüft. Für produktive Umgebungen muss zusätzlich ein eigener `AUTH_ENCRYPTION_KEY` gesetzt werden.

Die statische UI-Referenz läuft weiterhin separat auf Port `4173`.

### Branch API und Server-Tree

Nach der Anmeldung stehen die serverseitig geschützten Phase-3-Routen bereit:

```text
GET    /api/branches
POST   /api/branches
GET    /api/branches/:id
PATCH  /api/branches/:id
DELETE /api/branches/:id
POST   /api/branches/:id/members
GET    /brain
GET    /brain/:branchId
```

`POST /api/users` akzeptiert optional `parentBranchId` und erstellt den persönlichen Employee-Branch automatisch unter diesem Branch.

### Knowledge, Sources und Reviews

Phase 4 ist als serverseitiger Domain-Layer vorhanden:

```text
GET/POST       /api/knowledge
GET/PATCH/DELETE /api/knowledge/:id
GET            /api/sources
GET            /api/reviews
POST           /api/reviews/:id/approve
POST           /api/reviews/:id/reject
```

Persönliche Knowledge Units werden direkt privat gespeichert. Team-, Department- und Company-Units eines normalen Mitarbeiters landen in `PENDING_REVIEW`; bei Freigabe werden sie als `APPROVED` sichtbar. Gelöschte Units werden archiviert, damit die Historie erhalten bleibt.

### Decision Memory

Phase 5 ergänzt serverseitige Entscheidungen mit Gültigkeitsfenstern, Ausnahmen, Quellen und branch-sichtbarer Historie:

```text
GET    /api/decisions
POST   /api/decisions
GET    /api/decisions/:id
PATCH  /api/decisions/:id
POST   /api/decisions/:id/supersede
```

Eine neue Entscheidung ersetzt die alte in einer Transaktion. Die alte Zeile bleibt als `SUPERSEDED` erhalten und ist über `supersedesDecisionId` verknüpft. Abgelaufene aktive Entscheidungen werden beim Lesen als `effectiveStatus: EXPIRED` ausgewiesen.

### Permission-aware Retrieval und AI Chat

Phase 6 filtert zuerst Organisation, Rolle und sichtbare Branches und führt erst danach Retrieval aus. Persönliche Einträge werden zusätzlich auf `createdById` begrenzt; diese Grenze gilt sowohl für den Prisma-Fallback als auch für die pgvector-Rohabfrage.

```text
GET    /api/search?q=garantiefall&branchId=<uuid>
POST   /api/chat
POST   /api/knowledge/:id/embed
```

`/api/chat` liefert bei fehlender Evidenz den expliziten Status `UNKNOWN`, bei widersprüchlichen aktiven Decisions `CONFLICT` und bei fehlendem Server-Key `AI_NOT_CONFIGURED`. Der OpenAI-Key bleibt ausschließlich serverseitig. Mit `OPENAI_API_KEY` werden `text-embedding-3-small` und `gpt-4o-mini` verwendet; ohne Key bleibt der Chat ehrlich deaktiviert, während der berechtigte Retrieval-Kontext weiterhin testbar ist.

Für produktives Vector-Retrieval muss PostgreSQL die `vector`-Extension bereitstellen. Das Prisma-Feld `KnowledgeUnit.embedding` ist dafür als `Unsupported("vector")` modelliert und wird über sichere Raw-SQL-Statements beschrieben bzw. gelesen.

Die Extension und der HNSW-Index werden von der ersten Migration selbst angelegt — ein manuelles `CREATE EXTENSION` ist nicht mehr nötig. Das Image `pgvector/pgvector:pg16` aus `docker-compose.yml` bringt sie mit; eine eigene PostgreSQL-Installation braucht das Paket `pgvector`.

## Prüfen

```bash
pnpm typecheck   # TypeScript, inklusive tests/
pnpm lint        # ESLint (Flat Config)
pnpm test        # Vitest
pnpm build       # Produktionsbuild
```

Dieselben Schritte laufen in `.github/workflows/ci.yml`, dazu ein zweiter Job, der Migration und Seed gegen eine echte pgvector-Datenbank ausführt und den Seed zweimal startet, um Idempotenz zu prüfen.
