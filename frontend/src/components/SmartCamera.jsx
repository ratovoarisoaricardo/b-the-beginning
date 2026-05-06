// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playAlarm, playVoiceAlarm } from '../utils/soundEffects';
import { t } from '../utils/translations';

export default function SmartCamera({ onAnomaly, isDetectionActive, videoUrl, selectedDeviceId, language, alarmMode }) {
  const Pose = window.Pose;
  const POSE_CONNECTIONS = window.POSE_CONNECTIONS;
  const Camera = window.Camera;
  const drawConnectors = window.drawConnectors;
  const drawLandmarks = window.drawLandmarks;
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const cameraInstanceRef = useRef(null);
  
  const lastAnomalyTime = useRef(0);
  const animationFrameRef = useRef(null);

  // Buffer circulaire et Trajectoire
  const frameBufferRef = useRef([]); // Stocke les 50 dernières frames (environ 5-7s)
  const trajectoryRef = useRef([]);  // Stocke les 100 derniers points du nez
  const isCapturingPostRef = useRef(false);
  const postCaptureFramesRef = useRef([]);
  const pendingAlertRef = useRef(null);

  // Refs pour language et alarmMode
  const languageRef = useRef(language);
  const alarmModeRef = useRef(alarmMode);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { alarmModeRef.current = alarmMode; }, [alarmMode]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement?.getContext('2d');

    if (!canvasElement || !canvasCtx) return;

    if (!isDetectionActive) {
      setIsReady(false);
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.fillStyle = '#050505';
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Dessiner du "bruit statique" ou un simple message "OFFLINE"
      canvasCtx.fillStyle = '#ff003c';
      canvasCtx.font = '24px "Share Tech Mono", monospace';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText("SYSTEM OFFLINE", canvasElement.width / 2, canvasElement.height / 2);
      
      return () => {}; // Pas de nettoyage nécessaire
    }

    const pose = new Pose({
      locateFile: (file) => `/mediapipe/pose/${file}`
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results) => {
      canvasCtx.save();
      try {
        if (results.image) {
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          canvasCtx.globalCompositeOperation = 'source-over';
          canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
          
          // Sauvegarde dans le buffer circulaire (RAM uniquement)
          // On réduit la taille et la qualité pour préserver la RAM
          const frameData = canvasElement.toDataURL('image/jpeg', 0.3);
          
          if (isCapturingPostRef.current) {
            postCaptureFramesRef.current.push(frameData);
            if (postCaptureFramesRef.current.length >= 50) { // On capture 50 frames après (~5s)
              isCapturingPostRef.current = false;
              if (pendingAlertRef.current) {
                const fullClip = [...frameBufferRef.current, ...postCaptureFramesRef.current];
                
                // Calcul de la direction de sortie
                let exitDir = "LOST";
                if (trajectoryRef.current.length > 20) {
                  const lastPoints = trajectoryRef.current.slice(-10);
                  const avgX = lastPoints.reduce((sum, p) => sum + p.x, 0) / 10;
                  const avgY = lastPoints.reduce((sum, p) => sum + p.y, 0) / 10;
                  if (avgX < 0.15) exitDir = "LEFT";
                  else if (avgX > 0.85) exitDir = "RIGHT";
                  else if (avgY < 0.15) exitDir = "TOP";
                }

                onAnomaly({
                  ...pendingAlertRef.current,
                  clip: fullClip,
                  trajectory: [...trajectoryRef.current],
                  exitDirection: exitDir
                });
                pendingAlertRef.current = null;
                postCaptureFramesRef.current = [];
              }
            }
          } else {
            frameBufferRef.current.push(frameData);
            if (frameBufferRef.current.length > 50) frameBufferRef.current.shift();
          }

          canvasCtx.fillStyle = 'rgba(0, 240, 255, 0.05)';
          canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

          if (isDetectionActive && results.poseLandmarks) {
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00f0ff', lineWidth: 2});
            drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#ff003c', lineWidth: 1, radius: 2});

            const landmarks = results.poseLandmarks;
            const nose = landmarks[0];
            
            if (nose) {
              const nx = nose.x * canvasElement.width;
              const ny = nose.y * canvasElement.height;
              
              // Enregistrement trajectoire
              trajectoryRef.current.push({ x: nose.x, y: nose.y, t: Date.now() });
              if (trajectoryRef.current.length > 100) trajectoryRef.current.shift();

              canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
              canvasCtx.lineWidth = 2;
              canvasCtx.strokeRect(nx - 60, ny - 80, 120, 120);
              
              canvasCtx.beginPath();
              canvasCtx.moveTo(nx + 60, ny - 20);
              canvasCtx.lineTo(nx + 100, ny - 50);
              canvasCtx.lineTo(nx + 200, ny - 50);
              canvasCtx.stroke();
              
              canvasCtx.fillStyle = '#00f0ff';
              canvasCtx.font = '14px "Share Tech Mono", monospace';
              canvasCtx.fillText(t(languageRef.current, 'ID_UNKNOWN'), nx + 105, ny - 60);
              canvasCtx.fillText(t(languageRef.current, 'THREAT_ANALYZING'), nx + 105, ny - 45);
            }

            const leftWrist = landmarks[15];
            const rightWrist = landmarks[16];

            if (leftWrist && rightWrist && nose) {
              if (leftWrist.y < nose.y || rightWrist.y < nose.y) {
                if (nose) {
                  const nx = nose.x * canvasElement.width;
                  const ny = nose.y * canvasElement.height;
                  canvasCtx.fillStyle = '#ff003c';
                  canvasCtx.fillText(t(languageRef.current, 'THREAT_LETHAL'), nx + 105, ny - 45);
                  canvasCtx.strokeStyle = '#ff003c';
                  canvasCtx.strokeRect(nx - 60, ny - 80, 120, 120);
                }

                const now = Date.now();
                if (now - lastAnomalyTime.current > 8000) { // 8s cooldown pour laisser le temps au clip
                  lastAnomalyTime.current = now;
                  try {
                    if (alarmModeRef.current === 'siren') playAlarm();
                    else if (alarmModeRef.current === 'voice') playVoiceAlarm(languageRef.current, t(languageRef.current, 'VOICE_ALERT'));
                    
                    const snapshotBase64 = canvasElement.toDataURL('image/jpeg', 0.6);
                    const lang = languageRef.current;
                    const timestamp = new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', { hour12: false });
                    
                    // On prépare l'alerte mais on attend la fin du post-capture pour l'envoyer
                    pendingAlertRef.current = {
                      id: now,
                      timestamp,
                      msgKey: 'MSG_COMBAT_POSTURE',
                      image: snapshotBase64,
                      streamUrl: videoUrl || "Local Camera"
                    };
                    isCapturingPostRef.current = true;
                    postCaptureFramesRef.current = [];

                  } catch (err) {
                    console.error("Erreur anomalie:", err);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Erreur onResults:", error);
      } finally {
        canvasCtx.restore();
      }
    });

    const processCustomVideo = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        await pose.send({ image: videoRef.current });
      }
      animationFrameRef.current = requestAnimationFrame(processCustomVideo);
    };

    if (cameraInstanceRef.current && cameraInstanceRef.current.getTracks) {
      cameraInstanceRef.current.getTracks().forEach(track => track.stop());
      cameraInstanceRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    setIsReady(false);
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.fillStyle = '#000';
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    }

    if (videoUrl) {
      setIsReady(true);
      videoElement.src = videoUrl;
      videoElement.crossOrigin = "anonymous";
      videoElement.play().catch(e => console.error("Video error:", e));
      processCustomVideo();
    } else {
      navigator.mediaDevices.getUserMedia({
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      }).then((stream) => {
        videoElement.srcObject = stream;
        cameraInstanceRef.current = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(() => {
            setIsReady(true);
            processCustomVideo();
          });
        };
      }).catch(e => console.error("Camera access error:", e));
    }

    return () => {
      pose.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (cameraInstanceRef.current && cameraInstanceRef.current.getTracks) {
        cameraInstanceRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoUrl, isDetectionActive, onAnomaly, selectedDeviceId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', overflow: 'hidden' }}>
      {!isReady && !videoUrl && (
        <div style={{ color: 'var(--border-glow)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 10 }}>
          <div style={{ width: '50px', height: '50px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTop: '3px solid var(--border-glow)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ letterSpacing: '2px', fontSize: '14px' }}>{t(languageRef.current, 'INIT_CORE')}</span>
        </div>
      )}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted loop></video>
      <canvas ref={canvasRef} width={1280} height={720} style={{ width: '100%', height: '100%', objectFit: 'cover', display: isReady || videoUrl ? 'block' : 'none', transform: videoUrl ? 'none' : 'scaleX(-1)' }} />
      {!isDetectionActive && (
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20, background: 'rgba(255, 0, 60, 0.2)', color: 'var(--alert-red)', padding: '5px 10px', border: '1px solid var(--alert-red)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
          {t(language, 'DETECTION_OFFLINE')}
        </div>
      )}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.25) 50%)', backgroundSize: '100% 4px', pointerEvents: 'none', zIndex: 5 }} />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
