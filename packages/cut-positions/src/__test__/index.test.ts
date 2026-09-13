import { describe, it, expect } from "vitest";
import type { BoardStock, PlacementResult } from "@opinn/panel-nesting";
import { toCutSheet } from "../index";

describe("toCutSheet", () => {
  it("converts placements into an absolute cut sheet", () => {
    const boardStock: BoardStock = { kind: "sheet", widthMm: 5000, heightMm: 2500 };
    const result: PlacementResult = {
      algorithmId: "genetic",
      materialId: "valchromat",
      boardsUsed: 1,
      unplaced: [],
      placements: [
        { partId: "shelf-1", boardIndex: 0, xMm: 0, yMm: 0, widthMm: 600, heightMm: 400, rotated: false },
      ],
    };

    const sheet = toCutSheet(result, boardStock);

    expect(sheet).toEqual({
      materialId: "valchromat",
      boardWidthMm: 5000,
      boardHeightMm: 2500,
      boardsUsed: 1,
      cuts: [{ partId: "shelf-1", boardIndex: 0, xMm: 0, yMm: 0, widthMm: 600, heightMm: 400, rotated: false }],
    });
  });
});
