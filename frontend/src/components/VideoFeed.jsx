export default function VideoFeed({ frame }) {
  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#000', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {frame ? (
        <img 
          src={frame} 
          alt="Live feed" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      ) : (
        <div style={{ color: 'var(--border-glow)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid rgba(0, 240, 255, 0.2)', 
            borderTop: '3px solid var(--border-glow)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }} />
          <span style={{ letterSpacing: '2px', fontSize: '14px' }}>ESTABLISHING UPLINK...</span>
        </div>
      )}
      
      {/* Overlay CRT/Scanlines style */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
        backgroundSize: '100% 4px',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
