"""MindSense text analysis pipeline.

This module produces non-clinical language/sentiment signals only. It does not
diagnose mental-health conditions. Transformer sentiment is optional; VADER
works as the lightweight default so startup does not require a large model.
"""
from __future__ import annotations

import os
import re
from functools import lru_cache
from typing import Any, Dict, List, Optional

import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Enable the transformer model explicitly with MINDSENSE_ENABLE_TRANSFORMER=1.
# This avoids a large model download and makes the app usable on low-storage PCs.
_ENABLE_TRANSFORMER = os.getenv("MINDSENSE_ENABLE_TRANSFORMER", "0").strip() == "1"
_TRANSFORMER_MODEL_NAME = os.getenv(
    "MINDSENSE_TRANSFORMER_MODEL",
    "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
)

NEGATIVE_LANGUAGE_TERMS = {
    "sad", "sadness", "down", "upset", "angry", "anger", "lonely", "loneliness",
    "stressed", "stress", "worried", "worry", "hopeless", "helpless", "tired",
    "exhausted", "overwhelmed", "empty", "worthless", "cry", "crying", "failed",
    "failure", "isolated", "alone", "frustrated", "frustration", "bad", "terrible",
    "awful", "negative", "difficult", "hard", "unhappy", "miserable", "anxious",
}
POSITIVE_LANGUAGE_TERMS = {
    "happy", "good", "great", "excited", "calm", "peaceful", "hopeful", "hope",
    "enjoy", "enjoyed", "fun", "relaxed", "better", "proud", "grateful",
    "thankful", "confident", "motivated", "energetic", "content", "supported",
}


def clean_text(text: str) -> str:
    """Normalize text while preserving words and sentence meaning."""
    value = str(text or "").replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"https?://\S+|www\.\S+", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]*>", " ", value)
    # Remove social handles but preserve hashtag words (e.g. #stressed -> stressed).
    value = re.sub(r"(?<!\w)@\w+", " ", value)
    value = re.sub(r"(?<!\w)#([A-Za-z0-9_]+)", r"\1", value)
    return re.sub(r"\s+", " ", value).strip()


def tokenize(text: str) -> List[str]:
    """Return simple English word tokens, retaining apostrophes."""
    return re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text.lower())


@lru_cache(maxsize=1)
def _get_vader() -> Optional[SentimentIntensityAnalyzer]:
    """Load VADER; gracefully return None if its lexicon is unavailable offline."""
    try:
        nltk.data.find("sentiment/vader_lexicon.zip")
    except LookupError:
        try:
            if not nltk.download("vader_lexicon", quiet=True):
                return None
        except Exception:
            return None
    try:
        return SentimentIntensityAnalyzer()
    except (LookupError, OSError):
        return None


def _fallback_sentiment(tokens: List[str]) -> float:
    """Small lexicon fallback used only if the VADER lexicon cannot be loaded."""
    if not tokens:
        return 0.0
    positive = sum(token in POSITIVE_LANGUAGE_TERMS for token in tokens)
    negative = sum(token in NEGATIVE_LANGUAGE_TERMS for token in tokens)
    return max(-1.0, min(1.0, (positive - negative) / max(len(tokens) * 0.25, 1)))


@lru_cache(maxsize=1)
def _get_transformer():
    """Load the optional Hugging Face model only when explicitly enabled."""
    if not _ENABLE_TRANSFORMER:
        return None
    try:
        from transformers import pipeline
        return pipeline(
            "sentiment-analysis",
            model=_TRANSFORMER_MODEL_NAME,
            truncation=True,
        )
    except Exception:
        # Offline, unsupported hardware, or unavailable model: VADER remains usable.
        return None


def _transformer_sentiment(text: str) -> Optional[Dict[str, Any]]:
    model = _get_transformer()
    if model is None:
        return None
    try:
        result = model(text[:4000])[0]
        label = str(result.get("label", "")).upper()
        score = float(result.get("score", 0.0))
        if label not in {"POSITIVE", "NEGATIVE"}:
            return None
        return {
            "label": label.lower(),
            "score": max(0.0, min(1.0, score)),
        }
    except Exception:
        return None


def _language_signal(
    vader_negative: float,
    transformer_negative: float,
    negative_word_ratio: float,
    token_count: int,
) -> tuple[float, str]:
    """Return a heuristic language-negativity signal, not a clinical risk score."""
    signal = (
        0.50 * vader_negative
        + 0.35 * transformer_negative
        + 0.15 * min(negative_word_ratio * 8.0, 1.0)
    )
    # Very short entries are weak evidence and should have less influence.
    if token_count < 5:
        signal *= 0.65
    signal = max(0.0, min(1.0, signal))

    if token_count < 3:
        label = "Insufficient text"
    elif signal >= 0.70:
        label = "High language-negativity signal"
    elif signal >= 0.45:
        label = "Moderate language-negativity signal"
    else:
        label = "Low language-negativity signal"
    return round(signal, 4), label


def analyze_text(text: str) -> Dict[str, Any]:
    """Analyze one entry and return a stable, fusion-friendly dictionary."""
    cleaned = clean_text(text)
    tokens = tokenize(cleaned)
    token_count = len(tokens)

    if not tokens:
        return {
            "clean_text": cleaned,
            "sentiment_label": "neutral",
            "vader_compound": 0.0,
            "negative_score": 0.0,
            "positive_score": 0.0,
            "language_negativity_signal": 0.0,
            "negative_word_ratio": 0.0,
            "positive_word_ratio": 0.0,
            "token_count": 0,
            "transformer_used": False,
            "risk_level": "Insufficient text",
            "analysis_method": "none",
        }

    vader_analyzer = _get_vader()
    if vader_analyzer is not None:
        vader_compound = float(vader_analyzer.polarity_scores(cleaned)["compound"])
        analysis_method = "vader"
    else:
        vader_compound = _fallback_sentiment(tokens)
        analysis_method = "lexicon_fallback"

    negative_words = sum(token in NEGATIVE_LANGUAGE_TERMS for token in tokens)
    positive_words = sum(token in POSITIVE_LANGUAGE_TERMS for token in tokens)
    negative_ratio = negative_words / token_count
    positive_ratio = positive_words / token_count

    transformer = _transformer_sentiment(cleaned)
    transformer_used = transformer is not None
    transformer_negative = (
        transformer["score"] if transformer and transformer["label"] == "negative" else 0.0
    )

    if transformer is not None:
        analysis_method = "vader+transformer" if vader_analyzer is not None else "lexicon+transformer"
        # Transformer sentiment is a general-purpose model and is not a mental-health classifier.
        sentiment_label = transformer["label"]
    elif vader_compound <= -0.05:
        sentiment_label = "negative"
    elif vader_compound >= 0.05:
        sentiment_label = "positive"
    else:
        sentiment_label = "neutral"

    negative_score = min(
        1.0,
        0.60 * max(0.0, -vader_compound)
        + 0.30 * transformer_negative
        + 0.10 * min(negative_ratio * 8.0, 1.0),
    )
    positive_transformer = (
        transformer["score"] if transformer and transformer["label"] == "positive" else 0.0
    )
    positive_score = min(
        1.0,
        0.60 * max(0.0, vader_compound)
        + 0.25 * positive_transformer
        + 0.15 * min(positive_ratio * 8.0, 1.0),
    )

    language_signal, risk_level = _language_signal(
        max(0.0, -vader_compound),
        transformer_negative,
        negative_ratio,
        token_count,
    )

    return {
        "clean_text": cleaned,
        "sentiment_label": sentiment_label,
        "vader_compound": round(vader_compound, 4),
        "negative_score": round(negative_score, 4),
        "positive_score": round(positive_score, 4),
        "language_negativity_signal": language_signal,
        "negative_word_ratio": round(negative_ratio, 4),
        "positive_word_ratio": round(positive_ratio, 4),
        "token_count": token_count,
        "transformer_used": transformer_used,
        "risk_level": risk_level,  # Kept for backwards compatibility with existing UI/API.
        "analysis_method": analysis_method,
    }
