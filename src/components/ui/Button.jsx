import { Link } from "react-router-dom";

const variants = {
  primary:
    "border-[#58d9d0] bg-[#58d9d0] text-[#102020] hover:-translate-y-0.5",
  secondary:
    "border-[#29403f] bg-transparent text-[#9ca9a8] hover:border-[#58d9d0] hover:text-[#58d9d0]",
  danger:
    "border-[#29403f] bg-transparent text-[#9ca9a8] hover:border-red-400 hover:text-red-300",
};

const sizes = {
  sm: "px-5 py-2 text-[10px]",
  md: "px-7 py-3 text-xs",
};

// Shared pill button. Pass `to` to render a router link instead of a button.
function Button({
  to,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
