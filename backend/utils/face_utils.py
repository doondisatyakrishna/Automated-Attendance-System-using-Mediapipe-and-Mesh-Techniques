import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# --- This is the main change: We no longer import face_recognition ---

# Initialize MediaPipe Face Embedder
base_options = python.BaseOptions(model_asset_path='embedder.tflite')
options = vision.FaceEmbedderOptions(base_options=base_options)
embedder = vision.FaceEmbedder.create_from_options(options)

def image_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Converts image bytes to a numpy array."""
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img_np

def get_embedding_from_image_array(img_array: np.ndarray) -> Optional[list[float]]:
    """Generates a face embedding from a numpy image array using MediaPipe."""
    # MediaPipe expects RGB images
    rgb_image = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
    
    try:
        embedding_result = embedder.embed(mp_image)
        if embedding_result.embeddings:
            # Return the first detected face embedding
            return embedding_result.embeddings[0].embedding.tolist()
        else:
            return None # No face found
    except Exception as e:
        print(f"MediaPipe embedding error: {e}")
        return None

def cosine_similarity(embedding1: list[float], embedding2: list[float]) -> float:
    """Calculates the cosine similarity between two embeddings."""
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))