import { Line } from "react-chartjs-2";
import { percentTick, tooltipStyle } from "./chartSetup";

// Negative / positive language scores across text entries (POST /analyze).
function SentimentTrendChart({ entries, height = 220 }) {
  const data = {
    labels: entries.map((e, i) => e.date || `Entry ${i + 1}`),
    datasets: [
      {
        label: "Negative",
        data: entries.map((e) => e.analysis.negative_score),
        borderColor: "#e07a7a",
        backgroundColor: "rgba(224, 122, 122, 0.12)",
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.35,
      },
      {
        label: "Positive",
        data: entries.map((e) => e.analysis.positive_score),
        borderColor: "#58d9d0",
        backgroundColor: "rgba(88, 217, 208, 0.08)",
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.35,
      },
    ],
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
        aria-label="Text sentiment trend"
        role="img"
      />
    </div>
  );
}

export default SentimentTrendChart;
