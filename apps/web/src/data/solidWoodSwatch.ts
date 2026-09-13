import type { ValchromatColor } from "./valchromatColors";

// Solid wood species, shaped like ValchromatColor so they drop into the same
// swatch row (edges and doors can each be either material). Oak, birch and
// ash are real PBR scans (basecolor + normal + roughness); poplar and beech
// have no scan of their own, so they reuse a sibling's normal/roughness maps
// with a recolored basecolor — see scripts/process-wood-pbr.py.
export const SOLID_WOOD_SWATCHES: ValchromatColor[] = [
  {
    id: "oak",
    label: "Chêne",
    hex: "#c9a877",
    texture: "/images/wood-pbr/oak/basecolor.webp",
    normalMap: "/images/wood-pbr/oak/normal.webp",
    roughnessMap: "/images/wood-pbr/oak/roughness.webp",
    tiled: true,
  },
  {
    id: "birch",
    label: "Bouleau",
    hex: "#ecdfc0",
    texture: "/images/wood-pbr/birch/basecolor.webp",
    normalMap: "/images/wood-pbr/birch/normal.webp",
    roughnessMap: "/images/wood-pbr/birch/roughness.webp",
    tiled: true,
  },
  {
    id: "poplar",
    label: "Peuplier",
    hex: "#e4ddc5",
    texture: "/images/wood-pbr/poplar/basecolor.webp",
    normalMap: "/images/wood-pbr/poplar/normal.webp",
    roughnessMap: "/images/wood-pbr/poplar/roughness.webp",
    tiled: true,
  },
  {
    id: "ash",
    label: "Frêne",
    hex: "#ddccaa",
    texture: "/images/wood-pbr/ash/basecolor.webp",
    normalMap: "/images/wood-pbr/ash/normal.webp",
    roughnessMap: "/images/wood-pbr/ash/roughness.webp",
    tiled: true,
    normalScale: 1 / 3,
    tileScale: 3,
  },
  {
    id: "beech",
    label: "Hêtre",
    hex: "#d9ac86",
    texture: "/images/wood-pbr/beech/basecolor.webp",
    normalMap: "/images/wood-pbr/beech/normal.webp",
    roughnessMap: "/images/wood-pbr/beech/roughness.webp",
    tiled: true,
    normalScale: 1 / 3,
    tileScale: 3,
  },
];
