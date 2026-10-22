import unittest

from trend_engine import build_trend_report, _linear_slope


class TrendEngineTests(unittest.TestCase):
    def test_empty_rows(self):
        report = build_trend_report([])
        self.assertEqual(report["entry_count"], 0)
        self.assertEqual(report["overall_risk_level"], "Insufficient data")

    def test_slope_increases(self):
        self.assertGreater(_linear_slope([0.1, 0.3, 0.6]), 0)

    def test_slope_decreases(self):
        self.assertLess(_linear_slope([0.7, 0.4, 0.2]), 0)

    def test_report_has_compatibility_keys(self):
        report = build_trend_report([
            {"negative_score": 0.1, "sentiment_label": "positive"},
            {"negative_score": 0.2, "sentiment_label": "neutral"},
        ])
        self.assertIn("overall_risk_level", report)
        self.assertIn("negative_trend", report)
        self.assertIn("suggestions", report)
        self.assertEqual(report["entry_count"], 2)


if __name__ == "__main__":
    unittest.main()
