
import unittest

from nlp_pipeline import analyze_text
from trend_engine import build_trend_report


class NLPPipelineTests(unittest.TestCase):

    def test_empty_text(self):
        result = analyze_text("")

        self.assertEqual(result["sentiment_label"], "neutral")
        self.assertEqual(result["token_count"], 0)
        self.assertEqual(result["risk_level"], "Insufficient text")
        self.assertEqual(result["neutral_score"], 1.0)

    def test_negative_text(self):
        result = analyze_text("I feel sad and overwhelmed lately.")

        self.assertEqual(result["sentiment_label"], "negative")
        self.assertGreater(result["negative_score"], 0)

    def test_positive_text(self):
        result = analyze_text("I am very happy and excited today.")

        self.assertEqual(result["sentiment_label"], "positive")
        self.assertGreater(result["positive_score"], 0)

    def test_neutral_score_range(self):
        result = analyze_text("Today is a normal day.")

        self.assertGreaterEqual(result["neutral_score"], 0.0)
        self.assertLessEqual(result["neutral_score"], 1.0)

    def test_required_output_fields(self):
        result = analyze_text("I feel good today.")

        required_fields = [
            "clean_text",
            "sentiment_label",
            "vader_compound",
            "negative_score",
            "neutral_score",
            "positive_score",
            "language_negativity_signal",
            "negative_word_ratio",
            "positive_word_ratio",
            "token_count",
            "transformer_used",
            "risk_level",
            "analysis_method",
        ]

        for field in required_fields:
            self.assertIn(field, result)

    def test_nlp_output_compatible_with_trend_engine(self):
        texts = [
            "I feel happy today.",
            "I feel sad and stressed.",
            "I am feeling overwhelmed.",
        ]

        rows = [analyze_text(text) for text in texts]

        report = build_trend_report(rows)

        self.assertEqual(report["entry_count"], len(texts))
        self.assertIn("overall_risk_level", report)
        self.assertIn("negative_trend", report)
        self.assertIn("suggestions", report)


if __name__ == "__main__":
    unittest.main()
