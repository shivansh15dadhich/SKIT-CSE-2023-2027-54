import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

ChartJS.defaults.color = "#899595";
ChartJS.defaults.font.size = 10;
ChartJS.defaults.borderColor = "#25302f";

export const tooltipStyle = {
  backgroundColor: "#101414",
  borderColor: "#29403f",
  borderWidth: 1,
  titleColor: "#dce4e2",
  bodyColor: "#899595",
  padding: 8,
};

export const percentTick = (value) => `${Math.round(value * 100)}%`;
