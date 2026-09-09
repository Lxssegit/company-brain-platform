# Company Brain

Das Betriebsgedächtnis eines Unternehmens: eine Next.js-Anwendung, in der Wissen,
Entscheidungen und Kontext an dem Zweig hängen, zu dem sie gehören, und in der
jede Antwort nur aus dem gebaut wird, was die fragende Person auch sehen darf.

## Starten

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Die App läuft auf `http://localhost:3000`.

Für die Datenbank zuerst `DATABASE_URL` in `.env` setzen, dann:

```bash
pnpm db:migrate
pnpm db:seed
```

Wenn lokal kein PostgreSQL läuft und Docker vorhanden ist, bringt
`docker-compose.yml` eine passende pgvector-Datenbank mit:

```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed
```

Die Migration legt Extension und HNSW-Index selbst an; ein manuelles
`CREATE EXTENSION` ist nicht nötig. Eine eigene PostgreSQL-Installation braucht
das Paket `pgvector`.

## Die Oberflächen

| Pfad | Was dort passiert |
| --- | --- |
| `/` | Die öffentliche Seite: der Baum, der beim Scrollen wächst |
| `/login` | Anmeldung |
| `/dashboard` | Der eigene Zugriff: Rolle, Rechte, sichtbare Zweige |
| `/brain`, `/brain/:branchId` | Der Wissensbaum und was in einem Zweig liegt |
| `/fragen` | Fragen stellen — Wissen finden oder eine Antwort formulieren lassen |
| `/freigaben` | Die Warteschlange: was auf eine Entscheidung wartet |
| `/team` | Wer mitarbeitet, und wen man einlädt |
| `/einladung/<token>` | Wo eine eingeladene Person ihr Passwort vergibt |

## Einladungen

Eingeladene Konten haben kein Passwort und könnten sich sonst nie anmelden.
`POST /api/users` legt darum zusätzlich eine Einladung an und gibt den Link
**einmalig** in der Antwort zurück; gespeichert wird nur sein SHA-256-Hash, in
der `VerificationToken`-Tabelle unter dem Bezeichner `invite:<userId>`. Ein
geleaktes Datenbankabbild lässt sich damit nicht als Link nachspielen.

Der Link gilt sieben Tage und genau einmal. Beim Einlösen setzt
`POST /api/invitations/accept` das Passwort, schaltet das Konto auf `ACTIVE`
und löscht die Einladung — in einer Transaktion. Die Route ist die einzige, die
Fremde schreibend erreichen, und deshalb rate-limited; sie unterscheidet in der
Antwort nicht zwischen abgelaufen, verbraucht und nie existiert.

Es wird noch keine Mail versendet. Wer einlädt, gibt den Link selbst weiter.

## Anmeldung im Development

Ein lokaler Credentials-Provider ist aktiv. Läuft PostgreSQL, legt
`pnpm db:seed` den Demo-User an. Ohne PostgreSQL erlaubt
`AUTH_DEV_MEMORY_FALLBACK=true` den Login trotzdem; Benutzer und 2FA-Status
liegen dann in der ignorierten Datei `.dev-auth.json`. Der Fallback ist nur für
Development gedacht und in Production automatisch aus. Google OAuth ist optional
und braucht echte Werte für `AUTH_GOOGLE_ID` und `AUTH_GOOGLE_SECRET`.

Passwörter liegen als scrypt-Hash. TOTP-2FA lässt sich im Dashboard einrichten;
das Secret wird verschlüsselt gespeichert und beim Login serverseitig geprüft.
Produktive Umgebungen brauchen einen eigenen `AUTH_ENCRYPTION_KEY`.

## Die API

### Branch API und Server-Tree

Nach der Anmeldung stehen die serverseitig geschützten Routen bereit:

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

Der serverseitige Domain-Layer:

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

Entscheidungen tragen Gültigkeitsfenstern, Ausnahmen, Quellen und branch-sichtbarer Historie:

```text
GET    /api/decisions
POST   /api/decisions
GET    /api/decisions/:id
PATCH  /api/decisions/:id
POST   /api/decisions/:id/supersede
```

Eine neue Entscheidung ersetzt die alte in einer Transaktion. Die alte Zeile bleibt als `SUPERSEDED` erhalten und ist über `supersedesDecisionId` verknüpft. Abgelaufene aktive Entscheidungen werden beim Lesen als `effectiveStatus: EXPIRED` ausgewiesen.

### Permission-aware Retrieval und AI Chat

Retrieval filtert zuerst Organisation, Rolle und sichtbare Branches und führt erst danach Retrieval aus. Persönliche Einträge werden zusätzlich auf `createdById` begrenzt; diese Grenze gilt sowohl für den Prisma-Fallback als auch für die pgvector-Rohabfrage.

```text
GET    /api/search?q=garantiefall&branchId=<uuid>
POST   /api/chat
POST   /api/knowledge/:id/embed
```

`/api/chat` liefert bei fehlender Evidenz den expliziten Status `UNKNOWN`, bei widersprüchlichen aktiven Decisions `CONFLICT` und bei fehlendem Server-Key `AI_NOT_CONFIGURED`. Der OpenAI-Key bleibt ausschließlich serverseitig. Mit `OPENAI_API_KEY` werden `text-embedding-3-small` und `gpt-4o-mini` verwendet; ohne Key bleibt der Chat ehrlich deaktiviert, während der berechtigte Retrieval-Kontext weiterhin testbar ist.

Für produktives Vector-Retrieval muss PostgreSQL die `vector`-Extension bereitstellen. Das Prisma-Feld `KnowledgeUnit.embedding` ist als `Unsupported("vector(1536)")` modelliert und wird über parametrisierte Raw-SQL-Statements geschrieben und gelesen. Die Dimension steht fest, weil pgvector eine dimensionslose Spalte nicht indexieren kann.

Die Extension und der HNSW-Index werden von der ersten Migration selbst angelegt — ein manuelles `CREATE EXTENSION` ist nicht mehr nötig. Das Image `pgvector/pgvector:pg16` aus `docker-compose.yml` bringt sie mit; eine eigene PostgreSQL-Installation braucht das Paket `pgvector`.

## Prüfen

```bash
pnpm typecheck   # TypeScript, inklusive tests/
pnpm lint        # ESLint (Flat Config)
pnpm test        # Vitest
pnpm build       # Produktionsbuild
```

Dieselben Schritte laufen in `.github/workflows/ci.yml`, dazu ein zweiter Job, der Migration und Seed gegen eine echte pgvector-Datenbank ausführt und den Seed zweimal startet, um Idempotenz zu prüfen.

