# recognition_engine.py
import cv2
import mediapipe as mp
import face_recognition
from PIL import Image
import numpy as np
import io
import requests

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, min_detection_confidence=0.5)

def image_from_bytes(bytes_data):
    """Loads an image from bytes and converts to a NumPy array."""
    img = Image.open(io.BytesIO(bytes_data)).convert('RGB')
    return np.array(img)

def image_from_url(url):
    """Loads an image from a URL and converts to a NumPy array."""
    resp = requests.get(url, timeout=10)
    img = Image.open(io.BytesIO(resp.content)).convert('RGB')
    return np.array(img)

def get_embedding_from_image_array(img_array):
    """
    Uses MediaPipe to find the face and face_recognition to get the embedding.
    """
    # Process the image with MediaPipe Face Mesh to find face landmarks
    results = face_mesh.process(cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB))

    if not results.multi_face_landmarks:
        return None # No face found

    # Get the bounding box of the detected face from the mesh landmarks
    h, w, _ = img_array.shape
    landmarks = results.multi_face_landmarks[0].landmark
    x_min = min([lm.x for lm in landmarks]) * w
    y_min = min([lm.y for lm in landmarks]) * h
    x_max = max([lm.x for lm in landmarks]) * w
    y_max = max([lm.y for lm in landmarks]) * h
    
    # Define the face location in the format face_recognition expects: (top, right, bottom, left)
    face_location = (int(y_min), int(x_max), int(y_max), int(x_min))
    
    # Use face_recognition to get the encoding for the located face
    # We pass [face_location] because it expects a list of faces
    encodings = face_recognition.face_encodings(img_array, known_face_locations=[face_location])
    
    if not encodings:
        return None
        
    return encodings[0].tolist()

def cosine_similarity(a, b):
    """Calculates the cosine similarity between two embeddings."""
    a = np.array(a)
    b = np.array(b)
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return -1.0
    return float(np.dot(a, b) / denom)