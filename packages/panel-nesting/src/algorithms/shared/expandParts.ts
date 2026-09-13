import type { Part } from "../../types";

// Expands parts by quantity, keeping a parallel array mapping each instance
// back to which original part definition ("type") it came from.
export function expandParts(parts: Part[]): { instances: Part[]; typeIndexOf: number[] } {
  const instances: Part[] = [];
  const typeIndexOf: number[] = [];
  parts.forEach((part, typeIndex) => {
    for (let i = 0; i < (part.quantity ?? 1); i++) {
      instances.push(part);
      typeIndexOf.push(typeIndex);
    }
  });
  return { instances, typeIndexOf };
}

// Wide part on a wide board, tall on tall: keeps rows short, giving
// height-purity more rows to group by. Only worth flipping when rotation
// is actually allowed (sheet materials; strips must stay grain-aligned).
export function alignedRotation(part: Part, boardIsWide: boolean, allowRotation: boolean): boolean {
  if (!allowRotation) return false;
  const isAligned = (part.widthMm >= part.heightMm) === boardIsWide;
  return !isAligned;
}
