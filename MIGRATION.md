# Unity → PlayCanvas / Capacitor Migration

This repository is the replacement for the Unity prototype of Squatch Crossing.

## What changed

- Unity C# runtime → TypeScript game runtime
- Unity renderer → PlayCanvas Engine
- Unity Android build → Capacitor Android wrapper + Gradle on GitHub Actions
- Unity license secret → **not required**
- Local Unity Editor → **not required**
- Test loop → GitHub Pages in the phone browser, plus downloadable Android APK artifacts

## What was preserved

The core design remains the same: procedural Appalachian crossing, Squatch movement, traffic, railroads, creeks, the Sighting Meter, photographers, coins and power-ups, weather, rare cryptid events, missions, achievements, cosmetic Squatches, settings, records, and offline local progress.

## Repository migration

For a clean GitHub history, replace the Unity repository contents with this repository's contents. Do not keep Unity `Assets`, `Packages`, or `ProjectSettings` folders beside this project, because they are no longer used.
