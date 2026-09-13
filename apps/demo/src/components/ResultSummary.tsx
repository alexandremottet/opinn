import type { PlacementResult } from "@opinn/panel-nesting";

export function ResultSummary({ result }: { result: PlacementResult }) {
  return (
    <div className="flex gap-6 text-sm text-ink/80">
      <span>
        Boards used: <strong className="text-ink">{result.boardsUsed}</strong>
      </span>
      <span>
        Placed: <strong className="text-ink">{result.placements.length}</strong>
      </span>
      <span>
        Unplaced: <strong className={result.unplaced.length > 0 ? "text-red-600" : "text-ink"}>
          {result.unplaced.length}
        </strong>
      </span>
    </div>
  );
}
