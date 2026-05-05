// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import { AlertTriangle } from 'lucide-react'
import { t } from '../utils/translations'

export default function AlertPanel({ alerts, language }) {
  return (
    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {alerts.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '20px' }}>
          {t(language, 'NO_ANOMALIES')}
        </div>
      ) : (
        alerts.map((alert, index) => (
          <div key={index} style={{ 
            background: 'rgba(255, 0, 60, 0.1)', 
            borderLeft: '4px solid var(--alert-red)', 
            padding: '12px',
            animation: index === 0 ? 'slideIn 0.3s ease-out' : 'none',
            display: 'flex',
            gap: '15px'
          }}>
            {/* Miniature du Snapshot */}
            {alert.image && (
              <img 
                src={alert.image} 
                alt="Snapshot" 
                style={{ width: '80px', height: '60px', objectFit: 'cover', border: '1px solid var(--alert-red)' }} 
              />
            )}
            
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--alert-red)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                {alert.timestamp}
              </div>
              <div style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>
                {t(language, alert.msgKey || 'ANOMALY_DETECTED')}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {alert.agentDecision ? (
                  <span style={{ fontSize: '10px', padding: '1px 5px', background: 'var(--border-glow)', color: '#000', fontWeight: 'bold' }}>
                    {t(language, alert.agentDecision)}
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', padding: '1px 5px', border: '1px solid var(--alert-red)', color: 'var(--alert-red)' }}>
                    {t(language, 'AGENT_DECISION')} [!]
                  </span>
                )}
                {alert.exitDirection && alert.exitDirection !== 'LOST' && (
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
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
