import type { Part } from "@opinn/panel-nesting";

interface PartsListProps {
  parts: Part[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Part>) => void;
  onRemove: (id: string) => void;
}

export function PartsList({ parts, onAdd, onChange, onRemove }: PartsListProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink/70">Parts ({parts.length})</span>
        <button
          onClick={onAdd}
          className="rounded border border-ink px-2 py-1 text-xs font-medium text-ink hover:bg-ink/5"
        >
          Add part
        </button>
      </div>

      {parts.length === 0 && <p className="text-xs text-ink/50">No parts yet.</p>}

      {parts.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-[1fr_repeat(3,5rem)_auto] gap-2 text-xs font-medium text-ink/50">
            <span>Id</span>
            <span>Width</span>
            <span>Height</span>
            <span>Qty</span>
            <span />
          </div>
          {parts.map((part) => (
            <div key={part.id} className="grid grid-cols-[1fr_repeat(3,5rem)_auto] items-center gap-2 text-sm">
              <span className="truncate text-ink/70">{part.id}</span>
              <input
                type="number"
                value={part.widthMm}
                onChange={(e) => onChange(part.id, { widthMm: Number(e.target.value) })}
                className="rounded border border-ink/20 px-2 py-1"
                aria-label={`${part.id} width mm`}
              />
              <input
                type="number"
                value={part.heightMm}
                onChange={(e) => onChange(part.id, { heightMm: Number(e.target.value) })}
                className="rounded border border-ink/20 px-2 py-1"
                aria-label={`${part.id} height mm`}
              />
              <input
                type="number"
                min={1}
                value={part.quantity ?? 1}
                onChange={(e) => onChange(part.id, { quantity: Number(e.target.value) })}
                className="rounded border border-ink/20 px-2 py-1"
                aria-label={`${part.id} quantity`}
              />
              <button
                onClick={() => onRemove(part.id)}
                className="text-xs text-red-600 hover:underline"
                aria-label={`Remove ${part.id}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
