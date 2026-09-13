import type { BoardStock, PlacementResult } from "@opinn/panel-nesting";
import type { CutSheet, PositionCut } from "./types";

export type { CutSheet, PositionCut } from "./types";

function boardSize(stock: BoardStock): { widthMm: number; heightMm: number } {
  return stock.kind === "sheet"
    ? { widthMm: stock.widthMm, heightMm: stock.heightMm }
    : { widthMm: stock.maxWidthMm, heightMm: stock.lengthMm };
}

// Placements are already positioned in absolute mm on their board; this just
// attaches board dimensions so downstream consumers don't need panel-nesting.
export function toCutSheet(result: PlacementResult, boardStock: BoardStock): CutSheet {
  const { widthMm, heightMm } = boardSize(boardStock);
  const cuts: PositionCut[] = result.placements.map((placed) => ({
    partId: placed.partId,
    boardIndex: placed.boardIndex,
    xMm: placed.xMm,
    yMm: placed.yMm,
    widthMm: placed.widthMm,
    heightMm: placed.heightMm,
    rotated: placed.rotated,
  }));

  return {
    materialId: result.materialId,
    boardWidthMm: widthMm,
    boardHeightMm: heightMm,
    boardsUsed: result.boardsUsed,
    cuts,
  };
}
