import type { BoardStock, Part, PlacedPart } from "../../types";
import { boardSize } from "./geometry";

// One instance to place, already resolved to a fixed rotation.
export interface OrderedInstance {
  part: Part;
  rotated: boolean;
}

export interface PackResult {
  placements: PlacedPart[];
  unplaced: Part[];
  boardsUsed: number;
}

interface Shelf {
  yMm: number;
  heightMm: number;
  xCursorMm: number;
}

// Shelf packing: walks instances in the given order, stacking left-to-right
// then row by row, opening a new board whenever nothing fits anymore. A
// shelf's height is fixed by whichever part opens it, forever: joining one
// later requires an exact height match, so a row can never end up mixing
// heights — purity is a hard invariant of the packer, not a hope from search.
export function packShelves(order: OrderedInstance[], boardStock: BoardStock, kerfMm: number): PackResult {
  const { widthMm: boardWidth, heightMm: boardHeight } = boardSize(boardStock);
  const placements: PlacedPart[] = [];
  const unplaced: Part[] = [];
  let boardIndex = -1;
  let shelves: Shelf[] = [];

  for (const { part, rotated } of order) {
    const widthMm = rotated ? part.heightMm : part.widthMm;
    const heightMm = rotated ? part.widthMm : part.heightMm;

    if (widthMm > boardWidth || heightMm > boardHeight) {
      unplaced.push(part);
      continue;
    }

    if (boardIndex === -1) {
      boardIndex = 0;
      shelves = [];
    }
    let shelf = fitShelf(shelves, widthMm, heightMm, boardWidth, boardHeight);
    if (!shelf) {
      boardIndex += 1;
      shelves = [];
      shelf = fitShelf(shelves, widthMm, heightMm, boardWidth, boardHeight);
    }
    if (!shelf) {
      unplaced.push(part);
      continue;
    }

    placements.push({
      partId: part.id,
      boardIndex,
      xMm: shelf.xCursorMm,
      yMm: shelf.yMm,
      widthMm,
      heightMm,
      rotated,
    });
    shelf.xCursorMm += widthMm + kerfMm;
  }

  return { placements, unplaced, boardsUsed: boardIndex + 1 };
}

function fitShelf(
  shelves: Shelf[],
  widthMm: number,
  heightMm: number,
  boardWidth: number,
  boardHeight: number,
): Shelf | undefined {
  for (const shelf of shelves) {
    if (shelf.heightMm === heightMm && shelf.xCursorMm + widthMm <= boardWidth) return shelf;
  }

  const last = shelves[shelves.length - 1];
  const nextY = last ? last.yMm + last.heightMm : 0;
  if (nextY + heightMm > boardHeight) return undefined;

  const shelf: Shelf = { yMm: nextY, heightMm, xCursorMm: 0 };
  shelves.push(shelf);
  return shelf;
}
