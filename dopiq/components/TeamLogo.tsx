// A simple filled circle badge with the team's 2-3 letter abbreviation.
// Used everywhere a team is displayed — game cards, live strip, detail hero.

export function TeamLogo({
  color,
  abbr,
  size = 36,
}: {
  color: string;
  abbr: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      aria-hidden
      className="flex-none"
    >
      <circle cx="18" cy="18" r="18" fill={color} />
      <text
        x="18"
        y="19"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontWeight="800"
        fontSize={14}
        fontFamily="var(--font-inter), system-ui, sans-serif"
        letterSpacing="0.5"
      >
        {abbr}
      </text>
    </svg>
  );
}
