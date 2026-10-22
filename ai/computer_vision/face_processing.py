"""MindSense computer-vision face processing helpers."""

import cv2
import numpy as np


def preprocess_frame(frame, width=640):
    if frame is None:
        return None

    height, current_width = frame.shape[:2]

    if current_width != width:
        ratio = width / current_width
        new_height = int(height * ratio)
        frame = cv2.resize(frame, (width, new_height))

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    normalized_frame = rgb_frame.astype(np.float32) / 255.0

    return normalized_frame

def detect_faces(frame, face_detector):
    height, width = frame.shape[:2]

    face_detector.setInputSize((width, height))

    _, faces = face_detector.detect(frame)

    if faces is None:
        return []

    return faces

def crop_face(frame, face):
    x, y, w, h = face[:4].astype(int)

    x = max(0, x)
    y = max(0, y)

    x2 = min(frame.shape[1], x + w)
    y2 = min(frame.shape[0], y + h)

    if x >= x2 or y >= y2:
        return None

    return frame[y:y2, x:x2]

def face_eye_roll_degrees(face):
    """Return the eye-line roll angle from YuNet keypoints, in degrees."""
    if face is None or len(face) < 8:
        return None

    right_eye = face[4:6].astype(np.float32)
    left_eye = face[6:8].astype(np.float32)
    delta = left_eye - right_eye

    if not np.isfinite(delta).all() or np.hypot(*delta) < 1e-6:
        return None

    return float(np.degrees(np.arctan2(delta[1], delta[0])))

def align_face(frame, face):
    """Crop a YuNet-detected face and correct in-plane eye-line rotation.

    YuNet's FaceDetectorYN output stores:
      face[0:4]   -> x, y, width, height
      face[4:6]   -> right-eye center (x, y)
      face[6:8]   -> left-eye center (x, y)

    Returns the rotated face crop, or None if the crop is invalid.
    """
    if frame is None or face is None or len(face) < 8:
        return None

    cropped_face = crop_face(frame, face)
    if cropped_face is None or cropped_face.size == 0:
        return None

    angle_degrees = face_eye_roll_degrees(face)
    if angle_degrees is None:
        return cropped_face

    height, width = cropped_face.shape[:2]
    center = (width / 2.0, height / 2.0)
    rotation_matrix = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)

    # Keep the crop dimensions unchanged; replicate border pixels to reduce
    # black triangular areas introduced by rotation.
    return cv2.warpAffine(
        cropped_face,
        rotation_matrix,
        (width, height),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REPLICATE,
    )

def normalize_face(face, size=(224, 224)):
    if face is None or face.size == 0:
        return None

    normalized_face = cv2.resize(face, size)

    return normalized_face
