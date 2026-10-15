import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Results() {
  return (
    <div className="min-h-screen bg-[#111414] text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-[1000px] px-6 py-12">
        {/* =========================
            HEADER
        ========================= */}
        <section className="text-center">
          <h1 className="font-serif text-2xl text-[#dce4e2] md:text-3xl">
            Analysis Complete
          </h1>

          <p className="mt-2 text-[9px] text-[#657675]">
            Your session data has been processed using clinical-grade AI.
          </p>
        </section>

        {/* =========================
            MAIN RESULT
        ========================= */}
        <section className="mt-8 rounded-lg border border-[#4a4930] bg-[#191e1e] p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.3fr_1fr]">
            {/* Confidence */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[5px] border-[#58d9d0]">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-[#58d9d0]">
                    85%
                  </div>

                  <div className="text-[8px] text-[#657675]">CONFIDENCE</div>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="flex flex-col justify-center">
              <span className="text-[8px] uppercase tracking-[1.5px] text-[#a69d36]">
                DETECTION STATUS
              </span>

              <h2 className="mt-3 font-serif text-3xl text-[#dce4e2]">
                Mild Anxiety
                <br />
                Detected
              </h2>

              <p className="mt-4 text-[10px] leading-5 text-[#899595]">
                Based on the subtle micro-expressions and tonal shifts in your
                vocal pattern, our system has identified markers consistent with
                mild psychological arousal. This state often correlates with
                situational stress rather than chronic clinical concern.
              </p>
            </div>

            {/* Scores */}
            <div className="flex flex-col justify-center gap-5">
              {/* Face */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-[#657675]">FACE SCORE</span>

                  <span className="text-xs text-[#dce4e2]">
                    78<span className="text-[7px]"> /100</span>
                  </span>
                </div>

                <div className="mt-2 h-1 w-full rounded-full bg-[#293535]">
                  <div className="h-full w-[78%] rounded-full bg-[#58d9d0]" />
                </div>
              </div>

              {/* Voice */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-[#657675]">VOICE SCORE</span>

                  <span className="text-xs text-[#dce4e2]">
                    92<span className="text-[7px]"> /100</span>
                  </span>
                </div>

                <div className="mt-2 h-1 w-full rounded-full bg-[#293535]">
                  <div className="h-full w-[92%] rounded-full bg-[#58d9d0]" />
                </div>
              </div>

              {/* Combined */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-[#657675]">
                    COMBINED SCORE
                  </span>

                  <span className="text-xs text-[#dce4e2]">
                    85<span className="text-[7px]"> /100</span>
                  </span>
                </div>

                <div className="mt-2 h-1 w-full rounded-full bg-[#293535]">
                  <div className="h-full w-[85%] rounded-full bg-[#58d9d0]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            CLINICAL INSIGHTS
        ========================= */}
        <section className="mt-5 rounded-md border border-[#293535] bg-[#191e1e] p-5">
          <div className="flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#203635] text-[#58d9d0]">
              ✣
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#dce4e2]">
                AI Clinical Insights
              </h3>

              <p className="mt-2 text-[9px] leading-5 text-[#899595]">
                The analysis suggests your current physiological state is likely
                reactive to environmental factors. We recommend a 5-minute
                breathing exercise to recalibrate your baseline. Your "Voice
                Score" indicates strong expressive clarity, while the "Face
                Score" noted minor micro-expression markers.
              </p>
            </div>
          </div>
        </section>

        {/* =========================
            ACTION BUTTONS
        ========================= */}
        <section className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button className="rounded-full border border-[#29403f] bg-transparent px-6 py-2.5 text-[10px] font-semibold text-[#9ca9a8] transition-all hover:border-[#58d9d0] hover:text-[#58d9d0]">
            ↻ Retake Analysis
          </button>

          <button className="rounded-full border border-[#58d9d0] bg-[#58d9d0] px-6 py-2.5 text-[10px] font-semibold text-[#102020] transition-transform hover:-translate-y-0.5">
            ↓ Download Report
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Results;
