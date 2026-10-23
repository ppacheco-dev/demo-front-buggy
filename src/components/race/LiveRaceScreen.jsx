import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { findBuggyByName, generateDrawMarketReport, getBetMultiplier } from '../../game/config/selectionData';
import { getOrCreateRace, REFERENCE_RACE_TRAMOS } from '../../game/config/raceStorageService';
import { getUserBets } from '../../game/config/userBetsService';
import BuggySprite from './BuggySprite';
import ObstacleSprite from './ObstacleSprite';
import CircuitMinimap from './CircuitMinimap';
import ArcadeTrack25D from './ArcadeTrack25D';
import ArcadeFirstPersonCockpit from './ArcadeFirstPersonCockpit';
import { TICKET_PRICE, getRaceSchedule, formatSecondsToCountdown } from '../../game/config/raceTimeService';
import useArcadeAudio from '../../hooks/useArcadeAudio';
import PositionFlag from './PositionFlag';
import styles from './LiveRaceScreen.module.css';

// Duración total de la carrera en milisegundos (22s de acción pura estilo videojuego)
const RACE_DURATION_MS = 22000;

// Cuenta regresiva previa a la largada (10, 9, ... 1, ¡GO!)
const COUNTDOWN_START = 10;
const COUNTDOWN_STEP_MS = 1000;

// Tiempo que el podio animado permanece sobre la pista antes de abrir el resumen de resultados
const TRACK_PODIUM_MS = 9500;

// Piezas de confeti (posiciones deterministas para evitar recalcular en cada render)
const CONFETTI_COLORS = ['#facc15', '#f97316', '#38bdf8', '#4ade80', '#f472b6', '#a78bfa', '#ffffff'];
const CONFETTI_PIECES = Array.from({ length: 56 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: 3.9 + ((i * 13) % 30) / 10,
  duration: 2.6 + ((i * 7) % 18) / 10,
  drift: ((i * 29) % 120) - 60,
  rot: 360 + ((i * 53) % 540),
}));

// Amplitud máxima del desfase individual de cada auto dentro de un tramo.
// Con 0.17 la interpolación sigue siendo monótona (ningún auto retrocede) porque la
// derivada mínima del easing base es 0.65 y 0.17·π ≈ 0.53 < 0.65.
const CAR_PACE_AMPLITUDE = 0.17;

/** Hash determinista [-1, 1] para que cada auto tenga un ritmo propio y reproducible por tramo. */
function carPaceFactor(name, segIndex, raceNumber) {
  const str = `${name}|${segIndex}|${raceNumber}`;
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 20001) / 10000) - 1;
}

// Dimensiones de diseño de la vista de escritorio. Si el viewport es más pequeño, toda la
// pantalla se escala proporcionalmente (igual que la selección de mercado) para que quepa completa.
const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 700;
const MIN_FIT_ZOOM = 0.4;

export default function LiveRaceScreen({
  onBackToMenu,
  onGoToBet,
  userSelection,
  raceInfo,
  selectedRace = null,
}) {
  // Reloj en tiempo real sincronizado cada segundo
  const [liveNow, setLiveNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const liveSchedule = useMemo(() => getRaceSchedule(new Date(liveNow)), [liveNow]);
  const todayStr = raceInfo?.todayStr || liveSchedule.todayStr;

  // Estados de control de la pantalla:
  // - showPostRaceModal: modal cuando el usuario entra a una carrera ya finalizada
  // - isWaiting: usuario eligió esperar en pista la próxima carrera
  // - isExplicitPastRace: el usuario está viendo una repetición elegida explícitamente
  const [showPostRaceModal, setShowPostRaceModal] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isExplicitPastRace, setIsExplicitPastRace] = useState(() => Boolean(selectedRace));
  const lastSlotNumberRef = useRef(liveSchedule.currentRaceNumber);

  const initialNumber = selectedRace?.numero || liveSchedule.currentRaceNumber;
  const initialHour = selectedRace?.hora || liveSchedule.currentRaceTime;

  // Estado que fija y bloquea la carrera que el usuario está viendo actualmente.
  const [viewedRace, setViewedRace] = useState(() => {
    return selectedRace || getOrCreateRace(initialNumber, todayStr, initialHour);
  });

  // Si el prop selectedRace cambia explícitamente a otra carrera seleccionada
  useEffect(() => {
    if (selectedRace && selectedRace.numero !== viewedRace.numero) {
      setViewedRace(selectedRace);
      setIsExplicitPastRace(true);
      setShowPostRaceModal(false);
      setIsWaiting(false);
    }
  }, [selectedRace]);

  const race = viewedRace;
  const tramos = race.tramos && race.tramos.length > 0 ? race.tramos : REFERENCE_RACE_TRAMOS;

  const liveRaceNumber = liveSchedule.currentRaceNumber;
  const liveRaceTime = liveSchedule.currentRaceTime;
  const isViewingPastRace = Boolean(isExplicitPastRace || (race.numero < liveRaceNumber));
  const isNewLiveRaceAvailable = liveRaceNumber > race.numero;
  const isLive = !isViewingPastRace && !isWaiting;

  // Estados de animación continua (por defecto: vista ARCADE 2.5D)
  const [progress, setProgress] = useState(0); // 0.0 a 1.0
  const [isFinished, setIsFinished] = useState(false);
  const [resultsReady, setResultsReady] = useState(false); // retraso para ver el cruce de la meta
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, 0 (GO) o null
  const countdownTimersRef = useRef([]);
  const [cameraMode, setCameraMode] = useState('arcade25d'); // 'arcade25d' (por defecto) | 'broadcast2d' | 'cockpitFpv'
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  // Motor de audio procedural arcade (música synthwave, motor, fx y celebración)
  const {
    isMuted,
    toggleMute,
    playCountdown,
    startRaceAmbience,
    updateTelemetry,
    playCrash,
    playJump,
    playMeteor,
    playCelebration,
    playApplause,
    stopAll,
  } = useArcadeAudio();
  const playedCrashSegmentsRef = useRef(new Set());
  const playedJumpSegmentsRef = useRef(new Set());
  const playedMeteorSegmentsRef = useRef(new Set());

  // Ajuste al viewport: usa `zoom` (no `transform`) para no alterar elementos `position: fixed`.
  // En móvil / portrait se conserva el layout responsivo nativo.
  const containerRef = useRef(null);
  const fitToViewport = useCallback(() => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const W = parent.clientWidth;
    const H = parent.clientHeight;
    if (!W || !H) return;

    const isMobileMode =
      window.matchMedia('(max-width: 900px) and (orientation: portrait), (max-width: 640px)').matches ||
      W <= 640 ||
      (H > W && W <= 900);

    if (isMobileMode) {
      el.style.zoom = '';
      el.style.width = '';
      el.style.height = '';
      el.style.right = '';
      el.style.bottom = '';
      return;
    }

    const z = Math.max(MIN_FIT_ZOOM, Math.min(1, W / DESIGN_WIDTH, H / DESIGN_HEIGHT));
    el.style.zoom = String(z);
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.width = `${W / z}px`;
    el.style.height = `${H / z}px`;
  }, []);

  useLayoutEffect(() => {
    fitToViewport();
    const parent = containerRef.current?.parentElement;
    const ro = new ResizeObserver(() => fitToViewport());
    if (parent) ro.observe(parent);
    window.addEventListener('resize', fitToViewport);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fitToViewport);
    };
  }, [fitToViewport]);

  // Lista fija de nombres de autos para consistencia
  const carNames = useMemo(() => {
    const firstTramoCars = tramos[0]?.EstadosAutos || [];
    return firstTramoCars.map((c) => c.Nombre);
  }, [tramos]);

  // Convertir coordenada X (150m a 1160m) en porcentaje en pantalla (6% a 92%)
  const minTrackX = 150;
  const maxTrackX = 1160;
  const getCarTrackPercent = (xCoord) => {
    const clamped = Math.max(minTrackX, Math.min(maxTrackX, xCoord));
    const pct = ((clamped - minTrackX) / (maxTrackX - minTrackX)) * 82 + 6;
    return Math.min(92, Math.max(6, pct));
  };

  // Obstáculo activo en el tramo actual (aparece solo en el momento de la carrera)
  const currentSectorObstacle = useMemo(() => {
    const numSegments = tramos.length; // 8 segmentos correspondientes a los 8 tramos
    const rawIndex = progress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
    const currentTramo = tramos[segIndex] || tramos[0];

    return {
      tramo: currentTramo.TramoActual,
      tipo: currentTramo.TipoObstaculo || 'ROCAS',
      nombre: currentTramo.NombreObstaculo || 'Obstáculo',
      icono: currentTramo.IconoObstaculo || '🪨',
      segIndex,
    };
  }, [progress, tramos]);

  // Mapeo determinista del obstáculo fatal para cada auto que queda eliminado
  const fatalEliminationByCar = useMemo(() => {
    const map = {};

    carNames.forEach((name) => {
      // Buscar el primer tramo donde el auto pasa a estado ELIMINADO
      for (let sIdx = 0; sIdx < tramos.length; sIdx++) {
        const carState = tramos[sIdx]?.EstadosAutos?.find((c) => c.Nombre === name);
        if (carState?.Estado === 'ELIMINADO') {
          // El tramo donde ocurrió el choque fatal (sIdx es el segmento donde se alcanza este tramo)
          const tramoObj = tramos[sIdx] || tramos[0];
          map[name] = {
            fatalTramoIndex: sIdx,
            fatalSegmentIndex: sIdx,
            tipo: tramoObj.TipoObstaculo || 'ROCAS',
            nombre: carState.ObstaculoFallo || tramoObj.NombreObstaculo || 'Obstáculo',
            icono: tramoObj.IconoObstaculo || '🪨',
            crashX: carState.X || 800,
          };
          return;
        }
      }

      map[name] = null;
    });

    return map;
  }, [tramos, carNames]);

  // Evaluar deterministamente si algún auto logrará llegar a la meta
  const willAnyCarFinish = useMemo(() => {
    if (race.ningunAutoLlego) return false;
    const finalEstados = tramos[tramos.length - 1]?.EstadosAutos || [];
    return finalEstados.some((c) => c.Estado === 'EN_CARRERA' && c.PasoTramo === true && c.X >= 1100);
  }, [race.ningunAutoLlego, tramos]);

  const ningunAutoLlego = !willAnyCarFinish;

  // Si ningún auto llega a la meta, calcular el progreso exacto donde ocurre el último choque fatal
  const crashFinishProgress = useMemo(() => {
    if (willAnyCarFinish) return 1.0;
    const numSegments = tramos.length;
    let maxFatalSeg = -1;

    carNames.forEach((name) => {
      const f = fatalEliminationByCar[name];
      if (f && f.fatalSegmentIndex > maxFatalSeg) {
        maxFatalSeg = f.fatalSegmentIndex;
      }
    });

    if (maxFatalSeg < 0) return 0.85;

    // En el tramo fatal, el choque ocurre a fraction = 0.44.
    // Damos margen hasta fraction = 0.76 para apreciar el impacto, fuego y humo antes de finalizar
    return Math.min(0.95, (maxFatalSeg + 0.76) / numSegments);
  }, [willAnyCarFinish, tramos, carNames, fatalEliminationByCar]);

  // Motor de animación continua vía requestAnimationFrame
  const beginRaceLoop = useCallback((initialElapsedMs = 0) => {
    startTimeRef.current = performance.now() - initialElapsedMs;

    const loop = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const currentProgress = Math.min(1, elapsed / RACE_DURATION_MS);

      // CASO B: Ningún auto llega a la meta (todos eliminados por obstáculos)
      // La carrera se detiene automáticamente una vez consumado el último choque fatal
      if (!willAnyCarFinish && currentProgress >= crashFinishProgress) {
        setProgress(crashFinishProgress);
        setIsFinished(true);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        return;
      }

      // CASO A: Llega al menos un auto a la meta
      // La carrera se detiene exactamente cuando el PRIMER auto llega al pórtico de META
      if (willAnyCarFinish && currentProgress >= 1.0) {
        setProgress(1.0);
        setIsFinished(true);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        return;
      }

      setProgress(currentProgress);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(loop);
  }, [willAnyCarFinish, crashFinishProgress]);

  const clearCountdownTimers = useCallback(() => {
    countdownTimersRef.current.forEach((id) => clearTimeout(id));
    countdownTimersRef.current = [];
  }, []);

  // Lanzador principal de carreras: hora exacta (completa) o en curso (desde donde empezó)
  const launchRace = useCallback(
    ({ full = true, initialCountdown = COUNTDOWN_START, initialProgress = 0, initialElapsedMs = 0 } = {}) => {
      clearCountdownTimers();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      playedCrashSegmentsRef.current.clear();
      playedJumpSegmentsRef.current.clear();
      playedMeteorSegmentsRef.current.clear();
      stopAll();
      setIsFinished(false);
      setResultsReady(false);

      if (full) {
        // 1. "si uno se mete en la hora exacta la vera completa" o Repetición completa
        setProgress(0);
        const countdownSecs = Math.max(1, Math.min(COUNTDOWN_START, initialCountdown));
        setCountdown(countdownSecs);
        playCountdown(countdownSecs);

        const schedule = (fn, ms) => countdownTimersRef.current.push(setTimeout(fn, ms));
        for (let n = countdownSecs - 1; n >= 1; n--) {
          const value = n;
          schedule(() => {
            setCountdown(value);
            playCountdown(value);
          }, (countdownSecs - value) * COUNTDOWN_STEP_MS);
        }

        const goAt = countdownSecs * COUNTDOWN_STEP_MS;
        schedule(() => {
          setCountdown(0);
          playCountdown(0);
          startRaceAmbience();
          beginRaceLoop(0);
        }, goAt);
        schedule(() => setCountdown(null), goAt + 800);
      } else {
        // 2. "sino la vera desde donde empezo" (unirse a carrera ya en curso)
        setCountdown(null);
        setProgress(initialProgress);
        startRaceAmbience();
        beginRaceLoop(initialElapsedMs);
      }
    },
    [beginRaceLoop, clearCountdownTimers, playCountdown, startRaceAmbience, stopAll]
  );

  // Inicialización y sincronización de entrada según la hora exacta
  useEffect(() => {
    if (selectedRace) {
      // Repetición explícita desde historial
      setIsExplicitPastRace(true);
      setShowPostRaceModal(false);
      setIsWaiting(false);
      launchRace({ full: true, initialCountdown: COUNTDOWN_START });
      return () => {
        clearCountdownTimers();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        stopAll();
      };
    }

    // Modo TRANSMISIÓN EN VIVO
    setIsExplicitPastRace(false);
    const sched = getRaceSchedule(new Date());
    const elapsed = sched.elapsedInSlot;

    if (elapsed <= 10) {
      // Condición 1: "si uno se mete en la hora exacta la vera completa"
      setShowPostRaceModal(false);
      setIsWaiting(false);
      const remCountdown = elapsed <= 2 ? COUNTDOWN_START : Math.max(1, Math.ceil(10 - elapsed));
      launchRace({ full: true, initialCountdown: remCountdown });
    } else if (elapsed < 32.5) {
      // Condición 2: "sino la vera desde donde empezo"
      setShowPostRaceModal(false);
      setIsWaiting(false);
      const raceElapsedMs = (elapsed - 10) * 1000;
      const initialProgress = Math.min(0.98, (elapsed - 10) / 22);
      launchRace({ full: false, initialProgress, initialElapsedMs: raceElapsedMs });
    } else {
      // Condición 3: Carrera ya pasó -> Modal interactivo con reloj y 2 opciones (esperar o ver carrera anterior)
      setShowPostRaceModal(true);
      setIsWaiting(false);
      stopAll();
      setProgress(0);
    }

    return () => {
      clearCountdownTimers();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      stopAll();
    };
  }, [selectedRace, viewedRace.numero, viewedRace.hora, launchRace, clearCountdownTimers, stopAll]);

  // Transición automática al llegar el reloj a 00:00 (nueva carrera programada)
  useEffect(() => {
    if (liveSchedule.currentRaceNumber !== lastSlotNumberRef.current) {
      lastSlotNumberRef.current = liveSchedule.currentRaceNumber;

      // Si no estamos viendo una repetición congelada explícita de una carrera pasada:
      if (!isExplicitPastRace) {
        setShowPostRaceModal(false);
        setIsWaiting(false);
        const newRace = getOrCreateRace(
          liveSchedule.currentRaceNumber,
          liveSchedule.todayStr,
          liveSchedule.currentRaceTime
        );
        setViewedRace(newRace);
        launchRace({ full: true, initialCountdown: COUNTDOWN_START });
      }
    }
  }, [liveSchedule.currentRaceNumber, isExplicitPastRace, launchRace, liveSchedule.todayStr, liveSchedule.currentRaceTime]);

  // Tras cruzar la meta se muestra el podio animado sobre la pista; luego se abre el resumen de resultados
  useEffect(() => {
    if (!isFinished) { setResultsReady(false); return undefined; }
    const id = setTimeout(() => setResultsReady(true), TRACK_PODIUM_MS);
    return () => clearTimeout(id);
  }, [isFinished]);

  // Al término de la carrera: fanfarria + aplausos del público si hay ganador; si nadie llega, silencio (sin celebración)
  useEffect(() => {
    if (isFinished) {
      if (willAnyCarFinish) {
        playCelebration();
      } else {
        stopAll();
      }
    }
  }, [isFinished, willAnyCarFinish, playCelebration, stopAll]);

  // Calcular la posición X interpolada suavemente de cada auto para el `progress` actual,
  // con aparición de obstáculos en el momento y fijación permanente del obstáculo fatal que mató al auto
  const liveCars = useMemo(() => {
    const numSegments = tramos.length; // 8 segmentos entre largada y los 8 tramos
    const rawIndex = progress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
    const fraction = rawIndex - segIndex;

    // Easing suave: mezcla lineal + smoothstep para que los autos no se detengan en cada tramo
    const smoothT = fraction * 0.65 + fraction * fraction * (3 - 2 * fraction) * 0.35;
    const smoothTDeriv = 0.65 + 0.35 * 6 * fraction * (1 - fraction);
    const segmentSeconds = RACE_DURATION_MS / 1000 / numSegments;

    // En segIndex === 0 parten de minTrackX (150). En segIndex > 0 parten de tramos[segIndex - 1]
    const fromTramo = segIndex === 0 ? null : (tramos[segIndex - 1]?.EstadosAutos || []);
    const toTramo = tramos[segIndex]?.EstadosAutos || [];
    const currentObstacleData = tramos[segIndex] || tramos[0];

    return carNames.map((name, index) => {
      const fromCar = (fromTramo && fromTramo.find((c) => c.Nombre === name)) || { X: minTrackX, Estado: 'EN_CARRERA' };
      const toCar = (toTramo && toTramo.find((c) => c.Nombre === name)) || { X: minTrackX, Estado: 'EN_CARRERA' };

      const fatal = fatalEliminationByCar[name];

      // Determinar si este auto ya está eliminado en este punto de la animación
      let isEliminated = false;
      let isCrashing = false;
      let showCrashBadge = false;
      let fatalObstacle = null;

      if (fatal) {
        if (segIndex > fatal.fatalSegmentIndex) {
          // Ya estaba eliminado en un tramo previo: permanece detenido junto a su obstáculo fatal
          isEliminated = true;
          fatalObstacle = fatal;
        } else if (segIndex === fatal.fatalSegmentIndex) {
          // Es el tramo del choque fatal
          if (fraction >= 0.44) {
            isEliminated = true;
            isCrashing = fraction <= 0.72;
            showCrashBadge = fraction <= 0.88;
            fatalObstacle = fatal;
          }
        }
      }

      // En la largada (segIndex === 0), todos los autos parten exactamente desde minTrackX (150).
      // En los tramos siguientes, parten exactamente desde donde quedaron en el tramo previo (fromCar.X).
      const startX = segIndex === 0 ? minTrackX : (fromCar ? fromCar.X : minTrackX);
      const targetX = toCar.X;
      const deltaX = targetX - startX;
      const pasoObstaculo = toCar.PasoTramo === true || toCar.ResultadoObstaculo === 'EXITO';

      if (!isEliminated && !pasoObstaculo && fraction >= 0.40 && fraction <= 0.72) {
        isCrashing = true;
        showCrashBadge = true;
      }

      // Posición física del auto
      let currentX;
      let speedKmh = 0;
      let isBoosting = false;

      if (isEliminated) {
        if (segIndex > (fatal?.fatalSegmentIndex ?? -1)) {
          currentX = fatal ? fatal.crashX : targetX;
        } else {
          // Frenada e impacto suave hasta el obstáculo fatal sin salto abrupto
          const crashT = Math.min(1, smoothT / 0.50);
          currentX = startX + deltaX * crashT;
        }
        speedKmh = 0;
      } else {
        const paceFactor = carPaceFactor(name, segIndex, race.numero);
        const paceOffset = CAR_PACE_AMPLITUDE * paceFactor * Math.sin(smoothT * Math.PI);
        currentX = startX + deltaX * Math.max(0, Math.min(1, smoothT + paceOffset));
        const metersPerSecond = (deltaX / segmentSeconds) * (smoothTDeriv + CAR_PACE_AMPLITUDE * paceFactor * Math.PI * Math.cos(smoothT * Math.PI));
        const vibration = Math.sin(progress * 45 + index * 2) * 4;
        speedKmh = isFinished || progress <= 0
          ? 0
          : Math.max(0, Math.min(260, Math.round(metersPerSecond * 3.6 + vibration)));
        isBoosting = !isFinished && pasoObstaculo && fraction > 0.52 && fraction < 0.95;
      }

      // Obstáculo dinámico activo en pista para autos que aún están corriendo
      let activeObstacle = null;
      if (!isEliminated) {
        const obstacleDist = Math.max(60, deltaX * 0.60 + 50);
        const obstacleX = Math.round(startX + obstacleDist);
        const obstaclePct = getCarTrackPercent(obstacleX);

        let stage = 'hidden';
        if (fraction < 0.28) {
          stage = 'spawning';
        } else if (fraction <= 0.65) {
          stage = 'active';
        } else if (fraction <= 0.88) {
          stage = 'passed';
        }

        activeObstacle = {
          tipo: currentObstacleData.TipoObstaculo || 'ROCAS',
          nombre: currentObstacleData.NombreObstaculo || 'Obstáculo',
          icono: currentObstacleData.IconoObstaculo || '🪨',
          pct: obstaclePct,
          stage,
        };
      }

      // Maniobra de esquive (si está activo y superó el obstáculo)
      const inDodgeWindow = !isEliminated && pasoObstaculo && fraction >= 0.30 && fraction <= 0.68;
      let dodgeOffsetY = 0;
      let dodgeRotateDeg = 0;
      let isDodging = false;
      let isJumping = false;

      if (inDodgeWindow) {
        isDodging = true;
        const dodgePhase = Math.sin(((fraction - 0.30) / (0.68 - 0.30)) * Math.PI);
        const obsType = (currentObstacleData.TipoObstaculo || '').toUpperCase();

        if (obsType === 'HOYOS' || obsType === 'DUNAS' || obsType === 'GRIETAS' || index % 3 === 2) {
          isJumping = true;
          dodgeOffsetY = -Math.round(20 * dodgePhase);
          dodgeRotateDeg = -Math.round(10 * dodgePhase);
        } else if (index % 2 === 0) {
          dodgeOffsetY = -Math.round(15 * dodgePhase);
          dodgeRotateDeg = -Math.round(8 * dodgePhase);
        } else {
          dodgeOffsetY = Math.round(14 * dodgePhase);
          dodgeRotateDeg = Math.round(7 * dodgePhase);
        }
      }

      const showDodgeBadge = !isEliminated && pasoObstaculo && fraction >= 0.35 && fraction <= 0.70;

      const buggy = findBuggyByName(name);

      return {
        name,
        buggy,
        x: Math.round(currentX),
        speedKmh,
        isBoosting,
        isEliminated,
        isDodging,
        isJumping,
        isCrashing,
        dodgeOffsetY,
        dodgeRotateDeg,
        showDodgeBadge,
        showCrashBadge,
        pasoUltimoObstaculo: pasoObstaculo,
        activeObstacle,
        fatalObstacle,
        causaEliminacion: fatal?.nombre || toCar?.ObstaculoFallo || fromCar?.ObstaculoFallo || currentObstacleData?.NombreObstaculo || 'Obstáculo',
        index,
      };
    });
  }, [progress, tramos, carNames, fatalEliminationByCar, isFinished, race.numero]);

  // Ordenar autos por posición actual (los que avanzaron más van primero, eliminados al final)
  const rankedCars = useMemo(() => {
    return [...liveCars].sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      return b.x - a.x;
    });
  }, [liveCars]);

  const activeCars = liveCars.filter((c) => !c.isEliminated);
  const currentLeader = rankedCars.find((c) => !c.isEliminated) || rankedCars[0];
  const allCarsEliminated = activeCars.length === 0;

  // Las banderas de 1º/2º/3º se muestran una vez que los autos se separan de la grilla de largada
  const showPositionFlags = progress > 0.03 && countdown === null;

  // Posición en carrera (1, 2, 3...) solo para autos que siguen compitiendo
  const racePositionByName = useMemo(() => {
    const map = {};
    rankedCars
      .filter((c) => !c.isEliminated)
      .forEach((c, i) => {
        map[c.name] = i + 1;
      });
    return map;
  }, [rankedCars]);

  const getFlagPosition = (carName) => {
    if (!showPositionFlags) return null;
    const pos = racePositionByName[carName];
    return pos && pos <= 3 ? pos : null;
  };

  // Telemetría de audio en tiempo real (velocidad del líder y progreso de carrera)
  useEffect(() => {
    if (!isFinished && countdown === null && currentLeader) {
      updateTelemetry({
        speedKmh: currentLeader.speedKmh || 160,
        progress,
        isBoosting: currentLeader.isBoosting,
      });
    }
  }, [progress, currentLeader, isFinished, countdown, updateTelemetry]);

  // Efectos de sonido en carrera: choques fatales y saltos
  useEffect(() => {
    if (isFinished || countdown !== null) return;
    const numSegments = tramos.length;
    const rawIndex = progress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
    const fraction = rawIndex - segIndex;

    // Choque / Impacto con obstáculos (choque.mp3 para todos los obstáculos que no sean meteoritos)
    if (fraction >= 0.40 && fraction <= 0.65) {
      liveCars.forEach((c) => {
        if (c.isCrashing) {
          const crashKey = `${c.name}-${segIndex}`;
          if (!playedCrashSegmentsRef.current.has(crashKey)) {
            playedCrashSegmentsRef.current.add(crashKey);
            const obsType = (c.fatalObstacle?.tipo || c.activeObstacle?.tipo || currentSectorObstacle?.tipo || '').toUpperCase();
            if (obsType === 'METEORITOS') {
              playMeteor();
            } else {
              playCrash(obsType);
            }
          }
        }
      });
    }

    // Caída e impacto masivo de meteoritos desde el cielo (meteorito.mp3)
    const currentObstacleType = (currentSectorObstacle?.tipo || tramos[segIndex]?.TipoObstaculo || '').toUpperCase();
    if (currentObstacleType === 'METEORITOS' && fraction >= 0.18 && fraction <= 0.35) {
      const meteorKey = `meteor-${segIndex}`;
      if (!playedMeteorSegmentsRef.current.has(meteorKey)) {
        playedMeteorSegmentsRef.current.add(meteorKey);
        playMeteor();
      }
    }

    // Salto de buggies sobre dunas / grietas
    if (fraction >= 0.36 && fraction <= 0.48) {
      const anyJumping = liveCars.some((c) => c.isJumping);
      if (anyJumping) {
        const jumpKey = `jump-${segIndex}`;
        if (!playedJumpSegmentsRef.current.has(jumpKey)) {
          playedJumpSegmentsRef.current.add(jumpKey);
          playJump();
        }
      }
    }
  }, [progress, liveCars, isFinished, countdown, tramos, currentSectorObstacle, playCrash, playJump, playMeteor]);

  // Estados finales de los autos en el tramo de meta
  const finalCars = tramos[tramos.length - 1]?.EstadosAutos || [];

  const handleWatchPastRace = useCallback(() => {
    setShowPostRaceModal(false);
    setIsWaiting(false);
    setIsExplicitPastRace(true);
    const pastNum = liveSchedule.elapsedInSlot >= 32.5
      ? liveSchedule.currentRaceNumber
      : Math.max(1, liveSchedule.currentRaceNumber - 1);
    const pastTime = liveSchedule.elapsedInSlot >= 32.5
      ? liveSchedule.currentRaceTime
      : liveSchedule.currentRaceTime;
    const pastRace = getOrCreateRace(pastNum, liveSchedule.todayStr, pastTime);
    setViewedRace(pastRace);
    launchRace({ full: true, initialCountdown: COUNTDOWN_START });
  }, [liveSchedule, launchRace]);

  const handleWaitNextRace = useCallback(() => {
    setIsWaiting(true);
    setIsExplicitPastRace(false);
    setIsFinished(false);
    setResultsReady(false);
    stopAll();
    setProgress(0);
    setShowPostRaceModal(true);
  }, [stopAll]);

  const handleSwitchToLiveRace = useCallback(() => {
    setIsExplicitPastRace(false);
    setResultsReady(false);
    setIsFinished(false);
    clearCountdownTimers();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    stopAll();

    const sched = getRaceSchedule(new Date());
    const elapsed = sched.elapsedInSlot;
    const liveRace = getOrCreateRace(sched.currentRaceNumber, sched.todayStr, sched.currentRaceTime);
    setViewedRace(liveRace);

    if (elapsed <= 10) {
      setShowPostRaceModal(false);
      setIsWaiting(false);
      const remCountdown = elapsed <= 2 ? COUNTDOWN_START : Math.max(1, Math.ceil(10 - elapsed));
      launchRace({ full: true, initialCountdown: remCountdown });
    } else if (elapsed < 32.5) {
      setShowPostRaceModal(false);
      setIsWaiting(false);
      const raceElapsedMs = (elapsed - 10) * 1000;
      const initialProgress = Math.min(0.98, (elapsed - 10) / 22);
      launchRace({ full: false, initialProgress, initialElapsedMs: raceElapsedMs });
    } else {
      setShowPostRaceModal(true);
      setIsWaiting(false);
      stopAll();
      setProgress(0);
    }
  }, [clearCountdownTimers, launchRace, stopAll]);

  const handleReplay = useCallback(() => {
    launchRace({ full: true, initialCountdown: COUNTDOWN_START });
  }, [launchRace]);

  // Obtener todas las apuestas realizadas por el usuario para ESTA carrera en particular
  const userBetsForThisRace = useMemo(() => {
    const all = getUserBets();
    const list = all.filter((b) => Number(b.targetRaceNumber) === Number(race.numero));
    // Si viene userSelection por prop y corresponde a esta carrera pero no está en la lista guardada
    if (userSelection && Number(userSelection.targetRaceNumber) === Number(race.numero)) {
      if (!list.some((b) => b.id === userSelection.id || b.ticketId === userSelection.ticketId)) {
        list.unshift(userSelection);
      }
    }
    return list;
  }, [race.numero, userSelection]);

  const isUserParticipatingInThisRace = userBetsForThisRace.length > 0;

  // Lista de nombres únicos de buggies elegidos por el usuario en esta carrera
  const chosenBuggyNames = useMemo(() => {
    return [
      ...new Set(
        userBetsForThisRace
          .map((b) => b.buggy?.name?.toUpperCase())
          .filter(Boolean)
      ),
    ];
  }, [userBetsForThisRace]);

  const activeUserBuggyName = chosenBuggyNames[0] || userSelection?.buggy?.name?.toUpperCase() || null;
  const targetRaceNumber = Number(race.numero);
  const targetRaceTime = race.hora;

  // La vista en 1ª Persona (cabina) solo está habilitada para quien compró una apuesta para ESTA carrera
  const canUseFpv = isUserParticipatingInThisRace;
  useEffect(() => {
    if (!canUseFpv && cameraMode === 'cockpitFpv') setCameraMode('arcade25d');
  }, [canUseFpv, cameraMode]);
  const winnerCar = rankedCars.find((c) => !c.isEliminated) || null;

  // Podio oficial: solo autos que cruzaron la meta (no eliminados), máximo 3 lugares.
  // Si ningún auto llegó, el podio queda vacío.
  const podiumCars = useMemo(() => {
    if (ningunAutoLlego) return [null, null, null];
    const finishers = rankedCars.filter((c) => !c.isEliminated).slice(0, 3);
    return [finishers[0] || null, finishers[1] || null, finishers[2] || null];
  }, [rankedCars, ningunAutoLlego]);

  // Datos de carrera para cada auto del podio (tiempo estimado, diferencia con el ganador y velocidad media)
  const podiumStats = useMemo(() => {
    const winner = podiumCars[0];
    if (!winner || !winner.x) return [null, null, null];
    const raceSecs = RACE_DURATION_MS / 1000;
    const winnerMps = winner.x / raceSecs;
    return podiumCars.map((car) => {
      if (!car) return null;
      const gapM = Math.max(0, winner.x - car.x);
      const timeSecs = raceSecs + (winnerMps > 0 ? gapM / winnerMps : 0);
      return {
        gapM,
        timeSecs,
        gapSecs: timeSecs - raceSecs,
        avgKmh: Math.round((car.x / timeSecs) * 3.6),
      };
    });
  }, [podiumCars]);

  // Evaluación detallada de cada apuesta del usuario para esta carrera
  const evaluatedUserBets = useMemo(() => {
    if (!isFinished || !isUserParticipatingInThisRace) return [];

    return userBetsForThisRace.map((bet) => {
      const marketId = bet.market?.id || 'primer_lugar';
      const bName = bet.buggy?.name?.toUpperCase() || '';
      const montoBase = Number(bet.montoNum) || 2000;
      let won = false;
      let wonPlace = '';
      let winAmount = 0;

      if (marketId === 'ningun_auto') {
        won = Boolean(ningunAutoLlego);
        if (won) {
          winAmount = Math.round(montoBase * 14.0);
          wonPlace = 'Sin Ganador (Factor 14x)';
        }
      } else if (!ningunAutoLlego) {
        const first = (podiumCars[0]?.buggy?.name || '').toUpperCase();
        const second = (podiumCars[1]?.buggy?.name || '').toUpperCase();
        const third = (podiumCars[2]?.buggy?.name || '').toUpperCase();
        if (marketId === 'primer_lugar') {
          won = Boolean(bName && first === bName);
          wonPlace = '1º lugar (Ganador)';
        } else if (marketId === 'segundo_lugar') {
          won = Boolean(bName && (first === bName || second === bName));
          wonPlace = first === bName ? '1º lugar' : '2º lugar';
        } else if (marketId === 'tercer_lugar') {
          won = Boolean(bName && (first === bName || second === bName || third === bName));
          wonPlace = first === bName ? '1º lugar' : second === bName ? '2º lugar' : '3º lugar';
        }

        if (won) {
          const mult = getBetMultiplier(bName, marketId);
          winAmount = Math.round(montoBase * mult);
        }
      }

      return {
        bet,
        won,
        wonPlace,
        winAmount,
      };
    });
  }, [isFinished, isUserParticipatingInThisRace, userBetsForThisRace, ningunAutoLlego, rankedCars]);

  const winningBets = evaluatedUserBets.filter((e) => e.won);
  const totalUserWon = winningBets.reduce((acc, curr) => acc + curr.winAmount, 0);
  const hasUserWonAny = winningBets.length > 0;

  const drawMarketReport = useMemo(() => {
    if (!isFinished) return null;
    const p1 = (!ningunAutoLlego && winnerCar) ? winnerCar.buggy.name : (rankedCars[0]?.buggy?.name || 'ROJO');
    const p2 = (!ningunAutoLlego && rankedCars[1]) ? rankedCars[1].buggy.name : 'AZUL';
    const p3 = (!ningunAutoLlego && rankedCars[2]) ? rankedCars[2].buggy.name : 'VERDE';

    return generateDrawMarketReport({
      ningunAutoLlego: Boolean(ningunAutoLlego),
      ganador: ningunAutoLlego ? 'NINGUNO' : p1,
      podio: ningunAutoLlego ? [] : [p1, p2, p3],
    });
  }, [isFinished, ningunAutoLlego, winnerCar, rankedCars]);


  return (
    <div className={styles.container} ref={containerRef}>
      {/* 1. Barra Superior Oficial: Limpia, Equilibrada y Sin Ruido Visual */}
      <header className={styles.topBar}>
        {/* Columna Izquierda: Identificación única de la carrera */}
        <div className={styles.topBarLeft}>
          {isWaiting ? (
            <div className={`${styles.raceHeroBadge} ${styles.raceHeroLive}`}>
              <div className={styles.raceHeroTag}>
                <span className={styles.liveDot} style={{ background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                <span>EN ESPERA</span>
              </div>
              <span className={styles.raceHeroLabel}>PRÓXIMA</span>
              <span className={styles.raceHeroNumber}>{`Nº ${liveSchedule.nextRaceNumber}`}</span>
              <span className={styles.raceHeroTime}>{formatSecondsToCountdown(liveSchedule.remainingSeconds)}</span>
            </div>
          ) : isLive ? (
            <div className={`${styles.raceHeroBadge} ${styles.raceHeroLive}`}>
              <div className={styles.raceHeroTag}>
                <span className={styles.liveDot} />
                <span>EN VIVO</span>
              </div>
              <span className={styles.raceHeroLabel}>CARRERA</span>
              <span className={styles.raceHeroNumber}>{`Nº ${race.numero}`}</span>
              <span className={styles.raceHeroTime}>{race.hora} hrs</span>
            </div>
          ) : (
            <div className={`${styles.raceHeroBadge} ${styles.raceHeroReplay}`}>
              <div className={styles.raceHeroTag}>
                <i className="ph ph-clock-counter-clockwise" aria-hidden="true" />
                <span>REPETICIÓN</span>
              </div>
              <span className={styles.raceHeroLabel}>CARRERA</span>
              <span className={styles.raceHeroNumber}>{`Nº ${race.numero}`}</span>
              <span className={styles.raceHeroTime}>{race.hora} hrs</span>
            </div>
          )}

          {/* Botón compacto si hay una carrera en vivo disponible mientras se ve una anterior */}
          {isNewLiveRaceAvailable && (
            <button
              type="button"
              className={styles.liveNoticeBtn}
              onClick={handleSwitchToLiveRace}
              title="Sintonizar la carrera en vivo actual"
            >
              <span className={styles.liveNoticeDot} />
              <span>Ver en Vivo #{liveRaceNumber}</span>
            </button>
          )}
        </div>

        {/* Columna Central: Nombre del Circuito (Limpio y Centrado) */}
        <div className={styles.topBarCenter}>
          <h2 className={styles.raceTitle}>CIRCUITO DUNAS DEL PACÍFICO</h2>
        </div>

        {/* Columna Derecha: Selector de Cámara y Volver al Inicio */}
        <div className={styles.topBarRight}>
          <div className={styles.cameraSegmentedGroup}>
            <button
              type="button"
              className={`${styles.cameraSegmentBtn} ${cameraMode === 'arcade25d' ? styles.activeCameraSegment : ''}`}
              onClick={() => setCameraMode('arcade25d')}
              title="Cámara 3D en Perspectiva Arcade (Por defecto)"
            >
              <i className="ph ph-game-controller" aria-hidden="true" />
              <span>Arcade 2.5D</span>
            </button>
            <button
              type="button"
              className={`${styles.cameraSegmentBtn} ${cameraMode === 'broadcast2d' ? styles.activeCameraSegment : ''}`}
              onClick={() => setCameraMode('broadcast2d')}
              title="Vista Clásica Lateral"
            >
              <i className="ph ph-broadcast" aria-hidden="true" />
              <span>Clásica 2D</span>
            </button>
            {canUseFpv && (
              <button
                type="button"
                className={`${styles.cameraSegmentBtn} ${cameraMode === 'cockpitFpv' ? styles.activeCameraSegment : ''}`}
                onClick={() => setCameraMode('cockpitFpv')}
                title="Cámara en Primera Persona desde tu Buggy con espejo retrovisor y cabina"
              >
                <i className="ph ph-steering-wheel" aria-hidden="true" />
                <span>1ª Persona</span>
                <span className={styles.fpvHighlightBadge}>TÚ</span>
              </button>
            )}
          </div>

          {/* Botón de Sonido (Música de Carreras y Motor) */}
          <button
            type="button"
            className={`${styles.soundBtn} ${isMuted ? styles.soundBtnMuted : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Activar sonido de carreras y motor' : 'Silenciar sonido'}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            <i className={`ph ${isMuted ? 'ph-speaker-slash' : 'ph-speaker-high'}`} aria-hidden="true" />
            <span>{isMuted ? 'Mudo' : 'Audio'}</span>
          </button>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onBackToMenu}
            title="Volver al menú de inicio"
          >
            <i className="ph ph-house" aria-hidden="true" />
            <span>Inicio</span>
          </button>
        </div>
      </header>

      {/* 2. Barra de Progreso Superior: Discreta y Minimalista */}
      <div className={styles.raceProgressBarContainer}>
        <div className={styles.raceProgressBarFill} style={{ width: `${Math.round(progress * 100)}%` }}>
          <div className={styles.progressBarGlow} />
        </div>
        <div className={styles.progressBarInfo}>
          <span>LARGADA</span>
          <span className={styles.progressPercent}>{Math.round(progress * 100)}%</span>
          <span>🏁 META</span>
        </div>
      </div>

      {/* Modal Interactivo si el usuario entra cuando la carrera ya finalizó */}
      {showPostRaceModal && (
        <div className={styles.postRaceOverlay} role="dialog" aria-modal="true" aria-labelledby="postRaceHeading">
          <div className={styles.postRaceCard}>
            {/* Header del Modal */}
            <div className={styles.postRaceHeader}>
              <div className={styles.postRaceBadgeTag}>
                <span className={styles.postRaceDot} />
                <span>CARRERA Nº {liveSchedule.currentRaceNumber} FINALIZADA</span>
              </div>
              <h2 id="postRaceHeading" className={styles.postRaceTitle}>
                La carrera de las {liveSchedule.currentRaceTime} hrs ya concluyó
              </h2>
              <p className={styles.postRaceSub}>
                Puedes revivir la carrera que acaba de pasar o sintonizar la pista y esperar la largada de la siguiente.
              </p>
            </div>

            {/* Reloj y Cuenta Regresiva Oficial en Vivo */}
            <div className={styles.postRaceClockCard}>
              <div className={styles.postRaceClockHeader}>
                <span className={styles.postRaceClockEyebrow}>TIEMPO PARA LA PRÓXIMA CARRERA</span>
                <span className={styles.postRaceClockRaceTarget}>
                  CARRERA Nº {liveSchedule.nextRaceNumber} • {liveSchedule.nextRaceTime} HRS
                </span>
              </div>

              <div className={styles.postRaceDigitalClock}>
                <i className="ph ph-hourglass-high" aria-hidden="true" />
                <span className={styles.postRaceClockValue}>
                  {formatSecondsToCountdown(liveSchedule.remainingSeconds)}
                </span>
              </div>

              <div className={styles.postRaceClockBar}>
                <div
                  className={styles.postRaceClockBarFill}
                  style={{
                    width: `${Math.max(0, Math.min(100, ((300 - liveSchedule.remainingSeconds) / 300) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Resumen de apuesta activa si el usuario apostó */}
            {userSelection && (
              <div className={styles.postRaceUserTicketCard}>
                <i className="ph ph-ticket" aria-hidden="true" />
                <span>
                  Tu jugada para la Carrera Nº {userSelection.targetRaceNumber} ({userSelection.targetRaceTime} hrs) está confirmada (Ticket #{userSelection.ticketId} - Buggy {userSelection.buggy?.name || 'Amarillo'}). Se transmitirá aquí en directo.
                </span>
              </div>
            )}

            {/* Las 2 opciones principales en pantalla */}
            <div className={styles.postRaceOptionsGrid}>
              {/* Opción 1: Ver la carrera anterior */}
              <button
                type="button"
                className={styles.postRaceOptionCard}
                onClick={handleWatchPastRace}
              >
                <div className={styles.postRaceOptionIconWrap}>
                  <i className="ph ph-clock-counter-clockwise" aria-hidden="true" />
                </div>
                <div className={styles.postRaceOptionContent}>
                  <span className={styles.postRaceOptionBadge}>OPCIÓN 1</span>
                  <h3 className={styles.postRaceOptionTitle}>Ver la Carrera Anterior</h3>
                  <p className={styles.postRaceOptionDesc}>
                    Revive la Carrera Nº {liveSchedule.currentRaceNumber} ({liveSchedule.currentRaceTime} hrs) completa con repetición oficial, obstáculos y podio.
                  </p>
                </div>
                <span className={styles.postRaceOptionActionText}>
                  Ver repetición completa <i className="ph ph-arrow-right" aria-hidden="true" />
                </span>
              </button>

              {/* Opción 2: Esperar a la próxima */}
              <button
                type="button"
                className={`${styles.postRaceOptionCard} ${styles.postRaceOptionCardLive} ${isWaiting ? styles.postRaceOptionActive : ''}`}
                onClick={handleWaitNextRace}
              >
                <div className={`${styles.postRaceOptionIconWrap} ${styles.postRaceIconLive}`}>
                  <i className={`ph ${isWaiting ? 'ph-hourglass-high' : 'ph-broadcast'}`} aria-hidden="true" />
                </div>
                <div className={styles.postRaceOptionContent}>
                  <span className={`${styles.postRaceOptionBadge} ${styles.postRaceOptionBadgeLive}`}>
                    {isWaiting ? '✓ ESPERA ACTIVA • EN VIVO' : 'OPCIÓN 2 • EN DIRECTO'}
                  </span>
                  <h3 className={styles.postRaceOptionTitle}>Esperar a la Próxima Carrera</h3>
                  <p className={styles.postRaceOptionDesc}>
                    {isWaiting
                      ? `Modo espera activado. La Carrera Nº ${liveSchedule.nextRaceNumber} comenzará en vivo automáticamente a las ${liveSchedule.nextRaceTime} hrs.`
                      : `Sintoniza la pista y espera la largada. La Carrera Nº ${liveSchedule.nextRaceNumber} comenzará en vivo automáticamente a las ${liveSchedule.nextRaceTime} hrs.`}
                  </p>
                </div>
                <span className={styles.postRaceOptionActionText}>
                  {isWaiting ? 'Esperando inicio en vivo...' : 'Esperar en pista'} <i className="ph ph-arrow-right" aria-hidden="true" />
                </span>
              </button>
            </div>

            {/* Enlaces de pie de página */}
            <div className={styles.postRaceFooterRow}>
              {onGoToBet && (
                <button
                  type="button"
                  className={styles.postRaceBetBtn}
                  onClick={onGoToBet}
                >
                  <i className="ph ph-plus-circle" aria-hidden="true" />
                  <span>Participar en la Próxima Carrera ({TICKET_PRICE})</span>
                </button>
              )}

              <button
                type="button"
                className={styles.postRaceHomeBtn}
                onClick={onBackToMenu}
              >
                <i className="ph ph-house" aria-hidden="true" />
                <span>Volver al Inicio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Escenario Principal: Pista de Carreras de Videojuego */}
      <div className={`${styles.mainStage} ${countdown !== null && countdown > 0 ? styles.stagePaused : ''}`}>
      {/* Cuenta regresiva de largada centrada como la del GO */}
      {countdown !== null && (
        <div className={styles.countdownOverlay} aria-live="assertive">
          <span
            key={countdown}
            className={`${countdown === 0 ? styles.countdownGo : styles.countdownNumber} ${
              countdown > 0 && countdown <= 3 ? styles.countdownFinal : ''
            }`}
          >
            {countdown === 0 ? '¡GO!' : countdown}
          </span>
        </div>
      )}

      {/* Podio animado sobre la pista al finalizar la carrera */}
      {isFinished && !resultsReady && (
        <div
          className={`${styles.trackPodiumOverlay} ${ningunAutoLlego ? styles.trackPodiumEmpty : ''}`}
          aria-live="polite"
        >
          {!ningunAutoLlego && (
            <div className={styles.confettiLayer} aria-hidden="true">
              {CONFETTI_PIECES.map((p) => (
                <span
                  key={p.id}
                  className={styles.confettiPiece}
                  style={{
                    left: `${p.left}%`,
                    background: p.color,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`,
                    '--confetti-drift': `${p.drift}px`,
                    '--confetti-rot': `${p.rot}deg`,
                  }}
                />
              ))}
            </div>
          )}

          <div className={styles.trackPodiumTitle}>
            {ningunAutoLlego ? (
              <>
                <i className="ph ph-warning-octagon" aria-hidden="true" />
                <span>PODIO VACÍO • NINGÚN AUTO LLEGÓ</span>
              </>
            ) : (
              <>
                <i className="ph ph-trophy" aria-hidden="true" />
                <span>PODIO • CARRERA Nº {race.numero}</span>
              </>
            )}
          </div>

          <div className={styles.trackPodiumRow}>
            {[2, 1, 3].map((place) => {
              const car = podiumCars[place - 1];
              const stats = podiumStats[place - 1];
              const isUserCar =
                car && isUserParticipatingInThisRace && chosenBuggyNames.includes(car.buggy.name.toUpperCase());
              return (
                <div
                  key={place}
                  className={`${styles.trackPodiumCol} ${styles[`trackPodiumPlace${place}`]} ${!car ? styles.trackPodiumColEmpty : ''}`}
                >
                  <div className={styles.trackPodiumCar}>
                    {car ? (
                      <>
                        {place === 1 && <span className={styles.trackPodiumCrown}>👑</span>}
                        {isUserCar && <span className={styles.trackPodiumUserTag}>★ TU AUTO</span>}
                        <img src={car.buggy.image} alt={`${place}º lugar: ${car.buggy.name}`} />
                        <span className={styles.trackPodiumName} style={{ color: car.buggy.color }}>
                          {car.buggy.symbol} BUGGY {car.buggy.name}
                        </span>
                        {car.buggy.tagline && (
                          <span className={styles.trackPodiumTagline}>{car.buggy.tagline}</span>
                        )}
                        <div className={styles.trackPodiumStats} style={{ '--accent': car.buggy.color }}>
                          <div className={styles.trackPodiumStat}>
                            <span>Tiempo</span>
                            <strong>{stats ? `${stats.timeSecs.toFixed(2)}s` : '—'}</strong>
                          </div>
                          <div className={styles.trackPodiumStat}>
                            <span>{place === 1 ? 'Ventaja' : 'Diferencia'}</span>
                            <strong>
                              {place === 1
                                ? podiumStats[1]
                                  ? `+${podiumStats[1].gapSecs.toFixed(2)}s`
                                  : '—'
                                : stats
                                  ? `+${stats.gapSecs.toFixed(2)}s`
                                  : '—'}
                            </strong>
                          </div>
                          <div className={styles.trackPodiumStat}>
                            <span>Vel. media</span>
                            <strong>{stats ? `${stats.avgKmh} km/h` : '—'}</strong>
                          </div>
                          <div className={styles.trackPodiumStat}>
                            <span>Distancia</span>
                            <strong>{car.x} m</strong>
                          </div>
                          {car.buggy.specs && (
                            <div className={`${styles.trackPodiumStat} ${styles.trackPodiumStatWide}`}>
                              <span>Motor</span>
                              <strong>{car.buggy.specs.motor} • {car.buggy.specs.potencia}</strong>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className={styles.trackPodiumVacant}>
                        <i className="ph ph-prohibit" aria-hidden="true" />
                        VACÍO
                      </span>
                    )}
                  </div>
                  <div className={styles.trackPodiumBlock}>
                    <span>{place}º</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.trackPodiumResultsBtn}
            onClick={() => setResultsReady(true)}
          >
            Ver resultados <i className="ph ph-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}
        {cameraMode === 'cockpitFpv' ? (
          <ArcadeFirstPersonCockpit
            cars={liveCars}
            rankedCars={rankedCars}
            progress={progress}
            currentSectorObstacle={currentSectorObstacle}
            userBuggyNames={chosenBuggyNames}
            userBuggyName={activeUserBuggyName}
            isUserRace={isUserParticipatingInThisRace}
            isFinished={isFinished}
            fatalEliminationByCar={fatalEliminationByCar}
            ningunAutoLlego={ningunAutoLlego}
            showPositionFlags={showPositionFlags}
          />
        ) : cameraMode === 'arcade25d' ? (
          <ArcadeTrack25D
            cars={liveCars}
            rankedCars={rankedCars}
            progress={progress}
            currentSectorObstacle={currentSectorObstacle}
            userBuggyNames={chosenBuggyNames}
            userBuggyName={activeUserBuggyName}
            isUserRace={isUserParticipatingInThisRace}
            isFinished={isFinished}
            fatalEliminationByCar={fatalEliminationByCar}
            ningunAutoLlego={ningunAutoLlego}
            showPositionFlags={showPositionFlags}
          />
        ) : (
          /* Pista de Carreras Tipo Videojuego Arcade (Lateral) */
          <div className={`${styles.trackContainer} ${isFinished ? styles.trackPaused : ''}`}>
            <div className={styles.curbTop} />

            <div className={styles.lanesWrapper}>
            {liveCars.map((car, idx) => {
              const rank = rankedCars.findIndex((c) => c.name === car.name) + 1;
              const isUserChoice =
                isUserParticipatingInThisRace &&
                (chosenBuggyNames.includes(car.buggy.name.toUpperCase()) ||
                  (activeUserBuggyName && activeUserBuggyName.includes(car.buggy.name.toUpperCase())));
              const isLeader = rank === 1 && !car.isEliminated;
              const flagPosition = car.isEliminated ? null : getFlagPosition(car.name);

              return (
                <div
                  key={car.name}
                  className={`${styles.lane} ${isLeader ? styles.laneLeader : ''} ${
                    car.isEliminated ? styles.laneEliminated : ''
                  }`}
                >
                  {/* Encabezado del Carril */}
                  <div className={styles.laneHeader}>
                    {flagPosition && <PositionFlag position={flagPosition} size="xs" />}
                    <span
                      className={styles.laneRankBadge}
                      style={{ background: car.isEliminated ? '#475569' : car.buggy.color }}
                    >
                      {car.isEliminated ? 'OUT' : `P${rank}`}
                    </span>
                    <span className={styles.laneSymbol}>{car.buggy.symbol}</span>
                    <span
                      className={styles.laneName}
                      style={{ color: car.isEliminated ? '#94a3b8' : car.buggy.color }}
                    >
                      {car.buggy.name}
                    </span>

                    {isLeader && <span className={styles.leaderBadge}>⚡ LÍDER</span>}
                    {car.isEliminated && (
                      <span className={styles.eliminatedBadge}>
                        💥 DESTRUIDO ({car.causaEliminacion || 'Obstáculo'})
                      </span>
                    )}
                    {isUserChoice && <span className={styles.userChoiceBadge}>TU ELECCIÓN</span>}

                    <div className={styles.telemetryGroup}>
                      <span
                        className={`${styles.telemetrySpeed} ${
                          car.isEliminated ? styles.speedZero : ''
                        }`}
                      >
                        {car.speedKmh} km/h
                      </span>
                      <span className={styles.telemetryX}>{car.x}m</span>
                    </div>
                  </div>

                  {/* Vía de Carreras con Asfalto, Obstáculo Dinámico y Sprite del Buggy */}
                  <div className={styles.laneTrack}>
                    <div className={styles.trackSpeedLines} />

                    {/* 1. Obstáculo Dinámico que aparece en el momento para los autos activos en carrera */}
                    {!car.isEliminated && car.activeObstacle && car.activeObstacle.stage !== 'hidden' && (
                      <div
                        className={`${styles.dynamicObstacle} ${
                          styles['obsStage_' + car.activeObstacle.stage] || ''
                        }`}
                        style={{ left: `${car.activeObstacle.pct}%` }}
                      >
                        <ObstacleSprite
                          tipo={car.activeObstacle.tipo}
                          nombre={car.activeObstacle.nombre}
                        />
                      </div>
                    )}

                    {/* 2. Obstáculo Fatal que destruyó al auto: Permanece a su lado en la pista durante toda la carrera */}
                    {car.isEliminated && car.fatalObstacle && (
                      <div
                        className={styles.fatalCrashObstacle}
                        style={{
                          left: `calc(min(93%, ${getCarTrackPercent(car.x)}% + 112px))`,
                        }}
                        title={`Destruido por: ${car.fatalObstacle.nombre}`}
                      >
                        <ObstacleSprite
                          tipo={car.fatalObstacle.tipo}
                          nombre={car.fatalObstacle.nombre}
                        />
                      </div>
                    )}

                    {/* Auto Buggy Animado estilo Videojuego con Esquive Lateral / Salto y Sacudida en Impacto */}
                    <div
                      className={`${styles.carWrapper} ${
                        car.isEliminated ? styles.carCrashedWrapper : ''
                      }`}
                      style={{
                        left: `${getCarTrackPercent(car.x)}%`,
                        transform: `translateY(calc(-50% + ${car.dodgeOffsetY}px)) rotate(${car.dodgeRotateDeg}deg)`,
                        '--buggy-glow': car.buggy.glowColor,
                      }}
                    >
                      {/* Bandera distintiva de 1º, 2º o 3º lugar sobre el auto */}
                      {flagPosition && (
                        <div className={styles.carPositionFlag}>
                          <PositionFlag position={flagPosition} size="md" />
                        </div>
                      )}

                      {/* Badge flotante de Esquive Exitoso */}
                      {car.showDodgeBadge && (
                        <div className={styles.dodgeBanner}>
                          <i className="ph ph-check-circle" aria-hidden="true" />
                          <span>¡ESQUIVADO!</span>
                        </div>
                      )}

                      {/* Badge flotante de Impacto / Auto Eliminado que no continúa más */}
                      {car.isEliminated ? (
                        <div className={styles.crashBanner} style={{ background: 'rgba(185, 28, 28, 0.95)', borderColor: '#ef4444' }}>
                          <i className="ph ph-x-circle" aria-hidden="true" />
                          <span>💥 ¡AUTO {car.name} DESTRUIDO • NO CONTINÚA!</span>
                        </div>
                      ) : car.showCrashBadge ? (
                        <div className={styles.crashBanner}>
                          <i className="ph ph-warning-octagon" aria-hidden="true" />
                          <span>¡NO LO ESQUIVÓ!</span>
                        </div>
                      ) : null}

                      {/* Haz de luz de faros proyectado hacia adelante */}
                      {!car.isEliminated && (
                        <div
                          className={styles.headlightBeam}
                          style={{ '--beam-color': car.buggy.glowColor }}
                        />
                      )}

                      {/* Estela de tierra/polvo en movimiento */}
                      {!car.isEliminated && car.speedKmh > 30 && (
                        <div className={styles.dustRoosterTail} />
                      )}

                      {/* Sprite Vectorial del Buggy con sacudida si colisiona */}
                      <div className={car.isCrashing ? styles.buggyCrashShake : ''}>
                        <BuggySprite
                          color={car.buggy.color}
                          glowColor={car.buggy.glowColor}
                          name={car.name}
                          carNumber={idx + 1}
                          isRacing={!car.isEliminated}
                          isBoosting={car.isBoosting}
                          isEliminated={car.isEliminated}
                          isJumping={car.isJumping}
                        />
                      </div>

                      {/* Etiqueta flotante exclusiva para la elección del usuario */}
                      {isUserChoice && (
                        <div className={styles.buggyOverheadTag}>
                          <span className={styles.overheadUserArrow}>▼ TU AUTO</span>
                        </div>
                      )}
                    </div>

                    {/* Línea de Meta */}
                    <div className={styles.finishLine} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.curbBottom} />
        </div>
        )}

        {/* Panel Lateral: Radar GPS del Circuito y Clasificación en Vivo */}
        <aside className={styles.leaderboardSide}>
          {/* Radar GPS del Circuito */}
          <CircuitMinimap
            cars={liveCars}
            rankedCars={rankedCars}
            progress={progress}
            userBuggyNames={chosenBuggyNames}
            userBuggyName={activeUserBuggyName}
            isUserRace={isUserParticipatingInThisRace}
            isFinished={isFinished}
            isLive={isLive}
          />

          <div className={styles.leaderboardHeader}>
            <i className="ph ph-trophy" aria-hidden="true" />
            <span>ESTADO DE CARRERA</span>
          </div>

          <div className={styles.leaderboardList}>
            {rankedCars.map((car, rankIdx) => {
              const isUserChoice =
                isUserParticipatingInThisRace &&
                (chosenBuggyNames.includes(car.buggy.name.toUpperCase()) ||
                  (activeUserBuggyName && activeUserBuggyName.includes(car.buggy.name.toUpperCase())));
              const flagPosition = car.isEliminated ? null : getFlagPosition(car.name);
              const gapToLeader = !car.isEliminated && currentLeader && !currentLeader.isEliminated
                ? Math.max(0, currentLeader.x - car.x)
                : 0;

              return (
                <div
                  key={car.name}
                  className={`${styles.leaderboardItem} ${
                    rankIdx === 0 && !car.isEliminated ? styles.leaderItemFirst : ''
                  } ${car.isEliminated ? styles.leaderboardItemEliminated : ''} ${
                    isUserChoice ? styles.leaderboardItemUser : ''
                  }`}
                  style={{ '--accent': car.buggy.color }}
                >
                  <div
                    className={styles.leaderRankBadge}
                    style={{ background: car.isEliminated ? '#ef4444' : undefined }}
                  >
                    <span>{car.isEliminated ? '✕' : `${rankIdx + 1}º`}</span>
                  </div>

                  <div className={styles.leaderMiniBuggy}>
                    <img src={car.buggy.image} alt={car.buggy.name} className={styles.leaderCarThumb} />
                  </div>

                  <div className={styles.leaderInfo}>
                    <div className={styles.leaderNameRow}>
                      <span
                        className={styles.leaderName}
                        style={{ color: car.isEliminated ? '#94a3b8' : car.buggy.color }}
                      >
                        {car.buggy.symbol} {car.buggy.name}
                      </span>
                      {rankIdx === 0 && !car.isEliminated && <span className={styles.leaderStar}>👑</span>}
                      {flagPosition && (
                        <PositionFlag position={flagPosition} size="xs" className={styles.leaderFlag} />
                      )}
                    </div>

                    <div className={styles.leaderStatsRow}>
                      {car.isEliminated ? (
                        <span className={styles.leaderCrashedLabel}>
                          💥 Destruido por {car.causaEliminacion || 'Obstáculo'}
                        </span>
                      ) : (
                        <>
                          <span className={styles.leaderSpeed}>{car.speedKmh} km/h</span>
                          <span className={styles.leaderDist}>{car.x} m</span>
                          {showPositionFlags && rankIdx > 0 && (
                            <span className={styles.leaderGap}>-{gapToLeader} m</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tarjeta de Participación del Usuario (SOLO si apostó en ESTA carrera) */}
          {isUserParticipatingInThisRace ? (
            <div className={styles.userSelectionCard}>
              <div className={styles.userSelectionHeader}>
                <span className={styles.userSelectionLabel}>
                  TU PARTICIPACIÓN ({userBetsForThisRace.length > 1 ? `${userBetsForThisRace.length} APUESTAS` : '1 APUESTA'}):
                </span>
                <span className={styles.userSelectionBadgeActive}>JUGADA ACTIVA</span>
              </div>
              <div className={styles.userBetsList}>
                {userBetsForThisRace.map((bet, bIdx) => (
                  <div key={bet.id || bIdx} className={styles.userBetTicketItem}>
                    <div className={styles.userBetTicketTop}>
                      <span className={styles.userBetTicketId}>Ticket #{bet.ticketId || bet.id}</span>
                      <span className={styles.userBetTicketPrice}>{bet.monto || bet.precio || TICKET_PRICE}</span>
                    </div>
                    <div className={styles.userBetTicketRow}>
                      <span className={styles.userBetMarketBadge} style={{ color: bet.market?.accentColor }}>
                        {bet.market?.name}
                      </span>
                      {bet.buggy ? (
                        <span className={styles.userBetBuggyBadge} style={{ color: bet.buggy.color }}>
                          {bet.buggy.symbol} {bet.buggy.name}
                        </span>
                      ) : (
                        <span className={styles.userBetBuggyBadge} style={{ color: '#94a3b8' }}>
                          Sin Ganador
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            userSelection && (
              <div className={styles.spectatorCard}>
                <i className="ph ph-eye" aria-hidden="true" />
                <div className={styles.spectatorText}>
                  <span className={styles.spectatorTitle}>MODO ESPECTADOR</span>
                  <span className={styles.spectatorDesc}>
                    Tu apuesta activa (#{userSelection.ticketId}) es para la <strong>Carrera #{userSelection.targetRaceNumber} ({userSelection.targetRaceTime} hrs)</strong>.
                  </span>
                </div>
              </div>
            )
          )}
        </aside>
      </div>

      {/* 4. Podio o Pantalla de Catástrofe (si ningún auto llegó a la meta) */}
      {isFinished && resultsReady && (
        <div className={styles.resultsOverlay}>
          <div className={`${styles.resultsCard} ${ningunAutoLlego ? styles.resultsCardCatastrophe : ''}`}>
            {/* Ícono de Trofeo o Calavera/Fuego si ningún auto llegó */}
            <div className={`${styles.resultsTrophy} ${ningunAutoLlego ? styles.resultsTrophyCatastrophe : ''}`}>
              <i className={ningunAutoLlego ? "ph ph-warning-octagon" : "ph ph-flag-checkered"} aria-hidden="true" />
            </div>

            <span className={styles.resultsRaceNumber}>{`CARRERA Nº ${race.numero}`}</span>
            <span className={styles.resultsEyebrow}>FINALIZADA • {race.hora} hrs</span>

            {ningunAutoLlego ? (
              <>
                <h2 className={styles.resultsTitleCatastrophe}>
                  💥 ¡NINGÚN AUTO LLEGÓ A LA META!
                </h2>
                <span className={styles.resultsSub}>
                  Todos los buggies fueron destruidos por los obstáculos (rocas, hoyos y meteoritos).
                </span>
                <div className={styles.winningMarketBadge}>
                  MERCADO GANADOR: <strong>NINGÚN AUTO LLEGA A LA META</strong>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.resultsTitle}>
                  ¡GANADOR: BUGGY {winnerCar?.buggy?.name}! {winnerCar?.buggy?.symbol}
                </h2>
                <span className={styles.resultsSub}>
                  {race.fecha} • {race.hora} hrs • Circuito Dunas del Pacífico
                </span>
              </>
            )}

            {/* Banner de resultado para la jugada del usuario (SOLO si apostó en esta carrera) */}
            {isUserParticipatingInThisRace && (
              <div
                className={`${styles.userResultBanner} ${
                  hasUserWonAny ? styles.userResultWon : styles.userResultLost
                }`}
              >
                {hasUserWonAny ? (
                  <>
                    <i className="ph ph-confetti" aria-hidden="true" />
                    <span>
                      {winningBets.length === 1
                        ? `¡FELICITACIONES! ACERTASTE: ${winningBets[0].bet.market?.name?.toUpperCase()} ${
                            winningBets[0].bet.buggy ? `CON BUGGY ${winningBets[0].bet.buggy.name}` : '(SIN GANADOR)'
                          } (PREMIO: $${totalUserWon.toLocaleString('es-CL')})`
                        : `¡FELICITACIONES! ACERTASTE EN ${winningBets.length} DE TUS APUESTAS (PREMIO TOTAL: $${totalUserWon.toLocaleString('es-CL')})`}
                    </span>
                  </>
                ) : (
                  <>
                    <i className="ph ph-info" aria-hidden="true" />
                    <span>
                      {ningunAutoLlego
                        ? 'Ningún buggy completó el circuito. Ganó el mercado: Sin Ganador.'
                        : 'La carrera ha concluido. Tus apuestas no resultaron premiadas. ¡Prueba suerte en la siguiente!'}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Podio oficial: 1º, 2º y 3º lugar. Lugares sin auto (o si ninguno llegó) se muestran vacíos */}
            <div className={`${styles.podiumStage} ${ningunAutoLlego ? styles.podiumStageEmpty : ''}`}>
              <div className={styles.podiumStageTitle}>
                <i className="ph ph-trophy" aria-hidden="true" />
                <span>PODIO OFICIAL</span>
              </div>

              <div className={styles.podiumRow}>
                {[
                  { place: 2, cls: styles.podiumSecond, label: '2º LUGAR' },
                  { place: 1, cls: styles.podiumFirst, label: '1º LUGAR' },
                  { place: 3, cls: styles.podiumThird, label: '3º LUGAR' },
                ].map(({ place, cls, label }) => {
                  const car = podiumCars[place - 1];
                  return (
                    <div
                      key={place}
                      className={`${styles.podiumColumn} ${cls} ${!car ? styles.podiumColumnEmpty : ''}`}
                    >
                      {/* Badge superior de posición */}
                      <div className={`${styles.podiumPlaceBadge} ${styles[`podiumPlaceBadge${place}`]}`}>
                        {place === 1 ? '👑 1º LUGAR' : label}
                      </div>

                      {car ? (
                        <>
                          <div className={styles.podiumImgWrap}>
                            <img
                              src={car.buggy.image}
                              alt={`${label}: ${car.buggy.name}`}
                              className={place === 1 ? styles.podiumImgFirst : styles.podiumImg}
                            />
                          </div>

                          <div className={styles.podiumBuggyDetails}>
                            <span className={styles.podiumBuggyName} style={{ color: car.buggy.color }}>
                              BUGGY {car.buggy.name}
                            </span>
                            <span className={styles.podiumDistBadge}>
                              {car.x} m
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className={styles.podiumEmptyBox}>
                          <i className="ph ph-prohibit" aria-hidden="true" />
                          <span className={styles.podiumEmptyTitle}>VACÍO</span>
                          <span className={styles.podiumEmptySub}>Sin clasificar</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {ningunAutoLlego && (
                <div className={styles.podiumEmptyMessage}>
                  <i className="ph ph-warning-octagon" aria-hidden="true" />
                  <span>PODIO VACÍO • NINGÚN AUTO LLEGÓ A LA META</span>
                </div>
              )}
            </div>

            {/* Si ningún auto llegó: Resumen de Bajas por Obstáculo */}
            {ningunAutoLlego && (
              <div className={styles.casualtyBox}>
                <span className={styles.casualtyTitle}>REGISTRO DE IMPACTOS EN EL CIRCUITO</span>
                <div className={styles.casualtyGrid}>
                  {liveCars.map((c) => (
                    <div key={c.name} className={styles.casualtyItem}>
                      <span style={{ color: c.buggy.color, fontWeight: 900 }}>
                        {c.buggy.symbol} {c.buggy.name}:
                      </span>
                      <span className={styles.casualtyCause}>
                        💥 Destruido a los {c.x}m por {c.causaEliminacion || 'Obstáculo'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Reporte de Mercados Detallado (Tabla Gráfica Oficial) */}
            {drawMarketReport && (
              <div className={`${styles.marketReportCard} ${styles.resultsReportCol}`}>
                <div className={styles.marketReportHeader}>
                  <div className={styles.marketReportTitleGroup}>
                    <i className="ph ph-chart-bar" aria-hidden="true" />
                    <div>
                      <h3 className={styles.marketReportHeading}>
                        Reporte de Mercados del Sorteo
                      </h3>
                      <p className={styles.marketReportSubheading}>
                        Balance consolidado de apuestas, premios y retorno (RTP) de la Carrera #{race.numero}
                      </p>
                    </div>
                  </div>
                  <div className={styles.marketReportLiveTag}>
                    <span className={styles.marketReportLiveDot} />
                    <span>Sorteo #{race.numero}</span>
                  </div>
                </div>

                <div className={styles.tableResponsiveWrapper}>
                  <table className={styles.graphicReportTable}>
                    <thead>
                      <tr>
                        <th className={styles.thMarket}>Mercado</th>
                        <th className={styles.thNumber}>Tks Apost</th>
                        <th className={styles.thNumber}>Tks Ganad</th>
                        <th className={styles.thMoney}>$ Recaudado</th>
                        <th className={styles.thPrize}>$ Premios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drawMarketReport.rows.map((row) => (
                        <tr key={row.mercado} className={styles.tableDataRow}>
                          <td className={styles.tdMarket}>
                            <span className={styles.marketNameText}>{row.mercado}</span>
                            <span
                              className={styles.marketBadgeTag}
                              style={{ borderColor: row.accentColor, color: row.accentColor }}
                            >
                              {row.badge}
                            </span>
                          </td>
                          <td className={styles.tdNumber}>{row.tksApost}</td>
                          <td className={styles.tdNumber}>
                            <span className={row.tksGanad !== '0' ? styles.ticketsWonBadge : styles.ticketsZeroBadge}>
                              {row.tksGanad}
                            </span>
                          </td>
                          <td className={styles.tdMoney}>{row.recaudado}</td>
                          <td className={styles.tdPrize}>
                            <span className={row.premios !== '$0' ? styles.prizePositiveText : styles.prizeZeroText}>
                              {row.premios}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Métricas Resumen Consolidadas */}
                <div className={styles.reportSummaryGrid}>
                  <div className={styles.summaryKpiCard}>
                    <span className={styles.kpiLabel}>Total Apuestas</span>
                    <span className={styles.kpiValue}>{drawMarketReport.resumen.apuestas} <small>tks</small></span>
                  </div>
                  <div className={styles.summaryKpiCard}>
                    <span className={styles.kpiLabel}>Total Premiados</span>
                    <span className={styles.kpiValueSuccess}>{drawMarketReport.resumen.premios} <small>tks</small></span>
                  </div>
                  <div className={styles.summaryKpiCard}>
                    <span className={styles.kpiLabel}>Monto Apostado</span>
                    <span className={styles.kpiValue}>${drawMarketReport.resumen.montoApostado}</span>
                  </div>
                  <div className={styles.summaryKpiCard}>
                    <span className={styles.kpiLabel}>Monto Premiados</span>
                    <span className={styles.kpiValueGold}>${drawMarketReport.resumen.montoPremiados}</span>
                  </div>
                  <div className={styles.summaryKpiCard}>
                    <span className={styles.kpiLabel}>RTP General</span>
                    <span className={styles.kpiValueRtp}>{drawMarketReport.resumen.rtpGlobal}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className={styles.resultsActions}>
              {/* Reloj y cuenta regresiva para la próxima carrera programada */}
              <div style={{
                width: '100%',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                fontWeight: '800',
                boxSizing: 'border-box',
              }}>
                <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="ph ph-hourglass-high" />
                  Próxima Carrera Nº {liveSchedule.nextRaceNumber} ({liveSchedule.nextRaceTime} hrs)
                </span>
                <span style={{ color: '#facc15', fontVariantNumeric: 'tabular-nums', fontWeight: '900', fontSize: '0.9rem' }}>
                  {formatSecondsToCountdown(liveSchedule.remainingSeconds)}
                </span>
              </div>

              {/* Botón VER CARRERA siempre disponible e idéntico al del Home */}
              <button
                type="button"
                className={styles.resultsWatchLiveBtn}
                onClick={handleSwitchToLiveRace}
                title="Ver la carrera en directo"
              >
                <span className={styles.resultsWatchLiveDot} />
                <span>VER CARRERA</span>
              </button>

              <button
                type="button"
                className={styles.nextRaceBtn}
                onClick={onGoToBet}
              >
                <i className="ph ph-ticket" aria-hidden="true" />
                <span>PARTICIPAR EN PRÓXIMA CARRERA ({TICKET_PRICE})</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
                <button
                  type="button"
                  className={styles.replayActionBtn}
                  onClick={handleReplay}
                >
                  <i className="ph ph-arrow-counter-clockwise" aria-hidden="true" />
                  <span>Repetir Carrera</span>
                </button>

                <button
                  type="button"
                  className={styles.homeActionBtn}
                  onClick={onBackToMenu}
                >
                  <i className="ph ph-house" aria-hidden="true" />
                  <span>Volver al Inicio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

