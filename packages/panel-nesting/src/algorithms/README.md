# Placement algorithms

One folder per algorithm.

Convention: `src/algorithms/<algo-id>/index.ts` exports an object matching the `PlacementAlgorithm` interface (`src/registry.ts`), then calls `registerPlacementAlgorithm(...)` to plug it into the public registry. Import an algorithm's folder to register it — nothing is auto-registered by importing the package itself.

`shared/` holds the pieces every algorithm reuses rather than reimplementing: `geometry.ts` (board dimensions, rotation-allowed rule), `expandParts.ts` (quantity expansion, board-aspect rotation default), and `shelfPack.ts` (the row-based packer — rows require an exact height match to accept a part, so a row can never mix heights, by construction rather than by convention).

- `genetic/` — searches part order and per-type rotation with a GA to minimize board count, cut count, wasted trailing space per row, and row-order (biggest area first, easier and safer to cut).
- `first-fit-decreasing/` — deterministic baseline: sort parts biggest-area first, rotate each to match the board's orientation, pack with no search. No fitness tuning, no randomness — useful to sanity-check the genetic algorithm's output against.
