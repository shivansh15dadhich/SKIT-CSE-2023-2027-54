function Footer() {
  return (
    <footer className="w-full border-t border-[#202929] bg-[#101313]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#58d9d0]">◉</span>

          <span className="text-[10px] font-semibold text-[#58d9d0]">
            MindSense
          </span>

          <span className="text-[8px] text-[#596463]">
            © 2026 MindSense. Soft Clinical Minimalism.
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-5 text-[8px] text-[#697473]">
          <a href="#" className="transition-colors hover:text-[#58d9d0]">
            Privacy Policy
          </a>

          <a href="#" className="transition-colors hover:text-[#58d9d0]">
            Terms of Service
          </a>

          <a href="#" className="transition-colors hover:text-[#58d9d0]">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
