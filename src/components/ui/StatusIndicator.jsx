const tones = {
  active: { dot: "animate-pulse bg-[#58d9d0]", text: "text-[#58d9d0]" },
  idle: { dot: "bg-[#657675]", text: "text-[#899595]" },
  warning: { dot: "bg-[#e0b95a]", text: "text-[#e0b95a]" },
  error: { dot: "bg-red-400", text: "text-red-300" },
};

// Small dot + label, e.g. camera / microphone / service status.
function StatusIndicator({ status = "idle", label, className = "" }) {
  const tone = tones[status] || tones.idle;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-[#101414]/80 px-2 py-1 ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />

      <span className={`text-[8px] tracking-wide ${tone.text}`}>{label}</span>
    </span>
  );
}

export default StatusIndicator;
