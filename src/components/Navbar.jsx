import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex h-16 w-full items-center justify-between border-b border-[#263333] bg-[#111414] px-5 sm:px-8">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 text-[#58d9d0]">
        <span className="text-xs">◉</span>

        <span className="text-sm font-semibold tracking-wide">MindSense</span>
      </Link>

      {/* Navigation */}
      <div className="hidden items-center gap-8 md:flex">
        <Link
          to="/"
          className="text-xs text-[#8b9695] transition-colors hover:text-[#58d9d0]"
        >
          Home
        </Link>

        <Link
          to="/analysis"
          className="text-xs text-[#8b9695] transition-colors hover:text-[#58d9d0]"
        >
          Dashboard
        </Link>

        <Link
          to="/about"
          className="text-xs text-[#8b9695] transition-colors hover:text-[#58d9d0]"
        >
          About
        </Link>
      </div>

      {/* Get Started */}
      <Link
        to="/analysis"
        className="rounded-full bg-[#58d9d0] px-4 py-2 text-[10px] font-semibold text-[#102020] transition-transform hover:-translate-y-0.5 sm:px-5 sm:text-[11px]"
      >
        Get Started
      </Link>
    </nav>
  );
}

export default Navbar;
