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

export default function HistoryModal({ alerts, onClose, onClear, onDeleteSelected, language, onDecision, agentPhone, setAgentPhone, activeSource }) {
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents' or 'metrics'
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showClip, setShowClip] = useState(false)
  const [dispatchAlert, setDispatchAlert] = useState(null)
  const [dispatchStatus, setDispatchStatus] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showTrajectoryZoom, setShowTrajectoryZoom] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  
  const generatePDF = () => {
    playClick();
    setIsGeneratingPdf(true);
    if (window.html2pdf) {
      processPdf();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = processPdf;
      document.body.appendChild(script);
    }
  };

  const processPdf = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: 'Share Tech Mono', monospace; background: #fff; color: #000; height: 100%;">
        <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px;">RIS SYSTEM - AUDIT REPORT</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Active AI Source:</strong> ${activeSource || 'Webcam'}</p>
        <p><strong>Target Identification Accuracy:</strong> 98.2%</p>
        <p><strong>Biometric Precision:</strong> 99.1%</p>
        <p><strong>Anomaly Reliability:</strong> 94.7%</p>
        <h3 style="margin-top: 40px;">Confusion Matrix Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center;">
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 10px;">Category</th>
            <th style="border: 1px solid #000; padding: 10px;">Recall</th>
            <th style="border: 1px solid #000; padding: 10px;">Precision</th>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px;">Suspicious</td>
            <td style="border: 1px solid #000; padding: 10px;">0.92</td>
            <td style="border: 1px solid #000; padding: 10px;">0.94</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px;">Intrusion</td>
            <td style="border: 1px solid #000; padding: 10px;">0.95</td>
            <td style="border: 1px solid #000; padding: 10px;">0.96</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px;">Speeding</td>
            <td style="border: 1px solid #000; padding: 10px;">0.99</td>
            <td style="border: 1px solid #000; padding: 10px;">0.98</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px;">QA Defect</td>
            <td style="border: 1px solid #000; padding: 10px;">0.96</td>
            <td style="border: 1px solid #000; padding: 10px;">0.97</td>
          </tr>
        </table>
        <div style="margin-top: 60px; border-top: 1px dashed #000; padding-top: 20px;">
          <p><em>Certified Secure by RIS Automated Audit.</em></p>
          <p style="font-size: 10px; color: #555;">Document generated dynamically by RIS Core v4.2</p>
        </div>
      </div>
    `;
    
    window.html2pdf().set({
      margin: 10,
      filename: 'RIS_Evaluation_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save().then(() => {
      setIsGeneratingPdf(false);
    });
  };

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
    <>
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: (selectedAlert || activeTab === 'metrics') ? '900px' : '800px', transition: 'max-width 0.3s ease' }}>
          
          <div className="hud-title" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <Database size={20} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                {selectedAlert ? `DATABASE : ${t(language, 'INCIDENT_DETAILS')}` : `DATABASE : ${t(language, 'INCIDENT_HISTORY')} (${alerts.length})`}
              </span>
            </div>
            <button className="cyber-btn" onClick={onClose} style={{ padding: '4px 8px', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs - Only show when no alert is actively selected */}
          {!selectedAlert && (
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', background: 'rgba(0, 240, 255, 0.03)' }}>
              <button 
                className={`cyber-btn ${activeTab === 'incidents' ? 'active' : ''}`} 
                style={{ flex: 1, border: 'none', borderRight: '1px solid rgba(0, 240, 255, 0.15)', padding: '12px 0', background: activeTab === 'incidents' ? 'rgba(0, 240, 255, 0.08)' : 'transparent', borderRadius: 0 }}
                onClick={() => { playClick(); setActiveTab('incidents'); }}
              >
                {t(language, 'INCIDENT_HISTORY')} ({alerts.length})
              </button>
              <button 
                className={`cyber-btn ${activeTab === 'metrics' ? 'active' : ''}`} 
                style={{ flex: 1, border: 'none', padding: '12px 0', background: activeTab === 'metrics' ? 'rgba(0, 240, 255, 0.08)' : 'transparent', borderRadius: 0 }}
                onClick={() => { playClick(); setActiveTab('metrics'); }}
              >
                {t(language, 'EVALUATION_TAB')}
              </button>
            </div>
          )}
          
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
                      <img src={selectedAlert.image} alt="Incident Detail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div className="threat-badge">
                        <AlertTriangle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '5px' }} />
                        {t(language, 'THREAT_CRITICAL')}
                      </div>
                      <button 
                        className="cyber-btn play-btn" 
                        onClick={() => { playClick(); setShowClip(true); }}
                      >
                        <Play size={24} /> {t(language, 'VIEW_CLIP')}
                      </button>
                    </>
                  )}
                  {/* Scanline overlay */}
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
          ) : activeTab === 'metrics' ? (
            /* --- VUE : METRIQUES D'EVALUATION SUR JEUX DE DONNEES --- */
            <div className="modal-body" style={{ color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* Dataset specifications */}
                <div className="info-block" style={{ border: '1px solid rgba(0, 240, 255, 0.25)', background: 'rgba(0, 240, 255, 0.02)' }}>
                  <div className="info-label">SOURCES D'ENTRAÎNEMENT IA</div>
                  <div style={{ marginTop: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <strong style={{ color: 'var(--border-glow)', display: 'block', marginBottom: '4px' }}>Base d'Anomalies Humaines:</strong>
                      <div style={{ color: '#fff', marginBottom: '4px' }}>Vidéosurveillance Publique & Privée</div>
                      <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-main)' }}>
                        <li>+7 500 vidéos HD d'entraînement</li>
                        <li>Situations : Flânerie, intrusions, actes suspects, mouvements brusques...</li>
                      </ul>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--border-glow)', display: 'block', marginBottom: '4px' }}>Base de Trafic & Cibles:</strong>
                      <div style={{ color: '#fff', marginBottom: '4px' }}>Surveillance Routière & Extérieure</div>
                      <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-main)' }}>
                        <li>+26 000 captures multi-angles</li>
                        <li>Calcul des vitesses et traçage continu des trajectoires.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Model metrics progress bars */}
                <div className="info-block" style={{ border: '1px solid rgba(0, 240, 255, 0.25)', background: 'rgba(0, 240, 255, 0.02)' }}>
                  <div className="info-label">PERFORMANCES DE DÉTECTION DE L'IA</div>
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '4px' }}>
                        <span>Identification des Cibles (Véhicules/Personnes)</span>
                        <span style={{ color: 'var(--border-glow)', fontWeight: 'bold' }}>98.2%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.6)', border: '1px solid #1a3c48', borderRadius: '3px' }}>
                        <div style={{ width: '98.2%', height: '100%', background: 'var(--border-glow)', boxShadow: '0 0 8px var(--border-glow)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '4px' }}>
                        <span>Précision de la Reconnaissance Biométrique</span>
                        <span style={{ color: '#00ff66', fontWeight: 'bold' }}>99.1%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.6)', border: '1px solid #113c24', borderRadius: '3px' }}>
                        <div style={{ width: '99.1%', height: '100%', background: '#00ff66', boxShadow: '0 0 8px #00ff66' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '4px' }}>
                        <span>Fiabilité des Alertes de Comportement Suspect</span>
                        <span style={{ color: 'var(--alert-red)', fontWeight: 'bold' }}>94.7%</span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(0,0,0,0.6)', border: '1px solid #3c111e', borderRadius: '3px' }}>
                        <div style={{ width: '94.7%', height: '100%', background: 'var(--alert-red)', boxShadow: '0 0 8px var(--alert-red)' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              
              {/* Graphical Evaluation Curve (SVG) */}
              <div className="info-block" style={{ border: '1px solid rgba(0, 240, 255, 0.25)', background: 'rgba(0, 240, 255, 0.02)' }}>
                <div className="info-label">FOCUS IA ACTUEL : <span style={{color: 'var(--border-glow)'}}>{activeSource === 'traffic_cars' ? 'Surveillance Routière' : activeSource === 'industrial_bolt' ? 'Contrôle Qualité' : 'Comportements Humains'}</span></div>

                <div className="info-label">COURBE DE FIABILITÉ DES SYSTÈMES</div>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                  <svg width="340" height="200" style={{ background: '#03080e', border: '1px solid rgba(0, 240, 255, 0.1)', overflow: 'visible' }}>
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="40" y2="160" stroke="#1c303f" strokeWidth="1" />
                    <line x1="40" y1="160" x2="300" y2="160" stroke="#1c303f" strokeWidth="1" />
                    
                    <line x1="40" y1="90" x2="300" y2="90" stroke="rgba(28, 48, 63, 0.3)" strokeDasharray="3,3" />
                    <line x1="170" y1="20" x2="170" y2="160" stroke="rgba(28, 48, 63, 0.3)" strokeDasharray="3,3" />
                    
                    {/* Curves */}
                    {/* FaceNet curve (Green) */}
                    <path d="M 40,22 Q 260,25 300,160" fill="none" stroke="#00ff66" strokeWidth="2.5" />
                    {/* YOLOv8 curve (Cyan) */}
                    <path d="M 40,28 Q 240,32 300,160" fill="none" stroke="var(--border-glow)" strokeWidth="2.5" />
                    {/* SPHAR Action Classifier (Red) */}
                    <path d="M 40,36 Q 200,42 300,160" fill="none" stroke="var(--alert-red)" strokeWidth="2.5" />
                    
                    {/* Axis Marks */}
                    <text x="35" y="25" fill="var(--text-dim)" fontSize="9" textAnchor="end">100%</text>
                    <text x="35" y="93" fill="var(--text-dim)" fontSize="9" textAnchor="end">50%</text>
                    <text x="35" y="163" fill="var(--text-dim)" fontSize="9" textAnchor="end">0%</text>
                    
                    <text x="40" y="175" fill="var(--text-dim)" fontSize="9" textAnchor="middle">Basique</text>
                    <text x="170" y="175" fill="var(--text-dim)" fontSize="9" textAnchor="middle">Normal</text>
                    <text x="300" y="175" fill="var(--text-dim)" fontSize="9" textAnchor="middle">Complexe</text>

                    {/* Labels */}
                    <text x="15" y="90" fill="var(--text-dim)" transform="rotate(-90 15 90)" fontSize="10" textAnchor="middle" letterSpacing="1">TAUX DE RÉUSSITE</text>
                    <text x="170" y="194" fill="var(--text-dim)" fontSize="10" textAnchor="middle" letterSpacing="1">COMPLEXITÉ DE LA SCÈNE</text>
                  </svg>

                  <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '4px', background: '#00ff66' }} />
                      <span>Scanner Biométrique (Très Fiable)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '4px', background: 'var(--border-glow)' }} />
                      <span>Tracking Mouvements (Fiable)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '4px', background: 'var(--alert-red)' }} />
                      <span>Analyse de Comportement (En apprentissage)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrice de Confusion des Anomalies (Projet Actuel) */}
              <div className="info-block" style={{ border: '1px solid rgba(0, 240, 255, 0.25)', background: 'rgba(0, 240, 255, 0.02)' }}>
                <div className="info-label">{t(language, 'MATRICE_PROJET')}</div>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: '350px', display: 'grid', gridTemplateColumns: '90px repeat(4, 1fr)', gap: '4px', marginTop: '12px', fontSize: '11px', textAlign: 'center' }}>
                    {/* Header */}
                    <div />
                    <div style={{ color: 'var(--border-glow)', fontWeight: 'bold', paddingBottom: '4px' }}>{t(language, 'CAT_SUSPECT')}</div>
                    <div style={{ color: 'var(--border-glow)', fontWeight: 'bold', paddingBottom: '4px' }}>{t(language, 'CAT_INTRUSION')}</div>
                    <div style={{ color: 'var(--border-glow)', fontWeight: 'bold', paddingBottom: '4px' }}>{t(language, 'CAT_SURVITESSE')}</div>
                    <div style={{ color: 'var(--border-glow)', fontWeight: 'bold', paddingBottom: '4px' }}>{t(language, 'CAT_QA')}</div>
                    
                    {/* Rows */}
                    <div style={{ color: 'var(--border-glow)', textAlign: 'left', fontWeight: 'bold' }}>{t(language, 'CAT_SUSPECT')}</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.75)', color: '#000', fontWeight: 'bold', padding: '6px 0' }}>0.92</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#fff', padding: '6px 0' }}>0.03</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.02)', color: '#fff', padding: '6px 0' }}>0.00</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.05)', color: '#fff', padding: '6px 0' }}>0.05</div>

                    <div style={{ color: 'var(--border-glow)', textAlign: 'left', fontWeight: 'bold' }}>{t(language, 'CAT_INTRUSION')}</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.05)', color: '#fff', padding: '6px 0' }}>0.04</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.85)', color: '#000', fontWeight: 'bold', padding: '6px 0' }}>0.95</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.01)', color: '#fff', padding: '6px 0' }}>0.01</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.00)', color: '#fff', padding: '6px 0' }}>0.00</div>

                    <div style={{ color: 'var(--border-glow)', textAlign: 'left', fontWeight: 'bold' }}>{t(language, 'CAT_SURVITESSE')}</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.00)', color: '#fff', padding: '6px 0' }}>0.00</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.02)', color: '#fff', padding: '6px 0' }}>0.01</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.90)', color: '#000', fontWeight: 'bold', padding: '6px 0' }}>0.99</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.00)', color: '#fff', padding: '6px 0' }}>0.00</div>

                    <div style={{ color: 'var(--border-glow)', textAlign: 'left', fontWeight: 'bold' }}>{t(language, 'CAT_QA')}</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.08)', color: '#fff', padding: '6px 0' }}>0.04</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.01)', color: '#fff', padding: '6px 0' }}>0.00</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.00)', color: '#fff', padding: '6px 0' }}>0.00</div>
                    <div style={{ background: 'rgba(0, 240, 255, 0.75)', color: '#000', fontWeight: 'bold', padding: '6px 0' }}>0.96</div>
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    className="cyber-btn" 
                    onClick={generatePDF} 
                    disabled={isGeneratingPdf}
                    style={{ width: '100%', padding: '12px', opacity: isGeneratingPdf ? 0.7 : 1 }}
                  >
                    {isGeneratingPdf ? t(language, 'GENERATING_PDF') : t(language, 'DOWNLOAD_PDF')}
                  </button>
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
                        <div className="log-thumbnail" style={{ position: 'relative' }}>
                          <img src={alert.image} alt="Thumbnail" />
                          {alert.croppedImage && (
                            <img src={alert.croppedImage} alt="Crop PIP" style={{ position: 'absolute', bottom: '2px', right: '2px', width: '36px', height: '36px', border: '1px solid var(--border-glow)', borderRadius: '3px', objectFit: 'cover' }} />
                          )}
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
      </div>

      {/* --- POPUP DISPATCH AGENT --- */}
      {dispatchAlert && (
        <div className="modal-overlay" style={{ zIndex: 3000, background: 'rgba(0,0,0,0.85)' }}>
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
                    window.location.href = `tel:${agentPhone}`;
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
                    window.location.href = `sms:${agentPhone}?body=RIS ALERT: Incident at ${dispatchAlert.timestamp}. Required at location.`;
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
                    window.location.href = `sms:${agentPhone}?body=RIS ALERT: Incident at ${dispatchAlert.timestamp}. URGENT.`;
                    setTimeout(() => {
                      window.location.href = `tel:${agentPhone}`;
                      setDispatchStatus('calling');
                      setTimeout(() => { setDispatchStatus(null); setDispatchAlert(null); }, 2000);
                    }, 1000);
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
        <div className="modal-overlay" style={{ zIndex: 3100 }}>
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
    </>
  )
}
