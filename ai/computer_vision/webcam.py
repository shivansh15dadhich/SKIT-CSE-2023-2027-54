import cv2


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

        cv2.imshow("MindSense - Webcam Test", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    start_webcam()