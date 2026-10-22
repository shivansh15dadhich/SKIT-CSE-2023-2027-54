import { useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmotionTimelineChart from "../components/charts/EmotionTimelineChart";
import SentimentTrendChart from "../components/charts/SentimentTrendChart";
import RiskLevelBadge from "../components/visualizations/RiskLevelBadge";
import { useSession } from "../context/SessionContext";
import { sampleFacialTimeline, sampleTextEntries } from "../data/sampleData";
import useTrendReport from "../hooks/useTrendReport";

const sentimentColors = {
  positive: "text-[#58d9d0]",
  neutral: "text-[#899595]",
  negative: "text-[#e07a7a]",
};

function StatTile({ label, value, detail }) {
  return (
    <div className="rounded-md border border-[#293535] bg-[#191e1e] px-5 py-4">
      <span className="text-[8px] tracking-wide text-[#657675]">{label}</span>

      <div className="mt-2 text-xl text-[#dce4e2]">{value}</div>

      {detail && <div className="mt-1 text-[8px] text-[#657675]">{detail}</div>}
    </div>
  );
}

function Dashboard() {
  const { facialSamples, textEntries } = useSession();

  // Sample history stands in for stored past sessions until the backend
  // provides them; entries from the current session are appended.
  const entries = useMemo(
    () => [...sampleTextEntries, ...textEntries],
    [textEntries],
  );
  const samples = facialSamples.length ? facialSamples : sampleFacialTimeline;

  const { report, error } = useTrendReport(entries);

  const negativeCount = entries.filter(
    (e) => e.analysis.sentiment_label === "negative",
  ).length;
  const averageNegative =
    entries.reduce((sum, e) => sum + e.analysis.negative_score, 0) /
    entries.length;

  return (
    <div className="min-h-screen bg-[#111414] text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-[1000px] px-6 py-10">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-[#dce4e2] md:text-3xl">
              Emotional Trends
            </h1>

            <p className="mt-1 text-[9px] text-[#657675]">
              Sentiment and facial emotion patterns over time
            </p>
          </div>

          <Button to="/analysis" size="sm">
            New Session
          </Button>
        </section>

        <Alert variant="info" className="mt-6">
          History uses sample entries until the backend is connected.
          {textEntries.length > 0 &&
            ` Your ${textEntries.length} entr${textEntries.length === 1 ? "y" : "ies"} from this session ${textEntries.length === 1 ? "is" : "are"} included.`}
        </Alert>

        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}

        {/* =========================
            STATS
        ========================= */}
        <section className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile label="TEXT ENTRIES" value={entries.length} />

          <StatTile
            label="NEGATIVE ENTRIES"
            value={negativeCount}
            detail={`${Math.round((negativeCount / entries.length) * 100)}% of entries`}
          />

          <StatTile
            label="AVG NEGATIVITY"
            value={`${Math.round(averageNegative * 100)}%`}
          />

          <div className="rounded-md border border-[#293535] bg-[#191e1e] px-5 py-4">
            <span className="text-[8px] tracking-wide text-[#657675]">
              TREND SIGNAL
            </span>

            <div className="mt-2">
              <RiskLevelBadge level={report?.overall_risk_level} />
            </div>

            {report && (
              <div className="mt-1.5 text-[8px] text-[#657675]">
                {report.negative_trend}
              </div>
            )}
          </div>
        </section>

        {/* =========================
            CHARTS
        ========================= */}
        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="Text Sentiment Trend" icon="✎">
            <SentimentTrendChart entries={entries} />
          </Card>

          <Card
            title="Facial Emotion Timeline"
            icon="◉"
            status={
              <span className="text-[8px] text-[#657675]">
                {facialSamples.length ? "THIS SESSION" : "SAMPLE"}
              </span>
            }
          >
            <EmotionTimelineChart samples={samples} />
          </Card>
        </section>

        {/* =========================
            ENTRIES
        ========================= */}
        <Card title="Recent Entries" icon="☰" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[10px]">
              <thead className="text-[8px] tracking-wide text-[#657675]">
                <tr className="border-b border-[#293535]">
                  <th className="py-2 pr-3 font-normal">DATE</th>
                  <th className="py-2 pr-3 font-normal">ENTRY</th>
                  <th className="py-2 pr-3 font-normal">SENTIMENT</th>
                  <th className="py-2 font-normal text-right">NEGATIVITY</th>
                </tr>
              </thead>

              <tbody>
                {[...entries].reverse().map((entry, index) => (
                  <tr
                    key={`${entry.date}-${index}`}
                    className="border-b border-[#1f2828] last:border-0"
                  >
                    <td className="py-2.5 pr-3 whitespace-nowrap text-[#899595]">
                      {entry.date}
                    </td>
                    <td className="max-w-[320px] truncate py-2.5 pr-3 text-[#dce4e2]">
                      {entry.text}
                    </td>
                    <td
                      className={`py-2.5 pr-3 capitalize ${sentimentColors[entry.analysis.sentiment_label]}`}
                    >
                      {entry.analysis.sentiment_label}
                    </td>
                    <td className="py-2.5 text-right text-[#dce4e2]">
                      {Math.round(entry.analysis.negative_score * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {report && (
          <p className="mt-4 text-[9px] leading-5 text-[#899595]">
            {report.summary}
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Dashboard;
