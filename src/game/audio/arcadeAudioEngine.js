/**
 * arcadeAudioEngine.js
 * 
 * Motor de audio procedural y de baja latencia basado 100% en Web Audio API.
 * No requiere descargar archivos de audio externos (0 KB de dependencias),
 * funciona 100% offline, sin latencia, y cumple estrictamente con las políticas
 * de autoplay de los navegadores modernos (Chrome, Safari, Edge, Firefox).
 * 
 * Incluye:
 *  1. Sonidos de cuenta regresiva (Beeps de largada 3, 2, 1, ¡GO!).
 *  2. Sonido continuo de motor de carreras modulado en tiempo real por la velocidad (KM/H) y nitro.
 *  3. Música de carreras arcade (Retro Synthwave a 132 BPM con bajo rolling, batería cuatro-en-el-piso y leads).
 *  4. Efectos de acción (derrape, turbo, salto sobre dunas, choque/explosión).
 *  5. Celebración de victoria (fanfarria triunfal, vítores del público / estadio y bocina de aire / air horn).
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

    // Estado del motor
    this.engineNodes = null;
    this.currentEngineSpeed = 0;

    // Estado de la música
    this.isMusicPlaying = false;
    this.musicTimer = null;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.raceProgress = 0;

    // Estado de la multitud / celebración
    this.celebrationNodes = null;

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

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.05);
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
    try {
      localStorage.setItem(STORAGE_VOLUME_KEY, String(this.volume));
    } catch (e) {}
    this.notifyListeners();
  }

  // =========================================================================
  // 1. BEES DE CUENTA REGRESIVA (3, 2, 1, ¡GO!)
  // =========================================================================
  playCountdown(count) {
    const ctx = this.initContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (count === 0) {
      // "¡GO!": Tono doble brillante y alegre de largada
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, t); // La5
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.12);

      // Armónico extra
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      gain2.gain.setValueAtTime(0.25, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(this.masterGain);
      gain2.connect(this.masterGain);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.45);
      osc2.stop(t + 0.45);
    } else {
      // 3, 2, 1: Beep corto arcade de advertencia
      const freq = count === 1 ? 523.25 : 440; // Do5 en el último, La4 en los previos
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  // =========================================================================
  // 2. MOTOR DE CARRERAS (RUMBLE DE MOTOR SINTETIZADO EN TIEMPO REAL)
  // =========================================================================
  startEngine() {
    const ctx = this.initContext();
    if (!ctx || this.engineNodes) return;

    const t = ctx.currentTime;

    // Oscilador primario: Diente de sierra para rugido mecánico
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(52, t);

    // Oscilador secundario: Subgrave triangular
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(26, t);

    // Filtro pasa-bajos resonante (imita el tubo de escape)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.Q.setValueAtTime(3.2, t);

    // Ganancia del motor
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.3); // volumen suave para no tapar la música

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);

    this.engineNodes = { osc1, osc2, filter, gain };
    this.setEngineSpeed(100);
  }

  /** Modula el pitch y el rugido según los KM/H en tiempo real */
  setEngineSpeed(speedKmh, isBoosting = false) {
    if (!this.engineNodes || !this.ctx) return;

    const speed = Math.max(0, Math.min(240, Number(speedKmh) || 120));
    const norm = speed / 240;
    const t = this.ctx.currentTime;

    // Frecuencia base de 48 Hz (ralentí) hasta 145 Hz (máxima velocidad)
    const boostBonus = isBoosting ? 28 : 0;
    const targetFreq = 48 + norm * 85 + boostBonus;
    const targetCutoff = 280 + norm * 620 + (isBoosting ? 260 : 0);

    try {
      this.engineNodes.osc1.frequency.setTargetAtTime(targetFreq, t, 0.08);
      this.engineNodes.osc2.frequency.setTargetAtTime(targetFreq * 0.5, t, 0.08);
      this.engineNodes.filter.frequency.setTargetAtTime(targetCutoff, t, 0.08);
    } catch (e) {}
  }

  stopEngine() {
    if (!this.engineNodes || !this.ctx) return;
    const t = this.ctx.currentTime;
    try {
      this.engineNodes.gain.gain.linearRampToValueAtTime(0.001, t + 0.2);
      setTimeout(() => {
        if (this.engineNodes) {
          try {
            this.engineNodes.osc1.stop();
            this.engineNodes.osc2.stop();
            this.engineNodes.osc1.disconnect();
            this.engineNodes.osc2.disconnect();
          } catch (e) {}
          this.engineNodes = null;
        }
      }, 250);
    } catch (e) {
      this.engineNodes = null;
    }
  }

  // =========================================================================
  // 3. MÚSICA DE CARRERAS ARCADE (RETRO SYNTHWAVE A 132 BPM)
  // =========================================================================
  startRaceMusic() {
    const ctx = this.initContext();
    if (!ctx) return;

    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.raceProgress = 0;

    // 132 BPM: cada compás tiene 16 semicorcheas
    // Duración de cada semicorchea = (60 / 132) / 4 ≈ 0.1136 seg
    const stepDuration = 60 / 132 / 4;
    this.nextNoteTime = ctx.currentTime + 0.05;

    // Generar buffer de ruido reutilizable para batería (caja, hihats)
    if (!this.noiseBuffer) {
      const bufferSize = ctx.sampleRate * 1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }

    const scheduleNote = (step, time) => {
      if (!this.isMusicPlaying || !this.ctx) return;

      const subStep = step % 16;
      const bar = Math.floor(step / 16) % 4; // ciclo de 4 compases

      // 1. BOMBO (Kick Drum): Cuatro-en-el-piso (steps 0, 4, 8, 12)
      if (subStep % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(38, time + 0.09);
        gain.gain.setValueAtTime(0.38, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.12);
      }

      // 2. CAJA (Snare): En los tiempos 2 y 4 (steps 4 y 12)
      if (subStep === 4 || subStep === 12) {
        // Tono del snare
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190, time);
        oscGain.gain.setValueAtTime(0.18, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.13);

        // Ruido del snare
        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource();
          noise.buffer = this.noiseBuffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400, time);
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.24, time);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.masterGain);
          noise.start(time);
          noise.stop(time + 0.16);
        }
      }

      // 3. HI-HAT: Semicorcheas rápidas estilo OutRun
      if (this.noiseBuffer) {
        const isUpbeat = subStep % 4 === 2;
        const hatGainVal = isUpbeat ? 0.08 : 0.04;
        const hatDecay = isUpbeat ? 0.06 : 0.035;

        const hat = ctx.createBufferSource();
        hat.buffer = this.noiseBuffer;
        const hatFilter = ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7500, time);

        const hatGain = ctx.createGain();
        hatGain.gain.setValueAtTime(hatGainVal, time);
        hatGain.gain.exponentialRampToValueAtTime(0.001, time + hatDecay);

        hat.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.masterGain);
        hat.start(time);
        hat.stop(time + hatDecay + 0.01);
      }

      // 4. LÍNEA DE BAJO SYNTHWAVE (A1 -> F1 -> C2 -> G1)
      const bassRoots = [55.0, 43.65, 65.41, 48.99]; // A1, F1, C2, G1
      const root = bassRoots[bar];
      // Notas de bajo en cada semicorchea con octava rítmica
      const isOctave = subStep % 2 === 1;
      const bassFreq = isOctave ? root * 2 : root;

      const bassOsc = ctx.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, time);

      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(800, time);
      bassFilter.frequency.exponentialRampToValueAtTime(180, time + 0.08);
      bassFilter.Q.setValueAtTime(3, time);

      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0.18, time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.masterGain);
      bassOsc.start(time);
      bassOsc.stop(time + 0.1);

      // 5. LEAD / ARPEGIO SINTETIZADOR (Sprints y emoción arcade)
      // Escala pentatónica menor (A, C, D, E, G)
      const leadNotes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 659.25];
      // Toca en semicorcheas alternadas
      if (subStep % 2 === 0) {
        const noteIdx = (subStep + bar * 2) % leadNotes.length;
        const leadFreq = leadNotes[noteIdx];

        const leadOsc = ctx.createOscillator();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, time);

        const leadFilter = ctx.createBiquadFilter();
        leadFilter.type = 'lowpass';
        // Aumenta el brillo en el sprint final de la carrera
        const cutoff = this.raceProgress > 0.75 ? 2400 : 1400;
        leadFilter.frequency.setValueAtTime(cutoff, time);

        const leadGain = ctx.createGain();
        const baseLeadVol = this.raceProgress > 0.75 ? 0.09 : 0.06;
        leadGain.gain.setValueAtTime(baseLeadVol, time);
        leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(this.masterGain);
        leadOsc.start(time);
        leadOsc.stop(time + 0.15);
      }
    };

    // Planificador de precisión Web Audio (Lookahead Clock)
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // seg

    const scheduler = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
        scheduleNote(this.currentStep, this.nextNoteTime);
        this.nextNoteTime += stepDuration;
        this.currentStep += 1;
      }
    };

    this.musicTimer = setInterval(scheduler, lookahead);
  }

  setRaceProgress(p) {
    this.raceProgress = Math.max(0, Math.min(1, p));
  }

  stopRaceMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // =========================================================================
  // 4. EFECTOS ESPECIALES DE ACCIÓN (CHOQUES, SALTOS, DERRAPES, METEORITOS)
  // =========================================================================
  playCrashSound() {
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
    // Notas: Do4 (261) -> Mi4 (329) -> Sol4 (392) -> Do5 (523) -> Sol5 (784)
    const fanfareNotes = [
      { time: 0.0, freq: 523.25, dur: 0.2 },
      { time: 0.18, freq: 659.25, dur: 0.2 },
      { time: 0.36, freq: 783.99, dur: 0.25 },
      { time: 0.58, freq: 1046.50, dur: 0.9 }, // Do6 sostenido apoteósico
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
  }
}

// Instancia singleton para toda la aplicación
export const arcadeAudio = new ArcadeAudioEngine();
export default arcadeAudio;
