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

### 8. Emotion Detection

DeepFace is used for facial emotion classification.

The current implementation uses:

```text
actions = ["emotion"]
detector_backend = "skip"
enforce_detection = False
```

The `skip` detector is used because the face has already been detected and cropped by the CV pipeline.

The dominant emotion is displayed in the webcam window.

### 9. Real-time Optimization

DeepFace emotion inference is computationally more expensive than the other processing stages.

Therefore, emotion inference is performed approximately once per second while the latest result continues to be displayed between predictions.

This reduces unnecessary repeated model inference during real-time webcam processing.

## Project Structure

```text
ai/
└── computer_vision/
    ├── models/
    │   ├── face_detection_yunet_2026may.onnx
    │   └── face_landmarker.task
    │
    ├── webcam.py
    └── README.md
```

## Requirements

The current implementation uses a dedicated Python environment for DeepFace:

```text
Python 3.11
```

Main libraries:

```text
OpenCV
NumPy
MediaPipe
DeepFace
TensorFlow
```

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

Press:

```text
Q
```

to close the application.

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
