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

const logos: Record<string, LogoConfig> = {
  "Slice Society": { bg: "#E63946", abbr: "SS", icon: pizzaIcon },
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
