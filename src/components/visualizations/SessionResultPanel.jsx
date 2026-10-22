import { EMOTION_COLORS } from "../../data/sampleData";
import ScoreBar from "../ui/ScoreBar";
import RiskLevelBadge from "./RiskLevelBadge";

// Combined facial + text result for a session. All values are 0..1.
function SessionResultPanel({
  dominant,
  faceNegativity,
  textNegativity,
  combinedNegativity,
  trendReport,
}) {
  const [emotionName, emotionScore] = dominant;

  return (
    <section className="rounded-lg border border-[#293535] bg-[#191e1e] p-6 md:p-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.3fr_1fr]">
        {/* Dominant emotion */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="flex h-36 w-36 items-center justify-center rounded-full border-[5px]"
            style={{ borderColor: EMOTION_COLORS[emotionName] || "#58d9d0" }}
          >
            <div className="text-center">
              <div
                className="font-serif text-2xl capitalize"
                style={{ color: EMOTION_COLORS[emotionName] || "#58d9d0" }}
              >
                {emotionName}
              </div>

              <div className="text-[8px] text-[#657675]">
                {Math.round(emotionScore * 100)}% AVG FACIAL
              </div>
            </div>
          </div>
        </div>

        {/* Trend signal */}
        <div className="flex flex-col justify-center">
          <span className="text-[8px] uppercase tracking-[1.5px] text-[#a69d36]">
            TREND SIGNAL
          </span>

          <div className="mt-3">
            <RiskLevelBadge level={trendReport.overall_risk_level} />
          </div>

          <h2 className="mt-3 font-serif text-2xl text-[#dce4e2]">
            {trendReport.negative_trend}
          </h2>

          <p className="mt-3 text-[10px] leading-5 text-[#899595]">
            {trendReport.summary}
          </p>
        </div>

        {/* Scores */}
        <div className="flex flex-col justify-center gap-5">
          <ScoreBar
            label="Facial negativity"
            value={faceNegativity}
            color="#a69db8"
          />

          <ScoreBar
            label="Text negativity"
            value={textNegativity}
            color="#e07a7a"
          />

          <ScoreBar
            label="Combined negativity"
            value={combinedNegativity}
            color="#e0b95a"
          />
        </div>
      </div>
    </section>
  );
}

export default SessionResultPanel;
