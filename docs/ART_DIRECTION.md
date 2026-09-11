# Squatch Crossing Art Direction

## Target look

A modern stylized 3D Appalachian diorama: rounded characters, recognizable vehicle silhouettes, layered mountains, soft atmospheric lighting, dense roadside detail, clean mobile UI, and playful animation. The hidden gameplay grid should not read visually as a board of cubes.

## Visual priorities

1. Squatch silhouette and animation readability
2. Vehicle readability at phone scale
3. Lush Appalachian edges and distant ridges
4. Strong weather / day-night mood changes
5. High contrast between playable lanes and decorative scenery
6. Stable mobile frame time over unnecessary geometric detail

## Asset strategy

The current build creates most visual assets procedurally from PlayCanvas primitives. One reusable Squatch body supports all cosmetic variants. Vehicle families share construction logic. Forest detail comes from randomized trees, rocks, signs, buildings, tents, and logs rather than dozens of downloaded asset packs.

This keeps the repository self-contained and gives later art upgrades a clean replacement path for GLB models without rewriting the game systems.
