import { useMemo, useState } from "react";
import "@opinn/panel-nesting/algorithms/genetic";
import {
  getBoardStock,
  getPlacementAlgorithm,
  type BoardStock,
  type MaterialId,
  type Part,
  type PlacementResult,
} from "@opinn/panel-nesting";
import { toCutSheet, type CutSheet } from "@opinn/cut-positions";
import { drawCutSheetPdf, BOARD_INNER_MARGIN_MM } from "@opinn/cut-pdf";
import {
  METOD_FACADES,
  FACADE_CATEGORIES,
  deriveFacadeParts,
  finalSizeMm,
} from "@opinn/metod-facades";
import type { ObjectData } from "../../types/object";
import { VALCHROMAT_COLORS } from "../../data/valchromatColors";
import { SOLID_WOOD_SWATCHES } from "../../data/solidWoodSwatch";
import ObjectViewer3D, { ColorCircle } from "./ObjectViewer3D";
import BoardPreview from "./BoardPreview";
import FacadeTypeIcon from "./FacadeTypeIcon";

// Hidden from the UI on purpose: genetic gives the best cut quality and is
// fast enough at facade scale, so there's nothing useful to expose here.
const ALGORITHM_ID = "genetic";

// getBoardStock("solid-wood") returns the narrow edge-banding strip — right
// for edges, but a door panel isn't cut from a strip. Used as a *panel*,
// solid wood is a pre-glued board sold at a standard size, nestable like a
// sheet material.
const SOLID_WOOD_PANEL_STOCK: BoardStock = { kind: "sheet", widthMm: 2000, heightMm: 600 };

function panelBoardStock(materialId: MaterialId): BoardStock {
  return materialId === "solid-wood" ? SOLID_WOOD_PANEL_STOCK : getBoardStock(materialId);
}

// The PDF draws BOARD_INNER_MARGIN_MM as a keep-clear zone around the
// board's true edge, so the nesting step must reserve the same margin —
// shrink the area it's allowed to place into, then shift the results back
// out to the full board's coordinate space.
function insetBoardStock(stock: BoardStock, marginMm: number): BoardStock {
  return stock.kind === "sheet"
    ? {
        kind: "sheet",
        widthMm: Math.max(stock.widthMm - marginMm * 2, 1),
        heightMm: Math.max(stock.heightMm - marginMm * 2, 1),
      }
    : {
        kind: "strip",
        maxWidthMm: Math.max(stock.maxWidthMm - marginMm * 2, 1),
        lengthMm: Math.max(stock.lengthMm - marginMm * 2, 1),
      };
}

function offsetPlacements(result: PlacementResult, marginMm: number): PlacementResult {
  return {
    ...result,
    placements: result.placements.map((p) => ({
      ...p,
      xMm: p.xMm + marginMm,
      yMm: p.yMm + marginMm,
    })),
  };
}

interface Props {
  objectData: ObjectData;
}

interface CutRun {
  label: string;
  material: MaterialId;
  result: PlacementResult;
  sheet: CutSheet;
}

interface MaterialCutList {
  materialLabel: string;
  stockLabel: string;
  parts: Part[];
}

// Edge banding is bought and cut as linear strips (or, for Valchromat,
// off a sheet nobody nests thin bands onto by hand) — a shopping + cut list
// is more useful here than a 2D nesting layout.
function describeBoardStock(materialId: MaterialId): string {
  const stock = getBoardStock(materialId);
  return stock.kind === "strip"
    ? `bande ${stock.maxWidthMm} × ${stock.lengthMm} mm`
    : `plaque ${stock.widthMm} × ${stock.heightMm} mm`;
}

// Same idea, but for the board a door panel is cut from (see
// panelBoardStock — solid wood uses a different stock as a panel than as
// edge banding).
function describePanelBoardStock(materialId: MaterialId): string {
  const stock = panelBoardStock(materialId);
  return stock.kind === "strip"
    ? `bande ${stock.maxWidthMm} × ${stock.lengthMm} mm`
    : `plaque ${stock.widthMm} × ${stock.heightMm} mm`;
}

function describeEdgePart(part: Part): string {
  const match = part.id.match(/^(.*)-edge-(v|h)$/);
  if (!match) return part.id;
  const facade = METOD_FACADES.find((f) => f.id === match[1]);
  const orientation = match[2] === "v" ? "vertical" : "horizontal";
  return `${facade?.label ?? match[1]} — bord ${orientation}`;
}

function describePanelPart(part: Part): string {
  const match = part.id.match(/^(.*)-panel$/);
  if (!match) return part.id;
  const facade = METOD_FACADES.find((f) => f.id === match[1]);
  return facade?.label ?? match[1];
}

function swatchLabel(materialId: MaterialId, swatchId: string): string {
  const list = materialId === "solid-wood" ? SOLID_WOOD_SWATCHES : VALCHROMAT_COLORS;
  return list.find((s) => s.id === swatchId)?.label ?? swatchId;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// A queued facade carries a snapshot of the material/color it was added
// with — the tool's current picks only apply to the *next* Add, so two
// batches of the same facade in different finishes never get merged into
// one and cut as if they were the same material.
interface QueuedFacade {
  facadeId: string;
  quantity: number;
  edgeWidthMm: number;
  doorMaterial: MaterialId;
  doorSwatchId: string;
  edgeMaterial: MaterialId;
  edgeSwatchId: string;
}

function queueKey(item: Omit<QueuedFacade, "quantity">): string {
  return [
    item.facadeId,
    item.edgeWidthMm,
    item.doorMaterial,
    item.doorSwatchId,
    item.edgeMaterial,
    item.edgeSwatchId,
  ].join("|");
}

interface MaterialGroup {
  materialId: MaterialId;
  swatchId: string;
  parts: Part[];
}

// Two queued items can share an edge (or, in principle, a panel) material
// while differing elsewhere — same facade + edge finish, different door
// finish — which lands identical part ids in the same group. Combine them
// into one line with a summed quantity instead of listing/cutting twice.
function mergeParts(parts: Part[]): Part[] {
  const merged = new Map<string, Part>();
  for (const part of parts) {
    const existing = merged.get(part.id);
    if (existing) {
      existing.quantity = (existing.quantity ?? 1) + (part.quantity ?? 1);
    } else {
      merged.set(part.id, { ...part });
    }
  }
  return [...merged.values()];
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function widthsFor(category: string): number[] {
  return [
    ...new Set(
      METOD_FACADES.filter((f) => f.category === category).map(
        (f) => f.widthCm,
      ),
    ),
  ];
}

function heightsFor(category: string, widthCm: number): number[] {
  return METOD_FACADES.filter(
    (f) => f.category === category && f.widthCm === widthCm,
  ).map((f) => f.heightCm);
}

export default function CabinetDoorConfigurator({ objectData }: Props) {
  const edgeWidthRange = objectData.cabinetDoor?.edgeWidthMm ?? {
    min: 5,
    max: 30,
    default: 12,
    step: 1,
  };
  const contentColorHex = objectData.cabinetDoor?.colorHex?.toLowerCase();
  const defaultDoorColorId =
    VALCHROMAT_COLORS.find((c) => c.hex.toLowerCase() === contentColorHex)
      ?.id ?? VALCHROMAT_COLORS[0].id;

  const [edgeWidthMm, setEdgeWidthMm] = useState(edgeWidthRange.default);
  const [edgeMaterial, setEdgeMaterial] = useState<MaterialId>("valchromat");
  const [edgeColorId, setEdgeColorId] = useState(VALCHROMAT_COLORS[0].id);
  const [edgeWoodId, setEdgeWoodId] = useState(SOLID_WOOD_SWATCHES[0].id);
  const [doorMaterial, setDoorMaterial] = useState<MaterialId>("valchromat");
  const [doorColorId, setDoorColorId] = useState(defaultDoorColorId);
  const [doorWoodId, setDoorWoodId] = useState(SOLID_WOOD_SWATCHES[0].id);

  const edgeSwatch =
    edgeMaterial === "solid-wood"
      ? (SOLID_WOOD_SWATCHES.find((w) => w.id === edgeWoodId) ??
        SOLID_WOOD_SWATCHES[0])
      : (VALCHROMAT_COLORS.find((c) => c.id === edgeColorId) ??
        VALCHROMAT_COLORS[0]);
  const doorSwatch =
    doorMaterial === "solid-wood"
      ? (SOLID_WOOD_SWATCHES.find((w) => w.id === doorWoodId) ??
        SOLID_WOOD_SWATCHES[0])
      : (VALCHROMAT_COLORS.find((c) => c.id === doorColorId) ??
        VALCHROMAT_COLORS[0]);

  const [category, setCategory] = useState<string>(FACADE_CATEGORIES[0]);
  const [widthCm, setWidthCm] = useState<number>(
    widthsFor(FACADE_CATEGORIES[0])[0],
  );
  const [heightCm, setHeightCm] = useState<number>(
    heightsFor(FACADE_CATEGORIES[0], widthCm)[0],
  );
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<QueuedFacade[]>([]);

  const widthOptions = useMemo(() => widthsFor(category), [category]);
  const heightOptions = useMemo(
    () => heightsFor(category, widthCm),
    [category, widthCm],
  );

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    const nextWidth = widthsFor(next)[0];
    setWidthCm(nextWidth);
    setHeightCm(heightsFor(next, nextWidth)[0]);
  };

  const handleWidthChange = (next: number) => {
    setWidthCm(next);
    setHeightCm(heightsFor(category, next)[0]);
  };

  const currentFacade = METOD_FACADES.find(
    (f) =>
      f.category === category &&
      f.widthCm === widthCm &&
      f.heightCm === heightCm,
  );

  // The 3D preview follows whichever facade is currently selected, not the
  // object's own static frontmatter dimensions — only depth stays fixed.
  const previewObjectData: ObjectData = useMemo(() => {
    if (!currentFacade) return objectData;
    const { widthMm, heightMm } = finalSizeMm(currentFacade);
    return {
      ...objectData,
      dimensions: { ...objectData.dimensions, widthMm, heightMm },
    };
  }, [objectData, currentFacade]);

  const handleAdd = () => {
    if (!currentFacade || quantity <= 0) return;
    const spec = {
      facadeId: currentFacade.id,
      edgeWidthMm,
      doorMaterial,
      doorSwatchId: doorSwatch.id,
      edgeMaterial,
      edgeSwatchId: edgeSwatch.id,
    };
    const key = queueKey(spec);
    setSelections((prev) => {
      const existing = prev.find((s) => queueKey(s) === key);
      if (existing) {
        return prev.map((s) =>
          queueKey(s) === key ? { ...s, quantity: s.quantity + quantity } : s,
        );
      }
      return [...prev, { ...spec, quantity }];
    });
  };

  const handleRemove = (key: string) => {
    setSelections((prev) => prev.filter((s) => queueKey(s) !== key));
  };

  const [cutRuns, setCutRuns] = useState<CutRun[]>([]);
  const [panelCutLists, setPanelCutLists] = useState<MaterialCutList[]>([]);
  const [edgeCutLists, setEdgeCutLists] = useState<MaterialCutList[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (selections.length === 0) return;
    const algorithm = getPlacementAlgorithm(ALGORITHM_ID);
    if (!algorithm) return;

    setGenerating(true);
    try {
      // Grouped by material + color: each finish is its own physical stock,
      // so items in different finishes can never share a cut layout.
      const panelGroups = new Map<string, MaterialGroup>();
      const edgeGroups = new Map<string, MaterialGroup>();

      for (const item of selections) {
        if (item.quantity <= 0) continue;
        const { panelParts, edgeParts } = deriveFacadeParts(
          [{ facadeId: item.facadeId, quantity: item.quantity }],
          item.edgeWidthMm,
        );

        const panelKey = `${item.doorMaterial}:${item.doorSwatchId}`;
        const panelGroup = panelGroups.get(panelKey) ?? {
          materialId: item.doorMaterial,
          swatchId: item.doorSwatchId,
          parts: [],
        };
        panelGroup.parts.push(...panelParts);
        panelGroups.set(panelKey, panelGroup);

        const edgeKey = `${item.edgeMaterial}:${item.edgeSwatchId}`;
        const edgeGroup = edgeGroups.get(edgeKey) ?? {
          materialId: item.edgeMaterial,
          swatchId: item.edgeSwatchId,
          parts: [],
        };
        edgeGroup.parts.push(...edgeParts);
        edgeGroups.set(edgeKey, edgeGroup);
      }

      // Text cut lists come straight from the grouped parts — they don't
      // depend on the nesting algorithm succeeding, so they always render
      // even if placement fails or is still slow for a large batch.
      setPanelCutLists(
        [...panelGroups.values()].map((group) => ({
          materialLabel:
            group.materialId === "solid-wood"
              ? `Bois massif — ${swatchLabel(group.materialId, group.swatchId)}`
              : `Valchromat — ${swatchLabel(group.materialId, group.swatchId)}`,
          stockLabel: describePanelBoardStock(group.materialId),
          parts: mergeParts(group.parts),
        })),
      );

      let runs: CutRun[] = [];
      try {
        runs = [...panelGroups.values()].map((group) => {
          const parts = mergeParts(group.parts);
          const boardStock = panelBoardStock(group.materialId);
          const nestingStock = insetBoardStock(boardStock, BOARD_INNER_MARGIN_MM);
          const rawPlacement = algorithm.place({
            materialId: group.materialId,
            parts,
            boardStock: nestingStock,
          });
          const placement = offsetPlacements(rawPlacement, BOARD_INNER_MARGIN_MM);
          return {
            label: `Panel — ${swatchLabel(group.materialId, group.swatchId)}`,
            material: group.materialId,
            result: placement,
            sheet: toCutSheet(placement, boardStock),
          };
        });
      } catch (err) {
        console.error("Panel nesting failed", err);
      }
      setCutRuns(runs);

      setEdgeCutLists(
        [...edgeGroups.values()].map((group) => ({
          materialLabel:
            group.materialId === "solid-wood"
              ? `Bois massif — ${swatchLabel(group.materialId, group.swatchId)}`
              : `Valchromat — ${swatchLabel(group.materialId, group.swatchId)}`,
          stockLabel: describeBoardStock(group.materialId),
          parts: mergeParts(group.parts),
        })),
      );

    } finally {
      setGenerating(false);
    }
  };

  // Chrome (and other browsers) silently drops all but the first of several
  // downloads triggered automatically in a row — there's no reliable way to
  // force a burst of them through from JS. A button per file, each firing
  // from its own click, sidesteps that entirely.
  const handleDownloadRun = async (run: CutRun) => {
    const bytes = await drawCutSheetPdf(run.sheet, run.label);
    downloadBytes(bytes, `cut-panel-${slug(run.label)}.pdf`);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="aspect-square w-full">
        <ObjectViewer3D
          objectData={previewObjectData}
          edgeColorBackground
          controlled={{ edgeWidthMm, edgeSwatch, doorSwatch }}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">
          METOD facade selection
        </h2>

        <div className="mt-2">
          <span className="block text-xs font-medium text-neutral-500">
            Type
          </span>
          <div className="mt-1 flex flex-wrap gap-2">
            {FACADE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-pressed={category === c}
                onClick={() => handleCategoryChange(c)}
                className={`flex w-24 flex-col items-center gap-1 rounded-md border px-2 py-2 text-center text-[10px] font-medium transition ${
                  category === c
                    ? "border-neutral-900 bg-neutral-100 text-neutral-900"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <FacadeTypeIcon category={c} className="h-14 w-14" />
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-500">
            Edge width: {edgeWidthMm}mm
          </label>
          <input
            type="range"
            className="mt-1 block w-full"
            min={edgeWidthRange.min}
            max={edgeWidthRange.max}
            step={edgeWidthRange.step ?? 1}
            value={edgeWidthMm}
            onChange={(e) => setEdgeWidthMm(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500">
            Edge material &amp; color
          </label>
          <div className="mt-2 flex flex-col gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                Valchromat
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {VALCHROMAT_COLORS.map((color) => (
                  <ColorCircle
                    key={color.id}
                    color={color}
                    selected={
                      edgeMaterial === "valchromat" && color.id === edgeColorId
                    }
                    onSelect={() => {
                      setEdgeMaterial("valchromat");
                      setEdgeColorId(color.id);
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                Bois massif
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {SOLID_WOOD_SWATCHES.map((wood) => (
                  <ColorCircle
                    key={wood.id}
                    color={wood}
                    selected={
                      edgeMaterial === "solid-wood" && wood.id === edgeWoodId
                    }
                    onSelect={() => {
                      setEdgeMaterial("solid-wood");
                      setEdgeWoodId(wood.id);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500">
            Door color
          </label>
          <div className="mt-2 flex flex-col gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                Valchromat
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {VALCHROMAT_COLORS.map((color) => (
                  <ColorCircle
                    key={color.id}
                    color={color}
                    selected={
                      doorMaterial === "valchromat" && color.id === doorColorId
                    }
                    onSelect={() => {
                      setDoorMaterial("valchromat");
                      setDoorColorId(color.id);
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                Bois massif
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {SOLID_WOOD_SWATCHES.map((wood) => (
                  <ColorCircle
                    key={wood.id}
                    color={wood}
                    selected={
                      doorMaterial === "solid-wood" && wood.id === doorWoodId
                    }
                    onSelect={() => {
                      setDoorMaterial("solid-wood");
                      setDoorWoodId(wood.id);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex flex-col text-xs font-medium text-neutral-500">
              Width (cm)
              <select
                value={widthCm}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="mt-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
              >
                {widthOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs font-medium text-neutral-500">
              Height (cm)
              <select
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="mt-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
              >
                {heightOptions.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-2 flex items-end gap-2">
            <label className="flex w-20 flex-col text-xs font-medium text-neutral-500">
              Qty
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mt-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-md border border-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Add
            </button>
          </div>

          {selections.length > 0 && (
            <div className="mt-3 flex flex-col gap-1">
              {selections.map((sel) => {
                const entry = METOD_FACADES.find((f) => f.id === sel.facadeId);
                const key = queueKey(sel);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {entry?.label ?? sel.facadeId}
                      <span className="text-neutral-500">
                        {" "}
                        — {swatchLabel(sel.doorMaterial, sel.doorSwatchId)} door,{" "}
                        {swatchLabel(sel.edgeMaterial, sel.edgeSwatchId)} edge
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-neutral-500">×{sel.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(key)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={selections.length === 0 || generating}
            className="mt-4 w-full rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? "Generating…" : "Generate cut file(s)"}
          </button>
        </div>

        {panelCutLists.map((list) => (
          <div
            key={list.materialLabel}
            className="flex flex-col gap-2 border-t border-neutral-200 pt-4"
          >
            <h3 className="text-xs font-semibold text-neutral-700">Panels — cut list</h3>
            <p className="text-xs text-neutral-600">
              Buy: <span className="font-medium">{list.materialLabel}</span> —{" "}
              {list.stockLabel}
            </p>
            <table className="text-xs">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="pr-4 font-medium">Piece</th>
                  <th className="pr-4 font-medium">Size (mm)</th>
                  <th className="font-medium">Qty</th>
                </tr>
              </thead>
              <tbody>
                {list.parts.map((part) => (
                  <tr key={part.id}>
                    <td className="pr-4 py-0.5">{describePanelPart(part)}</td>
                    <td className="pr-4 py-0.5">
                      {part.widthMm} × {part.heightMm}
                    </td>
                    <td className="py-0.5">{part.quantity ?? 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {cutRuns.map((run) => (
          <div
            key={run.label}
            className="flex flex-col gap-3 border-t border-neutral-200 pt-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-neutral-700">
                {run.label} ({run.material}) — boards used:{" "}
                {run.result.boardsUsed}, placed: {run.result.placements.length},
                unplaced: {run.result.unplaced.length}
              </h3>
              {run.result.placements.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleDownloadRun(run)}
                  className="shrink-0 rounded-md border border-neutral-800 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
                >
                  Download PDF
                </button>
              )}
            </div>
            {run.result.placements.length === 0 ? (
              <p className="text-xs text-red-600">
                No cut plan — this panel doesn't fit on the standard board
                size for this material.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: run.sheet.boardsUsed }, (_, boardIndex) => (
                  <BoardPreview
                    key={boardIndex}
                    boardIndex={boardIndex}
                    boardWidthMm={run.sheet.boardWidthMm}
                    boardHeightMm={run.sheet.boardHeightMm}
                    cuts={run.sheet.cuts.filter(
                      (cut) => cut.boardIndex === boardIndex,
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {edgeCutLists.map((list) => (
          <div
            key={list.materialLabel}
            className="flex flex-col gap-2 border-t border-neutral-200 pt-4"
          >
            <h3 className="text-xs font-semibold text-neutral-700">Edges — cut list</h3>
            <p className="text-xs text-neutral-600">
              Buy: <span className="font-medium">{list.materialLabel}</span> —{" "}
              {list.stockLabel}
            </p>
            <table className="text-xs">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="pr-4 font-medium">Piece</th>
                  <th className="pr-4 font-medium">Size (mm)</th>
                  <th className="font-medium">Qty</th>
                </tr>
              </thead>
              <tbody>
                {list.parts.map((part) => (
                  <tr key={part.id}>
                    <td className="pr-4 py-0.5">{describeEdgePart(part)}</td>
                    <td className="pr-4 py-0.5">
                      {part.widthMm} × {part.heightMm}
                    </td>
                    <td className="py-0.5">{part.quantity ?? 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
