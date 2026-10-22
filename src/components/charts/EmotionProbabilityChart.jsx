import { Bar } from "react-chartjs-2";
import { EMOTION_COLORS, EMOTION_NAMES } from "../../data/sampleData";
import { percentTick, tooltipStyle } from "./chartSetup";

// Horizontal bars of the seven DeepFace emotion probabilities (0..1).
function EmotionProbabilityChart({ scores, height = 200 }) {
  const data = {
    labels: EMOTION_NAMES.map((n) => n[0].toUpperCase() + n.slice(1)),
    datasets: [
      {
        data: EMOTION_NAMES.map((n) => scores?.[n] ?? 0),
        backgroundColor: EMOTION_NAMES.map((n) => EMOTION_COLORS[n]),
        borderRadius: 4,
        barThickness: 10,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: { label: (ctx) => ` ${percentTick(ctx.parsed.x)}` },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 1,
        ticks: { callback: percentTick, stepSize: 0.25 },
        grid: { color: "#1f2828" },
      },
      y: { grid: { display: false } },
    },
  };

  return (
    <div style={{ height }}>
      <Bar
        data={data}
        options={options}
        aria-label="Facial emotion probabilities"
        role="img"
      />
    </div>
  );
}

export default EmotionProbabilityChart;
