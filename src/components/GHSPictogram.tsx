import type { GHSPictogram as PictogramType } from "@/lib/data";

interface GHSPictogramProps {
  type: PictogramType;
  size?: number;
  className?: string;
}

// Each pictogram is a red-bordered diamond with a black symbol inside.
// The SVG viewBox is 100x100, the diamond is rotated 45deg via polygon points.
export default function GHSPictogram({ type, size = 48, className = "" }: GHSPictogramProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={pictogramLabels[type]}
    >
      {/* Red diamond border */}
      <polygon
        points="50,2 98,50 50,98 2,50"
        fill="white"
        stroke="#DC2626"
        strokeWidth="4"
      />
      {/* Symbol inside */}
      <g transform="translate(50,50)">
        {pictogramSymbols[type]}
      </g>
    </svg>
  );
}

const pictogramLabels: Record<PictogramType, string> = {
  flame: "Flammable",
  oxidizer: "Oxidizer",
  "compressed-gas": "Gas Under Pressure",
  corrosion: "Corrosive",
  skull: "Acute Toxicity",
  exclamation: "Irritant / Harmful",
  "health-hazard": "Health Hazard",
  environment: "Environmental Hazard",
  "exploding-bomb": "Explosive",
};

const pictogramSymbols: Record<PictogramType, React.ReactNode> = {
  // Flame — stylized fire shape
  flame: (
    <path
      d="M0,-28 C8,-20 14,-10 14,0 C14,8 8,14 0,14 C-8,14 -14,8 -14,0 C-14,-4 -10,-6 -6,-2 C-6,-2 -8,-14 0,-28Z"
      fill="#000"
      strokeLinejoin="round"
    />
  ),

  // Oxidizer — flame over a circle
  oxidizer: (
    <g>
      <circle cx="0" cy="10" r="12" fill="none" stroke="#000" strokeWidth="3.5" />
      <path
        d="M0,-8 C5,-2 8,2 8,6 C8,10 4,12 0,12 C-4,12 -8,10 -8,6 C-8,4 -6,2 -4,4 C-4,4 -5,-2 0,-8Z"
        fill="#000"
        transform="translate(0,-16) scale(0.8)"
      />
    </g>
  ),

  // Compressed gas — gas cylinder
  "compressed-gas": (
    <g>
      <rect x="-8" y="-22" width="16" height="36" rx="4" fill="none" stroke="#000" strokeWidth="3.5" />
      <rect x="-4" y="-26" width="8" height="6" rx="2" fill="#000" />
      <line x1="0" y1="-26" x2="0" y2="-30" stroke="#000" strokeWidth="3" strokeLinecap="round" />
      <path d="M-4,14 L-10,22 M4,14 L10,22" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),

  // Corrosion — liquid dripping on hand and surface
  corrosion: (
    <g>
      <path
        d="M-6,-24 L6,-24 L4,-14 L10,-14 L10,-6 C10,2 6,6 0,6 C-6,6 -10,2 -10,-6 L-10,-14 L-4,-14Z"
        fill="#000"
        transform="translate(0,-2) scale(0.9)"
      />
      <rect x="-14" y="14" width="28" height="4" rx="1" fill="#000" />
      <path d="M8,-16 L8,-8 C8,-4 4,0 0,0" fill="none" stroke="#000" strokeWidth="2.5" transform="translate(2,4)" />
    </g>
  ),

  // Skull and crossbones
  skull: (
    <g>
      <circle cx="0" cy="-10" r="14" fill="#000" />
      <circle cx="-5" cy="-12" r="3.5" fill="white" />
      <circle cx="5" cy="-12" r="3.5" fill="white" />
      <ellipse cx="0" cy="-5" rx="2" ry="2.5" fill="white" />
      <path d="M-10,6 L10,6" stroke="#000" strokeWidth="5" strokeLinecap="round" />
      <path d="M-14,2 L14,14" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      <path d="M-14,14 L14,2" stroke="#000" strokeWidth="4" strokeLinecap="round" />
    </g>
  ),

  // Exclamation mark
  exclamation: (
    <g>
      <rect x="-4" y="-26" width="8" height="32" rx="3" fill="#000" />
      <circle cx="0" cy="16" r="5" fill="#000" />
    </g>
  ),

  // Health hazard — person silhouette with star/burst on chest
  "health-hazard": (
    <g>
      <circle cx="0" cy="-22" r="7" fill="#000" />
      <path d="M-12,-12 L12,-12 L8,18 L-8,18Z" fill="#000" />
      <polygon
        points="0,-12 2,-4 10,-4 4,1 6,9 0,5 -6,9 -4,1 -10,-4 -2,-4"
        fill="white"
        transform="translate(0,2) scale(0.7)"
      />
    </g>
  ),

  // Environment — dead tree and fish
  environment: (
    <g>
      <path d="M-4,18 L-4,-10 C-4,-20 -16,-16 -10,-24 C-4,-18 0,-22 4,-28 C8,-22 12,-18 18,-24 C12,-16 4,-20 4,-10 L4,18Z" fill="#000" transform="translate(-2,2) scale(0.75)" />
      <ellipse cx="2" cy="14" rx="16" ry="5" fill="#000" transform="scale(0.8)" />
    </g>
  ),

  // Exploding bomb
  "exploding-bomb": (
    <g>
      <circle cx="0" cy="4" r="16" fill="#000" />
      <path d="M4,-12 Q12,-20 8,-28" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M6,-26 L12,-22 L8,-20 L14,-16 L6,-18 L10,-14"
        fill="#000"
        strokeLinejoin="round"
      />
    </g>
  ),
};
