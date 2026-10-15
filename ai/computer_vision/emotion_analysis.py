"""MindSense computer-vision emotion analysis helpers."""

import cv2

from deepface import DeepFace


def analyze_emotion(face):
    if face is None or face.size == 0:
        return None

    try:
        result = DeepFace.analyze(
            img_path=face,
            actions=["emotion"],
            enforce_detection=False,
            detector_backend="skip"
        )

        if isinstance(result, list):
            result = result[0]

        emotions = result.get("emotion", {})
        dominant_emotion = result.get(
            "dominant_emotion",
            "unknown"
        )

        return {
            "dominant_emotion": dominant_emotion,
            "emotions": emotions
        }

    except Exception as error:
        print("Emotion analysis error:", error)
        return None

def display_emotion(frame, emotion_result):
    if emotion_result is None:
        return

    dominant_emotion = emotion_result["dominant_emotion"]

    cv2.putText(
        frame,
        f"Emotion: {dominant_emotion}",
        (20, 45),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )
