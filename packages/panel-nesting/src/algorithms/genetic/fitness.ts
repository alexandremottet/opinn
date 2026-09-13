import type { Decoded } from "./decode";

interface BoardDims {
  widthMm: number;
  heightMm: number;
}

// Lower is better, in priority order: unplaced parts, board count, a big
// reward for same-part neighbors (batch-cuttable side by side), a reward for
// parts oriented the same way as the board (wide-on-wide, tall-on-tall —
// keeps rows short so height grouping has more rows to work with), guillotine
// cut count, then two 0..1 ratios scaled against material placed: the
// trailing gap stranded mid-row before that row's own right edge, and rows
// running biggest-area first from the board's top edge (easier and safer to
// cut in practice). Row height is never mixed — decode.ts enforces that by
// construction — so there's no term for it here. Leftover stock past the
// last row is not penalized at all — it's just unused raw board, not waste.
export function fitness(decoded: Decoded, board: BoardDims): number {
  const placedArea = Math.max(decoded.usedAreaMm2, 1);
  const rowTrailingGapRatio = decoded.rowTrailingGapMm / Math.max(decoded.rowCount * board.widthMm, 1);
  const rowAreaOrderRatio = decoded.rowAreaOrderViolationMm2 / placedArea;

  return (
    decoded.unplaced.length * 1_000_000 +
    decoded.boardsUsed * 1_000 -
    decoded.sameNeighborCount * 200 -
    decoded.aspectAlignedCount * 30 +
    decoded.cutCount * 10 +
    rowTrailingGapRatio * 5_000 +
    rowAreaOrderRatio * 5_000
  );
}
