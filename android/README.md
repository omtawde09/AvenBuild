# AvenBuild — Android app (WebView)

A native Android shell around the web app. The Vite production build is packaged inside the APK and served offline
from `https://appassets.androidplatform.net` by `WebViewAssetLoader`, so the app needs no hosting or network connection.
Data stays in the WebView's `localStorage` on the device, exactly as in a browser.

## What the shell handles

| Concern | Behaviour |
|---|---|
| Routing | Paths without a file extension fall back to `index.html`, so React Router deep paths and reloads work. |
| Back button | Closes the top open `<dialog>` first, then goes back in in-app history, then leaves the app. |
| File attachments | `<input type="file">` opens the system picker (multiple files, filtered to the input's `accept` types). |
| Links | Links to other hosts open in the browser / mail / phone app; `intent:`, `javascript:` and `file:` are never handed off. |
| System bars | Edge-to-edge with the page laid out between the status bar, navigation bar and keyboard. |
| Security | No JavaScript bridge, file and content URL access disabled, WebView debugging only in debug builds. |
| Splash | Android 12+ splash screen held until the first page renders (4 s cap). |

Package `com.avenbuild.app` (debug builds: `com.avenbuild.app.debug`, so both can be installed side by side),
min SDK 26 (Android 8.0), target SDK 36. The page needs a current Android System WebView (Chrome 111+), which Play
updates automatically.

## Requirements

- JDK 17+ — Android Studio's bundled JBR works: `JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"`
- Android SDK with platform 36 (`local.properties` points at it; Android Studio creates this file)
- Node.js and `npm install` already run in the repository root

## Build

From this `android/` folder:

```bash
./gradlew assembleRelease
```

This runs `npm run build` in the repository root, copies `dist/` into the APK and writes
`app/build/outputs/apk/release/app-release.apk`. Add `-PskipWebBuild` to reuse an existing `dist/`.
`./gradlew assembleDebug` gives a debuggable build (inspect it at `chrome://inspect`).

Install on a connected device or emulator:

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

## Release signing

Release builds are signed with the key described in `keystore.properties` (git-ignored), for example:

```properties
storeFile=keystore/avenbuild-release.jks
storePassword=…
keyAlias=avenbuild
keyPassword=…
```

Without that file the release APK is built unsigned. **Back up the keystore and its password**: Android only installs an
update over an existing install when it is signed with the same key, and a lost key cannot be recovered.

## Antivirus HTTPS scanning

If Gradle fails with `PKIX path building failed` while downloading dependencies, an antivirus (for example Avast Web
Shield) is re-signing HTTPS traffic with a root Java does not trust. Either exclude Java from HTTPS scanning, or build a
truststore that adds that root and pass it to Gradle:

```bash
./gradlew assembleRelease -Djavax.net.ssl.trustStore=/path/to/truststore.jks -Djavax.net.ssl.trustStorePassword=changeit
```

## Updating the app

Bump `versionCode` in `app/build.gradle.kts` for each release you distribute (`versionName` follows `package.json`),
rebuild, and install over the previous version.
