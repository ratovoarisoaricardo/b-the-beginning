// =============================================================================
// Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO
// Projet Personnel — RIS Surveillance System
// Tous droits réservés.
// =============================================================================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playClick() {
  playTone(800, 'square', 0.1, 0.05);
}

export function playBoot() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(50, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 1.5);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.5);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.5);
}

export function playAlarm() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  
  osc.frequency.setValueAtTime(250, audioCtx.currentTime);
  osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.25);
  osc.frequency.setValueAtTime(250, audioCtx.currentTime + 0.5);
  osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.75);
  
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.0);
}

export function playVoiceAlarm(language, text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any currently speaking voice
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurer le ton et la vitesse pour un aspect robotique
    utterance.pitch = 0.4;
    utterance.rate = 1.1;
    
    // Essayer de trouver une voix correspondant à la langue
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.startsWith(language));
    
    // Fallback: essayer de trouver une voix de base
    if (!selectedVoice) {
      if (language === 'zh') selectedVoice = voices.find(v => v.lang.includes('zh'));
      if (language === 'ja') selectedVoice = voices.find(v => v.lang.includes('ja'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
}
