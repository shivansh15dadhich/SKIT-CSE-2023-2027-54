from typing import Dict, List


def _linear_slope(values: List[float]) -> float:
    """Simple least-squares slope without requiring NumPy."""
    n = len(values)
    if n < 2:
        return 0.0

    x_mean = (n - 1) / 2
    y_mean = sum(values) / n

    numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    return numerator / denominator if denominator else 0.0


def build_trend_report(rows: List[Dict]) -> Dict:
    """
    Aggregate NLP observations into a non-clinical trend signal.

    rows must contain:
      negative_score, sentiment_label, risk_level
    """
    if not rows:
        return {
            "overall_risk_level": "Insufficient data",
            "negative_trend": "Insufficient data",
            "recent_negative_rate": 0.0,
            "summary": "No observations were supplied.",
            "suggestions": ["Add more journal/message observations."],
        }

    scores = [float(r.get("negative_score", 0.0)) for r in rows]
    labels = [str(r.get("sentiment_label", "neutral")) for r in rows]

    slope = _linear_slope(scores)
    negative_count = sum(label == "negative" for label in labels)
    negative_rate = negative_count / len(labels)

    recent = scores[-min(3, len(scores)):]
    recent_negative_rate = sum(x >= 0.45 for x in recent) / len(recent)

    # Persistence matters more than one isolated negative entry.
    if len(scores) >= 3 and recent_negative_rate >= 0.67 and slope > 0.02:
        overall = "High trend signal"
    elif recent_negative_rate >= 0.50 or slope > 0.02:
        overall = "Moderate trend signal"
    else:
        overall = "Low trend signal"

    if slope > 0.02:
        trend = "Increasing negative-language trend"
    elif slope < -0.02:
        trend = "Improving / decreasing negative-language trend"
    else:
        trend = "Relatively stable"

    if overall == "High trend signal":
        summary = (
            "Recent entries show a sustained increase or persistence in negative "
            "language. This is a trend signal from text only and is not a diagnosis."
        )
        suggestions = [
            "Consider talking with a trusted person about how things have been going.",
            "Review sleep, routine, workload, and social connection patterns.",
            "If the pattern continues or feels difficult to manage, consider speaking with a qualified professional.",
        ]
    elif overall == "Moderate trend signal":
        summary = (
            "The recent text contains a noticeable amount of negative language. "
            "Continue monitoring the pattern rather than relying on a single entry."
        )
        suggestions = [
            "Keep brief daily notes to observe whether the pattern persists.",
            "Consider a small routine-supporting activity such as walking, rest, or social connection.",
            "Reach out to someone you trust if the pattern is affecting daily life.",
        ]
    else:
        summary = (
            "The available entries do not show a strong sustained increase in "
            "negative language."
        )
        suggestions = [
            "Continue occasional journaling if it helps you notice changes over time.",
            "Maintain supportive routines, sleep, activity, and social connection.",
        ]

    return {
        "overall_risk_level": overall,
        "negative_trend": trend,
        "recent_negative_rate": round(recent_negative_rate, 4),
        "slope": round(slope, 4),
        "summary": summary,
        "suggestions": suggestions,
    }
