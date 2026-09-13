export interface Gene {
  partIndex: number;
}

// Rotation is one bit per part TYPE, shared by every instance of that type —
// instances of the same type are geometrically identical, so searching
// rotation per instance only fragments them into more height-groups, never
// helps, and makes "flip every copy of this type together" astronomically
// unlikely for random per-gene mutation to ever find.
export interface Chromosome {
  order: Gene[];
  rotatedByType: boolean[];
}

// defaultOrder seeds every individual biggest-area-first (see decode.ts's
// row order reward) instead of a plain shuffle — a starting point search
// refines from. A light jitter keeps the population from being N identical
// clones in the order dimension, so crossover still has something to work with.
export function alignedChromosome(defaultOrder: number[], defaultRotatedByType: boolean[]): Chromosome {
  const order = jitter(defaultOrder.map((partIndex) => ({ partIndex })));
  return { order, rotatedByType: [...defaultRotatedByType] };
}

function jitter<T>(items: T[]): T[] {
  const copy = [...items];
  const swaps = Math.ceil(copy.length / 4);
  for (let s = 0; s < swaps; s++) {
    const i = Math.floor(Math.random() * copy.length);
    const j = Math.floor(Math.random() * copy.length);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Order crossover: keep a slice from A, fill the rest with B's remaining order.
// Rotation: each type independently inherits from A or B.
export function crossover(parentA: Chromosome, parentB: Chromosome): Chromosome {
  const size = parentA.order.length;
  const [start, end] = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)].sort(
    (a, b) => a - b,
  );
  const slice = parentA.order.slice(start, end + 1);
  const used = new Set(slice.map((gene) => gene.partIndex));
  const rest = parentB.order.filter((gene) => !used.has(gene.partIndex));
  const order = [...rest.slice(0, start), ...slice, ...rest.slice(start)];
  const rotatedByType = parentA.rotatedByType.map((bit, i) => (Math.random() < 0.5 ? bit : parentB.rotatedByType[i]));
  return { order, rotatedByType };
}

export function mutate(chromosome: Chromosome, allowRotation: boolean, rate: number): Chromosome {
  const order = chromosome.order.map((gene) => ({ ...gene }));
  for (let i = 0; i < order.length; i++) {
    if (Math.random() < rate) {
      const j = Math.floor(Math.random() * order.length);
      [order[i].partIndex, order[j].partIndex] = [order[j].partIndex, order[i].partIndex];
    }
  }

  const rotatedByType = chromosome.rotatedByType.map((bit) =>
    allowRotation && Math.random() < rate ? !bit : bit,
  );
  return { order, rotatedByType };
}
