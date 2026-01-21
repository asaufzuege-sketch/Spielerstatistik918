# SmartHockey als Android App bauen

## Voraussetzungen
- Node.js installiert
- Android Studio installiert
- Java JDK 11+ installiert

## Schritt 1: Icons erstellen
1. Erstelle ein 512x512 PNG Icon für deine App
2. Gehe zu https://www.pwabuilder.com/imageGenerator
3. Lade dein Icon hoch
4. Lade alle generierten Icons herunter
5. Kopiere sie in den `icons/` Ordner

## Schritt 2: Bubblewrap installieren
```bash
npm install -g @bubblewrap/cli
```

## Schritt 3: TWA-Projekt erstellen
```bash
mkdir SmartHockey-TWA
cd SmartHockey-TWA
bubblewrap init --manifest=https://asaufzuege-sketch.github.io/Spielerstatistik918/manifest.json
```

Beantworte die Fragen:
- Package name: `com.smarthockey.tracking918`
- App name: `SmartHockey 918`
- Signing key: Erstelle einen neuen Key

## Schritt 4: APK bauen
```bash
bubblewrap build
```

Die APK-Datei findest du unter `app-release-signed.apk`

## Schritt 5: In Android Studio testen
1. Öffne Android Studio
2. Verbinde ein Android Gerät oder starte einen Emulator
3. Ziehe die APK auf das Gerät

## Schritt 6: Google Play Store
1. Gehe zu https://play.google.com/console
2. Erstelle ein Entwicklerkonto ($25 einmalig)
3. Erstelle eine neue App
4. Lade die signierte APK/AAB hoch
5. Fülle alle Store-Informationen aus
6. Reiche zur Überprüfung ein

## Wichtig: Digital Asset Links
Für TWA musst du eine `assetlinks.json` Datei erstellen:

1. Erstelle `.well-known/assetlinks.json` in deinem Repo
2. Füge deinen SHA-256 Fingerprint ein (von bubblewrap generiert)
