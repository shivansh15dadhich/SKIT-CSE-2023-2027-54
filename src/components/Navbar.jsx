import { Link, NavLink } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/analysis", label: "Analysis" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
];

const navLinkClass = ({ isActive }) =>
  `text-xs transition-colors hover:text-[#58d9d0] ${
    isActive ? "text-[#58d9d0]" : "text-[#8b9695]"
  }`;

function Navbar() {
  return (
    <nav className="w-full border-b border-[#263333] bg-[#111414]">
      <div className="flex h-16 items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-[#58d9d0]">
          <span className="text-xs">◉</span>

          <span className="text-sm font-semibold tracking-wide">MindSense</span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={navLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Get Started */}
        <Link
          to="/analysis"
          className="rounded-full bg-[#58d9d0] px-4 py-2 text-[10px] font-semibold text-[#102020] transition-transform hover:-translate-y-0.5 sm:px-5 sm:text-[11px]"
        >
          Get Started
        </Link>
      </div>

      {/* Mobile navigation */}
      <div className="flex items-center justify-center gap-6 border-t border-[#1d2626] py-2 md:hidden">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={navLinkClass}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
