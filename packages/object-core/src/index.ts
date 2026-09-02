export interface Dimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

export interface ObjectData {
  name: string;
  kind: string;
  summary: string;
  dimensions: Dimensions;
  downloadFile: { path: string; label: string };
  modelUrl?: string;
}
