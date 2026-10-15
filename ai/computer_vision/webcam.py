"""Webcam entry point and orchestration for the MindSense CV pipeline."""

import time

import cv2
import mediapipe as mp
import numpy as np

if __package__:
    from .affect_output import build_facial_affect_output, handle_output_key
    from .emotion_analysis import analyze_emotion, display_emotion
    from .face_processing import align_face, detect_faces, face_eye_roll_degrees, normalize_face, preprocess_frame
    from .facial_features import create_feature_vector, draw_landmarks, extract_facial_features
else:
    from affect_output import build_facial_affect_output, handle_output_key
    from emotion_analysis import analyze_emotion, display_emotion
    from face_processing import align_face, detect_faces, face_eye_roll_degrees, normalize_face, preprocess_frame
    from facial_features import create_feature_vector, draw_landmarks, extract_facial_features


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
    latest_facial_affect = build_facial_affect_output()
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
                latest_facial_affect = build_facial_affect_output(
                    face_detected=False
                )
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

                key = cv2.waitKey(1) & 0xFF
                if handle_output_key(key, latest_facial_affect):
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
            else:
                features = None

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

            latest_facial_affect = build_facial_affect_output(
                emotion_result=latest_emotion,
                features=features,
                face_detected=True,
            )

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

            key = cv2.waitKey(1) & 0xFF
            if handle_output_key(key, latest_facial_affect):
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
