"""Trend aggregation for MindSense NLP observations (non-clinical)."""
from __future__ import annotations

from typing import Any, Dict, List


def _linear_slope(values: List[float]) -> float:
    """Calculate least-squares slope without requiring NumPy."""
    n = len(values)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2
    y_mean = sum(values) / n
    numerator = sum((i - x_mean) * (value - y_mean) for i, value in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    return numerator / denominator if denominator else 0.0


def build_trend_report(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Summarize ordered observations; rows should be oldest-to-newest."""
    if not rows:
        return {
            "entry_count": 0,
            "overall_risk_level": "Insufficient data",
            "negative_trend": "Insufficient data",
            "recent_negative_rate": 0.0,
            "recent_average_negative_score": 0.0,
            "slope": 0.0,
            "summary": "No observations were supplied.",
            "suggestions": ["Add at least two journal/message observations to view a trend."],
            "disclaimer": "This is a text-only, non-clinical signal and not a diagnosis.",
        }

    scores = []
    labels = []
    for row in rows:
        try:
            score = float(row.get("negative_score", 0.0))
        except (TypeError, ValueError):
            score = 0.0
        scores.append(max(0.0, min(1.0, score)))
        labels.append(str(row.get("sentiment_label", "neutral")).lower())

    slope = _linear_slope(scores)
    recent_scores = scores[-min(3, len(scores)):]
    recent_negative_rate = sum(score >= 0.45 for score in recent_scores) / len(recent_scores)
    recent_average = sum(recent_scores) / len(recent_scores)
    negative_rate = sum(label == "negative" for label in labels) / len(labels)

    # High signal can reflect persistent high recent scores OR a clear upward trend.
    if len(scores) >= 3 and recent_negative_rate >= (2 / 3) and (
        recent_average >= 0.70 or slope > 0.08
    ):
        overall = "High trend signal"
    elif recent_negative_rate >= 0.50 or recent_average >= 0.45 or slope > 0.03:
        overall = "Moderate trend signal"
    else:
        overall = "Low trend signal"

    if slope > 0.03:
        trend = "Increasing negative-language trend"
    elif slope < -0.03:
        trend = "Decreasing negative-language trend"
    else:
        trend = "Relatively stable"

    if len(rows) < 3:
        summary_prefix = (
            "This is a preliminary pattern based on a small number of entries. "
        )
    else:
        summary_prefix = ""

    if overall == "High trend signal":
        summary = summary_prefix + (
            "Recent entries show persistently high or increasing negative-language signals. "
            "This is a text-based pattern, not a mental-health assessment."
        )
        suggestions = [
            "Consider discussing how you have been feeling with someone you trust.",
            "Review recent changes in sleep, workload, routine, and social connection.",
            "If the pattern persists or affects daily life, consider speaking with a qualified professional.",
        ]
    elif overall == "Moderate trend signal":
        summary = summary_prefix + (
            "Recent entries contain a noticeable negative-language signal. "
            "Look for patterns across time rather than interpreting one entry in isolation."
        )
        suggestions = [
            "Continue journaling periodically and note context around difficult days.",
            "Consider a manageable supportive activity, such as a short walk, rest, or connecting with someone.",
            "Reach out to a trusted person if the pattern feels difficult to manage.",
        ]
    else:
        summary = summary_prefix + (
            "The available entries do not show a strong recent increase in negative-language signals. "
            "This does not establish that someone is or is not experiencing distress."
        )
        suggestions = [
            "Continue occasional journaling if it helps you reflect on changes over time.",
            "Maintain routines and social connections that you find supportive.",
        ]

    return {
        "entry_count": len(rows),
        "overall_risk_level": overall,  # Existing API/UI key retained for compatibility.
        "negative_trend": trend,
        "recent_negative_rate": round(recent_negative_rate, 4),
        "recent_average_negative_score": round(recent_average, 4),
        "overall_negative_rate": round(negative_rate, 4),
        "slope": round(slope, 4),
        "summary": summary,
        "suggestions": suggestions,
        "disclaimer": "MindSense provides non-clinical language trends only; it does not diagnose conditions.",
    }
