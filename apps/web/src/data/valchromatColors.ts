export interface ValchromatColor {
  id: string;
  label: string;
  hex: string;
  texture: string;
  // True to tile the texture at a fixed real-world size (see TILE_SIZE_MM
  // in CabinetDoorMesh) instead of stretching it once across the face.
  // Right for a small repeating grain scan; wrong for a photographed
  // full-panel swatch, which is sized to fill a face on its own.
  tiled?: boolean;
  // Optional PBR maps (solid wood only, so far) — omitted means flat color
  // + a fixed roughness, same as every Valchromat swatch.
  normalMap?: string;
  roughnessMap?: string;
  // Multiplies the normal map's bump strength. Omitted means 1 (full
  // strength) — some reused scans read as too rough/bumpy for the species.
  normalScale?: number;
  // Multiplies the tile count from TILE_SIZE_MM (tiled swatches only).
  // Omitted means 1 — a finer grain scan needs more tiles per face.
  tileScale?: number;
}

// Hex values are approximate (visually sampled) — Valchromat publishes only
// photo swatches, no color codes. The texture is the source of truth.
export const VALCHROMAT_COLORS: ValchromatColor[] = [
  { id: "white-pearl", label: "White Pearl", hex: "#f5f1ea", texture: "/images/White-Pearl.png" },
  { id: "white-grey", label: "White Grey", hex: "#d9d5cd", texture: "/images/White-Grey_certa-1.webp" },
  { id: "light-grey", label: "Light Grey", hex: "#b8b4ac", texture: "/images/Light-Grey.webp" },
  { id: "grey", label: "Grey", hex: "#8c8a86", texture: "/images/Grey.webp" },
  { id: "black", label: "Black", hex: "#2b2a28", texture: "/images/Black.webp" },
  { id: "chocolate-brown", label: "Chocolate Brown", hex: "#4a3428", texture: "/images/Chocolate-Brown.webp" },
  { id: "red", label: "Red", hex: "#a13327", texture: "/images/Red-1.webp" },
  { id: "yellow", label: "Yellow", hex: "#e0a72e", texture: "/images/Yellow.webp" },
  { id: "orange", label: "Orange", hex: "#c9631f", texture: "/images/Orange.webp" },
  { id: "blue", label: "Blue", hex: "#2e4f6b", texture: "/images/Blue.webp" },
  { id: "green-mint", label: "Green Mint", hex: "#6b8f7a", texture: "/images/Green-Mint.webp" },
  { id: "khaki", label: "Khaki", hex: "#7a7256", texture: "/images/4Valchromat-Caqui.webp" },
];
