import type { BoardStock, Part, PlacedPart } from "../../types";
import type { Chromosome } from "./chromosome";
import { boardSize } from "../shared/geometry";
import { packShelves, type OrderedInstance, type PackResult } from "../shared/shelfPack";

export interface Decoded extends PackResult {
  cutCount: number;
  usedAreaMm2: number;
  rowTrailingGapMm: number;
  rowCount: number;
  sameNeighborCount: number;
  aspectAlignedCount: number;
  rowAreaOrderViolationMm2: number;
}

// typeIndexOf maps each instance (by partIndex) to the rotatedByType slot
// shared by every instance of that same part.
export function decode(
  chromosome: Chromosome,
  parts: Part[],
  typeIndexOf: number[],
  boardStock: BoardStock,
  kerfMm: number,
): Decoded {
  const { widthMm: boardWidth } = boardSize(boardStock);
  const order: OrderedInstance[] = chromosome.order.map((gene) => ({
    part: parts[gene.partIndex],
    rotated: chromosome.rotatedByType[typeIndexOf[gene.partIndex]],
  }));
  const packed = packShelves(order, boardStock, kerfMm);

  const rows = groupByRow(packed.placements);
  return {
    ...packed,
    cutCount: countCuts(rows),
    usedAreaMm2: usedArea(packed.placements),
    rowTrailingGapMm: rowTrailingGap(rows, boardWidth),
    rowCount: countRows(rows),
    sameNeighborCount: sameNeighbors(rows),
    aspectAlignedCount: aspectAligned(packed.placements, boardStock),
    rowAreaOrderViolationMm2: rowAreaOrderViolation(rows),
  };
}

// A row is every part sharing one full-length shelf cut (same board, same yMm).
function groupByRow(placements: PlacedPart[]): Map<number, Map<number, PlacedPart[]>> {
  const perBoard = new Map<number, Map<number, PlacedPart[]>>();
  for (const placed of placements) {
    const rows = perBoard.get(placed.boardIndex) ?? new Map<number, PlacedPart[]>();
    const row = rows.get(placed.yMm) ?? [];
    row.push(placed);
    rows.set(placed.yMm, row);
    perBoard.set(placed.boardIndex, rows);
  }
  return perBoard;
}

// Straight guillotine cuts to separate N parts on a board: shelf separators + part separators.
function countCuts(perBoard: Map<number, Map<number, PlacedPart[]>>): number {
  let cuts = 0;
  for (const rows of perBoard.values()) {
    cuts += rows.size - 1;
    for (const row of rows.values()) cuts += row.length - 1;
  }
  return Math.max(cuts, 0);
}

// Gap between a row's last part and the board's right edge: scrap length
// stranded mid-row, as opposed to leftover stock past the last row (fine).
function rowTrailingGap(perBoard: Map<number, Map<number, PlacedPart[]>>, boardWidth: number): number {
  let gap = 0;
  for (const rows of perBoard.values()) {
    for (const row of rows.values()) {
      const rightEdge = Math.max(...row.map((part) => part.xMm + part.widthMm));
      gap += boardWidth - rightEdge;
    }
  }
  return gap;
}

function countRows(perBoard: Map<number, Map<number, PlacedPart[]>>): number {
  let count = 0;
  for (const rows of perBoard.values()) count += rows.size;
  return count;
}

// Rows are built left-to-right (xCursorMm only grows), so adjacent array
// entries are adjacent on the board: count same-part neighbors, one batch cut apart.
function sameNeighbors(perBoard: Map<number, Map<number, PlacedPart[]>>): number {
  let count = 0;
  for (const rows of perBoard.values()) {
    for (const row of rows.values()) {
      for (let i = 1; i < row.length; i++) {
        if (row[i].partId === row[i - 1].partId) count++;
      }
    }
  }
  return count;
}

// A part is aspect-aligned when its own landscape/portrait orientation
// matches the board's: wide parts on a wide board leave short rows, which
// gives every other row-shaped objective more room to work with.
function aspectAligned(placements: PlacedPart[], boardStock: BoardStock): number {
  const { widthMm, heightMm } = boardSize(boardStock);
  const boardIsWide = widthMm >= heightMm;
  return placements.filter((placed) => (placed.widthMm >= placed.heightMm) === boardIsWide).length;
}

// Cutting big panels off the raw board first (and off its edge, not from an
// interior remnant) is easier and safer in practice, so rows should run
// biggest-area to smallest from the board's top (y=0) down. Penalizes any
// row that's bigger than the row directly above it.
function rowAreaOrderViolation(perBoard: Map<number, Map<number, PlacedPart[]>>): number {
  let violation = 0;
  for (const rows of perBoard.values()) {
    const rowAreas = [...rows.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, row]) => Math.max(...row.map((part) => part.widthMm * part.heightMm)));
    for (let i = 1; i < rowAreas.length; i++) {
      if (rowAreas[i] > rowAreas[i - 1]) violation += rowAreas[i] - rowAreas[i - 1];
    }
  }
  return violation;
}

function usedArea(placements: PlacedPart[]): number {
  return placements.reduce((sum, placed) => sum + placed.widthMm * placed.heightMm, 0);
}
