// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import { AlertTriangle } from 'lucide-react'
import { t } from '../utils/translations'

export default function AlertPanel({ alerts, language }) {
  return (
    <div className="alert-list">
      {alerts.length === 0 ? (
        <div className="empty-alerts">
          {t(language, 'NO_ANOMALIES')}
        </div>
      ) : (
        alerts.map((alert, index) => (
          <div key={index} className={`alert-card ${index === 0 ? 'new-alert' : ''}`}>
            {/* Miniature du Snapshot */}
            {alert.image && (
              <div className="alert-thumbnail">
                <img src={alert.image} alt="Snapshot" />
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
