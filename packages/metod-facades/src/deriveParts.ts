import type { Part } from "@opinn/panel-nesting";
import { METOD_FACADES, finalSizeMm } from "./catalog";

export interface FacadeSelection {
  facadeId: string;
  quantity: number;
}

export interface FacadeParts {
  panelParts: Part[];
  edgeParts: Part[];
}

// Panel is inset by the edge (lipping) width on every side; the two vertical
// strips run the facade's full height, the two horizontal strips fit between
// them (panel width), so all four meet without overlapping at the corners.
// Every strip's long side goes on heightMm (not widthMm): a solid-wood
// board's width is the short, cross-grain axis capped at maxWidthMm, and a
// strip that can't rotate must keep its long side along the grain (height).
export function deriveFacadeParts(selections: FacadeSelection[], edgeWidthMm: number): FacadeParts {
  const panelParts: Part[] = [];
  const edgeParts: Part[] = [];

  for (const { facadeId, quantity } of selections) {
    if (quantity <= 0) continue;
    const entry = METOD_FACADES.find((f) => f.id === facadeId);
    if (!entry) continue;

    const { widthMm, heightMm } = finalSizeMm(entry);
    const panelWidthMm = widthMm - 2 * edgeWidthMm;
    const panelHeightMm = heightMm - 2 * edgeWidthMm;

    panelParts.push({
      id: `${facadeId}-panel`,
      widthMm: panelWidthMm,
      heightMm: panelHeightMm,
      quantity,
    });
    edgeParts.push(
      { id: `${facadeId}-edge-v`, widthMm: edgeWidthMm, heightMm, quantity: quantity * 2 },
      { id: `${facadeId}-edge-h`, widthMm: edgeWidthMm, heightMm: panelWidthMm, quantity: quantity * 2 },
    );
  }

  return { panelParts, edgeParts };
}
