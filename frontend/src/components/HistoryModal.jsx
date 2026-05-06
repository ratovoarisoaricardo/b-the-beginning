// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import { useState, useEffect, useRef } from 'react'
import { X, Database, Trash2, ArrowLeft, AlertTriangle, Play, Pause, RotateCcw, ShieldCheck, Search, EyeOff, MapPin, Phone, MessageSquare } from 'lucide-react'
import { playClick } from '../utils/soundEffects'
import { t } from '../utils/translations'

function ClipPlayer({ clip, language }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setFrameIndex(prev => (prev + 1) % clip.length);
      }, 100); // 10 fps
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, clip.length]);

  if (!clip || clip.length === 0) return (
    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#555' }}>
      {t(language, 'NO_CLIP')}
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', background: '#000', border: '1px solid var(--border-glow)' }}>
      <img src={clip[frameIndex]} style={{ width: '100%', display: 'block' }} alt="Clip Frame" />
      
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'rgba(0,0,0,0.7)', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button className="cyber-btn" onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '5px', minWidth: '40px' }}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className="cyber-btn" onClick={() => { setIsPlaying(false); setFrameIndex(0); }} style={{ padding: '5px', minWidth: '40px' }}>
          <RotateCcw size={16} />
        </button>
        <div style={{ flex: 1, height: '4px', background: '#333', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(frameIndex / clip.length) * 100}%`, background: 'var(--border-glow)' }} />
        </div>
        <span style={{ fontSize: '10px', color: '#fff', minWidth: '50px', textAlign: 'right' }}>
          {frameIndex + 1} / {clip.length}
        </span>
      </div>
    </div>
  );
}

export default function HistoryModal({ alerts, onClose, onClear, onDeleteSelected, language, onDecision, agentPhone, setAgentPhone }) {
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showClip, setShowClip] = useState(false)
  const [dispatchAlert, setDispatchAlert] = useState(null)
  const [dispatchStatus, setDispatchStatus] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showTrajectoryZoom, setShowTrajectoryZoom] = useState(false)

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === alerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alerts.map(a => a.id)));
    }
  };

  const handleDelete = () => {
    playClick();
    onDeleteSelected(selectedIds);
    setSelectedIds(new Set());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: selectedAlert ? '900px' : '800px', transition: 'max-width 0.3s ease' }}>
        
        <div className="hud-title" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} />
            {selectedAlert ? `DATABASE : ${t(language, 'INCIDENT_DETAILS')}` : `DATABASE : ${t(language, 'INCIDENT_HISTORY')} (${alerts.length})`}
          </div>
          <button className="cyber-btn" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>
        
        {selectedAlert ? (
          /* --- VUE : DETAILS D'UNE ALERTE --- */
          <div className="modal-body">
            <button 
              className="cyber-btn" 
              onClick={() => { playClick(); setSelectedAlert(null); setShowClip(false); }} 
              style={{ alignSelf: 'flex-start' }}
            >
              <ArrowLeft size={16} /> <span>{t(language, 'FULL_LOGS')}</span>
            </button>
            
            <div className="details-container">
              <div className="details-media">
                {showClip ? (
                  <ClipPlayer clip={selectedAlert.clip} language={language} />
                ) : (
                  <>
                    <img src={selectedAlert.image} alt="Incident Detail" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    <div className="threat-badge">
                      <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} />
                      {t(language, 'THREAT_LETHAL')}
                    </div>
                    <button 
                      className="cyber-btn play-btn" 
                      onClick={() => { playClick(); setShowClip(true); }}
                    >
                      <Play size={24} /> {t(language, 'VIEW_CLIP')}
                    </button>
                  </>
                )}
                {/* Scanline sur l'image/clip */}
                <div className="scanline-overlay" />
              </div>
              
              <div className="details-info">
                <div className="info-block info-time">
                  <div className="info-label">{t(language, 'TIMESTAMP')}</div>
                  <div className="info-value big">{selectedAlert.timestamp}</div>
                </div>

                <div className="info-block info-event">
                  <div className="info-label">{t(language, 'EVENT')}</div>
                  <div className="info-value">{t(language, selectedAlert.msgKey || 'ANOMALY_DETECTED')}</div>
                </div>

                <div 
                  className="info-block info-trajectory"
                  onClick={() => { playClick(); setShowTrajectoryZoom(true); }}
                >
                  <div className="info-label">
                    <MapPin size={12} /> {t(language, 'TRAJECTORY')} / {t(language, 'EXIT_DIR')}
                  </div>
                  <div className="trajectory-preview">
                    <svg width="80" height="60" style={{ background: '#111', border: '1px solid #333' }}>
                      {selectedAlert.trajectory && selectedAlert.trajectory.length > 1 && (
                        <path 
                          d={`M ${selectedAlert.trajectory.map(p => `${p.x * 80},${p.y * 60}`).join(' L ')}`} 
                          fill="none" 
                          stroke="var(--alert-red)" 
                          strokeWidth="2"
                        />
                      )}
                    </svg>
                    <div className="exit-text">
                      {t(language, `EXIT_${selectedAlert.exitDirection || 'LOST'}`)}
                    </div>
                  </div>
                </div>

                <div className="info-block info-decision">
                  <div className="info-label">{t(language, 'AGENT_DECISION')}</div>
                  <div className="decision-buttons">
                    <button 
                      className={`cyber-btn ${selectedAlert.agentDecision === 'INTERVENTION' ? 'danger active' : ''}`}
                      onClick={() => { 
                        playClick(); 
                        onDecision(selectedAlert.id, 'INTERVENTION');
                        setDispatchAlert(selectedAlert);
                      }}
                    >
                      <ShieldCheck size={14} /> <span>{t(language, 'INTERVENTION')}</span>
                    </button>
                    
                    <button 
                      className={`cyber-btn ${selectedAlert.agentDecision === 'SURVEILLANCE' ? 'active' : ''}`}
                      onClick={() => { 
                        playClick(); 
                        onDecision(selectedAlert.id, 'SURVEILLANCE');
                        setDispatchAlert(selectedAlert);
                      }}
                    >
                      <Search size={14} /> <span>{t(language, 'SURVEILLANCE_MODE')}</span>
                    </button>
                    <button 
                      className={`cyber-btn ${selectedAlert.agentDecision === 'IGNORE' ? 'active' : ''}`}
                      onClick={() => { playClick(); onDecision(selectedAlert.id, 'IGNORE'); }}
                    >
                      <EyeOff size={14} /> <span>{t(language, 'IGNORE')}</span>
                    </button>
                  </div>
                  {selectedAlert.decisionAt && (
                    <div className="decision-timestamp">
                      {t(language, 'DECISION_SAVED')} : {selectedAlert.decisionAt}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- VUE : LISTE DES LOGS --- */
          <>
            {/* Header Multi-Select */}
            {alerts.length > 0 && (
              <div className="log-list-header">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === alerts.length && alerts.length > 0} 
                  onChange={handleSelectAll}
                  className="cyber-checkbox"
                />
                <span className="selection-label">{t(language, 'SELECT_ALL')}</span>
                {selectedIds.size > 0 && (
                  <span className="selected-count">
                    ({selectedIds.size} {t(language, 'SELECTED') || 'SELECTED'})
                  </span>
                )}
              </div>
            )}

            <div className="log-list-body">
              {alerts.length === 0 ? (
                <div className="empty-logs">
                  {t(language, 'NO_ANOMALIES')}
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`log-item ${selectedIds.has(alert.id) ? 'selected' : ''}`}
                    onClick={() => { playClick(); setSelectedAlert(alert); }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(alert.id)}
                      onChange={(e) => handleToggleSelect(alert.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="cyber-checkbox"
                    />

                    {alert.image && (
                      <div className="log-thumbnail">
                        <img 
                          src={alert.image} 
                          alt="Thumbnail" 
                        />
                      </div>
                    )}
                    <div className="log-info">
                      <span className="log-time">
                        [{alert.timestamp}]
                      </span>
                      <span className="log-msg">
                        {t(language, alert.msgKey || 'ANOMALY_DETECTED')}
                      </span>
                      <div className="log-meta">
                        <span className="log-details-link">
                          {'>'} {t(language, 'INCIDENT_DETAILS')}
                        </span>
                        {alert.agentDecision && (
                          <span className="decision-badge">
                            {t(language, 'DECISION_SAVED')}
                          </span>
                        )}
                        {alert.exitDirection && alert.exitDirection !== 'LOST' && (
                          <span className="exit-badge">
                            {t(language, 'EXIT_DIR')} : {t(language, `EXIT_${alert.exitDirection}`)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="log-list-footer">
              <div className="footer-actions">
                {selectedIds.size > 0 && (
                  <button className="cyber-btn danger" onClick={handleDelete}>
                    <Trash2 size={16} />
                    <span>{t(language, 'DELETE_SELECTED')}</span>
                  </button>
                )}
              </div>
              <button className="cyber-btn danger clear-btn" onClick={() => { playClick(); onClear(); setSelectedAlert(null); }}>
                <Trash2 size={16} />
                <span>{t(language, 'CLEAR_LOGS')}</span>
              </button>
            </div>
          </>
        )}

      </div>
      {/* --- POPUP DISPATCH AGENT --- */}
      {dispatchAlert && (
        <div className="modal-overlay" style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ maxWidth: '400px', border: '2px solid var(--alert-red)', boxShadow: '0 0 30px rgba(255,0,60,0.3)' }}>
            <div className="hud-title" style={{ background: 'var(--alert-red)', color: '#fff' }}>
              <ShieldCheck size={18} /> {t(language, 'DISPATCH_AGENT')}
            </div>
            
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '10px' }}>{t(language, 'AGENT_PHONE_PLACEHOLDER')}</div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Phone size={18} color="var(--border-glow)" />
                <input 
                  type="tel" 
                  className="cyber-input" 
                  style={{ flex: 1, fontSize: '18px', textAlign: 'center' }}
                  placeholder="+261..."
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="cyber-btn" 
                  style={{ width: '100%', padding: '12px' }} 
                  disabled={!agentPhone}
                  onClick={() => {
                    playClick();
                    window.open(`tel:${agentPhone}`, '_self');
                    setDispatchStatus('calling');
                    setTimeout(() => { setDispatchStatus(null); setDispatchAlert(null); }, 2000);
                  }}
                >
                  <Phone size={18} /> {t(language, 'CALLING')}
                </button>
                
                <button 
                  className="cyber-btn" 
                  style={{ width: '100%', padding: '12px' }}
                  disabled={!agentPhone}
                  onClick={() => {
                    playClick();
                    window.open(`sms:${agentPhone}?body=RIS ALERT: Incident at ${dispatchAlert.timestamp}. Required at location.`, '_self');
                    setDispatchStatus('sms_sent');
                    setTimeout(() => { setDispatchStatus(null); setDispatchAlert(null); }, 2000);
                  }}
                >
                  <MessageSquare size={18} /> {t(language, 'SMS_SENT')}
                </button>

                <button 
                  className="cyber-btn danger" 
                  style={{ width: '100%', padding: '12px' }}
                  disabled={!agentPhone}
                  onClick={() => {
                    playClick();
                    window.open(`sms:${agentPhone}?body=RIS ALERT: Incident at ${dispatchAlert.timestamp}. URGENT.`, '_self');
                    setTimeout(() => {
                      window.open(`tel:${agentPhone}`, '_self');
                      setDispatchStatus('calling');
                      setTimeout(() => { setDispatchStatus(null); setDispatchAlert(null); }, 2000);
                    }, 500);
                  }}
                >
                  <ShieldCheck size={18} /> {t(language, 'CALLING')} + {t(language, 'SMS_SENT')}
                </button>
              </div>

              {dispatchStatus && (
                <div className="blink-text" style={{ marginTop: '20px', color: 'var(--alert-red)', fontWeight: 'bold' }}>
                  {t(language, dispatchStatus === 'calling' ? 'CALLING' : 'SMS_SENT')}
                </div>
              )}

              <button className="cyber-btn" style={{ marginTop: '20px', width: '100%', opacity: 0.5 }} onClick={() => setDispatchAlert(null)}>
                {t(language, 'CLOSE')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP ZOOM TRAJECTOIRE --- */}
      {showTrajectoryZoom && selectedAlert && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '800px', border: '1px solid var(--border-glow)' }}>
            <div className="hud-title" style={{ justifyContent: 'space-between' }}>
              <span><MapPin size={18} /> {t(language, 'ZOOM_TRAJECTORY')}</span>
              <button className="cyber-btn" onClick={() => setShowTrajectoryZoom(false)}><X size={16} /></button>
            </div>
            <div style={{ position: 'relative', background: '#000' }}>
              <img src={selectedAlert.image} alt="Full Trajectory" style={{ width: '100%', display: 'block' }} />
              <svg 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              >
                {selectedAlert.trajectory && selectedAlert.trajectory.length > 1 && (
                  <>
                    <path 
                      d={`M ${selectedAlert.trajectory.map(p => `${p.x * 100},${p.y * 100}`).join(' L ')}`} 
                      fill="none" 
                      stroke="rgba(0, 240, 255, 0.5)" 
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <path 
                      d={`M ${selectedAlert.trajectory.map(p => `${p.x * 100},${p.y * 100}`).join(' L ')}`} 
                      fill="none" 
                      stroke="var(--alert-red)" 
                      strokeWidth="2"
                    />
                    {/* Points de passage */}
                    {selectedAlert.trajectory.map((p, i) => (
                      <circle key={i} cx={p.x * 100} cy={p.y * 100} r="1" fill={i === 0 ? '#00ff00' : 'var(--alert-red)'} />
                    ))}
                  </>
                )}
              </svg>
              {/* Légende direction */}
              <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', padding: '10px', border: '1px solid var(--alert-red)', color: 'var(--alert-red)', fontWeight: 'bold' }}>
                {t(language, 'EXIT_DIR')} : {t(language, `EXIT_${selectedAlert.exitDirection || 'LOST'}`)}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
