export interface FacadeCatalogEntry {
  id: string;
  category: string;
  label: string;
  widthCm: number;
  heightCm: number;
}

// Nominal size shrinks by 3mm total (not per side) for the opening gap —
// per data/dimensions_facades_metod.md: a 60x80cm door measures 59.7x79.7cm.
export const FACADE_NOMINAL_SHRINK_MM = 3;

export const FACADE_CATEGORIES = ["Tiroir", "Porte", "Porte colonne", "Lave-vaisselle"] as const;

function combos(
  category: (typeof FACADE_CATEGORIES)[number],
  widthsCm: number[],
  heightsByWidthCm: Record<number, number[]>,
): FacadeCatalogEntry[] {
  return widthsCm.flatMap((widthCm) =>
    heightsByWidthCm[widthCm].map((heightCm) => ({
      id: `${category}-${widthCm}x${heightCm}`,
      category,
      label: `${category} ${widthCm}×${heightCm} cm`,
      widthCm,
      heightCm,
    })),
  );
}

export const METOD_FACADES: FacadeCatalogEntry[] = [
  ...combos("Tiroir", [40, 60, 80], { 40: [10, 20, 40], 60: [10, 20, 40], 80: [10, 20, 40] }),
  ...combos("Porte", [20, 30, 40, 60], {
    20: [80],
    30: [60, 80, 100],
    40: [40, 60, 80, 100, 120],
    60: [40, 60, 80, 100, 120],
  }),
  ...combos("Porte colonne", [40, 60], { 40: [100, 120, 140, 200], 60: [100, 120, 140, 200] }),
  ...combos("Lave-vaisselle", [45, 60], { 45: [80], 60: [80] }),
];

export function finalSizeMm(entry: FacadeCatalogEntry): { widthMm: number; heightMm: number } {
  return {
    widthMm: entry.widthCm * 10 - FACADE_NOMINAL_SHRINK_MM,
    heightMm: entry.heightCm * 10 - FACADE_NOMINAL_SHRINK_MM,
  };
}
