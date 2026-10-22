const variants = {
  error: "border-red-900/50 bg-red-950/20 text-red-300",
  warning: "border-[#4a4930] bg-[#1f1e14] text-[#d8cf7a]",
  info: "border-[#29403f] bg-[#142020] text-[#8fcfc9]",
  success: "border-[#2c5a46] bg-[#122019] text-[#7fd6a8]",
};

const icons = {
  error: "✕",
  warning: "!",
  info: "i",
  success: "✓",
};

function Alert({ variant = "info", title, className = "", children }) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-md border px-4 py-3 text-[10px] leading-5 ${variants[variant]} ${className}`}
    >
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[8px] font-bold">
        {icons[variant]}
      </span>

      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "opacity-80" : ""}>{children}</div>
      </div>
    </div>
  );
}

export default Alert;
