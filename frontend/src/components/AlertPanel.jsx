// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import React, { useState, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { t } from '../utils/translations'

function SwipeableAlert({ alert, index, language, onDismiss }) {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(null);
  
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff < 0) { // Only allow swipe left
      setTranslateX(diff);
    }
  };
  
  const handleTouchEnd = () => {
    if (translateX < -80) { // threshold for dismiss
      onDismiss(alert.id);
    } else {
      setTranslateX(0); // snap back
    }
    startX.current = null;
  };

  return (
    <div 
      className={`alert-card ${index === 0 ? 'new-alert' : ''}`}
      style={{ transform: `translateX(${translateX}px)`, transition: startX.current === null ? 'transform 0.3s ease' : 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Miniature du Snapshot */}
      {alert.image && (
        <div className="alert-thumbnail" style={{ position: 'relative' }}>
          <img src={alert.image} alt="Snapshot" />
          {alert.croppedImage && (
            <img src={alert.croppedImage} alt="Crop PIP" style={{ position: 'absolute', bottom: '2px', right: '2px', width: '32px', height: '32px', border: '1px solid var(--border-glow)', borderRadius: '3px', objectFit: 'cover' }} />
          )}
        </div>
      )}
      
      <div className="alert-content">
        <div className="alert-timestamp">
          <AlertTriangle size={14} />
          {alert.timestamp}
        </div>
        <div className="alert-msg">
          {t(language, alert.msgKey || 'ANOMALY_DETECTED')}
        </div>
        
        <div className="alert-badges">
          {alert.agentDecision ? (
            <span className="badge decision-badge-fixed">
              {t(language, alert.agentDecision)}
            </span>
          ) : (
            <span className="badge pending-badge">
              {t(language, 'AGENT_DECISION')} [!]
            </span>
          )}
          {alert.exitDirection && alert.exitDirection !== 'LOST' && (
            <span className="badge exit-badge-dim">
              {t(language, 'EXIT_DIR')}: {t(language, `EXIT_${alert.exitDirection}`)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlertPanel({ alerts, language, onDismiss }) {
  return (
    <div className="alert-list">
      {alerts.length === 0 ? (
        <div className="empty-alerts">
          {t(language, 'NO_ANOMALIES')}
        </div>
      ) : (
        alerts.map((alert, index) => (
          <SwipeableAlert 
            key={alert.id || index} 
            alert={alert} 
            index={index} 
            language={language} 
            onDismiss={onDismiss} 
          />
        ))
      )}
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
