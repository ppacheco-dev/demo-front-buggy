import React, { useState, useEffect, useRef, useMemo } from 'react';
import { findBuggyByName } from '../../game/config/selectionData';
import { getOrCreateRace, REFERENCE_RACE_TRAMOS } from '../../game/config/raceStorageService';
import BuggySprite from './BuggySprite';
import ObstacleSprite from './ObstacleSprite';
import CircuitMinimap from './CircuitMinimap';
import ArcadeTrack25D from './ArcadeTrack25D';
import { TICKET_PRICE } from '../../game/config/raceTimeService';
import styles from './LiveRaceScreen.module.css';

// Duración total de la carrera en milisegundos (22s de acción pura estilo videojuego)
const RACE_DURATION_MS = 22000;

export default function LiveRaceScreen({
  onBackToMenu,
  onGoToBet,
  userSelection,
  raceInfo,
  selectedRace = null,
}) {
  // Obtener o generar la carrera consistente (debe corresponder a la hora ACTUAL, no a la próxima)
  const now = new Date();
  const todayStr = raceInfo?.todayStr || `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const currentSlotMins = Math.floor(now.getMinutes() / 5) * 5;
  const currentSlotHours = now.getHours();
  const currentSlotHourStr = `${String(currentSlotHours).padStart(2, '0')}:${String(currentSlotMins).padStart(2, '0')}`;
  const currentSlotNum = Math.floor((currentSlotHours * 60 + currentSlotMins) / 5) + 1;

  const initialNumber = selectedRace?.numero || raceInfo?.currentRaceNumber || currentSlotNum;
  const initialHour = selectedRace?.hora || raceInfo?.currentRaceTime || currentSlotHourStr;

  // Estado que fija y bloquea la carrera que el usuario está viendo actualmente.
  // CRÍTICO: Si el usuario está viendo una carrera anterior o la de un ticket/slot previo,
  // NUNCA se sobreescribe ni se reemplaza automáticamente al iniciar una nueva carrera en vivo.
  const [viewedRace, setViewedRace] = useState(() => {
    return selectedRace || getOrCreateRace(initialNumber, todayStr, initialHour);
  });

  // Si el prop selectedRace cambia explícitamente a otra carrera seleccionada
  useEffect(() => {
    if (selectedRace && selectedRace.numero !== viewedRace.numero) {
      setViewedRace(selectedRace);
    }
  }, [selectedRace]);

  const race = viewedRace;
  const tramos = race.tramos && race.tramos.length > 0 ? race.tramos : REFERENCE_RACE_TRAMOS;

  const liveRaceNumber = raceInfo?.currentRaceNumber || currentSlotNum;
  const liveRaceTime = raceInfo?.currentRaceTime || currentSlotHourStr;
  const isViewingPastRace = Boolean(selectedRace || (race.numero < liveRaceNumber));
  const isNewLiveRaceAvailable = liveRaceNumber > race.numero;
  const isLive = !isViewingPastRace;

  const handleSwitchToLiveRace = () => {
    const liveRace = getOrCreateRace(liveRaceNumber, todayStr, liveRaceTime);
    setViewedRace(liveRace);
  };

  // Estados de animación continua (por defecto: vista clásica 2D)
  const [progress, setProgress] = useState(0); // 0.0 a 1.0
  const [isFinished, setIsFinished] = useState(false);
  const [cameraMode, setCameraMode] = useState('broadcast2d'); // 'broadcast2d' (por defecto) | 'arcade25d'
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

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
    const numSegments = tramos.length - 1; // 7 segmentos entre los 8 tramos
    const rawIndex = progress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
    const currentTramo = tramos[segIndex + 1] || tramos[segIndex] || tramos[0];

    return {
      tramo: currentTramo.TramoActual,
      tipo: currentTramo.TipoObstaculo || 'ROCAS',
      nombre: currentTramo.NombreObstaculo || 'Obstáculo',
      icono: currentTramo.IconoObstaculo || '🪨',
      segIndex,
    };
  }, [progress, tramos]);

  // Motor de animación continua vía requestAnimationFrame
  const startRaceAnimation = () => {
    setProgress(0);
    setIsFinished(false);
    startTimeRef.current = performance.now();

    const loop = (currentTime) => {
      const elapsed = currentTime - startTimeRef.current;
      const currentProgress = Math.min(1, elapsed / RACE_DURATION_MS);
      setProgress(currentProgress);

      if (currentProgress < 1) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        setIsFinished(true);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    startRaceAnimation();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [race.numero, race.hora]);

  // Mapeo determinista del obstáculo fatal para cada auto que queda eliminado
  const fatalEliminationByCar = useMemo(() => {
    const map = {};

    carNames.forEach((name) => {
      // Buscar el primer tramo donde el auto pasa a estado ELIMINADO
      for (let sIdx = 0; sIdx < tramos.length; sIdx++) {
        const carState = tramos[sIdx]?.EstadosAutos?.find((c) => c.Nombre === name);
        if (carState?.Estado === 'ELIMINADO') {
          // El tramo donde ocurrió el choque fatal
          const tramoObj = tramos[sIdx] || tramos[Math.max(0, sIdx - 1)] || tramos[0];
          map[name] = {
            fatalTramoIndex: sIdx,
            fatalSegmentIndex: Math.max(0, sIdx - 1),
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

  // Calcular la posición X interpolada suavemente de cada auto para el `progress` actual,
  // con aparición de obstáculos en el momento y fijación permanente del obstáculo fatal que mató al auto
  const liveCars = useMemo(() => {
    const numSegments = tramos.length - 1; // 7 segmentos entre los 8 tramos
    const rawIndex = progress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
    const fraction = rawIndex - segIndex;

    // Easing suave (smoothstep / cúbico)
    const smoothT = fraction * fraction * (3 - 2 * fraction);

    const fromTramo = tramos[segIndex]?.EstadosAutos || [];
    const toTramo = tramos[segIndex + 1]?.EstadosAutos || fromTramo;
    const currentObstacleData = tramos[segIndex + 1] || tramos[segIndex] || tramos[0];

    return carNames.map((name, index) => {
      const fromCar = fromTramo.find((c) => c.Nombre === name) || { X: 180, Estado: 'EN_CARRERA' };
      const toCar = toTramo.find((c) => c.Nombre === name) || fromCar;

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

      // Si no es un choque fatal pero el auto falló temporalmente un obstáculo
      const deltaX = toCar.X - fromCar.X;
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
        currentX = fatal ? fatal.crashX : fromCar.X;
        speedKmh = 0;
      } else {
        currentX = fromCar.X + deltaX * smoothT;
        speedKmh = Math.max(0, Math.round(152 + (deltaX / 130) * 36 + Math.sin(progress * 45 + index * 2) * 8));
        isBoosting = pasoObstaculo && fraction > 0.52 && fraction < 0.95;
      }

      // Obstáculo dinámico activo en pista para autos que aún están corriendo
      let activeObstacle = null;
      if (!isEliminated) {
        const obstacleDist = Math.max(60, deltaX * 0.60 + 50);
        const obstacleX = Math.round(fromCar.X + obstacleDist);
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
        causaEliminacion: fatal?.nombre || toCar.ObstaculoFallo || fromCar.ObstaculoFallo || currentObstacleData.NombreObstaculo,
        index,
      };
    });
  }, [progress, tramos, carNames, fatalEliminationByCar]);

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

  // Evaluar si ningún auto llegó a la meta
  const finalCars = tramos[tramos.length - 1]?.EstadosAutos || [];
  const ningunAutoLlego = race.ningunAutoLlego || (isFinished && finalCars.every((c) => c.Estado === 'ELIMINADO' || !c.PasoTramo || c.X < 1100));

  const handleReplay = () => {
    startRaceAnimation();
  };

  // Evaluación de si la participación del usuario corresponde a ESTA carrera en particular
  const targetRaceNumber = Number(userSelection?.targetRaceNumber || userSelection?.raceInfo?.nextRaceNumber);
  const targetRaceTime = userSelection?.targetRaceTime || userSelection?.raceInfo?.nextRaceTime;
  const isUserParticipatingInThisRace = Boolean(
    userSelection &&
    targetRaceNumber &&
    targetRaceNumber === Number(race.numero)
  );

  const userMarketId = isUserParticipatingInThisRace ? userSelection?.market?.id : null;
  const userBuggyName = isUserParticipatingInThisRace ? userSelection?.buggy?.name?.toUpperCase() : null;
  const winnerCar = rankedCars.find((c) => !c.isEliminated) || null;

  let userWon = false;
  if (isFinished && isUserParticipatingInThisRace) {
    if (userMarketId === 'ningun_auto') {
      userWon = Boolean(ningunAutoLlego);
    } else if (!ningunAutoLlego && winnerCar) {
      userWon = Boolean(userBuggyName && userBuggyName.includes(winnerCar.buggy.name.toUpperCase()));
    }
  }

  return (
    <div className={styles.container}>
      {/* 1. Barra Superior Oficial: Identificación Exacta de la Carrera */}
      <header className={styles.topBar}>
        {isLive ? (
          <div className={styles.liveBadgeGroup}>
            <span className={styles.liveDot} />
            <span className={styles.liveBadgeText}>EN VIVO</span>
            <div className={styles.liveEqualizer}>
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : (
          <div className={styles.replayBadgeGroup}>
            <i className="ph ph-clock-counter-clockwise" aria-hidden="true" />
            <span className={styles.replayBadgeText}>CARRERA ANTERIOR</span>
          </div>
        )}

        {/* Notificación no intrusiva: Carrera en vivo disponible sin interrumpir la actual */}
        {isNewLiveRaceAvailable && (
          <div className={styles.liveAvailablePill}>
            <span className={styles.liveAvailableDot} />
            <span className={styles.liveAvailableText}>
              Carrera #{liveRaceNumber} en vivo ({liveRaceTime} hrs)
            </span>
            <button
              type="button"
              className={styles.liveAvailableBtn}
              onClick={handleSwitchToLiveRace}
              title="Sintonizar la carrera en vivo actual"
            >
              <i className="ph ph-broadcast" aria-hidden="true" />
              <span>Ver en Vivo</span>
            </button>
          </div>
        )}

        {/* Identificador Oficial: Carrera #X, Fecha y Hora */}
        <div className={styles.raceTitleGroup}>
          <div className={styles.raceTitleRow}>
            <span className={styles.raceNumberBadge}>Carrera #{race.numero}</span>
            <h2 className={styles.raceTitle}>CIRCUITO DUNAS DEL PACÍFICO</h2>
          </div>
          <div className={styles.raceMetaRow}>
            <span className={styles.raceDateMeta}>📅 Fecha: <strong>{race.fecha}</strong></span>
            <span className={styles.metaSeparator}>•</span>
            <span className={styles.raceTimeMeta}>⏰ Hora: <strong>{race.hora} hrs</strong></span>
            <span className={styles.metaSeparator}>•</span>
            <span className={styles.raceSpeedMeta}>
              {allCarsEliminated ? (
                <strong style={{ color: '#ef4444' }}>⚠️ TODOS ELIMINADOS</strong>
              ) : (
                <>Líder: <strong>{currentLeader?.buggy?.name} ({currentLeader?.speedKmh} km/h)</strong></>
              )}
            </span>
          </div>
        </div>

        {/* Acciones de Barra Superior: Selector de Cámara y Volver al Inicio */}
        <div className={styles.topBarActions}>
          <div className={styles.cameraSelector}>
            <span className={styles.cameraSelectorLabel}>VISTA:</span>
            <div className={styles.cameraSegmentedGroup}>
              <button
                type="button"
                className={`${styles.cameraSegmentBtn} ${cameraMode === 'arcade25d' ? styles.activeCameraSegment : ''}`}
                onClick={() => setCameraMode('arcade25d')}
                title="Cámara 3D en Perspectiva Arcade (Horizon Chase)"
              >
                <i className="ph ph-game-controller" aria-hidden="true" />
                <span>ARCADE 2.5D</span>
              </button>
              <button
                type="button"
                className={`${styles.cameraSegmentBtn} ${cameraMode === 'broadcast2d' ? styles.activeCameraSegment : ''}`}
                onClick={() => setCameraMode('broadcast2d')}
                title="Vista Clásica Lateral de Transmisión"
              >
                <i className="ph ph-broadcast" aria-hidden="true" />
                <span>CLÁSICA 2D</span>
              </button>
            </div>
          </div>

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

      {/* 2. Barra de Progreso Superior con Radar del Circuito */}
      <div className={styles.raceProgressBarContainer}>
        <div className={styles.raceProgressBarFill} style={{ width: `${Math.round(progress * 100)}%` }}>
          <div className={styles.progressBarGlow} />
        </div>
        <div className={styles.progressBarInfo}>
          <span>LARGADA</span>
          <span className={styles.progressPercent}>
            {Math.round(progress * 100)}% RECORRIDO • {activeCars.length} / {carNames.length} BUGGIES EN CARRERA
          </span>
          <span>🏁 META (1.140 m)</span>
        </div>
      </div>

      {/* 3. Escenario Principal: Pista de Carreras de Videojuego */}
      <div className={styles.mainStage}>
        {cameraMode === 'arcade25d' ? (
          <ArcadeTrack25D
            cars={liveCars}
            rankedCars={rankedCars}
            progress={progress}
            currentSectorObstacle={currentSectorObstacle}
            userBuggyName={userBuggyName}
            isUserRace={isUserParticipatingInThisRace}
            isFinished={isFinished}
            fatalEliminationByCar={fatalEliminationByCar}
          />
        ) : (
          /* Pista de Carreras Tipo Videojuego Arcade (Lateral) */
          <div className={styles.trackContainer}>
          {/* Cartel / Escenografía superior de la pista con Obstáculo del Momento */}
          <div className={styles.speedwayBillboard}>
            <div className={styles.billboardLeft}>
              <span className={styles.billboardText}>🏁 PACIFIC DUNES SPEEDWAY • 4x4 BUGGY CHAMPIONSHIP</span>
            </div>

            {/* Aviso del obstáculo activo en este momento */}
            {!isFinished && (
              <div className={styles.billboardHazardTag}>
                <span className={styles.hazardBlinkIcon}>⚠️</span>
                <span className={styles.hazardLabelText}>
                  OBSTÁCULO EN PISTA: <strong>{currentSectorObstacle.icono} {currentSectorObstacle.nombre}</strong>
                </span>
              </div>
            )}
          </div>

          <div className={styles.curbTop} />

          <div className={styles.lanesWrapper}>
            {liveCars.map((car, idx) => {
              const rank = rankedCars.findIndex((c) => c.name === car.name) + 1;
              const isUserChoice = isUserParticipatingInThisRace && userBuggyName && userBuggyName.includes(car.buggy.name.toUpperCase());
              const isLeader = rank === 1 && !car.isEliminated;

              return (
                <div
                  key={car.name}
                  className={`${styles.lane} ${isLeader ? styles.laneLeader : ''} ${
                    car.isEliminated ? styles.laneEliminated : ''
                  }`}
                >
                  {/* Encabezado del Carril */}
                  <div className={styles.laneHeader}>
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
                      {/* Badge flotante de Esquive Exitoso */}
                      {car.showDodgeBadge && (
                        <div className={styles.dodgeBanner}>
                          <i className="ph ph-check-circle" aria-hidden="true" />
                          <span>¡ESQUIVADO!</span>
                        </div>
                      )}

                      {/* Badge flotante de Impacto / No Esquivado */}
                      {car.showCrashBadge && (
                        <div className={styles.crashBanner}>
                          <i className="ph ph-warning-octagon" aria-hidden="true" />
                          <span>{car.isEliminated ? '¡IMPACTO CRÍTICO!' : '¡NO LO ESQUIVÓ!'}</span>
                        </div>
                      )}

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
            userBuggyName={userBuggyName}
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
              const isUserChoice = isUserParticipatingInThisRace && userBuggyName && userBuggyName.includes(car.buggy.name.toUpperCase());

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
                <span className={styles.userSelectionLabel}>TU PARTICIPACIÓN:</span>
                <span className={styles.userSelectionBadgeActive}>JUGADA ACTIVA</span>
              </div>
              <div className={styles.userSelectionDetails}>
                {userSelection.ticketId && (
                  <span>Ticket: <strong>#{userSelection.ticketId}</strong></span>
                )}
                <span>Carrera: <strong>#{targetRaceNumber} ({targetRaceTime} hrs)</strong></span>
                <span>Mercado: <strong>{userSelection.market?.name}</strong></span>
                {userSelection.buggy && (
                  <span>Auto: <strong style={{ color: userSelection.buggy.color }}>{userSelection.buggy.name}</strong></span>
                )}
                <span>Precio: <strong>{userSelection.monto || userSelection.precio || TICKET_PRICE}</strong></span>
              </div>
            </div>
          ) : (
            userSelection && (
              <div className={styles.spectatorCard}>
                <i className="ph ph-eye" aria-hidden="true" />
                <div className={styles.spectatorText}>
                  <span className={styles.spectatorTitle}>MODO ESPECTADOR</span>
                  <span className={styles.spectatorDesc}>
                    Tu apuesta activa (#{userSelection.ticketId}) es para la <strong>Carrera #{targetRaceNumber} ({targetRaceTime} hrs)</strong>.
                  </span>
                </div>
              </div>
            )
          )}
        </aside>
      </div>

      {/* 4. Podio o Pantalla de Catástrofe (si ningún auto llegó a la meta) */}
      {isFinished && (
        <div className={styles.resultsOverlay}>
          <div className={`${styles.resultsCard} ${ningunAutoLlego ? styles.resultsCardCatastrophe : ''}`}>
            {/* Ícono de Trofeo o Calavera/Fuego si ningún auto llegó */}
            <div className={`${styles.resultsTrophy} ${ningunAutoLlego ? styles.resultsTrophyCatastrophe : ''}`}>
              <i className={ningunAutoLlego ? "ph ph-warning-octagon" : "ph ph-flag-checkered"} aria-hidden="true" />
            </div>

            <span className={styles.resultsEyebrow}>CARRERA #{race.numero} FINALIZADA</span>

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
                  userWon ? styles.userResultWon : styles.userResultLost
                }`}
              >
                {userWon ? (
                  <>
                    <i className="ph ph-confetti" aria-hidden="true" />
                    <span>
                      {userMarketId === 'ningun_auto'
                        ? '¡FELICITACIONES! ACERTASTE: NINGÚN AUTO LLEGÓ A LA META'
                        : `¡FELICITACIONES! TU AUTO #${winnerCar?.buggy?.name} GANÓ LA CARRERA`}
                    </span>
                  </>
                ) : (
                  <>
                    <i className="ph ph-info" aria-hidden="true" />
                    <span>
                      {ningunAutoLlego
                        ? 'Ningún buggy completó el circuito. Ganó el mercado: Ningún auto llega a la meta.'
                        : 'La carrera ha concluido. ¡Prueba suerte en la siguiente!'}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Si llegaron autos: Podio Top 3. Si no: Resumen de Bajas por Obstáculo */}
            {!ningunAutoLlego ? (
              <div className={styles.podiumRow}>
                {/* 2do Lugar */}
                {rankedCars[1] && (
                  <div className={styles.podiumColumn}>
                    <span className={styles.podiumPlace}>2º LUGAR</span>
                    <img
                      src={rankedCars[1].buggy.image}
                      alt="2do"
                      className={styles.podiumImg}
                    />
                    <span className={styles.podiumName} style={{ color: rankedCars[1].buggy.color }}>
                      {rankedCars[1].buggy.symbol} {rankedCars[1].buggy.name}
                    </span>
                    <span className={styles.podiumCoord}>{rankedCars[1].x}m</span>
                  </div>
                )}

                {/* 1er Lugar */}
                {winnerCar && (
                  <div className={`${styles.podiumColumn} ${styles.podiumFirst}`}>
                    <div className={styles.crownIcon}>👑</div>
                    <span className={styles.podiumPlace}>1º LUGAR</span>
                    <img
                      src={winnerCar.buggy.image}
                      alt="1ro"
                      className={styles.podiumImgFirst}
                    />
                    <span className={styles.podiumName} style={{ color: winnerCar.buggy.color }}>
                      {winnerCar.buggy.symbol} {winnerCar.buggy.name}
                    </span>
                    <span className={styles.podiumCoord}>{winnerCar.x}m</span>
                  </div>
                )}

                {/* 3er Lugar */}
                {rankedCars[2] && (
                  <div className={styles.podiumColumn}>
                    <span className={styles.podiumPlace}>3º LUGAR</span>
                    <img
                      src={rankedCars[2].buggy.image}
                      alt="3ro"
                      className={styles.podiumImg}
                    />
                    <span className={styles.podiumName} style={{ color: rankedCars[2].buggy.color }}>
                      {rankedCars[2].buggy.symbol} {rankedCars[2].buggy.name}
                    </span>
                    <span className={styles.podiumCoord}>{rankedCars[2].x}m</span>
                  </div>
                )}
              </div>
            ) : (
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

            {/* Botones de Acción */}
            <div className={styles.resultsActions}>
              {isNewLiveRaceAvailable && (
                <button
                  type="button"
                  className={styles.watchCurrentLiveBtn}
                  onClick={handleSwitchToLiveRace}
                >
                  <i className="ph ph-broadcast" aria-hidden="true" />
                  <span>VER CARRERA EN VIVO #{liveRaceNumber} ({liveRaceTime} HRS)</span>
                </button>
              )}

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
