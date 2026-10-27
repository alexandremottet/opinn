import type { PlacementInput, PlacementResult } from "../../types";
import { DEEFAULT_KERF_MM } from "../../types";
import type { PlacementAlgorithm } from "../../registry";
import { registerPlacementAlgorithm } from "../../registry";
import { getBoardStock } from "../../materials";
import { boardSize, canRotate, preferShortEdgeFill, restoreOrientation } from "../shared/geometry";
import { expandParts, alignedRotation } from "../shared/expandParts";
import {
  alignedChromosome,
  crossover,
  mutate,
  type Chromosome,
} from "./chromosome";
import { decode } from "./decode";
import { fitness } from "./fitness";

const POPULATION_SIZE = 30;
const GENERATIONS = 10000;
const MUTATION_RATE = 0.1;
const ELITE_COUNT = 2;

function tournamentPick(
  population: Chromosome[],
  scores: number[],
): Chromosome {
  const a = Math.floor(Math.random() * population.length);
  const b = Math.floor(Math.random() * population.length);
  return scores[a] <= scores[b] ? population[a] : population[b];
}

export function nest(input: PlacementInput): PlacementResult {
  const { stock: boardStock, transposed } = preferShortEdgeFill(
    input.boardStock ?? getBoardStock(input.materialId),
  );
  const kerfMm = input.kerfMm ?? DEEFAULT_KERF_MM;
  const allowRotation = canRotate(boardStock);
  const { instances, typeIndexOf } = expandParts(input.parts);

  if (instances.length === 0) {
    return {
      algorithmId: "genetic",
      materialId: input.materialId,
      placements: [],
      unplaced: [],
      boardsUsed: 0,
    };
  }

  const board = boardSize(boardStock);
  const boardIsWide = board.widthMm >= board.heightMm;
  const defaultRotatedByType = input.parts.map((part) => alignedRotation(part, boardIsWide, allowRotation));
  const defaultOrder = instances
    .map((_, partIndex) => partIndex)
    .sort((a, b) => instances[b].widthMm * instances[b].heightMm - instances[a].widthMm * instances[a].heightMm);
  let population = Array.from({ length: POPULATION_SIZE }, () =>
    alignedChromosome(defaultOrder, defaultRotatedByType),
  );
  const score = (chromosome: Chromosome) =>
    fitness(decode(chromosome, instances, typeIndexOf, boardStock, kerfMm), board);

  for (let generation = 0; generation < GENERATIONS; generation++) {
    const scores = population.map(score);
    const elite = population
      .map((chromosome, i) => ({ chromosome, score: scores[i] }))
      .sort((a, b) => a.score - b.score)
      .slice(0, ELITE_COUNT)
      .map((ranked) => ranked.chromosome);

    const next = [...elite];
    while (next.length < POPULATION_SIZE) {
      const parentA = tournamentPick(population, scores);
      const parentB = tournamentPick(population, scores);
      next.push(
        mutate(crossover(parentA, parentB), allowRotation, MUTATION_RATE),
      );
    }
    population = next;
  }

  const best = population.reduce((best, chromosome) =>
    score(chromosome) < score(best) ? chromosome : best,
  );
  const decoded = restoreOrientation(decode(best, instances, typeIndexOf, boardStock, kerfMm), transposed);

  return { algorithmId: "genetic", materialId: input.materialId, ...decoded };
}

export const geneticPlacementAlgorithm: PlacementAlgorithm = {
  id: "genetic",
  label: "Genetic algorithm",
  place: nest,
};

registerPlacementAlgorithm(geneticPlacementAlgorithm);
