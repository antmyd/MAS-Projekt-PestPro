# Aufgabe 3 – Implementieren und Testen des Workflows

**Team 3 – PestPro GmbH (B2B-Schädlingsbekämpfung)**

**Teammitglieder:**
Mydlach, Anton Eric | s0596533
Bas, Emre | s0579548
Bessong Ngam, Emmanuel Dongmo | s0599797
Cung, Luis Duc Nam | s0597101

**Abgabedatum:** 12.07.2026

Diese Abgabe ist nach den drei Teilaufgaben gegliedert. Alle Ordner enthalten nur die
finalen, zur Bewertung relevanten Dateien.

## 3A_Workflow-Implementierung/

Die vier ausführbaren Prozesse (BPMN) sowie die Service-/REST-Anbindungen (externe
Node.js-Task-Worker) und zwei zusätzliche RPA-Bots, die zur Mindestanforderung
"mindestens 3 RPA-Bots über alle Prozesse hinweg" beitragen.

- `bpmn/` – die vier finalen Prozesse
- `workers/` – External Task Worker (Slack, GitHub, Frankfurter API); `.env.example`
  statt echter Zugangsdaten
- `weitere-rpa-bots/` – vollständige UiPath-Projekte „AngebotsEmail" und „RechnungsExcel"

### 1. Lokale Umgebung aufsetzen

Benötigt: Java (OpenJDK 21+), Camunda Run 7.23.0, Node.js.

1. Die vier Dateien aus `bpmn/` in `camunda-bpm-run-7.23.0/configuration/resources/`
   kopieren.
2. Camunda Run starten (`start.bat` im Camunda-Run-Ordner).
3. Tasklist öffnen: `http://localhost:8080/camunda/app/tasklist`, Login `demo` / `demo`.
4. Prüfen: alle vier Prozesse sind unter „Start process" auswählbar.

### 2. Externe Task-Worker starten (notwendig für P2 und P4)

```
cd workers
npm install
cp .env.example .env
```

`.env` ist eine reine Textdatei (mit Notepad/VS Code öffnen, nicht mit Excel). Pro Zeile
`SCHLÜSSEL=Wert`, ohne Anführungszeichen.

**Slack-Token** (`SLACK_BOT_TOKEN`, `SLACK_CHANNEL`) – nötig für den QS-Ticket-Task in P2:
1. Auf [api.slack.com/apps](https://api.slack.com/apps) einloggen (ein kostenloser
   Slack-Workspace reicht, in 2 Min. unter slack.com/get-started angelegt).
2. „Create New App" → „From scratch" → Namen vergeben, Workspace auswählen.
3. Links „OAuth & Permissions" → runter zu „Scopes" → „Bot Token Scopes" →
   „Add an OAuth Scope" → `chat:write` hinzufügen.
4. Oben „Install to Workspace" klicken, bestätigen.
5. Den angezeigten „Bot User OAuth Token" (beginnt mit `xoxb-`) kopieren →
   `SLACK_BOT_TOKEN=xoxb-...`
6. In der Slack-App einen Channel öffnen/anlegen (z. B. `#test`), dort
   `/invite @App-Name` eingeben.
7. `SLACK_CHANNEL=test` eintragen (ohne `#`).

**GitHub-Token** (`GITHUB_TOKEN`, `GITHUB_REPO`) – nötig für den Stellenausschreibungs-Task
in P4:
1. Auf [github.com/settings/tokens](https://github.com/settings/tokens) einloggen.
2. „Generate new token" → „Generate new token (classic)".
3. Scope `repo` aktivieren, Ablaufdatum wählen, „Generate token" klicken.
4. Token (beginnt mit `ghp_`) sofort kopieren → `GITHUB_TOKEN=ghp_...`
5. Ein beliebiges (auch leeres) Test-Repository anlegen.
6. `GITHUB_REPO=dein-github-name/repo-name` eintragen.

`worker-rechnung.js` (Frankfurter API, Wechselkurse) benötigt **keinen** Key – die
entsprechenden Zeilen in `.env` können leer bleiben.

Worker starten (Camunda Run muss bereits laufen):
```
node start-all-workers.js
```

### 3. Prozesse testen – wichtiger Hinweis

**Claim-Mechanik:** Tasks sind mit festen Rollennamen belegt (`techniker`, `vertrieb`,
`innendienst` …), nicht mit `demo`. Ein Task lässt sich daher nicht sofort ausfüllen: In
der Tasklist links auf **„All Tasks"** filtern, Task öffnen, oben rechts auf **„Claim"**
klicken – erst danach ist das Formular editierbar.

### 4. RPA-Bots in `weitere-rpa-bots/` testen

Jeden Ordner (`AngebotsEmail/`, `RechnungsExcel/`) in UiPath Studio öffnen
(`project.json`), fehlende Pakete werden automatisch nachinstalliert, dann im
Debug-Modus oder über den UiPath Assistant ausführen.

**Hinweis zu `AngebotsEmail`** (Outlook-Mail-Bot): Die Tabelle
`Uebergabe_Angebot.xlsx` im selben Ordner enthält bereits Testzeilen, deren Spalte
„Status" auf „Gesendet" steht – diese Zeilen überspringt der Bot beim Ausführen. Für
einen eigenen Testlauf entweder eine neue Zeile mit eigener E-Mail-Adresse in
`kontaktEmail` hinzufügen (idealerweise eine Adresse, bei der die Zustellung direkt
geprüft werden kann) oder bei einer bestehenden Zeile „Status" und „Log" leeren.

## 3B_RPA-Bot-Prozessinstanzen/

Vollständiges UiPath-Projekt `ProzessInstanz-Starter/` – loggt sich eigenständig in die
Camunda Tasklist ein und startet 10 neue Prozessinstanzen anhand der Datentabelle
`ProzessInstanzen.xlsx`. Voraussetzung: die lokale Camunda Run läuft bereits und die
BPMN-Prozesse aus 3A sind deployt. Nach dem Ausführen ist der Start der 10 Instanzen in
Camunda Cockpit (`http://localhost:8080/camunda/app/cockpit`) nachprüfbar.

## 3C_Test-Partnergruppe/

`Bewertungsformular_Partnergruppe_ausgefuellt.pdf` – ausgefüllte Checkliste zum Workflow
der zugewiesenen Partnergruppe.
