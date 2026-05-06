// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import { Play, Square, Link2, Camera, Globe, Bell, BellOff, Mic } from 'lucide-react'
import { useState, useEffect } from 'react'
import { playClick } from '../utils/soundEffects'
import { t } from '../utils/translations'

export default function ControlPanel({ 
  isDetectionActive, 
  setIsDetectionActive, 
  videoUrl, 
  setVideoUrl,
  selectedDeviceId,
  setSelectedDeviceId,
  language,
  setLanguage,
  alarmMode,
  setAlarmMode
}) {
  const [devices, setDevices] = useState([])

  useEffect(() => {
    // Demande la permission d'abord pour avoir les labels des caméras
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
          const videoDevices = deviceInfos.filter(d => d.kind === 'videoinput')
          setDevices(videoDevices)
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId)
          }
        })
        // On arrête le stream de test
        stream.getTracks().forEach(track => track.stop())
      })
      .catch(err => console.error("Erreur permissions caméra:", err))
  }, [])

  return (
    <div className="control-bar">
      <button 
        className={`cyber-btn ${isDetectionActive ? 'danger' : ''}`}
        onClick={() => { playClick(); setIsDetectionActive(!isDetectionActive); }}
      >
        {isDetectionActive ? <Square size={16} /> : <Play size={16} />}
        <span>{isDetectionActive ? t(language, 'STOP_DETECTION') : t(language, 'START_DETECTION')}</span>
      </button>

      {/* Sélection de la Caméra Locale */}
      <div className="control-group">
        <Camera size={18} color="var(--border-glow)" />
        <select 
          className="cyber-input camera-select" 
          value={selectedDeviceId}
          onChange={(e) => { playClick(); setSelectedDeviceId(e.target.value); }}
          disabled={videoUrl !== ''}
        >
          {devices.length === 0 ? (
            <option value="">{t(language, 'DETECTING_CAMERAS')}</option>
          ) : (
            devices.map((device, idx) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `${t(language, 'CAMERA')} ${idx + 1}`}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="control-group url-group">
        <Link2 size={18} color="var(--border-glow)" />
        <input 
          type="text" 
          className="cyber-input" 
          placeholder={t(language, 'URL_PLACEHOLDER')}
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </div>

      {/* Mode Alarme */}
      <div className="control-group">
        <button 
          title="Mode Sirène"
          className={`cyber-btn icon-btn ${alarmMode === 'siren' ? 'active' : ''}`}
          onClick={() => { playClick(); setAlarmMode('siren'); }}
        >
          <Bell size={16} />
        </button>
        <button 
          title="Mode Furtif"
          className={`cyber-btn icon-btn ${alarmMode === 'stealth' ? 'active' : ''}`}
          onClick={() => { playClick(); setAlarmMode('stealth'); }}
        >
          <BellOff size={16} />
        </button>
        <button 
          title="Voix Système"
          className={`cyber-btn icon-btn ${alarmMode === 'voice' ? 'active' : ''}`}
          onClick={() => { playClick(); setAlarmMode('voice'); }}
        >
          <Mic size={16} />
        </button>
      </div>

      {/* Sélecteur de Langue */}
      <div className="control-group lang-group">
        <Globe size={18} color="var(--border-glow)" />
        <select 
          className="cyber-input lang-select" 
          value={language}
          onChange={(e) => { playClick(); setLanguage(e.target.value); }}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
          <option value="pt">PT</option>
          <option value="zh">ZH</option>
          <option value="ja">JA</option>
          <option value="mg">MG</option>
          <option value="hi">HI</option>
        </select>
      </div>
    </div>
  )
}
