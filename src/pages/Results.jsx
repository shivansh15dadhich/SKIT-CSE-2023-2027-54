import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmotionProbabilityChart from "../components/charts/EmotionProbabilityChart";
import EmotionTimelineChart from "../components/charts/EmotionTimelineChart";
import SentimentTrendChart from "../components/charts/SentimentTrendChart";
import SessionResultPanel from "../components/visualizations/SessionResultPanel";
import { useSession } from "../context/SessionContext";
import { sampleFacialTimeline, sampleTextEntries } from "../data/sampleData";
import useTrendReport from "../hooks/useTrendReport";
import {
  averageEmotionScores,
  dominantEmotion,
  facialNegativity,
} from "../services/analysisService";

function Results() {
  const { facialSamples, textEntries } = useSession();

  const usingSampleFaces = facialSamples.length === 0;
  const usingSampleText = textEntries.length === 0;

  const samples = usingSampleFaces ? sampleFacialTimeline : facialSamples;
  const entries = usingSampleText ? sampleTextEntries : textEntries;

  const { report, error } = useTrendReport(entries);

  const averageScores = averageEmotionScores(samples);
  const faceNegativity = facialNegativity(averageScores);
  const textNegativity =
    entries.reduce((sum, e) => sum + e.analysis.negative_score, 0) /
    entries.length;

  return (
    <div className="min-h-screen bg-[#111414] text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-[1000px] px-6 py-12">
        {/* =========================
            HEADER
        ========================= */}
        <section className="text-center">
          <h1 className="font-serif text-2xl text-[#dce4e2] md:text-3xl">
            Session Summary
          </h1>

          <p className="mt-2 text-[9px] text-[#657675]">
            {samples.length} facial samples · {entries.length} text entries
          </p>
        </section>

        {(usingSampleFaces || usingSampleText) && (
          <Alert variant="info" className="mt-6">
            {usingSampleFaces && usingSampleText
              ? "No session data yet, so this page shows sample data. Run a session on the Analysis page to see your own results."
              : usingSampleFaces
                ? "No facial frames were captured in this session, so facial results use sample data."
                : "No text entries were added in this session, so text results use sample data."}
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mt-6">
            {error}
          </Alert>
        )}

        {/* =========================
            MAIN RESULT
        ========================= */}
        <div className="mt-6">
          {report ? (
            <SessionResultPanel
              dominant={dominantEmotion(averageScores)}
              faceNegativity={faceNegativity}
              textNegativity={textNegativity}
              combinedNegativity={(faceNegativity + textNegativity) / 2}
              trendReport={report}
            />
          ) : (
            <div className="h-48 animate-pulse rounded-lg border border-[#293535] bg-[#191e1e]" />
          )}
        </div>

        {/* =========================
            CHARTS
        ========================= */}
        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Average Facial Emotion" icon="◉">
            <EmotionProbabilityChart scores={averageScores} height={220} />
          </Card>

          <Card title="Emotion Timeline" icon="∿">
            <EmotionTimelineChart samples={samples} />
          </Card>
        </section>

        <Card title="Text Sentiment Trend" icon="✎" className="mt-4">
          <SentimentTrendChart entries={entries} />
        </Card>

        {/* =========================
            SUGGESTIONS
        ========================= */}
        {report && (
          <section className="mt-4 rounded-md border border-[#293535] bg-[#191e1e] p-5">
            <div className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#203635] text-[#58d9d0]">
                ✣
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#dce4e2]">
                  Suggested next steps
                </h3>

                <ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] leading-5 text-[#899595]">
                  {report.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        <p className="mt-5 text-center text-[8px] leading-4 text-[#657675]">
          MindSense is a non-clinical screening tool. These results show
          emotional trend signals and are not a diagnosis of anxiety,
          depression or any other condition.
        </p>

        {/* =========================
            ACTION BUTTONS
        ========================= */}
        <section className="mt-7 flex flex-wrap items-center justify-center gap-3 print:hidden">
          <Button to="/analysis" variant="secondary" size="sm">
            ↻ Retake Analysis
          </Button>

          <Button to="/dashboard" variant="secondary" size="sm">
            View Trends
          </Button>

          <Button size="sm" onClick={() => window.print()}>
            ↓ Download Report
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Results;
