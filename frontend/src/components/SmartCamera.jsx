// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
tf.enableProdMode();
import { playAlarm, playVoiceAlarm } from '../utils/soundEffects';
import { t } from '../utils/translations';

// Global model instance to share across cameras
let globalCocoModel = null;
let isGlobalLoading = false;

export default function SmartCamera({ 
  onAnomaly, 
  isDetectionActive, 
  videoUrl, 
  selectedDeviceId, 
  language, 
  alarmMode,
  sourceType = 'webcam',
  camName = 'CAM-01',
  isPrimary = true,
  globalLockdown = false
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const cameraInstanceRef = useRef(null);
  
  // Realism Video Backgrounds
  const [bgVideo, setBgVideo] = useState(null);
  const VIDEO_URLS = {
    mall_people: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/people-detection.mp4',
    classroom: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4',
    face_tracking: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female.mp4',
    traffic_cars: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4',
    industrial_bolt: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/bolt-detection.mp4',
        store_aisle: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/store-aisle-detection.mp4',
    pedestrian_track: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4',
    worker_zone: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/worker-zone-detection.mp4',
    bottle_detection: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/bottle-detection.mp4',
    long_indoor: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking.mp4',
    long_outdoor: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4'
  };

  useEffect(() => {
    const requiresModel = sourceType !== 'webcam' && sourceType !== 'face_tracking' && sourceType !== 'industrial_bolt' && sourceType !== 'bottle_detection';
    
    if (requiresModel && !globalCocoModel) {
      if (!isGlobalLoading) {
        isGlobalLoading = true;
        setIsAiLoading(true);
        cocoSsd.load({ base: 'lite_mobilenet_v2' }).then(model => {
          globalCocoModel = model;
          cocoModelRef.current = model;
          isGlobalLoading = false;
          setIsAiLoading(false);
        }).catch(e => {
          console.error('COCO-SSD Load Error:', e);
          isGlobalLoading = false;
          setIsAiLoading(false);
        });
      } else {
        // Wait for it
        setIsAiLoading(true);
        const interval = setInterval(() => {
          if (globalCocoModel) {
            cocoModelRef.current = globalCocoModel;
            clearInterval(interval);
            setIsAiLoading(false);
          }
        }, 300);
      }
    } else if (requiresModel && globalCocoModel) {
      cocoModelRef.current = globalCocoModel;
      setIsAiLoading(false);
    }

    const targetUrl = videoUrl || VIDEO_URLS[sourceType];
    if (sourceType !== 'webcam' && targetUrl) {
      const vid = videoRef.current;
      if (vid) {
        vid.crossOrigin = 'anonymous'; // Enable CORS to prevent canvas tainting
        vid.src = targetUrl;
        vid.load(); // Explicitly load the new source
        vid.loop = true;
        vid.muted = true;
        vid.play().catch(e => console.error("Sim video play error:", e));
        setBgVideo(vid);
      }
    } else {
      setBgVideo(null);
    }
  }, [sourceType, videoUrl]);

  const lastAnomalyTime = useRef(0);
  const animationFrameRef = useRef(null);

  // Buffer circular and Trajectory
  const frameBufferRef = useRef([]); 
  const trajectoryRef = useRef([]);  
  const isCapturingPostRef = useRef(false);
  const postCaptureFramesRef = useRef([]);
  const pendingAlertRef = useRef(null);

  // Refs for language, alarmMode, and detection activity
  const languageRef = useRef(language);
  const alarmModeRef = useRef(alarmMode);
  const isDetectionActiveRef = useRef(isDetectionActive);
  const isPrimaryRef = useRef(isPrimary);
  useEffect(() => { isPrimaryRef.current = isPrimary; }, [isPrimary]);
  const cocoModelRef = useRef(null);
  const trackedObjectsRef = useRef(new Map());
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { alarmModeRef.current = alarmMode; }, [alarmMode]);
  useEffect(() => { isDetectionActiveRef.current = isDetectionActive; }, [isDetectionActive]);

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
      
      canvasCtx.fillStyle = '#ff003c';
      canvasCtx.font = '24px "Share Tech Mono", monospace';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText("SYSTEM OFFLINE", canvasElement.width / 2, canvasElement.height / 2);
      return () => {};
    }

    // ==========================================
    // SIMULATION MODE (SPHAR / UVH-26)
    // ==========================================
    if (sourceType !== 'webcam') {
      setIsReady(true);
      let simTick = 0;
      
      // ML Loop for real object tracking
      let mlRunning = true;
      const detectLoop = async () => {
        if (!mlRunning || !isDetectionActiveRef.current) return;
        
        if (isPrimaryRef.current && cocoModelRef.current && bgVideo && bgVideo.readyState >= 2 && bgVideo.videoWidth > 0) {
           if (sourceType !== 'face_tracking' && sourceType !== 'industrial_bolt') {
             try {
                const predictions = await cocoModelRef.current.detect(bgVideo);
                const currentObjects = new Map();
                
                const scaleX = 1280 / bgVideo.videoWidth;
                const scaleY = 720 / bgVideo.videoHeight;
                
                predictions.forEach(pred => {
                    if (pred.score < 0.4) return;
                    
                    const x = pred.bbox[0] * scaleX;
                    const y = pred.bbox[1] * scaleY;
                    const w = pred.bbox[2] * scaleX;
                    const h = pred.bbox[3] * scaleY;
                    const cx = x + w/2;
                    const cy = y + h/2;
                    
                    let bestId = null;
                    let minDist = 150;
                    trackedObjectsRef.current.forEach((obj, id) => {
                        if (obj.class !== pred.class) return;
                        const dist = Math.hypot(obj.cx - cx, obj.cy - cy);
                        if (dist < minDist) { minDist = dist; bestId = id; }
                    });
                    
                    if (bestId) {
                        const obj = trackedObjectsRef.current.get(bestId);
                        obj.cx = cx; obj.cy = cy; obj.targetBbox = [x, y, w, h]; obj.frames++;
                        currentObjects.set(bestId, obj);
                        trackedObjectsRef.current.delete(bestId);
                    } else {
                        const newId = Math.random().toString(36).substring(2, 6).toUpperCase();
                        currentObjects.set(newId, { 
                            cx, cy, currentBbox: [x, y, w, h], targetBbox: [x, y, w, h], class: pred.class, 
                            frames: 1, speed: 40 + Math.random()*30, 
                            anomaly: Math.random() < 0.05,
                            label: pred.class === 'person' ? t(languageRef.current, 'LBL_PERSON') + ' ' + newId : 
                                   pred.class === 'car' ? t(languageRef.current, 'LBL_CAR') + ' ' + newId : 
                                   pred.class.toUpperCase() + ' ' + newId
                        });
                    }
                });
                
                trackedObjectsRef.current = currentObjects;
             } catch(e) { console.error(e); }
           }
        }
        
        setTimeout(detectLoop, 150); // Optimization: 6 FPS ML inference (LERP maintains 60 FPS visual)
      };
      detectLoop();

      // Fake Logic for bolt and face tracking (as COCO doesn't track these properly)
      let fakeActors = [];
      if (sourceType === 'face_tracking') {
          fakeActors = [{ id: 'F-1', x: 450, y: 150, vx: 0, vy: 0, w: 350, h: 420, type: 'face', label: 'Analyse Faciale', anomaly: false, matchProgress: 0 }];
      } else if (sourceType === 'industrial_bolt' || sourceType === 'bottle_detection') {
          fakeActors = [
            { id: 'B-1', x: 200, y: 500, vx: 2.5 + Math.random(), vy: 0, w: 40, h: 40, type: 'object', label: 'Boulon', anomaly: false },
            { id: 'B-2', x: 600, y: 500, vx: 2.5 + Math.random(), vy: 0, w: 40, h: 40, type: 'object', label: 'Boulon', anomaly: false }
          ];
      }

      const drawSimFrame = () => {
        if (!isDetectionActiveRef.current) return;
        simTick++;

        // Render Background
        if (bgVideo && bgVideo.readyState >= 2) {
          canvasCtx.drawImage(bgVideo, 0, 0, 1280, 720);
          canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          canvasCtx.fillRect(0, 0, 1280, 720);
        } else {
          canvasCtx.fillStyle = '#050a0f';
          canvasCtx.fillRect(0, 0, 1280, 720);
        }

        // Draw grid
        canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        canvasCtx.lineWidth = 1;
        for (let i = 0; i < 1280; i += 80) { canvasCtx.beginPath(); canvasCtx.moveTo(i, 0); canvasCtx.lineTo(i, 720); canvasCtx.stroke(); }
        for (let j = 0; j < 720; j += 60) { canvasCtx.beginPath(); canvasCtx.moveTo(0, j); canvasCtx.lineTo(1280, j); canvasCtx.stroke(); }

        let alertCondition = false;
        let alertMsgKey = 'ANOMALY_DETECTED';

        // Fake processing
        fakeActors.forEach(actor => {
          actor.x += actor.vx; actor.y += actor.vy;
          if (sourceType === 'face_tracking') {
             actor.x = 450 + Math.sin(simTick * 0.05) * 35 + Math.cos(simTick * 0.02) * 20;
             actor.y = 150 + Math.cos(simTick * 0.04) * 25 + Math.sin(simTick * 0.01) * 10;
             if (Math.random() < 0.005) actor.matchProgress += 10;
             if (actor.matchProgress > 0 && Math.random() < 0.02) actor.matchProgress -= 2;
             
             if (actor.matchProgress > 100) {
               actor.anomaly = true; actor.label = '🟢 MATCH IDENTITÉ (99.1%)';
               if (Math.random() < 0.01) actor.matchProgress = 0; 
             } else {
               actor.anomaly = false; actor.label = `🔍 Analyse: ${Math.max(0, Math.floor(actor.matchProgress))}%`;
             }
          } else if (sourceType === 'industrial_bolt') {
             if (actor.x > 1300) { actor.x = -100; actor.anomaly = Math.random() > 0.85; }
             if (actor.anomaly) { actor.label = t(languageRef.current, 'LBL_DEFAUT_QA'); alertCondition = true; alertMsgKey = 'MSG_QA_DEFECT'; anomalyObj = actor; }
             else { actor.label = t(languageRef.current, 'LBL_PIECE_OK'); }
          }
          
          const color = actor.anomaly ? '#ff003c' : '#00f0ff';
          const bgColor = actor.anomaly ? 'rgba(255, 0, 60, 0.15)' : 'rgba(0, 240, 255, 0.08)';
          canvasCtx.strokeStyle = color; canvasCtx.lineWidth = 1; canvasCtx.fillStyle = bgColor;
          canvasCtx.fillRect(actor.x, actor.y, actor.w, actor.h); canvasCtx.strokeRect(actor.x, actor.y, actor.w, actor.h);
          
          canvasCtx.font = 'bold 16px "Share Tech Mono", monospace';
          const textWidth = canvasCtx.measureText(actor.label).width;
          canvasCtx.fillStyle = color; canvasCtx.fillRect(actor.x, actor.y - 25, textWidth + 16, 25);
          canvasCtx.fillStyle = '#000'; canvasCtx.fillText(actor.label, actor.x + 8, actor.y - 7);
        });

        // Real ML rendering
        trackedObjectsRef.current.forEach((obj, id) => {
           if (sourceType === 'mall_people' || sourceType === 'long_indoor' || sourceType === 'store_aisle') {
              if (Math.random() < 0.002) obj.anomaly = true;
              if (obj.anomaly) { obj.label = t(languageRef.current, 'LBL_CPT_SUSPECT'); alertCondition = true; alertMsgKey = 'MSG_SUSPICIOUS'; anomalyObj = obj; }
           } else if (sourceType === 'traffic_cars') {
              if (obj.class === 'car' && obj.speed < 110 && Math.random() < 0.01) obj.speed = 110 + Math.random() * 40;
              if (obj.speed > 90) { obj.anomaly = true; obj.label = `🛑 EXCES VITESSE (${Math.floor(obj.speed)}km/h)`; alertCondition = true; alertMsgKey = 'MSG_SPEEDING'; anomalyObj = obj; }
              else { obj.label = `🚗 Auto (${Math.floor(obj.speed)}km/h)`; }
           } else if (sourceType === 'long_outdoor' || sourceType === 'pedestrian_track' || sourceType === 'worker_zone') {
              if (Math.random() < 0.001) obj.anomaly = true;
              if (obj.anomaly) { obj.label = t(languageRef.current, 'LBL_INTRUSION'); alertCondition = true; alertMsgKey = 'MSG_INTRUSION'; anomalyObj = obj; }
           } else if (sourceType === 'classroom') {
              if (Math.random() < 0.002) obj.anomaly = true;
              if (obj.anomaly) { obj.label = t(languageRef.current, 'LBL_MVT_BRUSQUE'); alertCondition = true; alertMsgKey = 'MSG_SUSPICIOUS'; anomalyObj = obj; }
           }
           
           
           // LERP pour des mouvements ultra fluides à 60fps malgré l'inférence asynchrone
           const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
           obj.currentBbox[0] = lerp(obj.currentBbox[0], obj.targetBbox[0], 0.35);
           obj.currentBbox[1] = lerp(obj.currentBbox[1], obj.targetBbox[1], 0.35);
           obj.currentBbox[2] = lerp(obj.currentBbox[2], obj.targetBbox[2], 0.35);
           obj.currentBbox[3] = lerp(obj.currentBbox[3], obj.targetBbox[3], 0.35);
           const [x, y, w, h] = obj.currentBbox;

           const color = obj.anomaly ? '#ff003c' : '#00f0ff';
           const bgColor = obj.anomaly ? 'rgba(255, 0, 60, 0.15)' : 'rgba(0, 240, 255, 0.08)';
           
           canvasCtx.strokeStyle = color; canvasCtx.lineWidth = 1; canvasCtx.fillStyle = bgColor;
           canvasCtx.fillRect(x, y, w, h); canvasCtx.strokeRect(x, y, w, h);
           
           const clen = 15;
           canvasCtx.beginPath();
           canvasCtx.moveTo(x, y + clen); canvasCtx.lineTo(x, y); canvasCtx.lineTo(x + clen, y);
           canvasCtx.moveTo(x + w - clen, y); canvasCtx.lineTo(x + w, y); canvasCtx.lineTo(x + w, y + clen);
           canvasCtx.moveTo(x, y + h - clen); canvasCtx.lineTo(x, y + h); canvasCtx.lineTo(x + clen, y + h);
           canvasCtx.moveTo(x + w - clen, y + h); canvasCtx.lineTo(x + w, y + h); canvasCtx.lineTo(x + w, y + h - clen);
           canvasCtx.lineWidth = 3; canvasCtx.stroke();
           
           canvasCtx.font = 'bold 16px "Share Tech Mono", monospace';
           const textWidth = canvasCtx.measureText(obj.label).width;
           canvasCtx.fillStyle = color; canvasCtx.fillRect(x, y - 25, textWidth + 16, 25);
           canvasCtx.fillStyle = '#000'; canvasCtx.fillText(obj.label, x + 8, y - 7);
        });

        // Threat alert overlay logic
        if (alertCondition) {
          const now = Date.now();
          if (now - lastAnomalyTime.current > 8000) { // 8s cooldown
            lastAnomalyTime.current = now;
            
            if (alarmModeRef.current === 'siren') playAlarm();
            else if (alarmModeRef.current === 'voice') playVoiceAlarm(languageRef.current, t(languageRef.current, 'VOICE_ALERT'));

                        let croppedImg = '';
            if (anomalyObj && (anomalyObj.currentBbox || (anomalyObj.w && anomalyObj.h))) {
              try {
                const tCanvas = document.createElement('canvas');
                let x, y, w, h;
                if (anomalyObj.currentBbox) {
                  [x, y, w, h] = anomalyObj.currentBbox;
                } else {
                  x = anomalyObj.x; y = anomalyObj.y; w = anomalyObj.w; h = anomalyObj.h;
                }
                const padX = w * 0.2;
                const padY = h * 0.2;
                tCanvas.width = w + padX * 2;
                tCanvas.height = h + padY * 2;
                const tCtx = tCanvas.getContext('2d');
                tCtx.drawImage(
                  canvasElement, 
                  Math.max(0, x - padX), Math.max(0, y - padY), w + padX * 2, h + padY * 2,
                  0, 0, tCanvas.width, tCanvas.height
                );
                croppedImg = tCanvas.toDataURL('image/jpeg', 0.8);
              } catch (e) { console.error('Crop failed', e); }
            }

            pendingAlertRef.current = {
              id: now,
              timestamp: new Date().toLocaleTimeString(languageRef.current === 'en' ? 'en-US' : 'fr-FR', { hour12: false }),
              msgKey: alertMsgKey,
              image: '', // Will be set by postCapture buffer
              croppedImage: croppedImg,
              streamUrl: `${camName} (${sourceType.toUpperCase()})`
            };
            isCapturingPostRef.current = true;
            postCaptureFramesRef.current = [];
          }

          if (Math.floor(simTick / 10) % 2 === 0) {
            canvasCtx.strokeStyle = '#ff003c'; canvasCtx.lineWidth = 8;
            canvasCtx.strokeRect(20, 20, 1240, 680);
            canvasCtx.fillStyle = '#ff003c'; canvasCtx.font = 'bold 24px "Share Tech Mono", monospace';
            canvasCtx.textAlign = 'center'; canvasCtx.fillText("RIS: THREAT ALERT DETECTED", 640, 60);
          }
        }


        // Circular Buffer Storage for Simulated Footage Clip Replays
        let frameData = null;
        try {
          frameData = canvasElement.toDataURL('image/jpeg', 0.25);
        } catch (e) {
          // Ignore canvas taint error
        }
        
        if (frameData) {
          if (isCapturingPostRef.current) {
            postCaptureFramesRef.current.push(frameData);
            if (postCaptureFramesRef.current.length >= 40) {
              isCapturingPostRef.current = false;
              if (pendingAlertRef.current) {
                 pendingAlertRef.current.image = postCaptureFramesRef.current[39];
                 pendingAlertRef.current.clip = [...postCaptureFramesRef.current];
                 onAnomaly(pendingAlertRef.current);
                 pendingAlertRef.current = null;
              }
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(drawSimFrame);

      };

      drawSimFrame();

      return () => {
        mlRunning = false;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }

    // ==========================================
    // WEBCAM MODE (MediaPipe Pose Detection)
    // ==========================================
    const Pose = window.Pose;
    const POSE_CONNECTIONS = window.POSE_CONNECTIONS;
    const drawConnectors = window.drawConnectors;
    const drawLandmarks = window.drawLandmarks;

    if (!Pose) {
      // Fallback if MediaPipe window objects are missing
      setIsReady(true);
      canvasCtx.fillStyle = '#050505';
      canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.fillStyle = '#ff003c';
      canvasCtx.font = '16px "Share Tech Mono", monospace';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText("MEDIAPIPE LIBRARIES OFFLINE", canvasElement.width / 2, canvasElement.height / 2);
      return () => {};
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
          const targetW = 1280;
          const targetH = 720;
          
          if (canvasElement.width !== targetW) {
            canvasElement.width = targetW;
            canvasElement.height = targetH;
          }

          const imgW = results.image.width || results.image.videoWidth || targetW;
          const imgH = results.image.height || results.image.videoHeight || targetH;
          
          const targetRatio = targetW / targetH;
          const imgRatio = imgW / imgH;
          
          let sw, sh, sx, sy;
          
          if (imgRatio > targetRatio) {
            sh = imgH;
            sw = imgH * targetRatio;
            sx = (imgW - sw) / 2;
            sy = 0;
          } else {
            sw = imgW;
            sh = imgW / targetRatio;
            sx = 0;
            sy = (imgH - sh) / 2;
          }

          canvasCtx.clearRect(0, 0, targetW, targetH);
          canvasCtx.globalCompositeOperation = 'source-over';
          canvasCtx.drawImage(results.image, sx, sy, sw, sh, 0, 0, targetW, targetH);
          
          const frameData = canvasElement.toDataURL('image/jpeg', 0.3);
          
          if (isCapturingPostRef.current) {
            postCaptureFramesRef.current.push(frameData);
            if (postCaptureFramesRef.current.length >= 50) { 
              isCapturingPostRef.current = false;
              if (pendingAlertRef.current) {
                const fullClip = [...frameBufferRef.current, ...postCaptureFramesRef.current];
                
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

          // Simulated background YOLO / FaceNet for local Webcam
          if (isDetectionActiveRef.current && results.poseLandmarks) {
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00f0ff', lineWidth: 2});
            drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#ff003c', lineWidth: 1, radius: 2});

            const landmarks = results.poseLandmarks;
            const nose = landmarks[0];
            
            if (nose) {
              const nx = nose.x * canvasElement.width;
              const ny = nose.y * canvasElement.height;
              
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
                if (now - lastAnomalyTime.current > 8000) { 
                  lastAnomalyTime.current = now;
                  try {
                    if (alarmModeRef.current === 'siren') playAlarm();
                    else if (alarmModeRef.current === 'voice') playVoiceAlarm(languageRef.current, t(languageRef.current, 'VOICE_ALERT'));
                    
                    const snapshotBase64 = canvasElement.toDataURL('image/jpeg', 0.6);
                    const lang = languageRef.current;
                    const timestamp = new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'fr-FR', { hour12: false });
                    
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
                    console.error("Anomaly handler error:", err);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("onResults error:", error);
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
      videoElement.load();
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
  }, [videoUrl, isDetectionActive, onAnomaly, selectedDeviceId, sourceType, camName, bgVideo]);

  return (
    <div className="smart-camera-container" style={{ position: 'relative', width: '100%', height: '100%', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', overflow: 'hidden' }}>
      {!isReady && !videoUrl && (
        <div style={{ color: 'var(--border-glow)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', zIndex: 10 }}>
          <div style={{ width: '50px', height: '50px', border: '3px solid rgba(0, 240, 255, 0.2)', borderTop: '3px solid var(--border-glow)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ letterSpacing: '2px', fontSize: '14px' }}>{t(languageRef.current, 'INIT_CORE')}</span>
        </div>
      )}
      <video ref={videoRef} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} playsInline muted loop></video>
      <canvas ref={canvasRef} width={1280} height={720} style={{ width: '100%', height: '100%', objectFit: 'cover', display: isReady || videoUrl ? 'block' : 'none', transform: (videoUrl || sourceType !== 'webcam') ? 'none' : 'scaleX(-1)' }} />
      
      {/* HUD tag showing Cam Name and Source */}
      {isReady && (
        <div className="cam-corner-tag" style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid var(--border-glow)', padding: '2px 8px', fontSize: '10px', color: 'var(--border-glow)', zIndex: 10, fontFamily: '"Share Tech Mono", monospace' }}>
          {camName} / {sourceType.startsWith('ucf_') ? t(language, 'SPHAR_SOURCE') : sourceType.startsWith('earthcam_') ? t(language, 'UVH26_SOURCE') : (t(language, sourceType.toUpperCase() + '_SOURCE') || sourceType.toUpperCase())}
        </div>
      )}

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
