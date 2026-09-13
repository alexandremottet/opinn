import type { MaterialId, Part } from "@opinn/panel-nesting";
import { PartsList } from "./PartsList";

interface SettingsFormProps {
  material: MaterialId;
  onMaterialChange: (material: MaterialId) => void;
  algorithmId: string | undefined;
  algorithmOptions: string[];
  onAlgorithmChange: (id: string) => void;
  parts: Part[];
  onAddPart: () => void;
  onPartChange: (id: string, patch: Partial<Part>) => void;
  onPartRemove: (id: string) => void;
  onGenerate: () => void;
  onRun: () => void;
  canRun: boolean;
}

export function SettingsForm({
  material,
  onMaterialChange,
  algorithmId,
  algorithmOptions,
  onAlgorithmChange,
  parts,
  onAddPart,
  onPartChange,
  onPartRemove,
  onGenerate,
  onRun,
  canRun,
}: SettingsFormProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink/70">Material</span>
        <select
          value={material}
          onChange={(e) => onMaterialChange(e.target.value as MaterialId)}
          className="rounded border border-ink/20 px-2 py-1 text-sm"
        >
          <option value="solid-wood">Solid wood (strip, grain-locked)</option>
          <option value="valchromat">Valchromat (sheet, free rotation)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-ink/70">Algorithm</span>
        <select
          value={algorithmId ?? ""}
          onChange={(e) => onAlgorithmChange(e.target.value)}
          className="rounded border border-ink/20 px-2 py-1 text-sm"
        >
          {algorithmOptions.length === 0 && <option value="">No algorithm registered</option>}
          {algorithmOptions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <PartsList parts={parts} onAdd={onAddPart} onChange={onPartChange} onRemove={onPartRemove} />

      <div className="flex gap-2">
        <button
          onClick={onGenerate}
          className="flex-1 rounded bg-ink px-3 py-2 text-sm font-medium text-paper hover:opacity-90"
        >
          Generate parts
        </button>
        <button
          onClick={onRun}
          disabled={!canRun}
          className="flex-1 rounded border border-ink px-3 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run nesting
        </button>
      </div>
    </div>
  );
}
