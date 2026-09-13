interface Props {
  category: string;
  className?: string;
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// The open facade gets a light fill so it reads as a solid panel next to
// the outline-only carcass, rather than another line in the same drawing.
const OPEN_PANEL = { ...STROKE, fill: "currentColor", fillOpacity: 0.12 };

// Shared isometric cabinet carcass: top / side / front faces.
function IsoBox() {
  return (
    <>
      <path d="M14 4 L23 8.5 L14 13 L5 8.5 Z" {...STROKE} />
      <path d="M5 8.5 L14 13 L14 25 L5 20.5 Z" {...STROKE} />
      <path d="M14 13 L23 8.5 L23 20.5 L14 25 Z" {...STROKE} />
    </>
  );
}

// One isometric glyph per METOD category, facade shown open — no icon
// library in this repo, and four shapes don't warrant adding one.
export default function FacadeTypeIcon({ category, className = "h-14 w-14" }: Props) {
  const common = { className, viewBox: "0 0 40 40" };

  switch (category) {
    case "Tiroir":
      return (
        <svg {...common}>
          <IsoBox />
          {/* drawer front shaded in place on the face — no swing, no poking past the carcass edges */}
          <path d="M14 16.6 L23 12.1 L23 16.3 L14 20.8 Z" {...OPEN_PANEL} />
        </svg>
      );
    case "Porte":
      return (
        <svg {...common}>
          <IsoBox />
          <path d="M23 8.5 L33 14 L33 26 L23 20.5 Z" {...OPEN_PANEL} />
        </svg>
      );
    case "Porte colonne":
      return (
        <svg {...common} viewBox="0 0 40 44">
          <path d="M14 2 L23 6.5 L14 11 L5 6.5 Z" {...STROKE} />
          <path d="M5 6.5 L14 11 L14 31 L5 26.5 Z" {...STROKE} />
          <path d="M14 11 L23 6.5 L23 26.5 L14 31 Z" {...STROKE} />
          <path d="M23 6.5 L33 12 L33 32 L23 26.5 Z" {...OPEN_PANEL} />
        </svg>
      );
    case "Lave-vaisselle":
      return (
        <svg {...common}>
          {/* square-ish under-counter proportions, not a short/flat box */}
          <path d="M18 8 L32 13 L18 18 L4 13 Z" {...STROKE} />
          <path d="M4 13 L18 18 L18 32 L4 27 Z" {...STROKE} />
          {/* carcass top-right edge, exposed above the door as it tilts down —
              the descending edge is cut short where the door's top edge
              would otherwise cover it */}
          <path d="M18 18 L32 13 L32 16" {...STROKE} />
          {/* door hinged at the bottom edge (fixed, shared with the carcass):
              only its free top edge swings down and toward the viewer a
              small amount — it replaces the front face, never floats below it */}
          <path d="M18 32 L32 27 L33.5 15.5 L19.5 20.5 Z" {...OPEN_PANEL} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <IsoBox />
        </svg>
      );
  }
}
