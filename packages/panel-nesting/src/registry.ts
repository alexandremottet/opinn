import type { PlacementInput, PlacementResult } from "./types";

export interface PlacementAlgorithm {
  id: string;
  label: string;
  place(input: PlacementInput): PlacementResult;
}

const algorithms = new Map<string, PlacementAlgorithm>();

export function registerPlacementAlgorithm(algorithm: PlacementAlgorithm): void {
  algorithms.set(algorithm.id, algorithm);
}

export function getPlacementAlgorithm(id: string): PlacementAlgorithm | undefined {
  return algorithms.get(id);
}

export function listPlacementAlgorithms(): PlacementAlgorithm[] {
  return [...algorithms.values()];
}
