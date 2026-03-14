/**
 * EkgIcon — A proper ECG/EKG waveform icon (P-QRS-T complex)
 * Accepts className and color props to match Lucide icon usage patterns.
 */
export default function EkgIcon({
  className,
  color = "currentColor",
  style,
}: {
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-label="ECG waveform"
    >
      {/* Flat baseline → P wave → return → Q dip → R spike → S dip → T wave → flat */}
      <polyline points="1,12 4,12 5,10 6,12 7,14 8,12 9,12 10,4 11,18 12,12 13,16 14,12 15,12 17,9 18,12 19,12 23,12" />
    </svg>
  );
}
