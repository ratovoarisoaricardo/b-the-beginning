// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

import React, { useEffect, useRef } from 'react';

export default function DummyCamera({ name }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationId;

    const drawNoise = () => {
      const w = canvas.width;
      const h = canvas.height;
      const idata = ctx.createImageData(w, h);
      const buffer32 = new Uint32Array(idata.data.buffer);
      const len = buffer32.length;

      for (let i = 0; i < len; i++) {
        const val = Math.random();
        if (val < 0.1) {
          buffer32[i] = 0xff333333; // dark grey
        } else if (val < 0.15) {
          buffer32[i] = 0xff666666; // lighter grey
        } else {
          buffer32[i] = 0xff000000; // black
        }
      }
      ctx.putImageData(idata, 0, 0);
      
      ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.font = '14px "Share Tech Mono", monospace';
      ctx.fillText(name, 10, 20);
      ctx.fillStyle = 'rgba(255, 0, 60, 0.5)';
      ctx.fillText('NO SIGNAL', 10, 40);

      // Ralentir l'animation pour économiser les perfs
      setTimeout(() => {
        animationId = requestAnimationFrame(drawNoise);
      }, 50);
    };

    drawNoise();

    return () => {
      clearTimeout(animationId);
      cancelAnimationFrame(animationId);
    };
  }, [name]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', border: '1px solid rgba(0,240,255,0.2)', background: '#000' }}>
      <canvas ref={canvasRef} width={320} height={240} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
        backgroundSize: '100% 4px', pointerEvents: 'none'
      }} />
    </div>
  );
}
