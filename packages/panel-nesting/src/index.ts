export type {
  MaterialId,
  BoardStock,
  Part,
  PlacedPart,
  PlacementInput,
  PlacementResult,
} from "./types";
export { MATERIAL_BOARD_STOCK, getBoardStock } from "./materials";
export type { PlacementAlgorithm } from "./registry";
export {
  registerPlacementAlgorithm,
  getPlacementAlgorithm,
  listPlacementAlgorithms,
} from "./registry";
