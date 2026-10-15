import Navbar from "../components/Navbar";
import FeatureCard from "../components/FeatureCard";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
function Home() {
  return (
    <div className="min-h-screen bg-[#111414] text-white">
      <Navbar />

      {/* =========================
          HERO SECTION
      ========================= */}
      <section className="flex flex-col items-center px-6 pt-16 pb-20">
        {/* Hero Content */}
        <div className="max-w-3xl text-center">
          <h1 className="font-serif text-5xl font-medium leading-[1.08] tracking-[-1.5px] text-[#dce4e2] md:text-6xl">
            Your face and voice reveal
            <br />
            what words cannot.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-xs leading-6 text-[#899595] md:text-sm">
            A digital sanctuary designed to decode emotional nuances through
            high-precision bio-signature analysis. Experience compassionate
            mental healthcare guided by technology.
          </p>

          {/* Buttons */}
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link
              to="/analysis"
              className="rounded-full border border-[#58d9d0] bg-[#58d9d0] px-6 py-3 text-[11px] font-semibold text-[#102020] transition-transform hover:-translate-y-0.5"
            >
              Start Analysis
            </Link>

            <button className="rounded-full border border-[#29403f] bg-transparent px-6 py-3 text-[11px] font-semibold text-[#9ca9a8] transition-all hover:border-[#58d9d0] hover:text-[#58d9d0]">
              View Demo
            </button>
          </div>
        </div>

        {/* Visualization */}
        <div className="relative mt-16 h-[300px] w-full max-w-[850px] overflow-hidden rounded-lg border border-[#293535] bg-[#191e1e]">
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <div className="mb-3 text-2xl text-[#58d9d0]">✣</div>

            <span className="text-[8px] tracking-[1.5px] text-[#657675]">
              REAL-TIME EMOTIONAL MAPPING
            </span>
          </div>

          <div className="absolute bottom-[-45px] left-1/2 flex -translate-x-1/2 items-end gap-2">
            <span className="h-11 w-[70px] rounded-t-full bg-[#2a5b59]/35" />
            <span className="h-16 w-[70px] rounded-t-full bg-[#2a5b59]/35" />
            <span className="h-[85px] w-[70px] rounded-t-full bg-[#2a5b59]/35" />
            <span className="h-[85px] w-[70px] rounded-t-full bg-[#2a5b59]/35" />
            <span className="h-16 w-[70px] rounded-t-full bg-[#2a5b59]/35" />
            <span className="h-11 w-[70px] rounded-t-full bg-[#2a5b59]/35" />
          </div>
        </div>

        {/* =========================
            HOW MINDSENSE WORKS
        ========================= */}
        <section className="mt-24 w-full max-w-[850px]">
          <div className="text-center">
            <h2 className="font-serif text-2xl text-[#dce4e2]">
              How MindSense Works
            </h2>

            <div className="mx-auto mt-3 h-px w-12 bg-[#58d9d0]" />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FeatureCard
              icon="◉"
              title="Visual Biometrics"
              description="Our facial AI analyzes micro-expressions and subtle movements to identify possible emotional shifts with clinical-level accuracy."
            />

            <FeatureCard
              icon="♧"
              title="Vocal Prosody"
              description="By analyzing pitch, tone, and rhythmic patterns, we uncover psychological states often hidden in spoken language."
            />

            <FeatureCard
              icon="▣"
              title="Deep Analysis"
              description="Combined data points create a comprehensive emotional profile, offering actionable insights for personal growth."
            />
          </div>
        </section>

        {/* =========================
            BOTTOM CTA
        ========================= */}
        <section className="mt-20 w-full max-w-[850px]">
          <div className="rounded-xl border border-[#293535] bg-[#1a1e1e] px-6 py-12 text-center">
            <h2 className="font-serif text-2xl text-[#dce4e2]">
              Ready to explore your inner landscape?
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-xs leading-5 text-[#899595]">
              Join thousands of others using MindSense to achieve higher
              emotional intelligence and well-being.
            </p>

            <button className="mt-6 rounded-full border border-[#58d9d0] bg-[#58d9d0] px-7 py-3 text-[11px] font-semibold text-[#102020] transition-transform hover:-translate-y-0.5">
              Create Your Account
            </button>
          </div>
        </section>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
