import type { BoardStock, PlacedPart } from "../../types";

export interface BoardSize {
  widthMm: number;
  heightMm: number;
}

// Strip width (maxWidthMm) is the cross-grain axis, length is along the grain.
export function boardSize(stock: BoardStock): BoardSize {
  return stock.kind === "sheet"
    ? { widthMm: stock.widthMm, heightMm: stock.heightMm }
    : { widthMm: stock.maxWidthMm, heightMm: stock.lengthMm };
}

// Only sheet materials can be cut in any direction; strips must stay grain-aligned.
export function canRotate(stock: BoardStock): boolean {
  return stock.kind === "sheet";
}

// A landscape sheet (width > height) packs shelves along the long edge by
// default: each shelf's cursor advances across the full width, so a
// handful of small parts trail off in one thin strip instead of clustering
// near a corner. Swapping the axes before packing makes shelves fill along
// the short edge instead — callers must run the whole packing pass against
// the swapped stock, then undo it with restoreOrientation on the result.
export function preferShortEdgeFill(stock: BoardStock): { stock: BoardStock; transposed: boolean } {
  if (stock.kind === "sheet" && stock.widthMm > stock.heightMm) {
    return { stock: { kind: "sheet", widthMm: stock.heightMm, heightMm: stock.widthMm }, transposed: true };
  }
  return { stock, transposed: false };
}

// Placements come back in the swapped stock's coordinate frame; swapping
// x/y puts them back on the real board. Part width/height are unaffected —
// they're physical cut sizes, not axis-dependent.
export function restoreOrientation<T extends { placements: PlacedPart[] }>(
  result: T,
  transposed: boolean,
): T {
  if (!transposed) return result;
  return {
    ...result,
    placements: result.placements.map((p) => ({ ...p, xMm: p.yMm, yMm: p.xMm })),
  };
}
