
"""Compare contextual sentiment models on the same text samples."""

import time
from transformers import pipeline

MODELS = {
    "BERT": "textattack/bert-base-uncased-SST-2",
    "RoBERTa": "siebert/sentiment-roberta-large-english",
}

SAMPLES = [
    ("positive", "I had a wonderful day and feel happy."),
    ("negative", "I feel sad and overwhelmed lately."),
    ("neutral", "I attended classes and completed my assignments."),
    ("mixed", "I am happy about my success but worried about tomorrow."),
    ("negation", "I am not unhappy with how things went."),
]


def main():
    for model_name, checkpoint in MODELS.items():
        print(f"\n{'=' * 60}\nModel: {model_name}\nCheckpoint: {checkpoint}")

        try:
            classifier = pipeline(
                "sentiment-analysis",
                model=checkpoint,
                tokenizer=checkpoint,
            )
            start = time.perf_counter()

            predictions = classifier(
                [text for _, text in SAMPLES],
                truncation=True,
            )
            elapsed = time.perf_counter() - start

            for (expected, text), prediction in zip(SAMPLES, predictions):
                print({
                    "expected_context": expected,
                    "text": text,
                    "predicted_label": prediction["label"],
                    "confidence": round(float(prediction["score"]), 4),
                })

            print(f"Batch inference time: {elapsed:.3f} seconds")

        except Exception as exc:
            print(f"Model failed to load or run: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    main()
