"""Single-face, frame-to-frame landmark tracking helpers.

Coordinates are MediaPipe-normalized (x/y in [0, 1] for the face crop; z is
MediaPipe's relative depth). This is short-term continuity, not identity tracking.
"""

from __future__ import annotations

import math
import time


# MediaPipe Face Landmarker topology. The 468-point mesh is the base topology;
# the installed attention model adds iris points through index 477. Left/right
# names follow that model's eye-region ordering and match the feature module.
FACIAL_REGIONS = {
    "left_eye": (33, 160, 158, 133, 153, 144),
    "right_eye": (362, 385, 387, 263, 373, 380),
    "eyebrows": (105, 107, 336, 334),
    "mouth": (61, 13, 14, 291),
    "face_outline": (234, 10, 454, 152),
}
FEATURE_LANDMARKS = {
    "mouth_left": 61,
    "mouth_right": 291,
    "mouth_top": 13,
    "mouth_bottom": 14,
    "left_eyebrow": 105,
    "right_eyebrow": 334,
    "face_left": 234,
    "face_right": 454,
}
REQUIRED_LANDMARK_INDICES = tuple(sorted({
    index for indices in FACIAL_REGIONS.values() for index in indices
}))
MIN_LANDMARK_COUNT = 468  # Base Face Mesh topology; iris points are optional.


def _coordinates(point):
    """Return a finite normalized (x, y, z) tuple, or None."""
    try:
        values = (float(point.x), float(point.y), float(point.z))
    except (AttributeError, TypeError, ValueError):
        try:
            values = tuple(float(value) for value in point[:3])
        except (TypeError, ValueError, IndexError):
            return None
    if len(values) != 3 or not all(math.isfinite(value) for value in values):
        return None
    return values


class FacialLandmarkTracker:
    """Track the first detected face with configurable jump-quality threshold.

    ``max_mean_displacement`` is in normalized crop-coordinate units (x/y),
    not pixels or a psychological score. A large move is reported as a
    possible discontinuity and is not hidden; the next valid frame starts a
    new comparison segment. This threshold does not establish tracking failure.
    """

    def __init__(self, max_mean_displacement=0.15):
        if not math.isfinite(max_mean_displacement) or max_mean_displacement <= 0:
            raise ValueError("max_mean_displacement must be a positive finite number")
        self.max_mean_displacement = float(max_mean_displacement)
        self._previous = None

    def reset(self):
        self._previous = None

    def update(self, landmarks=None, *, face_detected=True, frame_id=None):
        """Validate one frame and return a JSON-compatible tracking record."""
        started = time.perf_counter_ns()
        if not face_detected:
            self.reset()
            return self._result(started, frame_id, False, False, "no_face", None, None, None)

        if landmarks is None:
            self.reset()
            return self._result(started, frame_id, True, False, "invalid_landmarks", None, None, None)
        try:
            points = [_coordinates(point) for point in landmarks]
        except TypeError:
            points = []
        if len(points) < MIN_LANDMARK_COUNT or any(point is None for point in points):
            self.reset()
            return self._result(started, frame_id, True, False, "invalid_landmarks", None, None, None)
        # Normalized image-plane coordinates outside [0, 1] are invalid for
        # this crop-based pipeline. z is relative depth and may be negative.
        if any(not 0.0 <= point[0] <= 1.0 or not 0.0 <= point[1] <= 1.0 for point in points):
            self.reset()
            return self._result(started, frame_id, True, False, "invalid_landmarks", None, None, None)

        current = tuple(points)
        displacement = None
        if self._previous is None:
            status = "initialized"
            stable = None
            tracking_valid = False
        else:
            # Mean Euclidean x/y displacement for required facial-feature points.
            displacement = sum(
                math.hypot(current[i][0] - self._previous[i][0],
                           current[i][1] - self._previous[i][1])
                for i in REQUIRED_LANDMARK_INDICES
            ) / len(REQUIRED_LANDMARK_INDICES)
            stable = displacement <= self.max_mean_displacement
            status = "tracked" if stable else "possible_discontinuity"
            tracking_valid = stable

        # Keep the current valid observation. Even a large movement remains
        # visible in output; this frame becomes the baseline for the next one.
        self._previous = current
        regions = {
            name: [list(current[index]) for index in indices]
            for name, indices in FACIAL_REGIONS.items()
        }
        return self._result(
            started, frame_id, True, tracking_valid, status,
            [list(point) for point in current], regions, displacement, stable,
        )

    @staticmethod
    def _result(started, frame_id, face_detected, tracking_valid, status,
                landmarks, regions, displacement, stable=None):
        return {
            "frame_id": frame_id,
            "face_detected": face_detected,
            "tracking_valid": tracking_valid,
            "status": status,
            "coordinate_convention": "mediapipe_normalized_face_crop_xyz",
            "landmarks": landmarks,
            "regions": regions,
            "mean_displacement": displacement,
            "displacement_unit": "normalized_crop_xy",
            "stable": stable,
            "processing_latency_ms": (time.perf_counter_ns() - started) / 1_000_000,
        }
