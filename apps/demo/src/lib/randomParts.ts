import type { Part } from "@opinn/panel-nesting";

export interface GenerationSettings {
  countMin: number;
  countMax: number;
  widthMin: number;
  widthMax: number;
}

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  countMin: 3,
  countMax: 6,
  widthMin: 200,
  widthMax: 600,
};

const ASPECT_RATIO = 16 / 9;
const QUANTITY_MIN = 8;
const QUANTITY_MAX = 12;

function randomRoundTen(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) / 10) * 10;
}

function randomInt(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

export function generateRandomParts(settings: GenerationSettings): Part[] {
  const count = randomInt(settings.countMin, settings.countMax);
  return Array.from({ length: count }, (_, i) => {
    const widthMm = randomRoundTen(settings.widthMin, settings.widthMax);
    const heightMm = Math.round(widthMm / ASPECT_RATIO / 10) * 10;
    const quantity = randomInt(QUANTITY_MIN, QUANTITY_MAX);
    return { id: `part-${i + 1}`, widthMm, heightMm, quantity };
  });
}
