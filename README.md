# Anfrage-Wächter

Software von AILVL für Betriebe, die für Kundenanfragen bezahlen. Sie beantwortet jede
neue Anfrage innerhalb von 2 Minuten mit einem Rückruftermin, sorgt dafür, dass keine
Anfrage liegen bleibt, und zeigt pro Portal, was sich rechnet.

Das Projekt besteht aus zwei Teilen: der öffentlichen Seite unter `/` und der
angemeldeten Anwendung hinter `/login`. Beide teilen sich Palette und Schrift, folgen
aber unterschiedlich strengen Regeln, siehe unten.

**Die Gestaltungsregeln stehen in [CLAUDE.md](./CLAUDE.md) und sind verbindlich.** Wer
hier etwas ändert, liest sie vorher. Sie enthalten eine Verbotsliste mit 20 Punkten, die
Farbwerte, die Schriftregeln und die Textregeln.

## Entscheidungen, die der Auftrag offengelassen hat

Der Auftrag sagte: wenn etwas unklar ist, im Sinne der Vorlage und der Verbotsliste
entscheiden und hier notieren. Das ist diese Liste.

### Die Schrift ist nicht General Sans

Vorgesehen war General Sans von Fontshare. **Fontshare ist aus dieser Build-Umgebung
nicht erreichbar**: der Egress-Proxy beantwortet jedes CONNECT an `api.fontshare.com` und
`cdn.fontshare.com` mit 403, und ein npm-Paket für General Sans gibt es nicht.

An seiner Stelle steht **Plus Jakarta Sans**: dieselbe Gattung, echte 300er für die große
leichte Headline, als woff2 lokal unter `public/fonts`. Keine Verbindung zu einem
externen Schriftserver.

Der Tausch ist klein gehalten: die Dateien nach `public/fonts`, die vier `@font-face`
in `src/app/globals.css` auf die neuen Pfade, und `FONT_FAMILY` in `src/lib/brand.ts`.

### Die Verbotsliste gilt in der Anwendung nur zur Hälfte

Öffentlich gilt sie vollständig. Hinter `/login` gelten Palette, Schrift und die Punkte zu
Kursiv, Display-Serifen, negativer Laufweite, Icon-Kacheln, Monospace, Großbuchstaben und
Pillenform.

**Nicht** übernommen sind dort die Punkte 6 und 8, also das Verbot von Trennlinien und
von Rahmen um Container. Die Anwendung zeigt Listen, Zweigbäume und Zugriffstabellen; dort
gliedern Linien Daten und dekorieren nicht. Ohne sie wird aus einer Tabelle eine Textwand.
Die Liste ist für eine Website geschrieben, nicht für eine datendichte Oberfläche.

### Kein Einblenden beim Scrollen

Der Auftrag erlaubte höchstens ein dezentes Einblenden, 300 ms. Es war gebaut, über
`animation-timeline: view()` und damit ohne JavaScript, und ist wieder entfernt worden.

Grund: eine `view()`-Zeitachse braucht einen Scroll-Überhang. Gibt es keinen, weil das
Fenster höher ist als die Seite, bleibt der Fortschritt bei null, der Füllmodus hält den
Ausgangszustand fest, und **jeder Abschnitt steht auf Deckkraft null**. Das war in der
Vollseiten-Aufnahme sofort sichtbar und träfe auch Besucher mit sehr hohem Fenster.
Unsichtbarer Inhalt wiegt schwerer als ein fehlender Übergang.

Die einzige Bewegung ist jetzt die sehr langsame Drift der Kugel im Hero, 20 Sekunden,
wenige Pixel, abgeschaltet bei `prefers-reduced-motion`.

### Das Bildmotiv ist gezeichnet, nicht gefiltert

Naheliegend wäre `backdrop-filter` mit einer `feDisplacementMap` gewesen. Das funktioniert
nicht verlässlich, weil sich SVG-Filter nicht auf den Hintergrund hinter einem Element
anwenden lassen.

Stattdessen trägt jeder der sieben Glasstreifen **eine eigene Kopie der Kugel**, horizontal
um wenige Pixel versetzt und auf den Streifen beschnitten. Weil jede Kopie anders versetzt
ist, bricht die Silhouette an jeder Kante, wie hinter Riffelglas. Das funktioniert in jedem
Browser, kostet keinen Request und ist bis auf den Pixel steuerbar. Kein WebGL.

### `public/hero.webp` ist ein Schalter, keine Datei

Die Bilddatei liegt nicht bei; eine erfundene webp wäre schlechter als keine. Der Weg
dorthin ist aber gebaut: eigenes Bild nach `public/hero.webp` legen und in
`src/lib/brand.ts` `HERO_IMAGE` auf `"/hero.webp"` setzen. `HeroMotif` zeigt dann das Bild
statt der gezeichneten Kugel.

### Mobile Navigation bricht um, sie klappt nicht auf

Unter 600 px rücken die vier Links in eine zweite Zeile. Kein Menü hinter einem Klick:
das wäre entweder JavaScript, das die Seite sonst nirgends braucht, oder ein
`details`-Element, das an dieser Stelle wie ein Bedienelement aussieht, wo die Vorlage
nur Text zeigt. Bei vier Links trägt der Umbruch.

### 301 statt 308 für die alten Branchenseiten

`/energietechnik` und `/industrie` haben als Routen **nie existiert**, das waren Anker in
einer früheren Navigation. Die Weiterleitungen sind trotzdem angelegt, wie verlangt.
Next setzt für `permanent: true` ein 308; verlangt war 301, deshalb steht der Statuscode
direkt in `next.config.ts`.

### Impressum übernommen, Datenschutzerklärung angepasst statt kopiert

Das Impressum ist wörtlich das von ailvl.de. Stammdaten stehen als Konstanten in
`src/lib/brand.ts`, damit Anschrift und Rufnummer nicht an zwei Stellen gepflegt werden.

Die Datenschutzerklärung ist **nicht** kopiert. Aufbau, Rechtsgrundlagen und
Formulierungen stammen von ailvl.de, der Inhalt ist aber auf das abgeglichen, was diese
Seite tatsächlich tut. Die Unterschiede:

| ailvl.de | diese Seite |
|---|---|
| Formular mit Branche, Herausforderungen, Unternehmensgröße, Zeithorizont | Formular mit Firma, Name, E-Mail, Telefon, Anfragewegen, Anfragemenge, Microsoft 365 |
| Formulardaten in Supabase, EU Frankfurt | Formulardaten an einen Automatisierungsdienst, Anbieter noch als Platzhalter |
| Reichweitenmessung mit Umami nach Einwilligung | keine Reichweitenmessung |
| Chat mit Tidio nach Einwilligung | kein Chat |
| `ailvl.consent` und `ailvl.funnel` im Browserspeicher | nichts im Browserspeicher, die öffentlichen Seiten führen keinen eigenen Code aus |
| kein Login | Kundenlogin mit scrypt-Hashes, optionaler Zwei-Faktor-Anmeldung und Sitzungs-Cookie |

Eine kopierte Erklärung hätte die Verarbeitung verschwiegen, die hier wirklich
stattfindet. Das ist bei einer Seite, die mit Verarbeitung in der EU wirbt, der teuerste
denkbare Fehler.

**Offen bleibt genau ein Punkt**: der Anbieter hinter `N8N_WEBHOOK_URL`. Name, Anschrift,
Serverstandort und der Vertrag zur Auftragsverarbeitung stehen als sichtbarer Platzhalter
in `/datenschutz`. Ohne diese Angabe ist die Erklärung unvollständig.

Kommt der Tidio-Chat dazu, braucht die Seite zusätzlich einen Abschnitt dazu, einen
Einwilligungsbanner und den Widerruf. Abschnitt 5 sagt das heute ausdrücklich.

### Koralle in der Anwendung

Öffentlich ist Koralle dem Hauptbutton vorbehalten. In der Anwendung trägt sie zusätzlich
die zerstörende Aktion, weil die Palette sonst keine warme Farbe hat, die jemanden anhält.

## Was noch gefüllt werden muss

| Wo | Was |
|---|---|
| `src/app/LandingPage.tsx` | `[LAUFZEIT UND KÜNDIGUNG]` und `[MAXIMALE ANFRAGEN PRO MONAT]` im Preisabschnitt |
| `src/app/LandingPage.tsx` | `[FOTO]` und `[3 BIS 4 SÄTZE ÜBER MICH]` im Abschnitt „Über mich" |
| `src/app/datenschutz/page.tsx` | Anbieter hinter `N8N_WEBHOOK_URL`: Name, Anschrift, Serverstandort, Auftragsverarbeitungsvertrag |
| Umgebung | `N8N_WEBHOOK_URL`, sonst läuft die Testzugang-Anfrage ins Leere und die Seite meldet einen Fehler |
| `public/logo.svg` | die eigene Wortmarke; die Navigation zeigt bis dahin den Schriftzug „ailvl" |
| `public/hero.webp` | optional, siehe oben |

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
| `/entscheidungen` | Was gilt, seit wann, und was abgelaufen ist |
| `/fragen` | Fragen stellen — Wissen finden oder eine Antwort formulieren lassen |
| `/freigaben` | Die Warteschlange: was auf eine Entscheidung wartet |
| `/team` | Wer mitarbeitet, und wen man einlädt |
| `/einladung/<token>` | Wo eine eingeladene Person ihr Passwort vergibt |
| `/organisation` | Wo ein Konto ohne Unternehmen eines gründet |

## Sicherheitsköpfe und CSP

Dokument-Antworten bekommen ihre Content-Security-Policy aus `src/middleware.ts`,
weil sie einen Nonce trägt, der sich pro Anfrage ändert. `next.config.ts` setzt
die übrigen Köpfe und eine Policy für alles, was die Middleware nicht anfasst —
API-Antworten und statische Dateien, in denen ohnehin kein Skript läuft.

`script-src` kommt damit ohne `'unsafe-inline'` aus. Der Preis: eine
vorgerenderte Seite entsteht zur Bauzeit und kann keinen Wert tragen, der sich
pro Anfrage ändert — alle ihre Skripte werden blockiert. `/` und `/login` sind
deshalb ausdrücklich `force-dynamic`; beide holen keine Daten, es kostet ein
Template-Rendering.

Eine Ausnahme bleibt: die 404-Seite wird immer vorgerendert, und daran ändert
keine Segment-Konfiguration etwas. Ihre Skripte laufen nicht. Sie ist deshalb so
gebaut, dass sie keine braucht — Text und ein Link, nichts, was auf Hydration
wartet. In der Browserkonsole erscheinen dort blockierte Skripte.

## Wer was ändern darf

Freigabe heißt: jemand Zuständiges hat **diesen Text** gelesen. Daraus folgen
zwei Regeln, die im Code stehen und getestet sind:

- **Ändern.** Wer etwas geschrieben hat, darf es korrigieren — auch als
  Mitarbeitend, sonst bliebe der eigene Tippfehler für immer stehen. Ist der
  Eintrag aber freigegeben und über den persönlichen Zweig hinaus sichtbar,
  geht er durch die Änderung zurück in die Warteschlange und verliert seine
  Freigabe. Wessen Rolle ohne Freigabe veröffentlichen darf, ändert direkt.
- **Archivieren.** Dafür gibt es keine Wiedervorlage — nichts holt den Eintrag
  auf fremden Beschluss zurück. Autorinnen und Autoren nehmen deshalb nur
  zurück, was noch ihnen allein gehört: eine persönliche Notiz, ein Entwurf,
  etwas noch nicht Freigegebenes. Vereinbartes Wissen entfernt nur eine
  erhöhte Rolle.

## Ein Unternehmen gründen

Wer sich anmeldet und zu keinem Unternehmen gehört — nach einer Anmeldung über
Google etwa —, landet auf `/organisation` und gründet dort eines. Damit wird das
Konto Unternehmens-Admin, und der Unternehmenszweig entsteht als Wurzel des
Baums mit.

Vorher war das nicht erreichbar: `POST /api/organizations` verlangte ein aktives
Konto, aktiv wurde man aber nur durch den Beitritt zu einem Unternehmen. Jede
geschützte Seite schickte ein solches Konto zurück auf `/login` — angemeldet und
trotzdem zur Anmeldung geschickt, in einer Schleife.

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

## Anmeldung

E-Mail und Passwort gegen die echte Kontentabelle, mit scrypt und TOTP — in
Development und in Production derselbe Weg. Passwörter liegen als scrypt-Hash.
TOTP-2FA lässt sich im Dashboard einrichten; das Secret wird verschlüsselt
gespeichert und beim Login serverseitig geprüft.

`AUTH_PASSWORD_LOGIN_ENABLED="false"` schaltet ihn ab. Das ist nur sinnvoll,
wenn jedes Konto über einen OAuth-Provider hereinkommt — wer eine Einladung
annimmt, wird über denselben Provider angemeldet, mit ihm endet also auch der
Einladungs-Flow.

Google OAuth ist optional und braucht echte Werte für `AUTH_GOOGLE_ID` und
`AUTH_GOOGLE_SECRET`.

### Ohne Datenbank starten

Läuft PostgreSQL, legt `pnpm db:seed` das Demo-Konto und sieben Kolleginnen und
Kollegen an. Ohne PostgreSQL erlaubt `AUTH_DEV_MEMORY_FALLBACK=true` den Login
trotzdem: Benutzer und 2FA-Status liegen dann in der ignorierten Datei
`.dev-auth.json`. Dieser Notzugang authentifiziert gegen zwei Umgebungs-
variablen ohne Datenbank dahinter. Er ist in Production aus, und ihn dort zu
setzen bricht den Start ab.

### Was Production braucht

Der Server prüft das beim Start und startet nicht, wenn etwas fehlt:

| Variable | |
| --- | --- |
| `AUTH_SECRET` | Pflicht, mindestens 32 Zeichen. `openssl rand -base64 48` |
| `DATABASE_URL` | Pflicht — Konten liegen in der Datenbank |
| `AUTH_ENCRYPTION_KEY` | Optional, fällt auf `AUTH_SECRET` zurück. Eigener Wert, wenn einer von beiden rotierbar bleiben soll, ohne jede eingerichtete Authenticator-App zu entwerten |
| `AUTH_DEV_MEMORY_FALLBACK` | Darf nicht gesetzt sein |

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
pnpm typecheck        # TypeScript, inklusive tests/
pnpm lint             # ESLint (Flat Config)
pnpm test             # Vitest, ohne Datenbank
pnpm test:integration # braucht eine Datenbank mit pgvector
pnpm build            # Produktionsbuild
```

`pnpm test` lässt `tests/integration/` bewusst aus: dort läuft die Vektorsuche
gegen einen echten HNSW-Index, den keine Entwicklungsmaschine ohne pgvector hat.
Der Einbettungsdienst ist dabei ein deterministisches Testdouble — geprüft wird
das SQL dieses Projekts, seine Rechteprüfung und die Verschmelzung beider
Trefferlisten, nicht OpenAI. Ein API-Schlüssel ist nicht nötig.

Dieselben Schritte laufen in `.github/workflows/ci.yml`, dazu ein zweiter Job, der Migration und Seed gegen eine echte pgvector-Datenbank ausführt und den Seed zweimal startet, um Idempotenz zu prüfen.

