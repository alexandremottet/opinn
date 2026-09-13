import { useMemo, useRef, useState } from "react";
import {
  getBoardStock,
  getPlacementAlgorithm,
  listPlacementAlgorithms,
  type MaterialId,
  type Part,
  type PlacementResult,
} from "@opinn/panel-nesting";
import { toCutSheet, type CutSheet } from "@opinn/cut-positions";
import { DEFAULT_GENERATION_SETTINGS, generateRandomParts } from "./lib/randomParts";
import { SettingsForm } from "./components/SettingsForm";
import { BoardView } from "./components/BoardView";
import { ResultSummary } from "./components/ResultSummary";

export function App() {
  const algorithmOptions = useMemo(() => listPlacementAlgorithms().map((a) => a.id), []);

  const [material, setMaterial] = useState<MaterialId>("valchromat");
  const [algorithmId, setAlgorithmId] = useState<string | undefined>(algorithmOptions[0]);
  const [parts, setParts] = useState<Part[]>([]);
  const [sheet, setSheet] = useState<CutSheet | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const nextManualId = useRef(1);

  const handleGenerate = () => {
    setParts(generateRandomParts(DEFAULT_GENERATION_SETTINGS));
    setResult(null);
    setSheet(null);
  };

  const handleAddPart = () => {
    const id = `manual-${nextManualId.current++}`;
    setParts((prev) => [...prev, { id, widthMm: 300, heightMm: 300, quantity: 1 }]);
  };

  const handlePartChange = (id: string, patch: Partial<Part>) => {
    setParts((prev) => prev.map((part) => (part.id === id ? { ...part, ...patch } : part)));
  };

  const handlePartRemove = (id: string) => {
    setParts((prev) => prev.filter((part) => part.id !== id));
  };

  const handleRun = () => {
    if (!algorithmId || parts.length === 0) return;
    const algorithm = getPlacementAlgorithm(algorithmId);
    if (!algorithm) return;

    const placement = algorithm.place({ materialId: material, parts });
    const boardStock = getBoardStock(material);
    setResult(placement);
    setSheet(toCutSheet(placement, boardStock));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Panel nesting demo</h1>
        <p className="text-sm text-ink/60">Generate random parts and nest them with a registered algorithm.</p>
      </header>

      <SettingsForm
        material={material}
        onMaterialChange={setMaterial}
        algorithmId={algorithmId}
        algorithmOptions={algorithmOptions}
        onAlgorithmChange={setAlgorithmId}
        parts={parts}
        onAddPart={handleAddPart}
        onPartChange={handlePartChange}
        onPartRemove={handlePartRemove}
        onGenerate={handleGenerate}
        onRun={handleRun}
        canRun={parts.length > 0 && !!algorithmId}
      />

      {result && sheet && (
        <section className="flex flex-col gap-4">
          <ResultSummary result={result} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: sheet.boardsUsed }, (_, boardIndex) => (
              <BoardView
                key={boardIndex}
                boardIndex={boardIndex}
                boardWidthMm={sheet.boardWidthMm}
                boardHeightMm={sheet.boardHeightMm}
                cuts={sheet.cuts.filter((cut) => cut.boardIndex === boardIndex)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
