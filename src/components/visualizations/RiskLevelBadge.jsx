const styles = {
  high: "border-[#5a2f2f] bg-[#2a1717] text-[#e07a7a]",
  moderate: "border-[#4a4930] bg-[#1f1e14] text-[#e0b95a]",
  low: "border-[#29403f] bg-[#142020] text-[#58d9d0]",
  none: "border-[#293535] bg-[#151a1a] text-[#899595]",
};

// Accepts backend labels such as "High trend signal" or
// "Moderate language-negativity signal" and colours them by level.
function RiskLevelBadge({ level }) {
  const text = level || "Insufficient data";
  const key = text.toLowerCase().startsWith("high")
    ? "high"
    : text.toLowerCase().startsWith("moderate")
      ? "moderate"
      : text.toLowerCase().startsWith("low")
        ? "low"
        : "none";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wide ${styles[key]}`}
    >
      {text}
    </span>
  );
}

export default RiskLevelBadge;
