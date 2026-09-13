import { describe, it, expect } from "vitest";
import { nest } from "../index";

describe("first-fit-decreasing nest", () => {
  it("places every part on a sheet, biggest area first", () => {
    const result = nest({
      materialId: "valchromat",
      parts: [
        { id: "small", widthMm: 200, heightMm: 300, quantity: 2 },
        { id: "big", widthMm: 600, heightMm: 400, quantity: 4 },
      ],
    });
    expect(result.unplaced).toHaveLength(0);
    expect(result.placements).toHaveLength(6);
    expect(result.boardsUsed).toBeGreaterThan(0);

    const firstRowY = Math.min(...result.placements.map((p) => p.yMm));
    const firstRow = result.placements.filter((p) => p.yMm === firstRowY);
    expect(firstRow.every((p) => p.partId === "big")).toBe(true);
  });

  it("never rotates parts on grain-locked strips", () => {
    const result = nest({
      materialId: "solid-wood",
      parts: [{ id: "p", widthMm: 150, heightMm: 900, quantity: 3 }],
    });
    expect(result.unplaced).toHaveLength(0);
    expect(result.placements.every((p) => !p.rotated)).toBe(true);
  });

  it("marks a part unplaced when it can't fit on any board", () => {
    const result = nest({
      materialId: "solid-wood",
      parts: [{ id: "too-wide", widthMm: 500, heightMm: 300 }],
    });
    expect(result.unplaced).toHaveLength(1);
    expect(result.placements).toHaveLength(0);
  });
});
