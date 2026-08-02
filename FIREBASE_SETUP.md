# TaskNow – Firebase Backend einrichten

Das Frontend läuft jetzt gegen ein echtes Backend: **Auth + Firestore laufen
über Firebase**, **Datei-Uploads laufen über ein eigenes PHP-Script auf
Hostinger** (nicht Firebase Storage - siehe Abschnitt 3). Diese Anleitung
geht davon aus, dass du bereits ein Firebase-Projekt hast.

## 1. Authentication aktivieren

1. [Firebase Console](https://console.firebase.google.com) → dein Projekt → **Build → Authentication**.
2. Falls noch nicht geschehen: **Get started** klicken.
3. Tab **Sign-in method** → **Add new provider**:
   - **E-Mail/Passwort** → aktivieren, speichern.
   - **Google** → aktivieren, Support-E-Mail auswählen, speichern.
4. Tab **Settings → Authorized domains**: dort müssen stehen:
   - `localhost` (ist standardmäßig drin, für lokale Entwicklung)
   - `tasknow.me`
   - `www.tasknow.me` (falls genutzt)

   Ohne das schlägt Google-Login auf der echten Domain fehl.

## 2. Firestore Database

1. **Build → Firestore Database** → falls noch keine Datenbank existiert: **Create database** → **Production mode** → Region wählen (z.B. `eur3 (europe-west)` für EU-Nutzer) → **Enable**.
2. Tab **Rules** → Inhalt komplett ersetzen durch den Inhalt der Datei **`firestore.rules`** aus diesem Projekt → **Publish**.

Alle Datenbankabfragen der App sind reine Gleichheits-Abfragen (kein
`orderBy` auf Firestore-Ebene, es wird im Frontend sortiert) – du brauchst
deshalb **keine** zusätzlichen Composite-Indexes anzulegen.

## 3. Datei-Uploads (Hostinger, nicht Firebase Storage)

Profilbilder, Task-Fotos und Verifizierungs-Dokumente werden **nicht** über
Firebase Storage hochgeladen, sondern über `public/upload.php` - ein PHP-
Script, das mit `npm run build` automatisch in den `dist`-Ordner kopiert
wird und beim normalen Hostinger-Upload mit hochgeladen wird. Kein
zusätzlicher Schritt nötig, außer:

1. Sicherstellen, dass dein Hostinger-Plan **PHP** unterstützt (Standard bei
   praktisch jedem Hostinger-Webhosting-Paket) mit den Extensions `openssl`
   und `fileinfo` (beide sind auf Hostinger standardmäßig aktiviert).
2. In `public/upload.php` steht oben `FIREBASE_PROJECT_ID` fest eingetragen
   (`tasknowme-4dcef`) - das Script prüft damit, dass ein Firebase-ID-Token
   wirklich zu deinem Projekt gehört. Nur relevant, falls du je das
   Firebase-Projekt wechselst.
3. Nach dem Hochladen von `dist/` sollte `https://tasknow.me/uploads/`
   existieren (wird beim ersten Upload automatisch angelegt) und
   `https://tasknow.me/upload.php` sollte bei einem GET-Request `{"error":
   "Method not allowed"}` zurückgeben (Zeichen dafür, dass PHP läuft).

**Sicherheit:** `upload.php` prüft das Firebase-ID-Token serverseitig
(Signatur-Check gegen Googles öffentliche Schlüssel, ganz ohne Firebase
Admin SDK/Composer), erlaubt nur Bilder + PDF bis 10 MB, und bestimmt die
Dateiendung ausschließlich aus dem tatsächlich erkannten Dateiinhalt (nicht
aus dem vom Client angegebenen Dateinamen) - damit lässt sich keine
ausführbare Datei einschleusen. `public/uploads/.htaccess` blockt zusätzlich
jede Skript-Ausführung in diesem Ordner. Anders als bei Firebase Storage
sind hochgeladene Dateien hier nur so gut geschützt wie der Server selbst -
kein separates, deklaratives Regel-System wie Firestore.

`storage.rules` und der Storage-Bereich in der Firebase Console werden
aktuell **nicht** benutzt (können in Firebase brach liegen bleiben, kein
Problem).

## 4. Web-App-Konfiguration holen

1. **Project settings** (Zahnrad oben links) → Tab **General** → runterscrollen zu **"Your apps"**.
2. Falls noch keine Web-App existiert: **Add app → Web** (</> Icon), einen Namen vergeben, **Firebase Hosting NICHT aktivieren** (ihr hostet ja auf Hostinger), **Register app**.
3. Im angezeigten `firebaseConfig`-Objekt findest du die Werte für die `.env`-Datei:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

4. Im Projekt: `.env.example` nach `.env` kopieren und die Werte eintragen:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 5. Lokal testen

```bash
npm install
npm run dev
```

Öffne die App, registriere einen Test-Account (E-Mail/Passwort oder
Google), durchlaufe das Onboarding (Rolle wählen + Ausweisdokumente
hochladen). Prüfe in der Firebase Console unter **Firestore Database →
Data**, ob ein Dokument in `users/{deine-uid}` angelegt wurde.

Datei-Uploads funktionieren lokal nur, wenn `https://tasknow.me/upload.php`
schon live ist (Vite's Dev-Server kann kein PHP ausführen) - dafür in `.env`
die Zeile `VITE_UPLOAD_URL=https://tasknow.me/upload.php` einkommentieren.
Bis `upload.php` live auf Hostinger ist, schlagen Uploads lokal mit einem
Fetch-Fehler fehl - das ist erwartet.

## 6. Admin-Zugang freischalten

Die Seiten `/adminblog` und `/adminverification` sind nur für Nutzer mit
`role: "admin"` sichtbar. Das musst du einmalig manuell setzen:

1. **Firestore Database → Data → users** → dein User-Dokument öffnen (Doc-ID = deine Firebase-Auth-UID).
2. Feld `role` von `"user"` auf `"admin"` ändern → Update.

Danach hast du in der App Zugriff auf die Admin-Bereiche (Blog-Verwaltung,
Verifizierungs-Anfragen freigeben/ablehnen).

## 7. Build & Deploy auf Hostinger

Vite backt alle `VITE_*`-Variablen zur Build-Zeit ein – nach jeder
Änderung an `.env` musst du neu bauen und hochladen:

```bash
npm run build
```

Alles aus dem `dist`-Ordner (inkl. `.htaccess`) in das Hostinger-
Dokumentenverzeichnis für `tasknow.me` hochladen (siehe `DEPLOYMENT.md`
für Details zur Hostinger/IONOS-Domain-Verbindung – daran ändert sich
nichts).

## Was ohne Cloud Functions (noch) nicht funktioniert

Da bewusst auf Cloud Functions verzichtet wurde (kein Blaze-Plan nötig),
sind folgende Punkte aktuell nur Platzhalter (loggen eine Warnung in die
Browser-Konsole, brechen aber nichts ab):

- **E-Mail-Benachrichtigungen** (z.B. "Bewerbung angenommen", "neue
  Nachricht") – aktuell kein Versand.
- **SMS-Benachrichtigungen**.
- **KI-Funktionen** (Bildgenerierung, Datei-Text-Extraktion, LLM-Aufrufe) –
  in der App aktuell ungenutzt, aber im Client-Code als Stub vorhanden.

Wenn du das später willst: eine einzelne Cloud Function (oder ein kleiner
Server, z.B. auf Railway) reicht, die z.B. auf neue `messages`-Dokumente
reagiert und über einen E-Mail-Anbieter (Resend, SendGrid, ...) verschickt.
