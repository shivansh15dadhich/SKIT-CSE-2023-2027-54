# MindSense - Computer Vision Module

The Computer Vision module is responsible for real-time facial analysis in the MindSense system.

It processes webcam frames, detects faces, extracts facial landmarks and geometric features, and performs emotion classification using DeepFace.

## Current Pipeline

```text
Webcam
   ↓
Frame Preprocessing
   ↓
YuNet Face Detection
   ↓
Face Cropping
   ↓
Face Normalization (224 × 224)
   ↓
MediaPipe Face Landmarks
   ↓
Facial Feature Extraction
   ↓
Feature Vector
   ↓
DeepFace Emotion Detection
   ↓
Real-time Visualization
```

## Implemented Components

### 1. Webcam Capture

Captures frames from the system webcam using OpenCV.

The pipeline handles:

- Webcam initialization
- Frame capture
- Invalid frame handling
- Resource cleanup

### 2. Frame Preprocessing

Each captured frame is:

- Resized to a standard width of 640 pixels
- Converted from BGR to RGB
- Normalized to the range `0–1`

This provides a consistent input format for the subsequent processing stages.

### 3. Face Detection

Face detection is performed using the OpenCV YuNet face detector.

Model:

```text
models/face_detection_yunet_2026may.onnx
```

The detector provides the face bounding box, which is then used for face cropping.

### 4. Face Cropping and Normalization

The detected face region is cropped from the original frame.

Before resizing, the crop is rotated using YuNet's eye keypoints to correct
in-plane eye-line tilt. The webcam view shows the measured eye-line angle, and
an `Aligned Face` preview is available while the pipeline runs.

The cropped face is resized to:

```text
224 × 224 pixels
```

This creates a standardized face representation for landmark detection and emotion analysis.

### 5. MediaPipe Face Landmarks

MediaPipe Face Landmarker is used to identify facial landmark points from the normalized face.

Model:

```text
models/face_landmarker.task
```

The current implementation processes one detected face at a time.

### 6. Facial Feature Extraction

Geometric features are calculated from the detected landmarks.

The current feature set includes:

- Left Eye Aspect Ratio (EAR)
- Right Eye Aspect Ratio (EAR)
- Average Eye Aspect Ratio
- Mouth Ratio
- Eyebrow Distance

These measurements are normalized relative to facial geometry where appropriate.

### 7. Feature Vector

The extracted features are converted into a NumPy feature vector:

```text
[
    left_ear,
    right_ear,
    average_ear,
    mouth_ratio,
    eyebrow_distance
]
```

The vector is represented using `float32` values and is intended to be passed to the backend/ML layer during project integration.

### 8. Standardized Facial-Affect Output

`build_facial_affect_output()` creates a JSON-compatible payload for each
processed frame. It includes a UTC timestamp, schema version, face-detection
status, DeepFace's dominant emotion and normalized emotion scores, named
geometric features, and a feature vector in this order:

```text
left_ear, right_ear, average_ear, mouth_ratio, eyebrow_distance
```

Emotion scores are represented as probabilities from `0` to `1`. Missing faces,
emotion values, or landmarks are represented by `false` status or `null` values
without changing the payload shape. Press `S` in the webcam window to print the
latest payload as JSON for inspection or future backend integration.

### 9. Emotion Detection

DeepFace is used for facial emotion classification.

The current implementation uses:

```text
actions = ["emotion"]
detector_backend = "skip"
enforce_detection = False
```

The `skip` detector is used because the face has already been detected and cropped by the CV pipeline.

The dominant emotion is displayed in the webcam window.

### 10. Real-time Optimization

DeepFace emotion inference is computationally more expensive than the other processing stages.

Therefore, emotion inference is performed approximately once per second while the latest result continues to be displayed between predictions.

This reduces unnecessary repeated model inference during real-time webcam processing.
The webcam view also displays an approximate FPS value, refreshed about once per
second.

## Facial Landmark Tracking

`landmark_tracking.py` adds short-term continuity checks to the existing
single-face path. YuNet still selects the first face, and the existing
MediaPipe Face Landmarker still runs in `IMAGE` mode on the aligned 224 × 224
face crop. The model and tracker are each initialized once when the webcam
starts; the tracker receives the resulting landmark list on each frame.

MediaPipe `x`, `y`, and `z` values are preserved as normalized face-crop
coordinates (the feature helpers continue converting `x` and `y` to crop
pixels for their existing formulas). FaceLandmarker returns
`FaceLandmarkerResult.face_landmarks` as a list of faces, each containing
`NormalizedLandmark` objects. The installed attention model provides 478
points (468 mesh points plus 10 iris points); the selected regions use the
model's existing topology and feature ordering. `FACIAL_REGIONS` in
`landmark_tracking.py` centralizes selected Face Mesh indices: eye outlines
match the existing EAR calculation, eyebrows include the existing 105/334
feature points, the mouth includes 61/13/14/291, and the face outline uses
234/10/454/152. These are geometric regions, not psychological indicators.
All coordinates must be finite and image-plane x/y must lie in `[0, 1]`; z is
relative depth and may be negative. An invalid coordinate invalidates that
frame and clears the comparison baseline.

`FacialLandmarkTracker.update()` returns a JSON-compatible record with:

- `frame_id`, `face_detected`, `tracking_valid`, and `status` (`initialized`,
  `tracked`, `possible_discontinuity`, `invalid_landmarks`, or `no_face`).
- `landmarks` (all MediaPipe-normalized x/y/z points) and selected `regions`;
  both are `null` for no face or invalid input. There are no fabricated points.
- `mean_displacement`, the mean Euclidean x/y change over the selected
  feature-region points, in normalized crop-coordinate units, plus `stable`.
- `processing_latency_ms`, measured with `time.perf_counter_ns()` around
  MediaPipe detection and tracking in the webcam path. The existing UI FPS
  measurement remains the whole-loop diagnostic.

The configurable `max_mean_displacement` defaults to `0.15` normalized crop
units. It marks a large change as `possible_discontinuity`; this is a threshold
flag, not a determination that tracking failed or movement was invalid. It
does not suppress coordinates. The valid observation becomes the next baseline.
A no-face or invalid-landmark frame clears the baseline, so reacquisition is
reported as `initialized` without a displacement comparison. The `0.15` value
is an initial, configurable guardrail and has not been calibrated against
camera or hardware data. Each frame is independently YuNet-cropped, rotated to
align the eye line, then resized to 224 × 224 before MediaPipe runs.
Consequently this metric measures changes in selected landmark positions
within that changing, aligned normalized crop. Re-centering, rescaling, rotation correction, pose,
and expression can reduce, amplify, or otherwise alter apparent motion; this
is not camera-frame or real-world head displacement, nor pixel movement. The
tracker only checks continuity for the currently selected face; it does not
identify a person, associate multiple faces, compensate for crop/pose changes,
or distinguish natural head movement from detector jitter.

Run the camera-free automated tests from the repository root:

```powershell
python -m unittest discover -s tests -v
```

The tracking tests use synthetic landmarks and need no webcam or downloaded
model. To manually verify the integrated path, install the documented CV
environment and model files, then run:

```powershell
.\.venv-deepface\Scripts\python.exe ai\computer_vision\webcam.py
```

Move your face gradually and observe the output via `S`: `initialized` should
be followed by `tracked`, with a displacement value and non-negative latency.
Move out of view, then return: the payload should show `no_face` followed by
`initialized`. A sufficiently abrupt crop movement may report
`possible_discontinuity`. This manual check requires an accessible webcam, the
YuNet and Face Landmarker model files, and a functioning DeepFace environment; no
hardware performance claim is made here.

## Project Structure

```text
ai/
└── computer_vision/
    ├── models/
    │   ├── face_detection_yunet_2026may.onnx
    │   └── face_landmarker.task
    │
    ├── affect_output.py
    ├── emotion_analysis.py
    ├── face_processing.py
    ├── facial_features.py
    ├── landmark_tracking.py
    ├── webcam.py
    └── README.md
```

## Requirements

The Computer Vision module uses Python 3.11 and the following tested dependency versions:

| Library | Version |
|---|---|
| NumPy | 1.26.4 |
| OpenCV | 4.10.0.84 |
| MediaPipe | 0.10.21 |
| TensorFlow | 2.15.1 |
| Keras | 2.15.0 |
| DeepFace | 0.0.93 |

A dedicated virtual environment named `.venv-deepface` is used to isolate these dependencies from other project environments.

## Running the Module

From the project root:

```powershell
.\.venv-deepface\Scripts\python.exe ai\computer_vision\webcam.py
```

The webcam window will open and display:

- Face bounding box
- Facial landmarks
- Facial feature values
- Current dominant emotion
- Eye-line roll angle and approximate FPS

Press `S` to print the latest standardized facial-affect JSON payload. Press
`Q` to close the application.

## Models

The following model files are required:

### YuNet

```text
models/face_detection_yunet_2026may.onnx
```

Used for face detection.

### MediaPipe Face Landmarker

```text
models/face_landmarker.task
```

Used for facial landmark detection.

DeepFace downloads its required emotion model weights automatically when required by the environment.

## Current Limitations

- The pipeline currently processes the first detected face.
- Emotion classification is performed approximately once per second.
- The extracted feature vector is currently prepared for future backend/ML integration.
- Temporal analysis and emotion smoothing are not currently implemented.
- Backend/database integration is outside the current CV module.
- Runtime validation of alignment quality and FPS under different lighting and
  camera conditions has not yet been documented.
- Facial emotion predictions are estimates and may be affected by lighting, camera quality, facial expressions, and individual differences. They should not be treated as a mental-health diagnosis or definitive evidence of a person's emotional state.

## Future Integration

The extracted facial feature vector can later be passed to the project's ML/backend layer for further analysis.

Possible future integration points include:

- Temporal facial-feature analysis
- Feature aggregation
- ML model integration
- Backend communication
- Storage of analysis results

## Responsibility

This module covers the Computer Vision responsibilities of the MindSense project, including:

- Image/frame preprocessing
- Face detection
- Face cropping and normalization
- Facial landmark detection
- Facial feature extraction
- Emotion detection
- CV pipeline testing and optimization

## Environment Setup

Run these commands from the repository root in PowerShell.

Create the virtual environment:

```powershell
py -3.11 -m venv .venv-deepface
```

Activate it:

```powershell
.\.venv-deepface\Scripts\Activate.ps1
```

Install the tested dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install numpy==1.26.4 opencv-python==4.10.0.84 mediapipe==0.10.21
python -m pip install tensorflow==2.15.1 deepface==0.0.93
```

If TensorFlow encounters an `ml_dtypes` compatibility error involving JAX, and JAX is not required by another project component, run:

```powershell
python -m pip uninstall -y jax jaxlib
```

Use Python 3.11 for this tested TensorFlow and DeepFace setup.
