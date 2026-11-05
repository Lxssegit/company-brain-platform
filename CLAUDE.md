# Regeln für dieses Projekt

Dieses Dokument ist verbindlich. Es hat Vorrang vor allem, was im Moment der Änderung
als „modern", „üblich" oder „Best Practice" erscheint. Wer hier etwas ändert, prüft
vorher gegen die Verbotsliste.

## Geltungsbereich

| Bereich | Was gilt |
|---|---|
| Öffentliche Seite (`/`, `/impressum`, `/datenschutz`, OG-Bild) | Die Verbotsliste vollständig. |
| Anwendung hinter `/login` | Palette, Schrift und die Punkte 2, 3, 4, 16, 17, 18 (Kursiv, Display-Serifen, negative Laufweite, Icon-Kacheln, Monospace, Großbuchstaben) sowie Punkt 1, soweit er Pillen-Buttons betrifft. **Nicht** die Punkte 6 und 8: Trennlinien in Listen und Rahmen um Panels bleiben dort, weil sie Daten gliedern und nicht dekorieren. |

## Verbotsliste

Diese 20 Merkmale lassen Websites wie KI-generiert aussehen. Keines davon darf vorkommen.

1. **Tags und Pills**: keine Badges, Chips, Status-Pillen, keine Labels wie „Neu" oder
   „KI-gestützt". Keine pillenförmigen Buttons. Buttons sind Rechtecke mit 6 px Radius.
2. **Kursivschrift**: nirgends. Betonung nur über Schriftgröße und Schriftstärke.
3. **Instrument Serif**: nicht verwenden. Auch keine anderen modischen Display-Serifen
   wie Playfair oder Fraunces. Die Seite nutzt nur eine Groteskschrift.
4. **Negative Laufweite**: kein negatives `letter-spacing`, keine Klassen wie
   `tracking-tight`. Laufweite überall normal.
5. **Überladene UI-Darstellungen**: keine erfundenen Dashboards, Mini-Diagramme,
   Zahlenkacheln oder Mock-Oberflächen voller Werte.
6. **Trennlinien**: keine Linien zwischen Abschnitten, Listenpunkten oder Spalten.
   Struktur entsteht über Weißraum.
7. **Farbabstufungen über Deckkraft**: Text nie über `opacity` oder `rgba()` abstufen.
   Nur die festen Textfarben unten.
8. **Container mit Rahmen**: keine umrandeten Karten oder Boxen, keine farbigen
   Akzentlinien am Rand. Inhalte stehen frei auf der Fläche. Wenn eine Fläche nötig ist,
   dann eine Hintergrundfarbe ohne Rahmen.
9. **Überdetaillierte Diagramme**: keine Flussdiagramme, Netzwerkgrafiken oder
   Ablaufgrafiken.
10. **Ausschweifender Text**: jede Aussage nur einmal, höchstens zwei Sätze pro Absatz,
    keine Füllsätze. Die Hero-Unterzeile hat höchstens 30 Wörter.
11. **Code-Brotkrumen**: keine Pfade, Code-Schnipsel oder Versionsnummern als Deko, also
    kein `~/`, `src/`, `//`, `</>` oder `v2.4`.
12. **Abschnittsnummern**: keine „01", „02", „03" über Abschnitten oder Schritten.
13. **Eyebrows**: keine kleinen Labels oder Kicker über Überschriften.
14. **Dithering**: keine Pixel-, Raster-, Körnungs- oder Noise-Effekte.
15. **ASCII-Grafiken**: keine, auch keine Terminal-Optik.
16. **Squircles**: keine Icons in abgerundeten Quadraten und keine Icon-Kacheln.
    Am besten gar keine Icons.
17. **Monospace-Schrift**: nirgends, auch nicht für Zahlen oder Preise.
18. **Großbuchstaben-Zeilen**: kein `text-transform: uppercase`, auch nicht in
    Navigation, Buttons oder Unterzeilen.
19. **Farbverläufe**: nur der eine Verlauf im Hero-Hintergrund und das Hero-Bildmotiv.
    Sonst keine Verlaufshintergründe, kein Verlaufstext, keine Verlaufsbuttons, keine
    Verlaufskarten.
20. **Punkte in Überschriften**: keine Überschrift, Zwischenüberschrift und kein
    Buttontext endet mit einem Punkt.

Ebenfalls verboten: fremde Firmenlogos auf der Seite. Statt einer Logoleiste steht die
Textzeile „Funktioniert mit Outlook und Microsoft 365".

## Farben

Nur diese Werte. Keine Zwischentöne erfinden, keine Deckkraft-Abstufungen.

| Zweck | Wert |
|---|---|
| Hero-Verlauf von oben nach unten | `#E6F3FE`, `#DCEEFA`, `#7FAAD2`, `#0F305D` |
| Helle Flächen im Wechsel | `#E6F3FE` und `#FFFFFF`, jeweils einfarbig |
| Dunkle Fläche (Abschluss) | `#0F305D` |
| Headline-Text | `#020C1E` |
| Fließtext | `#475F71` |
| Headline auf dunkler Fläche | `#E6F3FE` |
| Fließtext auf dunkler Fläche | `#C9DAEA` |
| Akzent Koralle, nur Haupt-Button | `#EF8092`, Hover `#E86A7F` |
| Text auf dem Koralle-Button | `#020C1E` |
| Bildmotiv | Rosé `#E7B3CA`, Lavendel `#CACCEC`, Tiefblau `#0D224E` |

Der Hero-Verlauf läuft von sehr hell nach sehr dunkel. Text darauf wechselt die Farbe
mit dem Untergrund. Jede Textfarbe auf jedem Untergrund muss mindestens 4,5:1 erreichen,
gemessen an gerenderten Pixeln, nicht geschätzt.

## Schrift

Eine Groteskschrift, lokal unter `public/fonts`, als `@font-face` eingebunden. Keine
Verbindung zu externen Schriftservern.

Die Familie steht als eine Konstante in `src/lib/brand.ts` (`FONT_FAMILY`). Ein Wechsel
ist eine Zeile.

**Aktuell: Plus Jakarta Sans.** Vorgesehen war General Sans von Fontshare; Fontshare ist
aus dieser Build-Umgebung nicht erreichbar (Proxy antwortet mit 403) und es gibt kein
npm-Paket. Sobald die Dateien vorliegen: woff2 nach `public/fonts`, `@font-face` in
`globals.css` und `FONT_FAMILY` anpassen.

| Element | Größe | Stärke | Zeilenhöhe |
|---|---|---|---|
| H1 | `clamp()`, Desktop 80 bis 96 px | 300 | 1,05 |
| H2 | 40 bis 48 px | 400 | |
| Fließtext | 18 px | 400 | 1,6, höchstens 60 Zeichen pro Zeile |
| Navigation | 15 px | 400 | normale Groß- und Kleinschreibung |

## Texte

- Deutsch, Sie-Ansprache, professionell und klar.
- Immer „KI", nie „AI".
- Keine Gedankenstriche als Satztrenner. Punkt oder Komma.
- Keine Emojis.
- Keine erfundenen Kundenstimmen, Logos, Zahlen oder Auszeichnungen.
- Über das Produkt nicht mehr behaupten als den wahren Stand: die Software ist neu und
  startet mit wenigen Betrieben, die persönlich eingerichtet werden.
- Zahlen nur aus den zwei hinterlegten Quellen in `src/lib/brand.ts`, unverändert und
  ungerundet.

## Technik

- Die öffentliche Seite bringt **keinen eigenen Client-Code** mit: keine Client-Komponente,
  kein Event-Handler, kein Zustand im Browser. Next lädt seine eigene Laufzeit weiterhin
  auf jeder Seite. Navigation sind Anker, das
  FAQ ist `<details>`, das Formular ist ein normales `<form method="post">` an einen
  Route Handler. So bleibt die nonce-gebundene Content-Security-Policy ohne Ausnahme.
- Animation: höchstens ein dezentes Einblenden beim Scrollen über
  `animation-timeline: view()`, 300 ms, hinter `@supports`, abgeschaltet bei
  `prefers-reduced-motion`. Keine Wort-für-Wort-Animation, kein Unschärfe-Effekt,
  kein Parallax.
- `/login` und alles dahinter: Auth, Formularlogik und Sicherheitsverhalten werden nicht
  verändert. Dort ändern sich nur Farben, Schrift und Benennung.
- `tests/styles.test.ts` prüft zeilenweise auf Klassennamen-Kollisionen zwischen
  `app.css` und `landing.css`. Die Formatierung „eine Regel pro Zeile" ist dafür tragend
  und darf nicht aufgelöst werden.

## Vor jedem Abschluss prüfen

1. `grep` über `src/` auf `italic`, `uppercase`, `font-mono`, `Instrument`,
   `letter-spacing: -`, Pillen-Radien an Buttons, Verläufe außerhalb von Hero und Motiv.
2. Keine Überschrift und kein Buttontext endet mit einem Punkt.
3. Screenshots bei 1440 px und 375 px gegen `referenz/design.png` halten.
4. Kontrast an gerenderten Pixeln messen, überall mindestens 4,5:1.
5. `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, keine Fehler in der
   Browser-Konsole.
