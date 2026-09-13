import { describe, it, expect } from "vitest";
import type { CutSheet } from "@opinn/cut-positions";
import { drawCutSheetPdf } from "../index";

describe("drawCutSheetPdf", () => {
  it("renders a valid PDF from a cut sheet", async () => {
    const sheet: CutSheet = {
      materialId: "valchromat",
      boardWidthMm: 5000,
      boardHeightMm: 2500,
      boardsUsed: 1,
      cuts: [
        { partId: "shelf-1", boardIndex: 0, xMm: 0, yMm: 0, widthMm: 600, heightMm: 400, rotated: false },
        { partId: "shelf-2", boardIndex: 0, xMm: 604, yMm: 0, widthMm: 600, heightMm: 400, rotated: false },
      ],
    };

    const bytes = await drawCutSheetPdf(sheet);

    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
  });
});
