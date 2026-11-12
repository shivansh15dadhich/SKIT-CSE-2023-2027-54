
"""Evaluate BERT and RoBERTa on the same sentiment dataset.

Outputs:
- CSV file with predictions and confidence scores
- Accuracy, precision, recall and F1-score
- Confusion matrix
- Inference time for each model

Neutral examples are evaluated separately because both checkpoints
are binary sentiment classifiers.
"""

import csv
import time
from pathlib import Path

from transformers import pipeline


MODELS = {
    "BERT": "textattack/bert-base-uncased-SST-2",
    "RoBERTa": "siebert/sentiment-roberta-large-english",
}

# category, expected_label, text
# expected_label must be positive, negative, or None.
# None means the sentence is neutral/ambiguous and is excluded
# from binary classification metrics.
SAMPLES = [
    ("clear_positive", "positive", "I had a wonderful day and feel happy."),
    ("clear_positive", "positive", "I am grateful for all the support I received."),
    ("clear_positive", "positive", "Today was productive and enjoyable."),
    ("clear_positive", "positive", "I feel confident about my future."),
    ("clear_positive", "positive", "Spending time with my friends made me smile."),
    ("clear_positive", "positive", "I am excited about my new opportunity."),
    ("clear_positive", "positive", "Everything went better than I expected."),
    ("clear_positive", "positive", "I feel peaceful and satisfied today."),
    ("clear_positive", "positive", "I successfully completed my goals."),
    ("clear_positive", "positive", "I am proud of my progress."),

    ("clear_negative", "negative", "I feel sad and overwhelmed lately."),
    ("clear_negative", "negative", "Nothing seems to be going right today."),
    ("clear_negative", "negative", "I am disappointed with the result."),
    ("clear_negative", "negative", "I feel lonely and exhausted."),
    ("clear_negative", "negative", "The situation made me very upset."),
    ("clear_negative", "negative", "I am frustrated with my performance."),
    ("clear_negative", "negative", "I had a terrible and stressful day."),
    ("clear_negative", "negative", "I regret the decision I made."),
    ("clear_negative", "negative", "I feel hopeless about this result."),
    ("clear_negative", "negative", "I am unhappy with how things turned out."),

    ("negation", "positive", "I am not unhappy with how things went."),
    ("negation", "negative", "I do not feel happy about this situation."),
    ("mixed", "positive", "I am happy about my success but worried about tomorrow."),
    ("mixed", "negative", "I achieved my goal but feel disappointed and stressed."),
    ("mixed", "positive", "I was nervous at first, but I enjoyed the experience."),

    ("neutral", None, "I attended classes and completed my assignments."),
    ("neutral", None, "The meeting is scheduled for Monday morning."),
    ("neutral", None, "I travelled to college by bus today."),
    ("neutral", None, "I submitted the project before the deadline."),
    ("neutral", None, "The library closes at six in the evening."),
]


OUTPUT_FILE = Path("transformer_evaluation_results.csv")


def normalize_label(model_name, raw_label):
    """Convert checkpoint-specific labels into positive/negative."""

    label = raw_label.strip().upper()

    if label in ("POSITIVE", "LABEL_1"):
        return "positive"

    if label in ("NEGATIVE", "LABEL_0"):
        return "negative"

    raise ValueError(
        f"Unknown label from {model_name}: {raw_label}"
    )


def calculate_metrics(actual, predicted):
    """Calculate binary classification metrics without extra packages."""

    tp = sum(
        a == "positive" and p == "positive"
        for a, p in zip(actual, predicted)
    )
    tn = sum(
        a == "negative" and p == "negative"
        for a, p in zip(actual, predicted)
    )
    fp = sum(
        a == "negative" and p == "positive"
        for a, p in zip(actual, predicted)
    )
    fn = sum(
        a == "positive" and p == "negative"
        for a, p in zip(actual, predicted)
    )

    total = len(actual)

    accuracy = (tp + tn) / total if total else 0
    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall)
        else 0
    )

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "true_positive": tp,
        "true_negative": tn,
        "false_positive": fp,
        "false_negative": fn,
    }


def main():
    all_results = []
    model_summaries = []

    for model_name, checkpoint in MODELS.items():
        print(f"\n{'=' * 65}")
        print(f"Model: {model_name}")
        print(f"Checkpoint: {checkpoint}")

        try:
            classifier = pipeline(
                "sentiment-analysis",
                model=checkpoint,
                tokenizer=checkpoint,
            )

            texts = [sample[2] for sample in SAMPLES]

            start = time.perf_counter()
            predictions = classifier(texts, truncation=True)
            elapsed = time.perf_counter() - start

            actual = []
            predicted = []

            for (category, expected, text), result in zip(
                SAMPLES, predictions
            ):
                predicted_label = normalize_label(
                    model_name, result["label"]
                )
                confidence = float(result["score"])

                row = {
                    "model": model_name,
                    "category": category,
                    "text": text,
                    "expected_label": expected or "not_applicable",
                    "predicted_label": predicted_label,
                    "confidence": round(confidence, 4),
                }

                all_results.append(row)

                print(row)

                # Neutral/ambiguous samples are not included in
                # binary positive/negative classification metrics.
                if expected is not None:
                    actual.append(expected)
                    predicted.append(predicted_label)

            metrics = calculate_metrics(actual, predicted)

            summary = {
                "model": model_name,
                "checkpoint": checkpoint,
                "inference_time_seconds": round(elapsed, 3),
                "evaluated_samples": len(actual),
                **metrics,
            }

            model_summaries.append(summary)

            print("\nEvaluation metrics:")
            for key, value in metrics.items():
                if isinstance(value, float):
                    print(f"{key}: {value:.4f}")
                else:
                    print(f"{key}: {value}")

            print(f"Inference time: {elapsed:.3f} seconds")

        except Exception as exc:
            print(
                f"Model failed: {type(exc).__name__}: {exc}"
            )

    if all_results:
        with OUTPUT_FILE.open(
            "w", newline="", encoding="utf-8"
        ) as file:
            writer = csv.DictWriter(
                file, fieldnames=all_results[0].keys()
            )
            writer.writeheader()
            writer.writerows(all_results)

        print(f"\nResults saved to: {OUTPUT_FILE.resolve()}")

    if model_summaries:
        print("\n" + "=" * 65)
        print("FINAL MODEL COMPARISON")

        for summary in model_summaries:
            print(summary)

        summary_file = Path("transformer_model_summary.csv")

        with summary_file.open(
            "w", newline="", encoding="utf-8"
        ) as file:
            writer = csv.DictWriter(
                file, fieldnames=model_summaries[0].keys()
            )
            writer.writeheader()
            writer.writerows(model_summaries)

        print(f"Summary saved to: {summary_file.resolve()}")


if __name__ == "__main__":
    main()
