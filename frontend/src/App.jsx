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
import { playBoot, playClick } from './utils/soundEffects'
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
  
  const [language, setLanguage] = useState('fr')
  const [alarmMode, setAlarmMode] = useState('siren') // 'siren', 'stealth', 'voice'
  const [agentPhone, setAgentPhone] = useState('')

  const handleStartBoot = () => {
    if (bootStage !== 0) return
    setBootStage(1)
    playBoot()
    
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
    setTimeout(() => setIsAnomaly(false), 2000)
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
            >
              <Power size={20} />
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
            
            <div className="primary-camera">
              <SmartCamera 
                onAnomaly={handleAnomaly} 
                isDetectionActive={isDetectionActive}
                videoUrl={videoUrl}
                selectedDeviceId={selectedDeviceId}
                language={language}
                alarmMode={alarmMode}
              />
            </div>
            
            <DummyCamera name="CAM-02" />
            <DummyCamera name="CAM-03" />
            <DummyCamera name="CAM-04" />
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
          <AlertPanel alerts={alerts.slice(0, 10)} language={language} />
        </div>

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
