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


def start_webcam():
    cap = cv2.VideoCapture(0)

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
        display_frame = cv2.cvtColor(display_frame, cv2.COLOR_RGB2BGR)

        cv2.imshow("MindSense - Preprocessed Webcam", display_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    start_webcam()