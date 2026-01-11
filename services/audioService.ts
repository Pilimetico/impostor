// Advanced Web Audio Synthesis - Cyberpunk Edition
// Procedural Sound Generation

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicInterval: number | null = null;
let musicOscillators: AudioNode[] = [];

// Fire Audio Object (Custom File)
let fireAudio: HTMLAudioElement | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.6; // Boosted volume
    masterGain.connect(audioCtx.destination);
  }
  
  // Ensure musicGain exists even if audioCtx was already there (robustness)
  if (!musicGain && audioCtx && masterGain) {
     musicGain = audioCtx.createGain();
     musicGain.gain.value = 0; 
     musicGain.connect(masterGain);
  }

  return { ctx: audioCtx, master: masterGain!, musicMaster: musicGain! };
};

// Helper to safely resume audio context if blocked by browser policy
export const tryResumeAudioContext = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => console.debug("Audio resume prevented", e));
    }
}

// --- FIRE AMBIENCE (CUSTOM AUDIO FILE) ---

export const startFireAmbience = () => {
    // 1. Detener cualquier instancia previa para evitar ecos
    stopFireAmbience();

    // 2. Crear nueva instancia con la URL específica
    // Nota: Usamos la URL provista. Si falla (404), capturamos el error.
    fireAudio = new Audio('https://beyond.megarifas.uy/wp-content/uploads/2026/01/fire.mp3');
    fireAudio.loop = true;
    fireAudio.volume = 0.8; // Volumen alto directo, sin fades complejos

    // 3. Intentar reproducir inmediatamente
    const playPromise = fireAudio.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Error reproduciendo audio de fuego (posible bloqueo del navegador o URL incorrecta):", error);
        });
    }
};

export const stopFireAmbience = () => {
    if (fireAudio) {
        fireAudio.pause();
        fireAudio.currentTime = 0;
        fireAudio = null;
    }
};

// Helper: Create a retro synth tone with envelopes
const playSynthTone = (
  freq: number, 
  type: OscillatorType, 
  duration: number, 
  startTime: number, 
  ctx: AudioContext, 
  dest: AudioNode,
  vol: number = 0.5
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Detune slightly for thicker sound if it's sawtooth or square
  if (type === 'sawtooth' || type === 'square') {
    osc.detune.setValueAtTime(Math.random() * 10 - 5, startTime);
  }

  // Filter sweep for "Laser/Synth" effect
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(100, startTime);
  filter.frequency.exponentialRampToValueAtTime(8000, startTime + 0.05);
  filter.frequency.exponentialRampToValueAtTime(100, startTime + duration);

  // ADSR Envelope
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.02); // Attack
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Release

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
};

// --- MUSIC SEQUENCER ---
const TETRIS_NOTES = [
  // Section A
  { f: 659.25, d: 0.25 }, { f: 493.88, d: 0.125 }, { f: 523.25, d: 0.125 }, { f: 587.33, d: 0.25 }, // E5, B4, C5, D5
  { f: 523.25, d: 0.125 }, { f: 493.88, d: 0.125 }, { f: 440.00, d: 0.25 }, { f: 440.00, d: 0.125 }, { f: 523.25, d: 0.125 }, // C5, B4, A4, A4, C5
  { f: 659.25, d: 0.25 }, { f: 587.33, d: 0.125 }, { f: 523.25, d: 0.125 }, { f: 493.88, d: 0.375 }, { f: 523.25, d: 0.125 }, // E5, D5, C5, B4, C5
  { f: 587.33, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 523.25, d: 0.25 }, { f: 440.00, d: 0.25 }, { f: 440.00, d: 0.25 }, // D5, E5, C5, A4, A4
  // Pause/Bridge
  { f: 0, d: 0.25 }, { f: 587.33, d: 0.25 }, { f: 698.46, d: 0.125 }, { f: 880.00, d: 0.25 }, // -, D5, F5, A5
  { f: 783.99, d: 0.125 }, { f: 698.46, d: 0.125 }, { f: 659.25, d: 0.375 }, { f: 523.25, d: 0.125 }, // G5, F5, E5, C5
  { f: 659.25, d: 0.25 }, { f: 587.33, d: 0.125 }, { f: 523.25, d: 0.125 }, { f: 493.88, d: 0.25 }, { f: 493.88, d: 0.125 }, { f: 523.25, d: 0.125 }, // E5, D5, C5, B4, B4, C5
  { f: 587.33, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 523.25, d: 0.25 }, { f: 440.00, d: 0.25 }, { f: 440.00, d: 0.25 } // D5, E5, C5, A4, A4
];

export const toggleBackgroundMusic = (play: boolean) => {
  const { ctx, musicMaster } = initAudio();
  if (!ctx || !musicMaster) return;

  const now = ctx.currentTime;

  if (play) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    // Prevent double triggering/speeding up
    if (musicInterval) return;

    // Clear any existing music first to avoid overlap (safety)
    stopMusicInternal();

    // Fade In
    musicMaster.gain.cancelScheduledValues(now);
    musicMaster.gain.setValueAtTime(0, now);
    musicMaster.gain.linearRampToValueAtTime(0.25, now + 2); // Increased volume

    let noteIndex = 0;

    const scheduleNote = () => {
      const note = TETRIS_NOTES[noteIndex];
      const duration = note.d * 1.8; // Stretch slightly
      
      if (note.f > 0) {
        // Melody
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square'; // Gameboy style
        osc.frequency.value = note.f;
        
        gain.gain.value = 0.1;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (duration * 0.8));

        osc.connect(gain);
        gain.connect(musicMaster);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
        musicOscillators.push(osc);

        // Bassline (Offbeat)
        if (noteIndex % 2 === 0) {
           const bassOsc = ctx.createOscillator();
           const bassGain = ctx.createGain();
           bassOsc.type = 'sawtooth';
           bassOsc.frequency.value = note.f / 4; // 2 Octaves down
           bassGain.gain.value = 0.15;
           bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
           
           bassOsc.connect(bassGain);
           bassGain.connect(musicMaster);
           bassOsc.start();
           bassOsc.stop(ctx.currentTime + 0.2);
           musicOscillators.push(bassOsc);
        }
      }

      noteIndex = (noteIndex + 1) % TETRIS_NOTES.length;
    };

    // Start sequencer
    musicInterval = window.setInterval(scheduleNote, 250); // Fixed interval logic for simplicity

  } else {
    // Fade Out
    musicMaster.gain.cancelScheduledValues(now);
    musicMaster.gain.setValueAtTime(musicMaster.gain.value, now);
    musicMaster.gain.linearRampToValueAtTime(0, now + 1.5); // 1.5s Fade out
    
    // Stop generation after fade
    setTimeout(() => {
        stopMusicInternal();
    }, 1500);
  }
};

const stopMusicInternal = () => {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
    // Cleanup old oscillators
    musicOscillators = []; 
};

export const playSound = (type: 'click' | 'reveal' | 'start' | 'alert' | 'success' | 'eliminate_civil' | 'eliminate_imposter' | 'tension' | 'tick') => {
  try {
    const { ctx, master } = initAudio();
    const now = ctx.currentTime;

    // Always try to resume context on sound effect trigger
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }

    switch (type) {
      case 'click':
        // High-tech UI blip
        playSynthTone(1200, 'sine', 0.05, now, ctx, master, 0.2);
        playSynthTone(2000, 'square', 0.02, now, ctx, master, 0.05);
        break;

      case 'tick':
        // Mechanical click for roulette
        // Short white noise burst or high frequency click
        const tickOsc = ctx.createOscillator();
        const tickGain = ctx.createGain();
        tickOsc.frequency.setValueAtTime(800, now);
        tickOsc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        tickOsc.type = 'square';
        tickGain.gain.setValueAtTime(0.1, now);
        tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        tickOsc.connect(tickGain);
        tickGain.connect(master);
        tickOsc.start(now);
        tickOsc.stop(now + 0.05);
        break;

      case 'start':
        // Power Up / Portal Open Sound
        // Ascending Arpeggio
        [220, 440, 554.37, 659.25, 880].forEach((f, i) => {
           playSynthTone(f, 'sawtooth', 0.4, now + (i * 0.05), ctx, master, 0.2);
        });
        // Deep bass underlay
        playSynthTone(55, 'square', 1.0, now, ctx, master, 0.4);
        break;

      case 'reveal':
        // Mystery Reveal (Blade Runner style)
        playSynthTone(110, 'sawtooth', 1.5, now, ctx, master, 0.3); // Low drone
        playSynthTone(138.59, 'sine', 1.5, now, ctx, master, 0.3); // Minor 3rd
        break;

      case 'tension':
        // Horror/Suspense drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const tGain = ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.value = 60; 
        
        osc2.type = 'sawtooth';
        osc2.frequency.value = 61; // Strong dissonance
        
        // Filter LFO effect
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        tGain.gain.setValueAtTime(0, now);
        tGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
        tGain.gain.linearRampToValueAtTime(0, now + 2.5);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(tGain);
        tGain.connect(master);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.5);
        osc2.stop(now + 2.5);
        break;

      case 'alert':
        // Error / Warning
        playSynthTone(150, 'sawtooth', 0.3, now, ctx, master, 0.4);
        playSynthTone(100, 'sawtooth', 0.3, now + 0.1, ctx, master, 0.4);
        break;

      case 'success':
         // Positive "Coin" sound
         playSynthTone(880, 'sine', 0.1, now, ctx, master, 0.2);
         playSynthTone(1760, 'square', 0.2, now + 0.1, ctx, master, 0.2);
         break;

      case 'eliminate_civil': 
        // Sad/Wrong sound (Descending tritone)
        playSynthTone(440, 'triangle', 0.4, now, ctx, master, 0.3);
        playSynthTone(311.13, 'sawtooth', 0.6, now + 0.3, ctx, master, 0.3);
        break;

      case 'eliminate_imposter': 
        // Epic Win (Major Chord Blast)
        [261.63, 329.63, 392.00, 523.25].forEach(f => {
            playSynthTone(f, 'square', 0.8, now, ctx, master, 0.2);
        });
        break;
    }
  } catch (e) {
    console.warn("Audio error", e);
  }
};