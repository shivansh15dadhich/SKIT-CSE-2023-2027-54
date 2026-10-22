import { EMOTION_COLORS } from "../../data/sampleData";
import { dominantEmotion } from "../../services/analysisService";

// Dominant facial emotion for one facial affect payload (schema 1.0).
function EmotionCard({ affect }) {
  if (!affect || !affect.face_detected) {
    return (
      <div className="rounded-md border border-[#293535] bg-[#151a1a] p-4 text-center">
        <p className="text-[8px] tracking-wide text-[#657675]">
          DOMINANT EMOTION
        </p>

        <p className="mt-2 font-serif text-xl text-[#657675]">
          {affect ? "No face detected" : "--"}
        </p>
      </div>
    );
  }

  const name =
    affect.emotion.dominant || dominantEmotion(affect.emotion.scores)[0];
  const confidence = affect.emotion.scores[name] ?? 0;
  const color = EMOTION_COLORS[name] || "#58d9d0";

  return (
    <div className="rounded-md border border-[#293535] bg-[#151a1a] p-4">
      <p className="text-[8px] tracking-wide text-[#657675]">
        DOMINANT EMOTION
      </p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-serif text-2xl capitalize" style={{ color }}>
          {name}
        </p>

        <p className="text-right">
          <span className="text-lg font-semibold text-[#dce4e2]">
            {Math.round(confidence * 100)}%
          </span>
          <span className="block text-[7px] text-[#657675]">PROBABILITY</span>
        </p>
      </div>
    </div>
  );
}

export default EmotionCard;
