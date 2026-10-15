import time

import cv2
import numpy as np
import mediapipe as mp
from deepface import DeepFace


# --------------------------------------------------
# Frame preprocessing
# --------------------------------------------------

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


# --------------------------------------------------
# Face detection
# --------------------------------------------------

def detect_faces(frame, face_detector):
    height, width = frame.shape[:2]

    face_detector.setInputSize((width, height))

    _, faces = face_detector.detect(frame)

    if faces is None:
        return []

    return faces


# --------------------------------------------------
# Face cropping
# --------------------------------------------------

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


# --------------------------------------------------
# Facial alignment using YuNet eye keypoints
# --------------------------------------------------

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


# --------------------------------------------------
# Face normalization
# --------------------------------------------------

def normalize_face(face, size=(224, 224)):
    if face is None or face.size == 0:
        return None

    normalized_face = cv2.resize(face, size)

    return normalized_face


# --------------------------------------------------
# MediaPipe landmark utilities
# --------------------------------------------------

def landmark_point(landmarks, index, width, height):
    point = landmarks[index]

    return np.array([
        point.x * width,
        point.y * height
    ])


def calculate_distance(point1, point2):
    return np.linalg.norm(point1 - point2)


def calculate_eye_aspect_ratio(
    landmarks,
    eye_indices,
    width,
    height
):
    points = [
        landmark_point(landmarks, index, width, height)
        for index in eye_indices
    ]

    vertical_1 = calculate_distance(points[1], points[5])
    vertical_2 = calculate_distance(points[2], points[4])
    horizontal = calculate_distance(points[0], points[3])

    if horizontal == 0:
        return 0.0

    return (vertical_1 + vertical_2) / (2.0 * horizontal)


def calculate_mouth_ratio(
    landmarks,
    width,
    height
):
    left = landmark_point(landmarks, 61, width, height)
    right = landmark_point(landmarks, 291, width, height)
    top = landmark_point(landmarks, 13, width, height)
    bottom = landmark_point(landmarks, 14, width, height)

    horizontal = calculate_distance(left, right)
    vertical = calculate_distance(top, bottom)

    if horizontal == 0:
        return 0.0

    return vertical / horizontal


def calculate_eyebrow_distance(
    landmarks,
    width,
    height
):
    left_eyebrow = landmark_point(
        landmarks,
        105,
        width,
        height
    )

    right_eyebrow = landmark_point(
        landmarks,
        334,
        width,
        height
    )

    distance = calculate_distance(
        left_eyebrow,
        right_eyebrow
    )

    face_left = landmark_point(
        landmarks,
        234,
        width,
        height
    )

    face_right = landmark_point(
        landmarks,
        454,
        width,
        height
    )

    face_width = calculate_distance(
        face_left,
        face_right
    )

    if face_width == 0:
        return 0.0

    return distance / face_width


# --------------------------------------------------
# Facial feature extraction
# --------------------------------------------------

def extract_facial_features(landmarks, width, height):
    left_eye_indices = [
        33,
        160,
        158,
        133,
        153,
        144
    ]

    right_eye_indices = [
        362,
        385,
        387,
        263,
        373,
        380
    ]

    left_ear = calculate_eye_aspect_ratio(
        landmarks,
        left_eye_indices,
        width,
        height
    )

    right_ear = calculate_eye_aspect_ratio(
        landmarks,
        right_eye_indices,
        width,
        height
    )

    average_ear = (left_ear + right_ear) / 2.0

    mouth_ratio = calculate_mouth_ratio(
        landmarks,
        width,
        height
    )

    eyebrow_distance = calculate_eyebrow_distance(
        landmarks,
        width,
        height
    )

    return {
        "left_ear": left_ear,
        "right_ear": right_ear,
        "average_ear": average_ear,
        "mouth_ratio": mouth_ratio,
        "eyebrow_distance": eyebrow_distance
    }


def create_feature_vector(features):
    return np.array([
        features["left_ear"],
        features["right_ear"],
        features["average_ear"],
        features["mouth_ratio"],
        features["eyebrow_distance"]
    ], dtype=np.float32)


# --------------------------------------------------
# MediaPipe landmark drawing
# --------------------------------------------------

def draw_landmarks(frame, landmarks):
    height, width = frame.shape[:2]

    for landmark in landmarks:
        x = int(landmark.x * width)
        y = int(landmark.y * height)

        if 0 <= x < width and 0 <= y < height:
            cv2.circle(
                frame,
                (x, y),
                1,
                (0, 255, 0),
                -1
            )


# --------------------------------------------------
# Display facial features
# --------------------------------------------------

def display_features(frame, features):
    y_position = 80

    values = [
        f"Left EAR: {features['left_ear']:.3f}",
        f"Right EAR: {features['right_ear']:.3f}",
        f"Average EAR: {features['average_ear']:.3f}",
        f"Mouth Ratio: {features['mouth_ratio']:.3f}",
        f"Eyebrow Distance: {features['eyebrow_distance']:.3f}"
    ]

    for text in values:
        cv2.putText(
            frame,
            text,
            (20, y_position),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 255, 0),
            1
        )

        y_position += 25


# --------------------------------------------------
# DeepFace emotion detection
# --------------------------------------------------

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


# --------------------------------------------------
# Display emotion
# --------------------------------------------------

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


# --------------------------------------------------
# Main webcam pipeline
# --------------------------------------------------

def start_webcam():
    model_path = (
        "ai/computer_vision/models/"
        "face_detection_yunet_2026may.onnx"
    )

    landmark_model_path = (
        "ai/computer_vision/models/"
        "face_landmarker.task"
    )

    # ----------------------------------------------
    # YuNet face detector
    # ----------------------------------------------

    face_detector = cv2.FaceDetectorYN.create(
        model_path,
        "",
        (320, 320),
        0.9,
        0.3,
        5000
    )

    # ----------------------------------------------
    # MediaPipe Face Landmarker
    # ----------------------------------------------

    base_options = mp.tasks.BaseOptions(
        model_asset_path=landmark_model_path
    )

    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=(
            mp.tasks.vision.RunningMode.IMAGE
        ),
        num_faces=1
    )

    face_landmarker = (
        mp.tasks.vision.FaceLandmarker.create_from_options(
            options
        )
    )

    # ----------------------------------------------
    # Webcam
    # ----------------------------------------------

    cap = cv2.VideoCapture(0)

    cv2.namedWindow(
        "MindSense - Face Analysis",
        cv2.WINDOW_NORMAL
    )

    cv2.resizeWindow(
        "MindSense - Face Analysis",
        900,
        700
    )

    if not cap.isOpened():
        print("Unable to access webcam")
        face_landmarker.close()
        return

    # ----------------------------------------------
    # Runtime state
    # ----------------------------------------------

    latest_emotion = None
    last_emotion_time = 0.0
    fps_started_at = time.perf_counter()
    fps_frame_count = 0
    current_fps = 0.0

    try:
        while True:

            # --------------------------------------
            # Capture frame
            # --------------------------------------

            ret, frame = cap.read()

            if not ret:
                print("Unable to read frame")
                break

            # --------------------------------------
            # Preprocessing
            # --------------------------------------

            processed_frame = preprocess_frame(frame)

            if processed_frame is None:
                print("Invalid frame")
                continue

            display_frame = (
                processed_frame * 255
            ).astype(np.uint8)

            display_frame = cv2.cvtColor(
                display_frame,
                cv2.COLOR_RGB2BGR
            )

            # Refresh the displayed FPS once per second to avoid noisy values.
            fps_frame_count += 1
            fps_elapsed = time.perf_counter() - fps_started_at
            if fps_elapsed >= 1.0:
                current_fps = fps_frame_count / fps_elapsed
                fps_frame_count = 0
                fps_started_at = time.perf_counter()

            cv2.putText(
                display_frame,
                f"FPS: {current_fps:.1f}",
                (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 200, 0),
                2
            )

            # --------------------------------------
            # Face detection
            # --------------------------------------

            faces = detect_faces(
                display_frame,
                face_detector
            )


            if faces is None or len(faces) == 0:
                cv2.putText(
                    display_frame,
                    "No face detected",
                    (20, 45),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2
                )

                cv2.imshow(
                    "MindSense - Face Analysis",
                    display_frame
                )

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

                continue

            # --------------------------------------
            # Process first detected face
            # --------------------------------------

            face = faces[0]

            x, y, w, h = face[:4].astype(int)

            x = max(0, x)
            y = max(0, y)

            x2 = min(
                display_frame.shape[1],
                x + w
            )

            y2 = min(
                display_frame.shape[0],
                y + h
            )

            # Align the crop using YuNet's eye keypoints before resizing.
            eye_roll = face_eye_roll_degrees(face)
            aligned_face = align_face(
                display_frame,
                face
            )

            if aligned_face is None:
                continue

            normalized_face = normalize_face(
                aligned_face
            )

            if normalized_face is None:
                continue

            # Temporary diagnostic window for validating facial alignment.
            cv2.imshow("Aligned Face", normalized_face)
            if eye_roll is not None:
                cv2.putText(
                    display_frame,
                    f"Eye-line roll: {eye_roll:.1f} deg",
                    (20, 135),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    (255, 200, 0),
                    2
                )

            # --------------------------------------
            # Draw face bounding box
            # --------------------------------------

            cv2.rectangle(
                display_frame,
                (x, y),
                (x2, y2),
                (0, 255, 0),
                2
            )

            # --------------------------------------
            # MediaPipe landmark detection
            # --------------------------------------

            rgb_face = cv2.cvtColor(
                normalized_face,
                cv2.COLOR_BGR2RGB
            )

            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_face
            )

            landmark_result = (
                face_landmarker.detect(mp_image)
            )

            if landmark_result.face_landmarks:

                landmarks = (
                    landmark_result.face_landmarks[0]
                )

                draw_landmarks(
                    normalized_face,
                    landmarks
                )

                # ----------------------------------
                # Feature extraction
                # ----------------------------------

                face_height, face_width = (
                    normalized_face.shape[:2]
                )

                features = extract_facial_features(
                    landmarks,
                    face_width,
                    face_height
                )

                feature_vector = create_feature_vector(features)

                # Feature vector will be passed to the backend/ML layer
                # when the project integration is implemented.

            # --------------------------------------
            # DeepFace emotion inference
            # --------------------------------------
            # Run approximately once per second
            # instead of every few frames.

            current_time = time.time()

            if (
                current_time - last_emotion_time
                >= 1.0
            ):
                emotion_result = analyze_emotion(
                    normalized_face
                )

                if emotion_result is not None:
                    latest_emotion = emotion_result

                last_emotion_time = current_time

            # --------------------------------------
            # Display latest emotion
            # --------------------------------------

            display_emotion(
                display_frame,
                latest_emotion
            )

            # --------------------------------------
            # Display webcam
            # --------------------------------------

            cv2.imshow(
                "MindSense - Face Analysis",
                display_frame
            )

            # --------------------------------------
            # Quit with Q
            # --------------------------------------

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        cap.release()
        face_landmarker.close()
        cv2.destroyAllWindows()


# --------------------------------------------------
# Entry point
# --------------------------------------------------

if __name__ == "__main__":
    start_webcam()
