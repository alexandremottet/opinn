export const CABINET_DOOR_KIND = "cabinet-door";

export interface CabinetDoorData {
  material?: string;
  colorHex?: string;
  edgeWidthMm: { min: number; max: number; default: number; step?: number };
}

declare module "@opinn/object-core" {
  interface ObjectData {
    cabinetDoor?: CabinetDoorData;
  }
}
