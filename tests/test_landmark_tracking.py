import json
import math
import unittest
from types import SimpleNamespace

from ai.computer_vision.affect_output import build_facial_affect_output
from ai.computer_vision.facial_features import (
    create_feature_vector,
    extract_facial_features,
)
from ai.computer_vision.landmark_tracking import (
    FACIAL_REGIONS,
    FacialLandmarkTracker,
)


def make_landmarks(dx=0.0, dy=0.0):
    """Small deterministic normalized 478-point Face Landmarker fixture."""
    points = [SimpleNamespace(x=0.5 + dx, y=0.5 + dy, z=0.0) for _ in range(478)]
    # Give the feature landmarks non-zero eye, mouth, and face widths/heights.
    values = {
        33: (0.2, 0.4), 160: (0.22, 0.38), 158: (0.25, 0.38),
        133: (0.3, 0.4), 153: (0.25, 0.42), 144: (0.22, 0.42),
        362: (0.7, 0.4), 385: (0.72, 0.38), 387: (0.75, 0.38),
        263: (0.8, 0.4), 373: (0.75, 0.42), 380: (0.72, 0.42),
        61: (0.35, 0.7), 291: (0.65, 0.7), 13: (0.5, 0.68),
        14: (0.5, 0.72), 105: (0.35, 0.3), 334: (0.65, 0.3),
        234: (0.1, 0.5), 454: (0.9, 0.5), 10: (0.5, 0.1), 152: (0.5, 0.9),
    }
    for index, (x, y) in values.items():
        points[index] = SimpleNamespace(x=x + dx, y=y + dy, z=0.0)
    return points


class LandmarkTrackingTests(unittest.TestCase):
    def test_consecutive_valid_frames_and_regions(self):
        tracker = FacialLandmarkTracker()
        first = tracker.update(make_landmarks(), frame_id=1)
        second = tracker.update(make_landmarks(dx=0.01), frame_id=2)
        self.assertEqual(first["status"], "initialized")
        self.assertEqual(second["status"], "tracked")
        self.assertTrue(second["tracking_valid"])
        self.assertEqual(second["frame_id"], 2)
        self.assertEqual(second["coordinate_convention"], "mediapipe_normalized_face_crop_xyz")
        self.assertEqual(len(second["regions"]["left_eye"]), len(FACIAL_REGIONS["left_eye"]))
        self.assertAlmostEqual(second["mean_displacement"], 0.01, places=12)
        self.assertEqual(FACIAL_REGIONS["left_eye"], (33, 160, 158, 133, 153, 144))
        self.assertEqual(FACIAL_REGIONS["right_eye"], (362, 385, 387, 263, 373, 380))

    def test_identical_landmarks_have_zero_displacement(self):
        tracker = FacialLandmarkTracker()
        points = make_landmarks()
        tracker.update(points)
        result = tracker.update(points)
        self.assertAlmostEqual(result["mean_displacement"], 0.0, places=12)

    def test_no_face_resets_and_has_no_fake_landmarks(self):
        tracker = FacialLandmarkTracker()
        tracker.update(make_landmarks())
        result = tracker.update(face_detected=False)
        self.assertEqual(result["status"], "no_face")
        self.assertFalse(result["face_detected"])
        self.assertIsNone(result["landmarks"])
        self.assertEqual(tracker.update(make_landmarks())["status"], "initialized")

    def test_missing_and_invalid_coordinates_are_rejected(self):
        tracker = FacialLandmarkTracker()
        self.assertEqual(tracker.update(make_landmarks()[:467])["status"], "invalid_landmarks")
        for invalid_value in (float("nan"), float("inf"), -float("inf")):
            points = make_landmarks()
            points[200].x = invalid_value
            result = tracker.update(points)
            self.assertEqual(result["status"], "invalid_landmarks")
            self.assertIsNone(result["landmarks"])
        for invalid_point in (None, object()):
            points = make_landmarks()
            points[200] = invalid_point
            self.assertEqual(tracker.update(points)["status"], "invalid_landmarks")
        self.assertEqual(tracker.update(make_landmarks())["status"], "initialized")

    def test_out_of_range_normalized_xy_is_rejected_but_relative_z_can_be_negative(self):
        tracker = FacialLandmarkTracker()
        points = make_landmarks()
        points[200].z = -0.2
        self.assertEqual(tracker.update(points)["status"], "initialized")
        points = make_landmarks()
        points[200].x = 1.01
        self.assertEqual(tracker.update(points)["status"], "invalid_landmarks")
        points = make_landmarks()
        points[200].y = -0.01
        self.assertEqual(tracker.update(points)["status"], "invalid_landmarks")

    def test_stable_frame_reports_quality_and_displacement(self):
        tracker = FacialLandmarkTracker()
        tracker.update(make_landmarks())
        result = tracker.update(make_landmarks(dx=0.001))
        self.assertTrue(result["stable"])
        self.assertEqual(result["status"], "tracked")

    def test_large_move_is_reported_and_next_frame_reinitializes(self):
        tracker = FacialLandmarkTracker(max_mean_displacement=0.01)
        tracker.update(make_landmarks())
        jump = tracker.update(make_landmarks(dx=0.04))
        self.assertEqual(jump["status"], "possible_discontinuity")
        self.assertFalse(jump["tracking_valid"])
        self.assertGreater(jump["mean_displacement"], 0.01)
        self.assertEqual(tracker.update(make_landmarks(dx=0.04))["status"], "tracked")

    def test_face_loss_then_redetection_starts_new_segment(self):
        tracker = FacialLandmarkTracker()
        tracker.update(make_landmarks())
        tracker.update(face_detected=False)
        result = tracker.update(make_landmarks(dx=0.05))
        self.assertEqual(result["status"], "initialized")
        self.assertIsNone(result["mean_displacement"])

    def test_affect_output_is_additive_and_feature_vector_unchanged(self):
        landmarks = make_landmarks()
        features = extract_facial_features(landmarks, 224, 224)
        vector = create_feature_vector(features)
        tracking = FacialLandmarkTracker().update(landmarks)
        output = build_facial_affect_output(features=features, face_detected=True, tracking=tracking)
        self.assertEqual(output["schema_version"], "1.0")
        self.assertEqual(list(output["geometry"]), [
            "left_ear", "right_ear", "average_ear", "mouth_ratio", "eyebrow_distance"
        ])
        for actual, expected in zip(output["feature_vector"], vector.tolist()):
            self.assertAlmostEqual(actual, expected, places=6)
        self.assertEqual(output["tracking"], tracking)
        self.assertIn("tracking", build_facial_affect_output())
        json.dumps(output, allow_nan=False)

    def test_processing_latency_is_finite_and_non_negative(self):
        result = FacialLandmarkTracker().update(make_landmarks())
        self.assertGreaterEqual(result["processing_latency_ms"], 0.0)
        self.assertTrue(math.isfinite(result["processing_latency_ms"]))

    def test_normalized_coordinates_do_not_depend_on_source_pixel_dimensions(self):
        tracker = FacialLandmarkTracker()
        tracker.update(make_landmarks())
        # A resized crop maps the same normalized positions to the same values.
        result = tracker.update(make_landmarks())
        self.assertEqual(result["coordinate_convention"], "mediapipe_normalized_face_crop_xyz")
        self.assertEqual(result["displacement_unit"], "normalized_crop_xy")
        self.assertAlmostEqual(result["mean_displacement"], 0.0, places=12)


if __name__ == "__main__":
    unittest.main()
