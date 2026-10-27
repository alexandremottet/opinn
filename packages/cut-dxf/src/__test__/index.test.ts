import { describe, it, expect } from "vitest";
import { generateDoorHingeDxf } from "../index";

describe("generateDoorHingeDxf", () => {
  it("is a valid ASCII DXF starting with the standard group-code header", () => {
    const dxf = generateDoorHingeDxf(397, 789);
    expect(dxf.startsWith("0\nSECTION\n2\nHEADER\n")).toBe(true);
    expect(dxf.trimEnd().endsWith("0\nEOF")).toBe(true);
  });

  it("draws the door outline as a closed 4-vertex rectangle", () => {
    const dxf = generateDoorHingeDxf(397, 789);
    expect(dxf).toContain("0\nLWPOLYLINE\n");
    expect(dxf).toContain("90\n4\n");
    expect(dxf).toContain("70\n1\n");
    expect(dxf).toContain("10\n397\n20\n789\n");
  });

  it("bores 6 circles: a cup + 2 screws near the top edge and the same near the bottom edge", () => {
    const dxf = generateDoorHingeDxf(397, 789);
    const circleCount = (dxf.match(/0\nCIRCLE\n/g) ?? []).length;
    expect(circleCount).toBe(6);

    // Bottom cluster: cup 50.5mm from the bottom edge, screws +-22.5mm from it.
    expect(dxf).toContain("10\n22\n20\n50.5\n30\n0\n40\n17.5\n");
    expect(dxf).toContain("10\n31.5\n20\n28\n30\n0\n40\n4\n");
    expect(dxf).toContain("10\n31.5\n20\n73\n30\n0\n40\n4\n");

    // Top cluster: cup 50.5mm from the top edge (789), screws +-22.5mm from it.
    expect(dxf).toContain("10\n22\n20\n738.5\n30\n0\n40\n17.5\n");
    expect(dxf).toContain("10\n31.5\n20\n716\n30\n0\n40\n4\n");
    expect(dxf).toContain("10\n31.5\n20\n761\n30\n0\n40\n4\n");
  });

  it("scales with a different door size without changing the fixed hinge offsets", () => {
    const dxf = generateDoorHingeDxf(596, 1997);
    expect(dxf).toContain("10\n596\n20\n1997\n");
    expect(dxf).toContain("10\n22\n20\n50.5\n30\n0\n40\n17.5\n");
    expect(dxf).toContain("10\n22\n20\n1946.5\n30\n0\n40\n17.5\n");
  });
});
