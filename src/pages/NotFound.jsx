import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#111414] text-white">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="text-[8px] tracking-[1.5px] text-[#657675]">
          ERROR 404
        </span>

        <h1 className="mt-3 font-serif text-3xl text-[#dce4e2]">
          Page not found
        </h1>

        <p className="mt-3 max-w-sm text-xs leading-5 text-[#899595]">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          to="/"
          className="mt-7 rounded-full border border-[#58d9d0] bg-[#58d9d0] px-6 py-3 text-[11px] font-semibold text-[#102020] transition-transform hover:-translate-y-0.5"
        >
          Back to Home
        </Link>
      </main>

      <Footer />
    </div>
  );
}

export default NotFound;
