"""MindSense computer-vision facial features helpers."""

import cv2
import numpy as np


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
