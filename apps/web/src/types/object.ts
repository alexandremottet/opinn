export interface Dimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

export interface CabinetDoorData {
  material?: string;
  colorHex?: string;
  edgeWidthMm: { min: number; max: number; default: number; step?: number };
}

export interface ObjectData {
  name: string;
  kind: "cabinet-door" | "generic";
  summary: string;
  dimensions: Dimensions;
  downloadFile: { path: string; label: string };
  modelUrl?: string;
  cabinetDoor?: CabinetDoorData;
}
