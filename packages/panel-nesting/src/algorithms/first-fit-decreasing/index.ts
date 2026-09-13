import type { PlacementInput, PlacementResult } from "../../types";
import { DEEFAULT_KERF_MM } from "../../types";
import type { PlacementAlgorithm } from "../../registry";
import { registerPlacementAlgorithm } from "../../registry";
import { getBoardStock } from "../../materials";
import { boardSize, canRotate } from "../shared/geometry";
import { expandParts, alignedRotation } from "../shared/expandParts";
import { packShelves, type OrderedInstance } from "../shared/shelfPack";

// Deterministic baseline: sort parts biggest-area first (same reasoning as
// the genetic algorithm's row-order reward — easier to cut in practice),
// rotate each to match the board's orientation, then pack with no search.
export function nest(input: PlacementInput): PlacementResult {
  const boardStock = input.boardStock ?? getBoardStock(input.materialId);
  const kerfMm = input.kerfMm ?? DEEFAULT_KERF_MM;
  const allowRotation = canRotate(boardStock);
  const board = boardSize(boardStock);
  const boardIsWide = board.widthMm >= board.heightMm;
  const { instances } = expandParts(input.parts);

  const order: OrderedInstance[] = instances
    .map((part) => ({ part, rotated: alignedRotation(part, boardIsWide, allowRotation) }))
    .sort((a, b) => b.part.widthMm * b.part.heightMm - a.part.widthMm * a.part.heightMm);

  const { placements, unplaced, boardsUsed } = packShelves(order, boardStock, kerfMm);

  return { algorithmId: "first-fit-decreasing", materialId: input.materialId, placements, unplaced, boardsUsed };
}

export const firstFitDecreasingPlacementAlgorithm: PlacementAlgorithm = {
  id: "first-fit-decreasing",
  label: "First fit decreasing",
  place: nest,
};

registerPlacementAlgorithm(firstFitDecreasingPlacementAlgorithm);
