import type { BoardStock, MaterialId } from "./types";

import materialsJson from "../materials.json" with { type: "json" };

export const MATERIAL_BOARD_STOCK = materialsJson as Record<MaterialId, BoardStock>;

export function getBoardStock(materialId: MaterialId): BoardStock {
  return MATERIAL_BOARD_STOCK[materialId];
}
