import type { MaterialId } from "@opinn/panel-nesting";

export interface PositionCut {
  partId: string;
  boardIndex: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotated: boolean;
}

export interface CutSheet {
  materialId: MaterialId;
  boardWidthMm: number;
  boardHeightMm: number;
  boardsUsed: number;
  cuts: PositionCut[];
}
