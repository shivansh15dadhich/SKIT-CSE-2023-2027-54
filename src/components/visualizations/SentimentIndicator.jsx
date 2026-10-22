import ScoreBar from "../ui/ScoreBar";
import RiskLevelBadge from "./RiskLevelBadge";

const labelColors = {
  positive: "#58d9d0",
  neutral: "#899595",
  negative: "#e07a7a",
};

// Shows one POST /analyze result: label, compound gauge and scores.
function SentimentIndicator({ analysis }) {
  if (!analysis) {
    return (
      <div className="rounded-md border border-[#293535] bg-[#151a1a] p-4 text-center text-[9px] text-[#657675]">
        Write a short entry and analyse it to see the sentiment.
      </div>
    );
  }

  // vader_compound is -1..1; map to 0..100% for the marker position.
  const markerPosition = ((analysis.vader_compound + 1) / 2) * 100;
  const color = labelColors[analysis.sentiment_label] || "#899595";

  return (
    <div className="space-y-4 rounded-md border border-[#293535] bg-[#151a1a] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[8px] tracking-wide text-[#657675]">SENTIMENT</p>

          <p className="font-serif text-xl capitalize" style={{ color }}>
            {analysis.sentiment_label}
          </p>
        </div>

        <RiskLevelBadge level={analysis.risk_level} />
      </div>

      {/* Compound gauge */}
      <div>
        <div className="relative h-1.5 rounded-full bg-gradient-to-r from-[#e07a7a] via-[#3a4645] to-[#58d9d0]">
          <span
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#101414] bg-[#dce4e2] transition-[left] duration-500"
            style={{ left: `${markerPosition}%` }}
          />
        </div>

        <div className="mt-1.5 flex justify-between text-[7px] text-[#657675]">
          <span>NEGATIVE</span>
          <span>COMPOUND {analysis.vader_compound.toFixed(2)}</span>
          <span>POSITIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ScoreBar
          label="Negative score"
          value={analysis.negative_score}
          color="#e07a7a"
        />

        <ScoreBar label="Positive score" value={analysis.positive_score} />
      </div>
    </div>
  );
}

export default SentimentIndicator;
