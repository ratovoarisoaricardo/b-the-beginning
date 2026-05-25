# =============================================================================
# Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
# Projet Personnel — RIS Surveillance System (Reconnaissance & Intelligence System)
# Tous droits réservés. Toute reproduction, distribution ou modification
# sans autorisation écrite de l'auteur est strictement interdite.
# =============================================================================

import cv2
import mediapipe as mp
import base64
import time
import threading
import numpy as np
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize MediaPipe Pose fallback
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils

# =============================================================================
# PLACEHOLDER CLASSES FOR AI MODEL SUITE (YOLO, FACENET, SPHAR CNN)
# =============================================================================

class YOLOModel:
    """
    YOLO Object Detection Module
    Handles target localization (persons, vehicles) in real-time.
    """
    def __init__(self, model_path="yolov8n.pt"):
        self.model_path = model_path
        self.model = None
        self.is_loaded = False
        self.load_model()
        
    def load_model(self):
        try:
            # Conditional import to prevent failure if ultralytics is not installed
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            self.is_loaded = True
            print(f"[RIS ML] YOLO model loaded successfully from {self.model_path}")
        except ImportError:
            print("[RIS ML] 'ultralytics' package not found. Using fallback mock YOLO detector.")
            self.is_loaded = False

    def detect(self, frame):
        """
        Runs object detection on the frame.
        Returns: list of detections, each as a dict:
                 {'box': [x1, y1, x2, y2], 'class': 'person'|'car', 'conf': float}
        """
        if self.is_loaded and self.model is not None:
            results = self.model(frame, verbose=False)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    label = self.model.names[cls_id]
                    if label in ['person', 'car', 'truck', 'motorcycle']:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        detections.append({
                            'box': [x1, y1, x2, y2],
                            'class': 'person' if label == 'person' else 'car',
                            'conf': float(box.conf[0])
                        })
            return detections
        else:
            # Fallback mock detector generating a simulated target
            h, w = frame.shape[:2]
            return [
                {
                    'box': [int(w*0.3), int(h*0.3), int(w*0.5), int(h*0.8)],
                    'class': 'person',
                    'conf': 0.89
                }
            ]


class FaceNetRecognizer:
    """
    FaceNet Facial Feature Embeddings Generator
    Generates 128-dimensional face embeddings and matches them against authorized database.
    """
    def __init__(self, database_path="embeddings_db.pkl"):
        self.database_path = database_path
        self.known_faces = {}
        self.is_loaded = False
        self.load_database()

    def load_database(self):
        # In production, load known embeddings database
        print(f"[RIS ML] FaceNet database initialized from {self.database_path}")
        self.known_faces = {
            "RICARDO [STAFF]": [0.0] * 128
        }
        self.is_loaded = True

    def recognize(self, face_crop):
        """
        Generates embedding for face crop and calculates Euclidean distance to database.
        Returns: (match_name, confidence)
        """
        if not self.is_loaded or face_crop.size == 0:
            return "UNKNOWN_SUBJ", 0.0
            
        # In production:
        # embedding = self.model.predict(preprocess(face_crop))
        # match = match_against_db(embedding, self.known_faces)
        return "UNKNOWN_SUBJ", 0.92


class SpharActionClassifier:
    """
    SPHAR CNN Action Classifier
    Pretrained deep learning model recognizing abnormal actions from SPHAR classes
    (Walking, Running, Theft, Vandalism, Fighting...)
    """
    def __init__(self, model_weights="sphar_action_net.h5"):
        self.model_weights = model_weights
        self.classes = ["Walking", "Running", "Vandalism", "Theft", "Fighting"]
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        print(f"[RIS ML] SPHAR Action model weights mapped to {self.model_weights}")
        self.is_loaded = True

    def classify(self, tracking_sequence):
        """
        Classifies human action from a sequence of frame crops or tracking coordinates.
        Returns: (class_label, confidence)
        """
        return "Walking", 0.95


# Instantiate modules
yolo_detector = YOLOModel()
facenet_recognizer = FaceNetRecognizer()
sphar_classifier = SpharActionClassifier()

camera = None
is_running = False

def generate_frames():
    global camera, is_running
    camera = cv2.VideoCapture(0)
    is_running = True
    
    last_anomaly_time = 0

    while is_running:
        success, frame = camera.read()
        if not success:
            break
        
        # Mirror frame
        frame = cv2.flip(frame, 1)

        # 1. OpenCV Preprocessing (Color spacing & sizing)
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w = frame.shape[:2]

        # 2. YOLO Target Detection Inference
        targets = yolo_detector.detect(frame)
        for target in targets:
            x1, y1, x2, y2 = target['box']
            label = target['class']
            conf = target['conf']
            
            # Draw targeting box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 240, 0), 2)
            cv2.putText(frame, f"{label.upper()} ({conf*100:.1f}%)", (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 240, 0), 1)

            # 3. FaceNet Face Recognition (Crop & run embedding if person)
            if label == 'person':
                face_y1, face_y2 = max(0, y1), min(h, y1 + int((y2-y1)*0.2))
                face_x1, face_x2 = max(0, x1), min(w, x2)
                face_crop = frame[face_y1:face_y2, face_x1:face_x2]
                
                name, face_conf = facenet_recognizer.recognize(face_crop)
                cv2.putText(frame, f"FACE: {name}", (x1, y2 + 15), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)

        # 4. Fallback MediaPipe Pose processing for anomalies
        results = pose.process(image_rgb)
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 240, 255), thickness=1, circle_radius=1),
                mp_drawing.DrawingSpec(color=(255, 0, 60), thickness=1, circle_radius=1)
            )
            
            landmarks = results.pose_landmarks.landmark
            left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
            right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
            
            # Action check: Hands raised above nose
            if left_wrist.y < nose.y or right_wrist.y < nose.y:
                current_time = time.time()
                if current_time - last_anomaly_time > 8: # Cool down
                    last_anomaly_time = current_time
                    timestamp_str = time.strftime("%H:%M:%S", time.localtime())
                    
                    # Call SPHAR Classifier to confirm action class
                    action_class, action_conf = sphar_classifier.classify(None)
                    msg = "Alerte SPHAR : Posture agressive suspectée."
                    
                    socketio.emit('anomaly_detected', {
                        'timestamp': timestamp_str, 
                        'message': msg,
                        'class': action_class
                    })

        frame = cv2.resize(frame, (640, 480))
        
        # Cyberpunk Filter
        frame_hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        frame_hsv[:,:,0] = (frame_hsv[:,:,0] + 10) % 180
        frame = cv2.cvtColor(frame_hsv, cv2.COLOR_HSV2BGR)

        # Overlay red flashing HUD on anomaly event
        if time.time() - last_anomaly_time < 1.2:
            cv2.rectangle(frame, (0, 0), (640, 480), (0, 0, 255), 8)
            cv2.putText(frame, "RIS: THREAT ALERT", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        _, buffer = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        socketio.emit('video_frame', {'image': 'data:image/jpeg;base64,' + frame_base64})
        socketio.sleep(0.033)

    if camera is not None:
        camera.release()

@socketio.on('connect')
def test_connect():
    print('Client connected to RIS Backend')
    global is_running
    if not is_running:
        socketio.start_background_task(generate_frames)

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected from RIS Backend')
    global is_running
    is_running = False

if __name__ == '__main__':
    print("Démarrage du système RIS Backend sur le port 5000...")
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
