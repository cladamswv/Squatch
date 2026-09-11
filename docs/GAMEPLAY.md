# Gameplay Specification

## Core loop

Move one row at a time, survive hazards, collect currency and power-ups, keep the Sighting Meter low, set a new distance record, instantly retry.

## Input

- Tap: forward
- Swipe up: forward
- Swipe left/right: sidestep
- Swipe down: backward
- Optional Hold to Hop in Settings
- Keyboard arrows/WASD supported for browser testing

## Sighting system

Photographers can focus on Squatch in selected safe terrain rows. Staying exposed fills the Sighting Meter and periodically creates a photograph. Exposure decays when hidden. At 100, the run ends with `PROOF FOUND`.

Standing still also becomes dangerous. After several seconds without forward progress, hunter pressure raises exposure and eventually ends the run.

## Power-ups

- Squatch Coin: currency
- Pepperoni Roll: one temporary collision save
- Mountain Fog: temporary camera concealment
- Trail Mix: faster hop animation
- Fake Footprints: immediately reduces exposure

## Progression

Thirty cosmetic Squatches use coins and best-score gates. Daily missions provide coin rewards. Achievements and lifetime statistics persist locally.
