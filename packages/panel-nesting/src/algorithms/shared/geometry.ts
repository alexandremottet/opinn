import type { BoardStock } from "../../types";

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
