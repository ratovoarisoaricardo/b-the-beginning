// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import { useState, useCallback, useEffect } from 'react'
import SmartCamera from './components/SmartCamera'
import DummyCamera from './components/DummyCamera'
import AlertPanel from './components/AlertPanel'
import ControlPanel from './components/ControlPanel'
import HistoryModal from './components/HistoryModal'
import { ShieldAlert, Activity, Database, Terminal, Power, Play, Square } from 'lucide-react'
import { playBoot, playClick, startAmbientNoise, stopAmbientNoise } from './utils/soundEffects'
import { t } from './utils/translations'

function App() {
  const [bootStage, setBootStage] = useState(0)
  const [bootText, setBootText] = useState([])
  
  const [alerts, setAlerts] = useState([])
  const [isAnomaly, setIsAnomaly] = useState(false)
  const [isDetectionActive, setIsDetectionActive] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  
  const [primaryCam, setPrimaryCam] = useState('CAM-01')
  const [cameraSources, setCameraSources] = useState({
    'CAM-01': 'webcam',
    'CAM-02': 'mall_people',
    'CAM-03': 'traffic_cars',
    'CAM-04': 'face_tracking'
  })
  
  const [language, setLanguage] = useState('fr')
  const [alarmMode, setAlarmMode] = useState('siren') // 'siren', 'stealth', 'voice'
  const [agentPhone, setAgentPhone] = useState('')
  const [globalLockdown, setGlobalLockdown] = useState(false)

  const handleStartBoot = () => {
    if (bootStage !== 0) return
    setBootStage(1)
    playBoot()
    startAmbientNoise()
    
    const sequence = [
      t(language, 'BOOT_1'),
      t(language, 'BOOT_2'),
      t(language, 'BOOT_3'),
      t(language, 'BOOT_4'),
      t(language, 'BOOT_5'),
      t(language, 'BOOT_6')
    ]
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < sequence.length) {
        // On doit utiliser une fonction pour être sûr d'avoir le state le plus récent
        setBootText(prev => {
          const newArr = [...prev]
          newArr[index] = sequence[index]
          return newArr
        })
        index++
      } else {
        clearInterval(interval)
        setTimeout(() => setBootStage(2), 800) // Laisse le temps de lire le dernier message
      }
    }, 400)
  }

  const handleShutdown = () => {
    playClick()
    setBootStage(1)
    setBootText([t(language, 'SHUTTING_DOWN')])
    
    const sequence = [
      t(language, 'SHUTDOWN_1'),
      t(language, 'SHUTDOWN_2'),
      t(language, 'SHUTDOWN_3'),
      t(language, 'SHUTDOWN_4'),
      t(language, 'SHUTDOWN_5'),
      t(language, 'SHUTDOWN_6')
    ]
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < sequence.length) {
        setBootText(prev => {
          const newArr = [...prev]
          newArr[index + 1] = sequence[index] // index+1 car on garde SHUTTING_DOWN en premier
          return newArr
        })
        index++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          // Reset final
          setAlerts([])
          setIsAnomaly(false)
          setIsDetectionActive(true)
          setShowHistory(false)
          setVideoUrl('')
          setSelectedDeviceId('')
          setBootStage(0)
          setBootText([])
        }, 1000)
      }
    }, 400)
  }

  const handleAnomaly = useCallback((alertData) => {
    setAlerts(prev => [alertData, ...prev])
    setIsAnomaly(true)
    setGlobalLockdown(true)
    setTimeout(() => setIsAnomaly(false), 2000)
    setTimeout(() => setGlobalLockdown(false), 8000)
  }, [])

  const handleDeleteAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  const handleClearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const handleDeleteSelected = useCallback((ids) => {
    setAlerts(prev => prev.filter(alert => !ids.has(alert.id)))
  }, [])

  const handleDecision = useCallback((id, decision) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === id) {
        return {
          ...alert,
          agentDecision: decision,
          decisionAt: new Date().toLocaleTimeString()
        }
      }
      return alert;
    }))
  }, [])

  const toggleHistory = () => {
    playClick()
    setShowHistory(true)
  }

  // --- ECRAN DE BOOT ---
  if (bootStage < 2) {
    return (
      <div 
        className="boot-screen" 
        onClick={handleStartBoot}
        style={{ cursor: bootStage === 0 ? 'pointer' : 'default' }}
      >
        {bootStage === 0 ? (
          <div className="blink-text" style={{ fontSize: '24px', letterSpacing: '4px' }}>
            {t(language, 'CLICK_TO_INIT')}
          </div>
        ) : (
          <div className="terminal-container">
            <Terminal size={40} style={{ marginBottom: '20px' }} />
            {bootText.map((text, i) => (
              <div key={i} className="typewriter-text">&gt; {text}</div>
            ))}
            <div className="blink-cursor">_</div>
          </div>
        )}
        <div className="boot-copyright">
          © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO — {t(language, 'ALL_RIGHTS')}
        </div>
      </div>
    )
  }

  // --- APPLICATION PRINCIPALE ---
  return (
    <>
      <div className={`hud-container ${isAnomaly ? 'alert-active' : ''}`}>
        
        <div className="hud-panel main-section">
          <div className={`hud-title ${isAnomaly ? 'alert-text' : ''}`} style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAnomaly ? <ShieldAlert size={20} /> : <Activity size={20} />}
              {t(language, 'MULTI_FEED')} - {isAnomaly ? t(language, 'THREAT_CRITICAL') : (isDetectionActive ? t(language, 'STATUS_SECURE') : t(language, 'STATUS_OFFLINE'))}
            </div>
            <button 
              className="shutdown-btn" 
              onClick={handleShutdown}
              title={t(language, 'SHUTDOWN')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 15px', background: 'rgba(255, 0, 60, 0.15)', color: '#ff003c', border: '1px solid #ff003c', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}
            >
              <Power size={18} />
              <span>{t(language, 'SHUTDOWN')}</span>
            </button>
          </div>
          
          <ControlPanel 
            isDetectionActive={isDetectionActive}
            setIsDetectionActive={setIsDetectionActive}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            selectedDeviceId={selectedDeviceId}
            setSelectedDeviceId={setSelectedDeviceId}
            language={language}
            setLanguage={setLanguage}
            alarmMode={alarmMode}
            setAlarmMode={setAlarmMode}
            agentPhone={agentPhone}
            setAgentPhone={setAgentPhone}
          />

          <div className="camera-grid">
            {['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04'].map((camId) => {
              const isPrimary = primaryCam === camId;
              return (
                <div 
                  key={camId} 
                  className={isPrimary ? "primary-camera" : "secondary-camera"}
                  onClick={() => !isPrimary && setPrimaryCam(camId)}
                  style={{ position: 'relative', cursor: isPrimary ? 'default' : 'pointer' }}
                >
                  <div style={{ position: 'absolute', top: 5, left: 5, zIndex: 50, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <select 
                      className="camera-source-select" 
                      value={cameraSources[camId]} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setCameraSources(prev => ({ ...prev, [camId]: val }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="webcam">{t(language, 'WEBCAM_SOURCE')}</option>
                      <option value="mall_people">Simulation: Centre Commercial</option>
                      <option value="classroom">Simulation: Salle de Classe</option>
                      <option value="face_tracking">Simulation: Suivi Facial</option>
                      <option value="traffic_cars">Simulation: Trafic Routier</option>
                      <option value="industrial_bolt">Simulation: Usine / Ligne de prod.</option>
                      
                      <option value="store_aisle">Simulation: Magasin & Rayons</option>
                      <option value="pedestrian_track">Simulation: Suivi Piétons (Extérieur)</option>
                      <option value="worker_zone">Simulation: Zone de Chantier</option>
                      <option value="bottle_detection">Simulation: Convoyeur Bouteilles</option>
                      <option value="long_indoor">Test Long (12min) : Intérieur</option>
                      <option value="long_outdoor">Test Long (14min) : Extérieur</option>
                    </select>
                    <div className="camera-badge" style={{ position: 'absolute', top: '8px', right: '-80px', zIndex: 50, background: 'rgba(0,0,0,0.7)', border: `1px solid ${isPrimary ? 'var(--border-glow)' : 'var(--text-dim)'}`, padding: '2px 6px', fontSize: '10px', color: isPrimary ? 'var(--border-glow)' : 'var(--text-dim)' }}>
                      {camId} {isPrimary ? '[MAIN]' : ''}
                    </div>
                  </div>
                  {!isPrimary && <div className="camera-hover-overlay" />}
                  <SmartCamera 
                    camName={camId}
                    sourceType={cameraSources[camId]}
                    onAnomaly={handleAnomaly} 
                    isDetectionActive={isDetectionActive}
                    videoUrl={isPrimary ? videoUrl : ''}
                    selectedDeviceId={camId === 'CAM-01' ? selectedDeviceId : ''}
                    language={language}
                    alarmMode={alarmMode}
                  />
                </div>
              );
            })}
          </div>

        </div>

        <div className="hud-panel logs-section">
          <div className="hud-title" style={{ justifyContent: 'space-between' }}>
            <span>{t(language, 'SYS_LOGS')}</span>
            <button className="cyber-btn" onClick={toggleHistory} style={{ padding: '4px 8px', fontSize: '12px' }}>
              <Database size={14} />
              <span>{t(language, 'FULL_LOGS')}</span>
            </button>
          </div>
          <AlertPanel alerts={alerts.slice(0, 10)} language={language} onDismiss={handleDeleteAlert} />
        </div>

      </div>

      
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.03,
        display: 'flex',
        flexWrap: 'wrap',
        overflow: 'hidden',
        userSelect: 'none'
      }}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            transform: 'rotate(-30deg)',
            margin: '40px',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace'
          }}>
            CONFIDENTIAL - RATOVOARISOA M.M.R.
          </div>
        ))}
      </div>
      <div className="system-copyright">

        © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO — {t(language, 'ALL_RIGHTS')}
      </div>

      <div className="mobile-bottom-nav">
        <div className="nav-item" onClick={handleShutdown}>
          <Power size={20} />
          <span>{t(language, 'SHUTDOWN')}</span>
        </div>
        <div 
          className={`nav-item ${isDetectionActive ? 'active' : ''}`} 
          onClick={() => { playClick(); setIsDetectionActive(!isDetectionActive); }}
        >
          {isDetectionActive ? <Square size={20} /> : <Play size={20} />}
        </div>
        <div className="nav-item" onClick={toggleHistory}>
          <Database size={20} />
          <span>{t(language, 'FULL_LOGS')}</span>
        </div>
      </div>

      {showHistory && (
        <HistoryModal 
          alerts={alerts} 
          onClose={() => { playClick(); setShowHistory(false) }} 
          onClear={handleClearAlerts}
          onDeleteSelected={handleDeleteSelected}
          language={language}
          onDecision={handleDecision}
          agentPhone={agentPhone}
          setAgentPhone={setAgentPhone}
        />
      )}
    </>
  )
}

export default App
