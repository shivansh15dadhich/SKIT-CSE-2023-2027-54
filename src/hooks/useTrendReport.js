import { useEffect, useState } from "react";
import { buildTrendReport } from "../services/analysisService";

// Loads the trend report for a list of text entries. Async so it can be
// switched to POST /trend without changing the pages that use it.
export default function useTrendReport(entries) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    buildTrendReport(entries)
      .then((result) => {
        if (!cancelled) {
          setReport(result);
          setError("");
        }
      })
      .catch((err) => {
        console.error("Trend report error:", err);
        if (!cancelled) setError("Could not load the trend report.");
      });

    return () => {
      cancelled = true;
    };
  }, [entries]);

  return { report, error };
}
