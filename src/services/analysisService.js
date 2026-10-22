import { EMOTION_NAMES } from "../data/sampleData";

// Frontend stand-in for the NLP API until the dashboard is connected to
// FastAPI. analyzeText() returns the same shape as POST /analyze so callers
// will not change when this is replaced with a real request.

const NEGATIVE_TERMS = new Set([
  "sad", "down", "tired", "lonely", "alone", "worried", "worry", "anxious",
  "stressed", "stressful", "overwhelmed", "hopeless", "afraid", "scared",
  "angry", "upset", "bad", "awful", "terrible", "exhausted", "cry", "crying",
  "hurt", "empty", "worthless", "nervous", "panic", "depressed", "miserable",
]);

const POSITIVE_TERMS = new Set([
  "happy", "good", "great", "calm", "relaxed", "productive", "grateful",
  "excited", "hopeful", "glad", "proud", "love", "peaceful", "fine",
  "better", "joy", "enjoyed", "fun", "confident", "rested",
]);

const round = (value) => Math.round(value * 10000) / 10000;

export async function analyzeText(text) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  const tokens = cleaned.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  const tokenCount = tokens.length;

  const negativeWords = tokens.filter((t) => NEGATIVE_TERMS.has(t)).length;
  const positiveWords = tokens.filter((t) => POSITIVE_TERMS.has(t)).length;
  const negativeRatio = negativeWords / Math.max(tokenCount, 1);
  const positiveRatio = positiveWords / Math.max(tokenCount, 1);

  // Approximates the VADER compound score in the range -1..1.
  const raw = positiveWords - negativeWords;
  const compound = raw / Math.sqrt(raw * raw + 4);

  let sentimentLabel = "neutral";
  if (compound <= -0.05) sentimentLabel = "negative";
  else if (compound >= 0.05) sentimentLabel = "positive";

  const negativeScore = Math.min(
    1,
    0.9 * Math.max(0, -compound) + 0.1 * Math.min(negativeRatio * 8, 1),
  );
  const positiveScore = Math.min(
    1,
    0.8 * Math.max(0, compound) + 0.2 * Math.min(positiveRatio * 8, 1),
  );

  let riskLevel = "Low language-negativity signal";
  if (negativeScore >= 0.65) riskLevel = "High language-negativity signal";
  else if (negativeScore >= 0.35) riskLevel = "Moderate language-negativity signal";

  return {
    clean_text: cleaned,
    sentiment_label: sentimentLabel,
    vader_compound: round(compound),
    negative_score: round(negativeScore),
    positive_score: round(positiveScore),
    negative_word_ratio: round(negativeRatio),
    positive_word_ratio: round(positiveRatio),
    token_count: tokenCount,
    transformer_used: false,
    risk_level: riskLevel,
  };
}

// Average emotion probabilities across facial affect samples.
export function averageEmotionScores(samples) {
  const detected = samples.filter((s) => s.face_detected);
  const averages = {};

  EMOTION_NAMES.forEach((name) => {
    const values = detected
      .map((s) => s.emotion.scores[name])
      .filter((v) => typeof v === "number");

    averages[name] = values.length
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : 0;
  });

  return averages;
}

export function dominantEmotion(scores) {
  return Object.entries(scores).reduce(
    (best, entry) => (entry[1] > best[1] ? entry : best),
    ["neutral", 0],
  );
}


// Port of trend_engine.build_trend_report(); stand-in for POST /trend.
export async function buildTrendReport(entries) {
  const rows = entries.map((e) => e.analysis);

  if (!rows.length) {
    return {
      overall_risk_level: "Insufficient data",
      negative_trend: "Insufficient data",
      recent_negative_rate: 0,
      slope: 0,
      summary: "No observations were supplied.",
      suggestions: ["Add more journal/message observations."],
    };
  }

  const scores = rows.map((r) => Number(r.negative_score) || 0);
  const n = scores.length;
  const xMean = (n - 1) / 2;
  const yMean = scores.reduce((sum, v) => sum + v, 0) / n;
  const numerator = scores.reduce((sum, y, i) => sum + (i - xMean) * (y - yMean), 0);
  const denominator = scores.reduce((sum, _, i) => sum + (i - xMean) ** 2, 0);
  const slope = n < 2 || !denominator ? 0 : numerator / denominator;

  const recent = scores.slice(-Math.min(3, n));
  const recentNegativeRate = recent.filter((x) => x >= 0.45).length / recent.length;

  let overall = "Low trend signal";
  if (n >= 3 && recentNegativeRate >= 0.67 && slope > 0.02) overall = "High trend signal";
  else if (recentNegativeRate >= 0.5 || slope > 0.02) overall = "Moderate trend signal";

  let trend = "Relatively stable";
  if (slope > 0.02) trend = "Increasing negative-language trend";
  else if (slope < -0.02) trend = "Improving / decreasing negative-language trend";

  const content = {
    "High trend signal": {
      summary:
        "Recent entries show a sustained increase or persistence in negative language. This is a trend signal from text only and is not a diagnosis.",
      suggestions: [
        "Consider talking with a trusted person about how things have been going.",
        "Review sleep, routine, workload, and social connection patterns.",
        "If the pattern continues or feels difficult to manage, consider speaking with a qualified professional.",
      ],
    },
    "Moderate trend signal": {
      summary:
        "The recent text contains a noticeable amount of negative language. Continue monitoring the pattern rather than relying on a single entry.",
      suggestions: [
        "Keep brief daily notes to observe whether the pattern persists.",
        "Consider a small routine-supporting activity such as walking, rest, or social connection.",
        "Reach out to someone you trust if the pattern is affecting daily life.",
      ],
    },
    "Low trend signal": {
      summary:
        "The available entries do not show a strong sustained increase in negative language.",
      suggestions: [
        "Continue occasional journaling if it helps you notice changes over time.",
        "Maintain supportive routines, sleep, activity, and social connection.",
      ],
    },
  }[overall];

  return {
    overall_risk_level: overall,
    negative_trend: trend,
    recent_negative_rate: round(recentNegativeRate),
    slope: round(slope),
    ...content,
  };
}

// Share of facial probability on negative emotions (0..1).
export function facialNegativity(scores) {
  return ["angry", "disgust", "fear", "sad"].reduce(
    (sum, name) => sum + (scores[name] || 0),
    0,
  );
}
