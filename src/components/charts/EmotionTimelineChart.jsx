import { Line } from "react-chartjs-2";
import { EMOTION_COLORS } from "../../data/sampleData";
import { percentTick, tooltipStyle } from "./chartSetup";

const DEFAULT_EMOTIONS = ["neutral", "sad", "happy", "fear"];

function timeLabel(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
}

// Emotion probabilities across facial affect samples of a session.
function EmotionTimelineChart({
  samples,
  emotions = DEFAULT_EMOTIONS,
  height = 220,
}) {
  const detected = samples.filter((s) => s.face_detected);

  const data = {
    labels: detected.map((s) => timeLabel(s.timestamp_utc)),
    datasets: emotions.map((name) => ({
      label: name[0].toUpperCase() + name.slice(1),
      data: detected.map((s) => s.emotion.scores[name] ?? null),
      borderColor: EMOTION_COLORS[name],
      backgroundColor: EMOTION_COLORS[name],
      borderWidth: 2,
      pointRadius: 2,
      tension: 0.35,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${percentTick(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 1,
        ticks: { callback: percentTick, stepSize: 0.25 },
        grid: { color: "#1f2828" },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div style={{ height }}>
      <Line
        data={data}
        options={options}
        aria-label="Facial emotion timeline"
        role="img"
      />
    </div>
  );
}

export default EmotionTimelineChart;
