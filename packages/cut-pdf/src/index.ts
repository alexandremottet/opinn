import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import type { CutSheet } from "@opinn/cut-positions";

// A real, fixed page size — printable on any home/office printer — rather
// than a page sized to the (often multi-meter) board stock. The board and
// its cuts are drawn as a scaled-down diagram, not life-size.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PT = 72 / 25.4;

const PAGE_MARGIN_MM = 15;
// Blank buffer left between the board's true edge and its cuts, sized for
// jotting notes or trimming a warped/damaged raw edge before cutting.
// Exported so the nesting step can reserve the same margin — otherwise a
// placement could legally land in what this file draws as an empty zone.
export const BOARD_INNER_MARGIN_MM = 50;
const TITLE_ROW_MM = 12;
const LABEL_SIZE = 6;
// Kept clear so a label never visually touches the cut's own border.
const LABEL_PADDING_PT = 4;

function mm(value: number): number {
  return value * MM_TO_PT;
}

export async function drawCutSheetPdf(sheet: CutSheet, title?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  for (let boardIndex = 0; boardIndex < sheet.boardsUsed; boardIndex++) {
    const boardCuts = sheet.cuts.filter((cut) => cut.boardIndex === boardIndex);

    const landscape = sheet.boardWidthMm >= sheet.boardHeightMm;
    const pageWidthMm = landscape ? A4_HEIGHT_MM : A4_WIDTH_MM;
    const pageHeightMm = landscape ? A4_WIDTH_MM : A4_HEIGHT_MM;

    const printableWidthMm = pageWidthMm - PAGE_MARGIN_MM * 2;
    const printableHeightMm = pageHeightMm - PAGE_MARGIN_MM * 2 - TITLE_ROW_MM;

    const scale = Math.min(
      printableWidthMm / sheet.boardWidthMm,
      printableHeightMm / sheet.boardHeightMm,
    );
    const boardWidthMm = sheet.boardWidthMm * scale;
    const boardHeightMm = sheet.boardHeightMm * scale;

    const page = doc.addPage([mm(pageWidthMm), mm(pageHeightMm)]);

    const originXMm = PAGE_MARGIN_MM + (printableWidthMm - boardWidthMm) / 2;
    const originYMm = PAGE_MARGIN_MM;

    // Board name + material, outside the board's own frame so the frame
    // stays a clean cutting reference.
    const label =
      sheet.boardsUsed > 1
        ? `${title ?? sheet.materialId} — board ${boardIndex + 1}/${sheet.boardsUsed}`
        : (title ?? sheet.materialId);
    page.drawText(label, {
      x: mm(PAGE_MARGIN_MM),
      y: mm(pageHeightMm - PAGE_MARGIN_MM - TITLE_ROW_MM + 3),
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // The board's own outline.
    page.drawRectangle({
      x: mm(originXMm),
      y: mm(originYMm),
      width: mm(boardWidthMm),
      height: mm(boardHeightMm),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.2,
    });

    // Inner margin guide, dashed. The nesting step is expected to have kept
    // every cut's coordinates outside this zone already (see
    // BOARD_INNER_MARGIN_MM's usage in the caller) — this just draws it.
    const innerMm = BOARD_INNER_MARGIN_MM * scale;
    if (innerMm * 2 < boardWidthMm && innerMm * 2 < boardHeightMm) {
      page.drawRectangle({
        x: mm(originXMm + innerMm),
        y: mm(originYMm + innerMm),
        width: mm(boardWidthMm - innerMm * 2),
        height: mm(boardHeightMm - innerMm * 2),
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.6,
        borderDashArray: [4, 3],
      });
    }

    for (const cut of boardCuts) {
      const cutXMm = originXMm + cut.xMm * scale;
      const cutYMm = originYMm + (sheet.boardHeightMm - cut.yMm - cut.heightMm) * scale;
      const cutWidthMm = cut.widthMm * scale;
      const cutHeightMm = cut.heightMm * scale;

      page.drawRectangle({
        x: mm(cutXMm),
        y: mm(cutYMm),
        width: mm(cutWidthMm),
        height: mm(cutHeightMm),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      // Each label is skipped outright — never truncated or shrunk — once
      // it no longer fits inside the cut it's labeling.
      const partIdWidthPt = font.widthOfTextAtSize(cut.partId, LABEL_SIZE);
      if (partIdWidthPt <= mm(cutWidthMm) - LABEL_PADDING_PT) {
        page.drawText(cut.partId, {
          x: mm(cutXMm) + 2,
          y: mm(cutYMm) + mm(cutHeightMm) - 8,
          size: LABEL_SIZE,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // Width, horizontal, centered along the bottom edge.
      const widthLabel = `${cut.widthMm}`;
      const widthLabelWidthPt = font.widthOfTextAtSize(widthLabel, LABEL_SIZE);
      if (widthLabelWidthPt <= mm(cutWidthMm) - LABEL_PADDING_PT) {
        page.drawText(widthLabel, {
          x: mm(cutXMm) + (mm(cutWidthMm) - widthLabelWidthPt) / 2,
          y: mm(cutYMm) + 3,
          size: LABEL_SIZE,
          font,
          color: rgb(0, 0, 0),
        });
      }

      // Height, vertical (rotated 90°), centered along the left edge.
      const heightLabel = `${cut.heightMm}`;
      const heightLabelWidthPt = font.widthOfTextAtSize(heightLabel, LABEL_SIZE);
      if (heightLabelWidthPt <= mm(cutHeightMm) - LABEL_PADDING_PT) {
        page.drawText(heightLabel, {
          x: mm(cutXMm) + 9,
          y: mm(cutYMm) + (mm(cutHeightMm) - heightLabelWidthPt) / 2,
          size: LABEL_SIZE,
          font,
          color: rgb(0, 0, 0),
          rotate: degrees(90),
        });
      }
    }
  }

  return doc.save();
}
