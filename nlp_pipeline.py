import re
from collections import Counter
from typing import Dict, List

from nltk.sentiment import SentimentIntensityAnalyzer

try:
    from transformers import pipeline as hf_pipeline
except Exception:
    hf_pipeline = None

import nltk

# Download only the small VADER lexicon if it is missing.
try:
    nltk.data.find("sentiment/vader_lexicon.zip")
except LookupError:
    nltk.download("vader_lexicon", quiet=True)

VADER = SentimentIntensityAnalyzer()
_TRANSFORMER = None

# These are intentionally framed as language signals, NOT clinical symptoms.
NEGATIVE_LANGUAGE_TERMS = {
    "sad", "sadness", "down", "upset", "angry", "anger", "lonely", "loneliness",
    "stressed", "stress", "worried", "worry", "hopeless", "helpless", "tired",
    "exhausted", "overwhelmed", "empty", "worthless", "cry", "crying", "failed",
    "failure", "isolated", "alone", "frustrated", "frustration", "bad", "terrible",
    "awful", "negative", "difficult", "hard"
}

POSITIVE_LANGUAGE_TERMS = {
    "happy", "good", "great", "excited", "calm", "peaceful", "hopeful", "hope",
    "enjoy", "enjoyed", "fun", "relaxed", "better", "proud", "grateful",
    "thankful", "confident", "motivated", "energetic"
}


def clean_text(text: str) -> str:
    """Normalize text while retaining sentence meaning."""
    text = str(text or "")
    text = text.replace("\n", " ")
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[@#]\w+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(text: str) -> List[str]:
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text.lower())


def _get_transformer():
    """
    Lazy-load a small general sentiment model.
    If transformers/model download is unavailable, the system continues with VADER.
    """
    global _TRANSFORMER

    if _TRANSFORMER is not None:
        return _TRANSFORMER

    if hf_pipeline is None:
        return None

    try:
        _TRANSFORMER = hf_pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            truncation=True
        )
        return _TRANSFORMER
    except Exception:
        return None


def _transformer_sentiment(text: str):
    model = _get_transformer()
    if model is None:
        return None

    try:
        result = model(text[:4000])[0]
        label = result["label"].upper()
        score = float(result["score"])

        # Convert model output to a comparable positive/negative score.
        if label == "NEGATIVE":
            return {"label": "negative", "score": score}
        return {"label": "positive", "score": score}
    except Exception:
        return None


def _risk_from_scores(vader_negative: float, transformer_negative: float,
                      negative_word_ratio: float, text_length: int) -> str:
    # This is a language-risk signal, not a medical risk score.
    signal = (
        0.45 * vader_negative
        + 0.40 * transformer_negative
        + 0.15 * min(negative_word_ratio * 8.0, 1.0)
    )

    if text_length < 8:
        signal *= 0.70

    if signal >= 0.70:
        return "High language-negativity signal"
    if signal >= 0.45:
        return "Moderate language-negativity signal"
    return "Low language-negativity signal"


def analyze_text(text: str) -> Dict:
    """
    Main interface used by the rest of MindSense.

    Returns a stable dictionary so the multimodal fusion module can consume
    NLP output without knowing implementation details.
    """
    cleaned = clean_text(text)
    tokens = tokenize(cleaned)
    token_count = len(tokens)

    if not cleaned:
        return {
            "clean_text": "",
            "sentiment_label": "neutral",
            "vader_compound": 0.0,
            "negative_score": 0.0,
            "positive_score": 0.0,
            "negative_word_ratio": 0.0,
            "positive_word_ratio": 0.0,
            "token_count": 0,
            "transformer_used": False,
            "risk_level": "Low language-negativity signal",
        }

    vader = VADER.polarity_scores(cleaned)
    negative_words = sum(t in NEGATIVE_LANGUAGE_TERMS for t in tokens)
    positive_words = sum(t in POSITIVE_LANGUAGE_TERMS for t in tokens)

    negative_ratio = negative_words / max(token_count, 1)
    positive_ratio = positive_words / max(token_count, 1)

    transformer = _transformer_sentiment(cleaned)

    if transformer:
        transformer_negative = (
            transformer["score"] if transformer["label"] == "negative" else 0.0
        )
        transformer_used = True
    else:
        # VADER compound is used as a fallback proxy.
        transformer_negative = max(0.0, -float(vader["compound"]))
        transformer_used = False

    # Combine VADER and transformer signals.
    if transformer:
        if transformer["label"] == "negative":
            sentiment_label = "negative"
        else:
            sentiment_label = "positive"
    else:
        if vader["compound"] <= -0.05:
            sentiment_label = "negative"
        elif vader["compound"] >= 0.05:
            sentiment_label = "positive"
        else:
            sentiment_label = "neutral"

    negative_score = min(
        1.0,
        0.55 * max(0.0, -vader["compound"])
        + 0.35 * transformer_negative
        + 0.10 * min(negative_ratio * 8.0, 1.0)
    )

    positive_score = min(
        1.0,
        0.60 * max(0.0, vader["compound"])
        + 0.20 * (transformer["score"] if transformer and transformer["label"] == "positive" else 0.0)
        + 0.20 * min(positive_ratio * 8.0, 1.0)
    )

    risk_level = _risk_from_scores(
        max(0.0, -vader["compound"]),
        transformer_negative,
        negative_ratio,
        token_count,
    )

    return {
        "clean_text": cleaned,
        "sentiment_label": sentiment_label,
        "vader_compound": round(float(vader["compound"]), 4),
        "negative_score": round(float(negative_score), 4),
        "positive_score": round(float(positive_score), 4),
        "negative_word_ratio": round(float(negative_ratio), 4),
        "positive_word_ratio": round(float(positive_ratio), 4),
        "token_count": token_count,
        "transformer_used": transformer_used,
        "risk_level": risk_level,
    }
