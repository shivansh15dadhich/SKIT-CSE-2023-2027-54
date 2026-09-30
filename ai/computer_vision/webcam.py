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


def start_webcam():
    model_path = (
        "ai/computer_vision/models/"
        "face_detection_yunet_2026may.onnx"
    )

    face_detector = cv2.FaceDetectorYN.create(
        model_path,
        "",
        (320, 320),
        0.9,
        0.3,
        5000
    )

    cap = cv2.VideoCapture(0)
    cv2.namedWindow("Detected Face", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Detected Face", 300, 300)

    if not cap.isOpened():
        print("Unable to access webcam")
        return

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Unable to read frame")
            break

        processed_frame = preprocess_frame(frame)

        if processed_frame is None:
            print("Invalid frame")
            continue

        display_frame = (processed_frame * 255).astype(np.uint8)
        display_frame = cv2.cvtColor(
            display_frame,
            cv2.COLOR_RGB2BGR
        )

        faces = detect_faces(display_frame, face_detector)

        for face in faces:
            x, y, w, h = face[:4].astype(int)

            cropped_face = crop_face(display_frame, face)

            if cropped_face is None:
                continue

            cv2.rectangle(
                display_frame,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                2
            )

            cv2.imshow("Detected Face", cropped_face)
            

        cv2.imshow("MindSense - Face Detection", display_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    start_webcam()