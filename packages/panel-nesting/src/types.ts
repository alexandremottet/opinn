export type MaterialId = "solid-wood" | "valchromat";

export type BoardStock =
  | { kind: "sheet"; widthMm: number; heightMm: number }
  | { kind: "strip"; maxWidthMm: number; lengthMm: number };

export interface Part {
  id: string;
  widthMm: number;
  heightMm: number;
  quantity?: number;
}

export interface PlacedPart {
  partId: string;
  boardIndex: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotated: boolean;
}

export interface PlacementInput {
  materialId: MaterialId;
  boardStock?: BoardStock;
  parts: Part[];
  kerfMm?: number;
}

export interface PlacementResult {
  algorithmId: string;
  materialId: MaterialId;
  placements: PlacedPart[];
  unplaced: Part[];
  boardsUsed: number;
}

export const DEEFAULT_KERF_MM = 4;

export type NestedOptions = {
  // Optional kerf (cut width) in millimeters
  kerfMm?: number;
};