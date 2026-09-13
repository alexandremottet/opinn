import type { PositionCut } from "@opinn/cut-positions";

const PALETTE = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

interface BoardViewProps {
  boardIndex: number;
  boardWidthMm: number;
  boardHeightMm: number;
  cuts: PositionCut[];
}

export function BoardView({ boardIndex, boardWidthMm, boardHeightMm, cuts }: BoardViewProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
      <p className="mb-2 text-xs font-medium text-ink/60">
        Board {boardIndex + 1} · {boardWidthMm}×{boardHeightMm}mm
      </p>
      <svg
        viewBox={`0 0 ${boardWidthMm} ${boardHeightMm}`}
        style={{ aspectRatio: `${boardWidthMm} / ${boardHeightMm}` }}
        className="w-full rounded bg-paper"
      >
        {cuts.map((cut, i) => (
          <g key={`${cut.partId}-${i}`}>
            <rect
              x={cut.xMm}
              y={cut.yMm}
              width={cut.widthMm}
              height={cut.heightMm}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.75}
              stroke="#1c1c1c"
              strokeWidth={boardWidthMm / 400}
            />
            <text
              x={cut.xMm + cut.widthMm / 2}
              y={cut.yMm + cut.heightMm / 2}
              fontSize={boardWidthMm / 60}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#1c1c1c"
            >
              {cut.partId}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
