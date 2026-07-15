let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    // @ts-expect-error - webkitAudioContext is for older browsers
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(console.error);
  }
  return audioCtx;
}

export function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  
  // A pleasant major chord arpeggio: C5 -> E5 -> G5
  const t = ctx.currentTime;
  oscillator.frequency.setValueAtTime(523.25, t); // C5
  oscillator.frequency.setValueAtTime(659.25, t + 0.1); // E5
  oscillator.frequency.setValueAtTime(783.99, t + 0.2); // G5

  // Gentle volume envelope
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.2, t + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, t + 0.4);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(t);
  oscillator.stop(t + 0.4);
}

export function playIncorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'square';
  
  // A dull descending tone
  const t = ctx.currentTime;
  oscillator.frequency.setValueAtTime(300, t);
  oscillator.frequency.exponentialRampToValueAtTime(150, t + 0.3);

  // Soft volume envelope to prevent harshness
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.05, t + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, t + 0.3);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(t);
  oscillator.stop(t + 0.3);
}

export function playCompletionJingle() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  
  // A triumphant C major arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  notes.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    
    const startTime = t + (index * 0.15);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, startTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.4);
  });
}

export function playFlipSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  // A quick, neutral "tick" sound
  oscillator.type = 'triangle';
  const t = ctx.currentTime;
  
  oscillator.frequency.setValueAtTime(800, t);
  oscillator.frequency.exponentialRampToValueAtTime(300, t + 0.05);

  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.1, t + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, t + 0.05);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(t);
  oscillator.stop(t + 0.05);
}

export function playPopSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  // A soft "pop" sound like a message bubble
  oscillator.type = 'sine';
  const t = ctx.currentTime;
  
  oscillator.frequency.setValueAtTime(300, t);
  oscillator.frequency.exponentialRampToValueAtTime(450, t + 0.06);

  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(0.03, t + 0.02);
  gainNode.gain.linearRampToValueAtTime(0, t + 0.12);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(t);
  oscillator.stop(t + 0.12);
}
