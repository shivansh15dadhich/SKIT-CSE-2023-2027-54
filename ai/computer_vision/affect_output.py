"""MindSense computer-vision affect output helpers."""

import json
from datetime import datetime, timezone

import numpy as np


def build_facial_affect_output(
    emotion_result=None,
    features=None,
    face_detected=False,
    timestamp_utc=None,
):
    """Build a stable, JSON-compatible facial output for backend integration.

    DeepFace emotion scores are returned as percentages; this schema stores
    them as probabilities in the range 0..1. Missing values remain ``None``.
    """
    emotion_names = (
        "angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"
    )
    feature_names = (
        "left_ear", "right_ear", "average_ear", "mouth_ratio",
        "eyebrow_distance",
    )

    raw_scores = (emotion_result or {}).get("emotions", {})
    scores_by_name = {str(key).lower(): value for key, value in raw_scores.items()}
    emotion_scores = {}
    for name in emotion_names:
        raw_score = scores_by_name.get(name)
        try:
            score = float(raw_score) if raw_score is not None else None
            if score is not None and np.isfinite(score):
                # DeepFace reports percentages; tolerate already-normalized input.
                score = score / 100.0 if score > 1.0 else score
                score = min(1.0, max(0.0, score))
            else:
                score = None
        except (TypeError, ValueError):
            score = None
        emotion_scores[name] = score

    raw_features = features or {}
    geometry = {}
    for name in feature_names:
        value = raw_features.get(name)
        try:
            value = float(value) if value is not None else None
            if value is not None and not np.isfinite(value):
                value = None
        except (TypeError, ValueError):
            value = None
        geometry[name] = value

    dominant_emotion = (emotion_result or {}).get("dominant_emotion")
    if dominant_emotion is not None:
        dominant_emotion = str(dominant_emotion).lower()

    return {
        "schema_version": "1.0",
        "timestamp_utc": timestamp_utc or datetime.now(timezone.utc).isoformat(),
        "face_detected": bool(face_detected),
        "emotion": {
            "dominant": dominant_emotion,
            "scores": emotion_scores,
        },
        "geometry": geometry,
        "feature_vector": [geometry[name] for name in feature_names],
    }

def handle_output_key(key, facial_affect):
    """Print the latest backend-ready payload when S is pressed; Q exits."""
    if key in (ord("s"), ord("S")):
        print(json.dumps(facial_affect, indent=2, allow_nan=False))
    return key in (ord("q"), ord("Q"))
