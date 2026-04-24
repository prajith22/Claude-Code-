import type { ReactNode } from "react";

type LogoConfig = {
  bg: string;
  abbr: string;
  icon: (bg: string) => ReactNode;
};

const pizzaIcon = (bg: string) => (
  <g>
    <path
      d="M200 95 L320 300 Q200 340 80 300 Z"
      fill="white"
      strokeLinejoin="round"
    />
    <circle cx="175" cy="195" r="14" fill={bg} />
    <circle cx="235" cy="230" r="12" fill={bg} />
    <circle cx="170" cy="265" r="11" fill={bg} />
  </g>
);

const burgerIcon = () => (
  <g fill="white">
    {/* Top bun */}
    <path d="M90 185 Q90 125 200 125 Q310 125 310 185 Z" />
    {/* Patty */}
    <rect x="90" y="200" width="220" height="28" rx="10" />
    {/* Lettuce ribbon */}
    <path
      d="M90 238 Q115 224 140 238 Q165 224 190 238 Q215 224 240 238 Q265 224 290 238 Q305 232 310 238 L310 250 L90 250 Z"
    />
    {/* Bottom bun */}
    <path d="M90 262 L310 262 Q310 300 200 300 Q90 300 90 262 Z" />
  </g>
);

const burritoIcon = (bg: string) => (
  <g>
    <rect
      x="90"
      y="160"
      width="220"
      height="90"
      rx="45"
      fill="white"
      transform="rotate(-14 200 205)"
    />
    <g
      stroke={bg}
      strokeWidth="6"
      strokeLinecap="round"
      transform="rotate(-14 200 205)"
    >
      <line x1="120" y1="180" x2="130" y2="230" />
      <line x1="150" y1="175" x2="160" y2="235" />
      <line x1="250" y1="175" x2="260" y2="235" />
      <line x1="280" y1="180" x2="290" y2="230" />
    </g>
  </g>
);

const drumstickIcon = () => (
  <g fill="white">
    {/* Meat */}
    <ellipse cx="165" cy="165" rx="85" ry="75" />
    {/* Bone */}
    <rect
      x="200"
      y="210"
      width="130"
      height="26"
      rx="13"
      transform="rotate(35 200 210)"
    />
    <circle cx="310" cy="300" r="22" />
    <circle cx="290" cy="322" r="20" />
  </g>
);

const tacoIcon = () => (
  <g>
    {/* Shell */}
    <path
      d="M60 260 Q200 140 340 260 L320 280 Q200 200 80 280 Z"
      fill="white"
    />
    {/* Fillings peeking out */}
    <circle cx="150" cy="245" r="14" fill="white" />
    <circle cx="210" cy="235" r="14" fill="white" />
    <circle cx="265" cy="250" r="14" fill="white" />
  </g>
);

const sandwichIcon = () => (
  <g fill="white">
    {/* Top bread */}
    <path d="M70 160 L330 160 L330 195 Q200 175 70 195 Z" />
    {/* Lettuce */}
    <path d="M70 200 Q100 210 130 200 Q160 212 190 200 Q220 212 250 200 Q280 212 310 200 Q320 205 330 200 L330 215 L70 215 Z" />
    {/* Cheese / meat */}
    <rect x="70" y="220" width="260" height="20" />
    <rect x="70" y="245" width="260" height="20" />
    {/* Bottom bread */}
    <path d="M70 270 L330 270 Q200 295 70 275 Z" />
  </g>
);

const chopsticksIcon = () => (
  <g
    stroke="white"
    strokeWidth="20"
    strokeLinecap="round"
    fill="none"
  >
    <line x1="100" y1="90" x2="260" y2="310" />
    <line x1="160" y1="80" x2="320" y2="300" />
  </g>
);

const milkshakeIcon = () => (
  <g fill="white">
    {/* Dome/whip */}
    <path d="M120 170 Q140 120 200 115 Q260 120 280 170 Q250 160 230 175 Q210 155 190 175 Q170 155 150 175 Q130 160 120 170 Z" />
    {/* Cup */}
    <path d="M135 180 L265 180 L245 320 Q200 335 155 320 Z" />
    {/* Straw */}
    <rect
      x="225"
      y="70"
      width="18"
      height="130"
      rx="6"
      transform="rotate(15 234 135)"
    />
  </g>
);

const wingIcon = () => (
  <g fill="white">
    <path d="M100 290 Q90 180 180 130 Q270 100 320 150 Q290 180 260 175 Q300 210 275 240 Q240 235 220 220 Q240 260 205 275 Q175 270 165 250 Q180 285 150 300 Q115 305 100 290 Z" />
    <circle cx="115" cy="285" r="10" fill="white" />
  </g>
);

const sakuraIcon = () => (
  <g>
    {/* Crossed chopsticks */}
    <g stroke="white" strokeWidth="14" strokeLinecap="round" fill="none">
      <line x1="110" y1="100" x2="270" y2="260" />
      <line x1="160" y1="90" x2="320" y2="250" />
    </g>
    {/* Cherry blossom — 5 petals + center */}
    <g fill="white">
      <ellipse cx="150" cy="310" rx="22" ry="14" transform="rotate(-60 150 310)" />
      <ellipse cx="190" cy="300" rx="22" ry="14" transform="rotate(-20 190 300)" />
      <ellipse cx="230" cy="320" rx="22" ry="14" transform="rotate(20 230 320)" />
      <ellipse cx="200" cy="345" rx="22" ry="14" transform="rotate(70 200 345)" />
      <ellipse cx="160" cy="345" rx="22" ry="14" transform="rotate(-80 160 345)" />
    </g>
    <circle cx="190" cy="320" r="10" fill="#FFB7C5" />
  </g>
);

const spiceFlameIcon = (bg: string) => (
  <g>
    {/* Teardrop flame */}
    <path
      d="M200 80 Q140 150 150 210 Q155 280 200 320 Q245 280 250 210 Q260 150 200 80 Z"
      fill="white"
    />
    {/* Inner flame */}
    <path
      d="M200 150 Q175 195 180 235 Q185 275 200 295 Q215 275 220 235 Q225 195 200 150 Z"
      fill={bg}
    />
  </g>
);

const oliveBranchIcon = (bg: string) => (
  <g>
    {/* Curving stem */}
    <path
      d="M90 310 Q180 260 310 110"
      stroke="white"
      strokeWidth="10"
      strokeLinecap="round"
      fill="none"
    />
    {/* Leaves along the branch */}
    <g fill="white">
      <ellipse cx="130" cy="265" rx="28" ry="11" transform="rotate(-35 130 265)" />
      <ellipse cx="200" cy="215" rx="30" ry="12" transform="rotate(-45 200 215)" />
      <ellipse cx="260" cy="165" rx="28" ry="11" transform="rotate(-55 260 165)" />
    </g>
    {/* Olives */}
    <circle cx="165" cy="255" r="13" fill="white" />
    <circle cx="165" cy="255" r="5" fill={bg} />
    <circle cx="235" cy="200" r="13" fill="white" />
    <circle cx="235" cy="200" r="5" fill={bg} />
  </g>
);

const bigFlameIcon = (bg: string) => (
  <g>
    <path
      d="M200 70 Q120 180 140 250 Q150 310 200 330 Q250 310 260 250 Q280 180 200 70 Z"
      fill="white"
    />
    <path
      d="M200 170 Q170 220 175 260 Q180 295 200 310 Q220 295 225 260 Q230 220 200 170 Z"
      fill={bg}
    />
  </g>
);

const orchidIcon = (bg: string) => (
  <g>
    {/* 5 petals radiating from the center */}
    <g fill="white">
      <ellipse cx="200" cy="125" rx="34" ry="60" />
      <ellipse cx="270" cy="170" rx="34" ry="60" transform="rotate(60 270 170)" />
      <ellipse cx="250" cy="260" rx="34" ry="60" transform="rotate(120 250 260)" />
      <ellipse cx="150" cy="260" rx="34" ry="60" transform="rotate(-120 150 260)" />
      <ellipse cx="130" cy="170" rx="34" ry="60" transform="rotate(-60 130 170)" />
    </g>
    {/* Center */}
    <circle cx="200" cy="205" r="28" fill={bg} />
    <circle cx="200" cy="205" r="12" fill="white" />
  </g>
);

const sunEggIcon = (bg: string) => (
  <g>
    {/* Rays */}
    <g stroke="white" strokeWidth="14" strokeLinecap="round">
      <line x1="200" y1="55" x2="200" y2="100" />
      <line x1="345" y1="200" x2="300" y2="200" />
      <line x1="100" y1="200" x2="55" y2="200" />
      <line x1="303" y1="97" x2="275" y2="125" />
      <line x1="97" y1="97" x2="125" y2="125" />
      <line x1="303" y1="303" x2="275" y2="275" />
      <line x1="97" y1="303" x2="125" y2="275" />
    </g>
    {/* Sun / egg white */}
    <circle cx="200" cy="200" r="80" fill="white" />
    {/* Yolk */}
    <circle cx="200" cy="200" r="36" fill={bg} />
  </g>
);

const leafIcon = (bg: string) => (
  <g>
    {/* Teardrop leaf */}
    <path
      d="M110 290 Q110 130 290 110 Q310 250 180 310 Q140 320 110 290 Z"
      fill="white"
    />
    {/* Vein */}
    <path
      d="M120 285 Q200 220 285 120"
      stroke={bg}
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

const pastaForkIcon = () => (
  <g>
    {/* Fork handle */}
    <rect x="188" y="200" width="24" height="140" rx="10" fill="white" />
    {/* Fork tines */}
    <g fill="white">
      <rect x="150" y="100" width="14" height="110" rx="6" />
      <rect x="178" y="90" width="14" height="120" rx="6" />
      <rect x="208" y="90" width="14" height="120" rx="6" />
      <rect x="236" y="100" width="14" height="110" rx="6" />
    </g>
    {/* Noodle swirl wrapping the tines */}
    <g stroke="white" strokeWidth="8" fill="none" strokeLinecap="round">
      <path d="M120 170 Q200 120 280 170 Q310 200 270 220 Q210 240 140 215 Q105 200 130 180" />
    </g>
  </g>
);

const anchorIcon = (bg: string) => (
  <g>
    {/* Top ring */}
    <circle cx="200" cy="100" r="22" stroke="white" strokeWidth="12" fill="none" />
    {/* Vertical shank */}
    <rect x="190" y="115" width="20" height="175" fill="white" />
    {/* Cross bar */}
    <rect x="140" y="150" width="120" height="16" rx="6" fill="white" />
    {/* Curved flukes */}
    <path
      d="M120 255 Q150 325 200 320"
      stroke="white"
      strokeWidth="18"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M280 255 Q250 325 200 320"
      stroke="white"
      strokeWidth="18"
      strokeLinecap="round"
      fill="none"
    />
    {/* Inner accents on flukes */}
    <circle cx="120" cy="255" r="7" fill={bg} />
    <circle cx="280" cy="255" r="7" fill={bg} />
  </g>
);

const bobaIcon = (bg: string) => (
  <g>
    {/* Cup body */}
    <path d="M135 160 L265 160 L248 330 Q200 345 152 330 Z" fill="white" />
    {/* Lid */}
    <rect x="125" y="145" width="150" height="20" rx="6" fill="white" />
    {/* Straw */}
    <rect
      x="195"
      y="80"
      width="18"
      height="130"
      rx="6"
      transform="rotate(12 204 145)"
      fill="white"
    />
    {/* Tapioca pearls */}
    <g fill={bg}>
      <circle cx="170" cy="290" r="11" />
      <circle cx="200" cy="305" r="11" />
      <circle cx="230" cy="290" r="11" />
      <circle cx="185" cy="265" r="9" />
      <circle cx="215" cy="265" r="9" />
    </g>
  </g>
);

const logos: Record<string, LogoConfig> = {
  "Golden Arch Burgers": { bg: "#FFB703", abbr: "GA", icon: burgerIcon },
  "Canyon Burrito Co.": { bg: "#FB8500", abbr: "CB", icon: burritoIcon },
  "Southern Cluck": { bg: "#9D0208", abbr: "SC", icon: drumstickIcon },
  "Taco Mirage": { bg: "#7B2D8B", abbr: "TM", icon: tacoIcon },
  "The Sub Station": { bg: "#2D6A4F", abbr: "SS", icon: sandwichIcon },
  "Slice District": { bg: "#6A040F", abbr: "SD", icon: pizzaIcon },
  "Dragon Wok Express": { bg: "#BC2020", abbr: "DW", icon: chopsticksIcon },
  "Five Brothers Burgers": { bg: "#023E8A", abbr: "5B", icon: burgerIcon },
  "Shack & Shake": { bg: "#52B788", abbr: "S&S", icon: milkshakeIcon },
  "Wing Republic": { bg: "#E85D04", abbr: "WR", icon: wingIcon },
  "Sakura Roll House": { bg: "#FFB7C5", abbr: "SR", icon: sakuraIcon },
  "Bombay Bites": { bg: "#FF9933", abbr: "BB", icon: spiceFlameIcon },
  "Olive & Feta": { bg: "#6B8F4E", abbr: "O&F", icon: oliveBranchIcon },
  "Seoul Fire BBQ": { bg: "#8B0000", abbr: "SF", icon: bigFlameIcon },
  "Thai Orchid Express": { bg: "#7B2FBE", abbr: "TO", icon: orchidIcon },
  "Morning Glory Brunch": { bg: "#FF8C42", abbr: "MG", icon: sunEggIcon },
  "Green Root Kitchen": { bg: "#52796F", abbr: "GR", icon: leafIcon },
  "Trattoria Napoli": { bg: "#C1121F", abbr: "TN", icon: pastaForkIcon },
  "The Anchor Seafood": { bg: "#0077B6", abbr: "AS", icon: anchorIcon },
  "Boba & Bites": { bg: "#C77DFF", abbr: "B&B", icon: bobaIcon },
};

const fallback: LogoConfig = {
  bg: "#475569",
  abbr: "?",
  icon: () => (
    <text
      x="200"
      y="215"
      textAnchor="middle"
      dominantBaseline="central"
      fill="white"
      fontWeight="900"
      fontSize="140"
      fontFamily="var(--font-inter), system-ui, sans-serif"
    >
      ?
    </text>
  ),
};

export function RestaurantLogo({
  name,
  variant = "icon",
  className,
}: {
  name: string;
  variant?: "icon" | "banner";
  className?: string;
}) {
  const config = logos[name] ?? fallback;

  if (variant === "banner") {
    return (
      <div
        className={className}
        style={{ backgroundColor: config.bg }}
        aria-label={`${name} logo`}
      >
        <svg
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto h-full"
          role="img"
          aria-hidden
        >
          {config.icon(config.bg)}
          <text
            x="200"
            y="365"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontWeight="900"
            fontSize="56"
            fontFamily="var(--font-inter), system-ui, sans-serif"
            letterSpacing="4"
          >
            {config.abbr}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`${name} logo`}
    >
      <rect width="400" height="400" rx="80" fill={config.bg} />
      {config.icon(config.bg)}
      <text
        x="200"
        y="365"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontWeight="900"
        fontSize="56"
        fontFamily="var(--font-inter), system-ui, sans-serif"
        letterSpacing="4"
      >
        {config.abbr}
      </text>
    </svg>
  );
}
