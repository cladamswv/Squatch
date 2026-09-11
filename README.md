# Squatch Crossing 👣🌲

A modern portrait mobile arcade game set in stylized Appalachia. Guide Sasquatch across mountain roads, railroads, creeks, campgrounds, logging country, and small towns while avoiding traffic and keeping humans from proving you exist.

## This is the phone-friendly edition

This repository replaces the original Unity prototype with a web-native stack:

- **PlayCanvas Engine** for 3D rendering and game objects
- **TypeScript** for game logic
- **Vite** for the web build
- **Capacitor** for the Android wrapper
- **GitHub Actions** for both web deployment and APK generation

No Unity installation, Unity license, Android Studio, or local PC build is required for the normal testing workflow. GitHub's runners create the Android project and compile the debug APK.

## Gameplay included

- Tap forward; swipe left/right/down to move
- Endless procedural Appalachian terrain
- Roads with cars, pickups, coal trucks, logging trucks, buses, and RVs
- Freight railroads with warnings and moving trains
- Creek rows with stepping stones and logs
- Town, campground, logging, forest, road, creek, and railroad terrain types
- Sighting Meter with photographers, camera flashes, escalating exposure, and hunter pressure
- Squatch Coins and power-ups: Pepperoni Roll, Mountain Fog, Trail Mix, Fake Footprints
- 30 Squatch variants with progression and cosmetics
- Daily missions, records, and achievements
- Daily Trail deterministic seed
- Rare Mothman and UFO events
- Clear, fog, rain, snow, autumn, and night presentation
- Local offline save data
- Music/SFX/ambient controls, haptics toggle, reduced motion, reduced flash, high contrast, graphics quality
- Instant retry

## Phone-only GitHub workflow

1. Upload this repository to GitHub and push to `main`.
2. Open **Actions**.
3. `Deploy Web Game` builds the browser version.
4. `Build Android APK` builds an installable debug APK.
5. Open the completed Android workflow and download the artifact named **Squatch-Crossing-Android**.

### Enable the playable web link

In the repository, open **Settings → Pages**. Under **Build and deployment**, set Source to **GitHub Actions**. Run the `Deploy Web Game` workflow again if needed. The completed run shows the public game URL.

## Local development, when a computer is available

```bash
npm install
npm run dev
```

Production web build:

```bash
npm run build
```

Android debug build on a configured development machine:

```bash
npm run android:debug
```

The GitHub workflow does this remotely, so these local commands are optional.

## Project layout

```text
src/
  audio.ts       synthesized audio and feedback
  catalog.ts     Squatches, missions, achievements
  factory.ts     procedural stylized 3D asset factory
  game.ts        game director and progression
  player.ts      Squatch movement/animation
  save.ts        local save data
  style.css      mobile UI and weather presentation
  types.ts       shared game types
  ui.ts          menus, HUD, missions, settings, records
  world.ts       procedural terrain and hazards
public/
  icon.png
  logo.png
.github/workflows/
  android-apk.yml
  pages.yml
scripts/
  patch-android.mjs
```

## Android note

The GitHub workflow produces an **unsigned debug APK**, which is appropriate for direct testing on your own Android phone. A Play Store release later requires a release keystore/signing workflow.

## Technology versions

Pinned in `package.json` so the repository does not silently jump major versions during a build.

## License

Game code and original Squatch Crossing branding in this repository are project assets. Third-party software retains its own license; see `THIRD_PARTY_NOTICES.md`.
