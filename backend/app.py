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
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# On utilise threading comme fallback simple
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils

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
        
        # Miroir pour plus de naturel
        frame = cv2.flip(frame, 1)

        # Conversion en RGB pour MediaPipe
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)
        
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2)
            )
            
            landmarks = results.pose_landmarks.landmark
            
            left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
            right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
            
            # Geste inhabituel : Mains levées plus haut que le nez
            if left_wrist.y < nose.y or right_wrist.y < nose.y:
                current_time = time.time()
                if current_time - last_anomaly_time > 3: # 1 alerte toutes les 3s max
                    last_anomaly_time = current_time
                    timestamp_str = time.strftime("%H:%M:%S", time.localtime())
                    socketio.emit('anomaly_detected', {'timestamp': timestamp_str, 'message': 'Mouvement suspect détecté : posture agressive.'})

        frame = cv2.resize(frame, (640, 480))
        
        # Filtre Cyberpunk (teinte verdâtre/bleutée légère)
        frame_hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        frame_hsv[:,:,0] = (frame_hsv[:,:,0] + 10) % 180 # décalage de teinte
        frame = cv2.cvtColor(frame_hsv, cv2.COLOR_HSV2BGR)

        # Effet visuel si anomalie
        if time.time() - last_anomaly_time < 0.5:
            cv2.rectangle(frame, (0, 0), (640, 480), (0, 0, 255), 10)
            cv2.putText(frame, "RIS: THREAT DETECTED", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        _, buffer = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        socketio.emit('video_frame', {'image': 'data:image/jpeg;base64,' + frame_base64})
        
        socketio.sleep(0.03) # ~30 FPS

    if camera is not None:
        camera.release()

@socketio.on('connect')
def test_connect():
    print('Client connected')
    global is_running
    if not is_running:
        socketio.start_background_task(generate_frames)

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')
    global is_running
    is_running = False

if __name__ == '__main__':
    print("Démarrage du système RIS Backend sur le port 5000...")
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
