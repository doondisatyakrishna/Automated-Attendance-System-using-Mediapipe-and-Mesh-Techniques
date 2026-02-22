import os
import cv2
import numpy as np
import mediapipe as mp
import face_recognition
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import pickle
from typing import Optional, List
from math import hypot

# --- Load Liveness (CNN Spoof) Model and Label Encoder ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "liveness.keras")
LE_PATH = os.path.join(os.path.dirname(__file__), "models", "le.pickle")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Liveness model not found at {MODEL_PATH}")
if not os.path.exists(LE_PATH):
    raise FileNotFoundError(f"Label encoder not found at {LE_PATH}")

liveness_model = load_model(MODEL_PATH)
with open(LE_PATH, "rb") as f:
    le = pickle.load(f)

if isinstance(le, dict):
    class_labels = list(le.keys())
else:
    class_labels = le.classes_
print(f"[INFO] Liveness CNN model loaded with classes: {class_labels}")


# --- Initialize MediaPipe Face Detector (for embeddings) ---
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

# --- Initialize MediaPipe Face Mesh (for Blink Liveness) ---
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Standard MediaPipe eye landmark indices
LEFT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
RIGHT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]

def calculate_ear(eye_landmarks, landmarks, ih, iw):
    """Calculate Eye Aspect Ratio (EAR) from normalized landmarks."""
    try:
        coords_points = [(landmarks[i].x * iw, landmarks[i].y * ih) for i in eye_landmarks]
        p2_p6 = hypot(coords_points[1][0] - coords_points[5][0], coords_points[1][1] - coords_points[5][1])
        p3_p5 = hypot(coords_points[2][0] - coords_points[4][0], coords_points[2][1] - coords_points[4][1])
        p1_p4 = hypot(coords_points[0][0] - coords_points[3][0], coords_points[0][1] - coords_points[3][1])
        ear = (p2_p6 + p3_p5) / (2.0 * p1_p4)
        return ear
    except Exception:
        return 0.3

def image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Convert image bytes into a NumPy BGR array."""
    np_arr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)


def check_liveness_cnn(img_array: np.ndarray) -> bool:
    """
    Checks a SINGLE frame for spoofing (photo/screen) using the trained CNN.
    Returns True if the image is REAL, False if FAKE.
    """
    try:
        face = cv2.resize(img_array, (32, 32))
        face = face.astype("float") / 255.0
        face = img_to_array(face)
        face = np.expand_dims(face, axis=0)

        preds = liveness_model.predict(face, verbose=0)[0]
        j = np.argmax(preds)
        label = class_labels[j]
        confidence = preds[j]

        print(f"[DEBUG] CNN Liveness prediction: {label} ({confidence:.4f})")
        # Lowered threshold
        return label.lower() == "real" and confidence > 0.60
    except Exception as e:
        print(f"[ERROR] CNN Liveness detection failed: {str(e)}")
        return False


def check_blink_liveness(image_arrays: List[np.ndarray]) -> bool:
    """
    Checks for a blink across a series of frames using MediaPipe Face Mesh.
    """
    EAR_THRESHOLD = 0.2
    if len(image_arrays) < 3:
        return False

    ear_values = []
    for img_array in image_arrays:
        ih, iw, _ = img_array.shape
        rgb_image = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_image)
        if not results.multi_face_landmarks:
            ear_values.append(0.3)
            continue
        landmarks = results.multi_face_landmarks[0].landmark
        left_ear = calculate_ear(LEFT_EYE_INDICES, landmarks, ih, iw)
        right_ear = calculate_ear(RIGHT_EYE_INDICES, landmarks, ih, iw)
        avg_ear = (left_ear + right_ear) / 2.0
        ear_values.append(avg_ear)

    eyes_closed = any(ear < EAR_THRESHOLD for ear in ear_values)
    eyes_open = any(ear > (EAR_THRESHOLD + 0.05) for ear in ear_values)
    print(f"[DEBUG] Blink check EARs: {[round(e, 2) for e in ear_values]}. Closed: {eyes_closed}, Open: {eyes_open}")
    return eyes_closed and eyes_open


def get_embedding_from_image_array(img_array: np.ndarray) -> Optional[list[float]]:
    """
    Detects a face using Mediapipe and returns its face_recognition embedding.
    (This is the original version, without num_jitters)
    """
    try:
        rgb_image = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
        results = face_detector.process(rgb_image)

        if not results.detections:
            print("[DEBUG] No face detected by Mediapipe for embedding.")
            return None

        detection = results.detections[0]
        bboxC = detection.location_data.relative_bounding_box
        ih, iw, _ = img_array.shape
        x, y, w, h = int(bboxC.xmin * iw), int(bboxC.ymin * ih), int(bboxC.width * iw), int(bboxC.height * ih)
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(iw, x + w), min(ih, y + h)
        face_location = [(y1, x2, y2, x1)] # (top, right, bottom, left)

        # This uses the default "large" model and no jitters.
        embeddings = face_recognition.face_encodings(
            rgb_image, 
            known_face_locations=face_location
        )
        if embeddings:
            return embeddings[0].tolist()
        else:
            print("[DEBUG] Face encoding failed.")
            return None
    except Exception as e:
        print(f"[ERROR] Embedding generation failed: {str(e)}")
        return None


def check_face_quality(
    img_array: np.ndarray,
    *,
    min_face_area_ratio: float = 0.05,
    min_brightness: float = 50.0,
    max_brightness: float = 220.0,
    min_laplacian_variance: float = 60.0,
) -> tuple[bool, str]:
    """
    Lightweight quality gate to reduce false matches:
    - exactly 1 face (via MediaPipe detector)
    - face size >= min_face_area_ratio of image area
    - brightness in [min_brightness, max_brightness]
    - blur check via Laplacian variance >= min_laplacian_variance

    Returns (ok, reason). reason is safe to show to user.
    """
    try:
        if img_array is None or img_array.size == 0:
            return False, "Invalid image."

        ih, iw = img_array.shape[:2]
        if ih < 2 or iw < 2:
            return False, "Invalid image."

        # Brightness gate
        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        if brightness < min_brightness:
            return False, "Image too dark."
        if brightness > max_brightness:
            return False, "Image too bright."

        # Blur gate (higher variance => sharper)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if lap_var < min_laplacian_variance:
            return False, "Image too blurry."

        # Face count + size gate (MediaPipe)
        rgb_image = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
        results = face_detector.process(rgb_image)
        detections = results.detections or []

        if len(detections) == 0:
            return False, "No face detected."
        if len(detections) > 1:
            return False, "Multiple faces detected."

        bboxC = detections[0].location_data.relative_bounding_box
        face_area_ratio = float(max(0.0, bboxC.width) * max(0.0, bboxC.height))
        if face_area_ratio < min_face_area_ratio:
            return False, "Face too small in the image."

        return True, "OK"
    except Exception as e:
        print(f"[ERROR] Face quality check failed: {str(e)}")
        return False, "Face quality check failed."


def estimate_face_quality_score(img_array: np.ndarray) -> float:
    """
    Compute a relative quality score for a *single-face* image.
    Used only to pick the best profile picture among already
    quality-passed images.

    Higher is better. Returns 0.0 on failure.
    """
    try:
        if img_array is None or img_array.size == 0:
            return 0.0

        ih, iw = img_array.shape[:2]
        if ih < 2 or iw < 2:
            return 0.0

        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        rgb_image = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
        results = face_detector.process(rgb_image)
        detections = results.detections or []
        if not detections:
            return 0.0

        bboxC = detections[0].location_data.relative_bounding_box
        face_area_ratio = float(max(0.0, bboxC.width) * max(0.0, bboxC.height))

        # Normalize components into [0, 1] and weight them
        # Center brightness around ~128
        brightness_score = max(0.0, 1.0 - abs(brightness - 128.0) / 128.0)
        # Sharper images get higher score; cap variance to avoid extreme values
        sharpness_score = max(0.0, min(lap_var / 200.0, 1.0))
        # Larger face in frame is generally better up to a point
        size_score = max(0.0, min(face_area_ratio / 0.3, 1.0))

        score = 0.3 * brightness_score + 0.4 * sharpness_score + 0.3 * size_score
        return float(score)
    except Exception as e:
        print(f"[ERROR] Face quality scoring failed: {str(e)}")
        return 0.0