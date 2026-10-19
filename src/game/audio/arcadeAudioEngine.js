/**
 * arcadeAudioEngine.js
 * 
 * Motor de audio de carreras híbrido (Archivos MP3 reales + Web Audio API):
 *  1. Motor de autos: Reproduce `/assets/sounds/motor.mp3` con modulación dinámica de
 *     velocidad/revoluciones (playbackRate entre 0.85x y 1.35x según los KM/H en tiempo real).
 *  2. Música de carreras: Reproduce en bucle `/assets/sounds/musica.mp3` durante la competencia.
 *  3. Cuenta regresiva 3, 2, 1, ¡GO!: Chimes de largada arcade de alta fidelidad y acorde triunfal.
 *  4. Efectos de acción: Saltos, choques y explosiones fatales.
 *  5. Celebración de victoria: Fanfarria de podio, vítores de la multitud y bocina de aire (air horn).
 *  6. Control de mute y volumen con persistencia en localStorage.
 */

const STORAGE_MUTE_KEY = 'buggy_race_audio_muted';
const STORAGE_VOLUME_KEY = 'buggy_race_audio_volume';

class ArcadeAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.volume = 0.85;
    this.listeners = new Set();

    // Archivos de audio MP3 provistos por el usuario
    this.motorAudio = null;
    this.musicAudio = null;
    this.meteorAudio = null;
    this.crashAudio = null;
    this.isEngineRunning = false;
    this.isMusicPlaying = false;
    this.raceProgress = 0;

    // Cargar preferencia guardada
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem(STORAGE_MUTE_KEY);
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
        const savedVol = localStorage.getItem(STORAGE_VOLUME_KEY);
        if (savedVol !== null) {
          this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
        }
      } catch (e) {
        // Ignorar errores de storage privado
      }
    }
  }

  /** Inicializa los reproductores de audio para motor.mp3, musica.mp3, meteorito.mp3 y choque.mp3 */
  initAudioFiles() {
    if (typeof window === 'undefined') return;

    if (!this.musicAudio) {
      try {
        const audio = new Audio('/assets/sounds/musica.mp3');
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = this.isMuted ? 0 : this.volume * 0.58;
        audio.addEventListener('error', () => {
          if (audio.src.includes('/assets/sounds/')) {
            audio.src = '/sounds/musica.mp3';
          }
        });
        this.musicAudio = audio;
      } catch (e) {}
    }

    if (!this.motorAudio) {
      try {
        const audio = new Audio('/assets/sounds/motor.mp3');
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 1.0);
        audio.addEventListener('error', () => {
          if (audio.src.includes('/assets/sounds/')) {
            audio.src = '/sounds/motor.mp3';
          }
        });
        this.motorAudio = audio;
      } catch (e) {}
    }

    if (!this.meteorAudio) {
      try {
        const audio = new Audio('/assets/sounds/meteorito.mp3');
        audio.preload = 'auto';
        audio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
        audio.addEventListener('error', () => {
          if (audio.src.includes('/assets/sounds/meteorito.mp3')) {
            audio.src = '/assets/sounds/meterorito.mp3';
          }
        });
        this.meteorAudio = audio;
      } catch (e) {}
    }

    if (!this.crashAudio) {
      try {
        const audio = new Audio('/assets/sounds/choque.mp3');
        audio.preload = 'auto';
        audio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
        audio.addEventListener('error', () => {
          if (audio.src.includes('/assets/sounds/')) {
            audio.src = '/sounds/choque.mp3';
          }
        });
        this.crashAudio = audio;
      } catch (e) {}
    }
  }

  /** Inicializa o reanuda el AudioContext en respuesta a un gesto del usuario */
  initContext() {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.initAudioFiles();
    return this.ctx;
  }

  /** Suscribirse a cambios de estado de mute */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((fn) => {
      try { fn(this.isMuted, this.volume); } catch (e) {}
    });
  }

  /** Alternar silencio (Mute / Unmute) */
  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    this.initContext();
    this.initAudioFiles();

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
    }

    if (this.musicAudio) {
      this.musicAudio.volume = this.isMuted ? 0 : this.volume * 0.58;
      if (!this.isMuted && this.isMusicPlaying && this.musicAudio.paused) {
        this.musicAudio.play().catch(() => {});
      }
    }

    if (this.motorAudio) {
      this.motorAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 1.0);
      if (!this.isMuted && this.isEngineRunning && this.motorAudio.paused) {
        this.motorAudio.play().catch(() => {});
      }
    }

    if (this.meteorAudio) {
      this.meteorAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
    }

    if (this.crashAudio) {
      this.crashAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
    }

    try {
      localStorage.setItem(STORAGE_MUTE_KEY, String(this.isMuted));
    } catch (e) {}

    this.notifyListeners();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (!this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
    if (this.musicAudio) {
      this.musicAudio.volume = this.isMuted ? 0 : this.volume * 0.58;
    }
    if (this.motorAudio) {
      this.motorAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 1.0);
    }
    if (this.meteorAudio) {
      this.meteorAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
    }
    if (this.crashAudio) {
      this.crashAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
    }
    try {
      localStorage.setItem(STORAGE_VOLUME_KEY, String(this.volume));
    } catch (e) {}
    this.notifyListeners();
  }

  // =========================================================================
  // 1. BEES DE CUENTA REGRESIVA ARCADE (3, 2, 1, ¡GO!)
  // =========================================================================
  playCountdown(count) {
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    if (count === 0) {
      // "¡GO!": Glorioso acorde triunfal de largada arcade (C6 + E6 + G6 + C7) con brillo y sweep ascendente
      const goNotes = [1046.5, 1318.51, 1567.98, 2093.0]; // Tríada mayor brillante
      goNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        const vol = idx === 0 ? 0.28 : 0.16;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.78);
      });

      // Sweep propulsor de largada hacia adelante (sensación de aceleración inmediata)
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(320, t);
      sweepOsc.frequency.exponentialRampToValueAtTime(1480, t + 0.35);

      sweepGain.gain.setValueAtTime(0.22, t);
      sweepGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(this.masterGain);
      sweepOsc.start(t);
      sweepOsc.stop(t + 0.4);

      // Campana armónica cristalina superior (Glockenspiel chime)
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(3135.96, t); // Sol7 cristalino
      bellGain.gain.setValueAtTime(0.12, t);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      bellOsc.connect(bellGain);
      bellGain.connect(this.masterGain);
      bellOsc.start(t);
      bellOsc.stop(t + 0.62);
    } else {
      // 3, 2, 1: Chime arcade limpio, metálico y resonante (estilo Mario Kart / OutRun / Sega Rally)
      // Nota base afinada: 3 y 2 son Sol5 (783.99 Hz), 1 es La5 (880 Hz) para mayor tensión previa a la largada
      const baseFreq = count === 1 ? 880 : 783.99;

      // 1. Cuerpo principal (triángulo cálido)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

      // 2. Sobretono de campana metálica (armónico 2x característico de campanas de bronce/arcade)
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(baseFreq * 2.0, t);
      chimeGain.gain.setValueAtTime(0.18, t);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      // 3. Transient de percusión metálica inicial (click de badajo/campana de largada)
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(baseFreq * 3.5, t);
      clickGain.gain.setValueAtTime(0.12, t);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      osc.connect(gain);
      chimeOsc.connect(chimeGain);
      clickOsc.connect(clickGain);

      gain.connect(this.masterGain);
      chimeGain.connect(this.masterGain);
      clickGain.connect(this.masterGain);

      osc.start(t);
      chimeOsc.start(t);
      clickOsc.start(t);

      osc.stop(t + 0.35);
      chimeOsc.stop(t + 0.25);
      clickOsc.stop(t + 0.05);
    }
  }

  // =========================================================================
  // 2. MOTOR DE CARRERAS (REPRODUCCIÓN DINÁMICA DE motor.mp3)
  // =========================================================================
  startEngine() {
    this.initContext();
    this.initAudioFiles();
    if (!this.motorAudio) return;

    this.isEngineRunning = true;
    try {
      this.motorAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 1.0);
      this.motorAudio.playbackRate = 1.0;
      this.motorAudio.currentTime = 0;
      const playPromise = this.motorAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy: reanudará con interacción
        });
      }
    } catch (e) {}
  }

  /** Modula el playbackRate de motor.mp3 según los KM/H en tiempo real */
  setEngineSpeed(speedKmh, isBoosting = false) {
    if (!this.motorAudio || !this.isEngineRunning) return;

    try {
      const speed = Math.max(0, Math.min(240, Number(speedKmh) || 120));
      const norm = speed / 240;
      // Modula la velocidad de reproducción entre 0.85x (ralentí) y 1.30x (máxima velocidad / nitro)
      const rate = 0.85 + norm * 0.36 + (isBoosting ? 0.12 : 0);
      this.motorAudio.playbackRate = Math.max(0.75, Math.min(1.4, rate));
    } catch (e) {}
  }

  stopEngine() {
    this.isEngineRunning = false;
    if (this.motorAudio) {
      try {
        this.motorAudio.pause();
        this.motorAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  // =========================================================================
  // 3. MÚSICA DE CARRERAS (REPRODUCCIÓN EN BUCLE DE musica.mp3)
  // =========================================================================
  startRaceMusic() {
    this.initContext();
    this.initAudioFiles();
    if (!this.musicAudio) return;

    this.isMusicPlaying = true;
    try {
      this.musicAudio.volume = this.isMuted ? 0 : this.volume * 0.58;
      this.musicAudio.currentTime = 0;
      const playPromise = this.musicAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy: reanudará con interacción
        });
      }
    } catch (e) {}
  }

  setRaceProgress(p) {
    this.raceProgress = Math.max(0, Math.min(1, p));
  }

  stopRaceMusic() {
    this.isMusicPlaying = false;
    if (this.musicAudio) {
      try {
        this.musicAudio.pause();
        this.musicAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  // =========================================================================
  // 4. EFECTOS ESPECIALES DE ACCIÓN (CHOQUES, SALTOS, DERRAPES, METEORITOS)
  // =========================================================================
  playCrashSound(obstacleType = '') {
    const norm = String(obstacleType || '').toUpperCase();
    if (norm === 'METEORITOS') {
      this.playMeteorImpact();
      return;
    }

    this.initContext();
    this.initAudioFiles();

    // 1. Reproducción de audio real choque.mp3 optimizado (para todos los obstáculos que no sean meteoritos)
    if (this.crashAudio) {
      try {
        this.crashAudio.currentTime = 0;
        this.crashAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
        const p = this.crashAudio.play();
        if (p !== undefined) {
          p.catch(() => {
            this.playSyntheticCrash();
          });
        }
        return;
      } catch (e) {}
    }

    // 2. Fallback sintético en Web Audio si el elemento no está listo
    this.playSyntheticCrash();
  }

  playSyntheticCrash() {
    const ctx = this.initContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Sub-impacto percusivo pesado (95 Hz -> 22 Hz)
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.frequency.setValueAtTime(95, t);
    boom.frequency.exponentialRampToValueAtTime(22, t + 0.35);

    boomGain.gain.setValueAtTime(0.45, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    boom.connect(boomGain);
    boomGain.connect(this.masterGain);
    boom.start(t);
    boom.stop(t + 0.48);

    // Explosión crujiente de metal y restos
    if (!this.noiseBuffer && ctx) {
      const bufferSize = ctx.sampleRate * 1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }

    if (this.noiseBuffer) {
      const crunch = ctx.createBufferSource();
      crunch.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.frequency.exponentialRampToValueAtTime(280, t + 0.5);

      const crunchGain = ctx.createGain();
      crunchGain.gain.setValueAtTime(0.42, t);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      crunch.connect(filter);
      filter.connect(crunchGain);
      crunchGain.connect(this.masterGain);
      crunch.start(t);
      crunch.stop(t + 0.58);
    }
  }

  playJumpSound() {
    const ctx = this.initContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Whoosh de aire ascendente al saltar la duna / grieta
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.16);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  playMeteorImpact() {
    this.initContext();
    this.initAudioFiles();

    // 1. Reproducción de audio real meteorito.mp3 optimizado
    if (this.meteorAudio) {
      try {
        this.meteorAudio.currentTime = 0;
        this.meteorAudio.volume = this.isMuted ? 0 : Math.min(1.0, this.volume * 0.95);
        const p = this.meteorAudio.play();
        if (p !== undefined) {
          p.catch(() => {
            // Autoplay policy o error: fallback al sintetizador sub-graves
            this.playSyntheticMeteor();
          });
        }
        return;
      } catch (e) {}
    }

    // 2. Fallback sintético en Web Audio si el elemento de audio no está listo
    this.playSyntheticMeteor();
  }

  playSyntheticMeteor() {
    const ctx = this.initContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Detonación colosal de impacto de meteorito
    const sub = ctx.createOscillator();
    sub.frequency.setValueAtTime(120, t);
    sub.frequency.exponentialRampToValueAtTime(18, t + 0.6);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.75);
  }

  // =========================================================================
  // 5. CELEBRACIÓN DE VICTORIA (FANFARRIA, PÚBLICO Y BOCINA DE AIRE)
  // =========================================================================
  playCelebration() {
    const ctx = this.initContext();
    if (!ctx) return;

    // Detener música de carrera y motor
    this.stopRaceMusic();
    this.stopEngine();

    const t = ctx.currentTime;

    // A. FANFARRIA TRIUNFAL (Acordes mayores de victoria en metal brillante)
    // Notas: Do5 (523) -> Mi5 (659) -> Sol5 (784) -> Do6 (1046) apoteósico
    const fanfareNotes = [
      { time: 0.0, freq: 523.25, dur: 0.2 },
      { time: 0.18, freq: 659.25, dur: 0.2 },
      { time: 0.36, freq: 783.99, dur: 0.25 },
      { time: 0.58, freq: 1046.50, dur: 0.9 },
    ];

    fanfareNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, t + n.time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, t + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur + 0.05);
    });

    // B. BOCINA DE ESTADIO / AIR HORN (Típica de rally triunfal)
    const playAirHornBlast = (delay) => {
      const hornTime = t + delay;
      [740, 880].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, hornTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, hornTime);
        filter.Q.setValueAtTime(4.0, hornTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.18, hornTime);
        gain.gain.exponentialRampToValueAtTime(0.001, hornTime + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(hornTime);
        osc.stop(hornTime + 0.25);
      });
    };

    playAirHornBlast(0.6);
    playAirHornBlast(0.9);
    playAirHornBlast(1.2);

    // C. PÚBLICO ACLAMANDO / APLAUSOS (Estadio en éxtasis)
    if (!this.noiseBuffer && ctx) {
      const bufferSize = ctx.sampleRate * 1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }

    if (this.noiseBuffer) {
      const crowd = ctx.createBufferSource();
      crowd.buffer = this.noiseBuffer;
      crowd.loop = true;

      const crowdFilter = ctx.createBiquadFilter();
      crowdFilter.type = 'bandpass';
      crowdFilter.frequency.setValueAtTime(650, t);
      crowdFilter.Q.setValueAtTime(1.4, t);

      const crowdGain = ctx.createGain();
      // Crescendo que sube y se sostiene
      crowdGain.gain.setValueAtTime(0.01, t);
      crowdGain.gain.linearRampToValueAtTime(0.24, t + 0.8);
      crowdGain.gain.linearRampToValueAtTime(0.20, t + 3.0);
      crowdGain.gain.exponentialRampToValueAtTime(0.001, t + 6.0);

      crowd.connect(crowdFilter);
      crowdFilter.connect(crowdGain);
      crowdGain.connect(this.masterGain);

      crowd.start(t);
      crowd.stop(t + 6.5);
    }
  }

  // =========================================================================
  // 6. DETENER TODO DE FORMA LIMPIA
  // =========================================================================
  stopAll() {
    this.stopEngine();
    this.stopRaceMusic();
    if (this.meteorAudio) {
      try {
        this.meteorAudio.pause();
        this.meteorAudio.currentTime = 0;
      } catch (e) {}
    }
    if (this.crashAudio) {
      try {
        this.crashAudio.pause();
        this.crashAudio.currentTime = 0;
      } catch (e) {}
    }
  }
}

// Instancia singleton para toda la aplicación
export const arcadeAudio = new ArcadeAudioEngine();
export default arcadeAudio;
