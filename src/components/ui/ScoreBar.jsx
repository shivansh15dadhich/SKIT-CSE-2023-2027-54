// Horizontal probability / score bar. `value` is 0..1.
function ScoreBar({ label, value, color = "#58d9d0", suffix = "%" }) {
  const percent = Math.round(Math.min(1, Math.max(0, value || 0)) * 100);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-wide text-[#657675]">
          {label}
        </span>

        <span className="text-[10px] text-[#dce4e2]">
          {percent}
          <span className="text-[7px] text-[#657675]">{suffix}</span>
        </span>
      </div>

      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#293535]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default ScoreBar;
