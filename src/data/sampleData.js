// Sample payloads used until the frontend is connected to the backend.
// Every object below mirrors a real backend contract so the components can
// switch to live data without changes:
//   - facial affect:  ai/computer_vision/affect_output.py (schema 1.0)
//   - text analysis:  POST /analyze  -> nlp_pipeline.analyze_text()
//   - trend report:   POST /trend    -> trend_engine.build_trend_report()

export const EMOTION_NAMES = [
  "angry",
  "disgust",
  "fear",
  "happy",
  "sad",
  "surprise",
  "neutral",
];

export const EMOTION_COLORS = {
  angry: "#e07a7a",
  disgust: "#9fae5f",
  fear: "#a69db8",
  happy: "#58d9d0",
  sad: "#6d8fd6",
  surprise: "#e0b95a",
  neutral: "#899595",
};

function facialAffect(timestamp, scores) {
  const dominant = Object.entries(scores).reduce((best, entry) =>
    entry[1] > best[1] ? entry : best,
  )[0];

  return {
    schema_version: "1.0",
    timestamp_utc: timestamp,
    face_detected: true,
    emotion: { dominant, scores },
    geometry: {
      left_ear: 0.29,
      right_ear: 0.3,
      average_ear: 0.295,
      mouth_ratio: 0.32,
      eyebrow_distance: 0.18,
    },
    feature_vector: [0.29, 0.3, 0.295, 0.32, 0.18],
  };
}

// One facial affect sample roughly every 2 seconds of a session.
export const sampleFacialTimeline = [
  facialAffect("2026-10-22T10:00:00Z", { angry: 0.03, disgust: 0.01, fear: 0.06, happy: 0.12, sad: 0.14, surprise: 0.04, neutral: 0.6 }),
  facialAffect("2026-10-22T10:00:02Z", { angry: 0.02, disgust: 0.01, fear: 0.08, happy: 0.1, sad: 0.19, surprise: 0.03, neutral: 0.57 }),
  facialAffect("2026-10-22T10:00:04Z", { angry: 0.04, disgust: 0.02, fear: 0.11, happy: 0.07, sad: 0.27, surprise: 0.03, neutral: 0.46 }),
  facialAffect("2026-10-22T10:00:06Z", { angry: 0.05, disgust: 0.02, fear: 0.13, happy: 0.05, sad: 0.36, surprise: 0.02, neutral: 0.37 }),
  facialAffect("2026-10-22T10:00:08Z", { angry: 0.04, disgust: 0.01, fear: 0.12, happy: 0.06, sad: 0.33, surprise: 0.02, neutral: 0.42 }),
  facialAffect("2026-10-22T10:00:10Z", { angry: 0.03, disgust: 0.01, fear: 0.09, happy: 0.14, sad: 0.22, surprise: 0.05, neutral: 0.46 }),
  facialAffect("2026-10-22T10:00:12Z", { angry: 0.02, disgust: 0.01, fear: 0.07, happy: 0.21, sad: 0.16, surprise: 0.06, neutral: 0.47 }),
  facialAffect("2026-10-22T10:00:14Z", { angry: 0.03, disgust: 0.01, fear: 0.08, happy: 0.17, sad: 0.2, surprise: 0.04, neutral: 0.47 }),
];

// sample_data.json entries with the fields returned by POST /analyze.
export const sampleTextEntries = [
  {
    date: "2026-09-25",
    text: "Today was busy but I felt productive and happy.",
    analysis: {
      clean_text: "Today was busy but I felt productive and happy.",
      sentiment_label: "positive",
      vader_compound: 0.7184,
      negative_score: 0.0,
      positive_score: 0.6338,
      negative_word_ratio: 0.0,
      positive_word_ratio: 0.2222,
      token_count: 9,
      transformer_used: false,
      risk_level: "Low language-negativity signal",
    },
  },
  {
    date: "2026-09-27",
    text: "Work was stressful and I felt tired after the day.",
    analysis: {
      clean_text: "Work was stressful and I felt tired after the day.",
      sentiment_label: "negative",
      vader_compound: -0.6124,
      negative_score: 0.5737,
      positive_score: 0.0,
      negative_word_ratio: 0.2,
      positive_word_ratio: 0.0,
      token_count: 10,
      transformer_used: false,
      risk_level: "Moderate language-negativity signal",
    },
  },
  {
    date: "2026-09-29",
    text: "I have been feeling down and overwhelmed lately.",
    analysis: {
      clean_text: "I have been feeling down and overwhelmed lately.",
      sentiment_label: "negative",
      vader_compound: -0.5106,
      negative_score: 0.5595,
      positive_score: 0.0,
      negative_word_ratio: 0.25,
      positive_word_ratio: 0.0,
      token_count: 8,
      transformer_used: false,
      risk_level: "Moderate language-negativity signal",
    },
  },
  {
    date: "2026-10-01",
    text: "I feel lonely and worried about many things.",
    analysis: {
      clean_text: "I feel lonely and worried about many things.",
      sentiment_label: "negative",
      vader_compound: -0.6705,
      negative_score: 0.6534,
      positive_score: 0.0,
      negative_word_ratio: 0.25,
      positive_word_ratio: 0.0,
      token_count: 8,
      transformer_used: false,
      risk_level: "Moderate language-negativity signal",
    },
  },
];

// Output of POST /trend for sampleTextEntries.
export const sampleTrendReport = {
  overall_risk_level: "High trend signal",
  negative_trend: "Increasing negative-language trend",
  recent_negative_rate: 1.0,
  slope: 0.1876,
  summary:
    "Recent entries show a sustained increase or persistence in negative language. This is a trend signal from text only and is not a diagnosis.",
  suggestions: [
    "Consider talking with a trusted person about how things have been going.",
    "Review sleep, routine, workload, and social connection patterns.",
    "If the pattern continues or feels difficult to manage, consider speaking with a qualified professional.",
  ],
};
