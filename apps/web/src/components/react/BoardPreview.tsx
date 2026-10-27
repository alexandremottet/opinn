import type { PositionCut } from "@opinn/cut-positions";

const PALETTE = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

interface Props {
  boardIndex: number;
  boardWidthMm: number;
  boardHeightMm: number;
  cuts: PositionCut[];
}

export default function BoardPreview({ boardIndex, boardWidthMm, boardHeightMm, cuts }: Props) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3">
      <p className="mb-2 text-xs font-medium text-neutral-500">
        Board {boardIndex + 1} · {boardWidthMm}×{boardHeightMm}mm
      </p>
      <svg
        viewBox={`0 0 ${boardWidthMm} ${boardHeightMm}`}
        style={{ aspectRatio: `${boardWidthMm} / ${boardHeightMm}` }}
        className="w-full rounded bg-neutral-50"
      >
        {cuts.map((cut, i) => {
          const clipId = `cut-clip-${boardIndex}-${i}`;
          return (
            <g key={`${cut.partId}-${i}`}>
              <clipPath id={clipId}>
                <rect x={cut.xMm} y={cut.yMm} width={cut.widthMm} height={cut.heightMm} />
              </clipPath>
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
              {/* Any label that overflows the cut it's labeling is clipped away by
                  clip-path — never shrunk, truncated, or spilling onto a neighbor. */}
              <g clipPath={`url(#${clipId})`}>
                <text
                  x={cut.xMm + boardWidthMm / 150}
                  y={cut.yMm + boardWidthMm / 60}
                  fontSize={boardWidthMm / 60}
                  fill="#1c1c1c"
                >
                  {cut.partId}
                </text>
                {/* Width, horizontal, centered along the bottom edge. */}
                <text
                  x={cut.xMm + cut.widthMm / 2}
                  y={cut.yMm + cut.heightMm - boardWidthMm / 200}
                  fontSize={boardWidthMm / 70}
                  textAnchor="middle"
                  fill="#1c1c1c"
                >
                  {cut.widthMm}
                </text>
                {/* Height, vertical, centered along the left edge. */}
                <text
                  x={cut.xMm + boardWidthMm / 120}
                  y={cut.yMm + cut.heightMm / 2}
                  fontSize={boardWidthMm / 70}
                  textAnchor="middle"
                  fill="#1c1c1c"
                  transform={`rotate(-90, ${cut.xMm + boardWidthMm / 120}, ${cut.yMm + cut.heightMm / 2})`}
                >
                  {cut.heightMm}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
