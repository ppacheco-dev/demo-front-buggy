import React, { useMemo, useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react';
import ArcadeBuggyRearSprite from './ArcadeBuggyRearSprite';
import ArcadeRoadHazardZone from './ArcadeRoadHazardZone';
import ArcadeSkyFallingHazards from './ArcadeSkyFallingHazards';
import useArcadeAudio from '../../hooks/useArcadeAudio';
import PositionFlag from './PositionFlag';
import {
  getRoadState,
  drawPseudoRoad,
  coastTravel,
  laneX,
  roadCenterX,
  roadHeadingDeg,
  finishGantryLayout,
  steerAtTrackPct,
  ROAD_RENDER_SCALE,
} from './pseudoRoad';
import { carTrackPct } from './circuitTrack';
import styles from './ArcadeTrack25D.module.css';

/**
 * ArcadeTrack25D: Pista de carreras en perspectiva 2.5D pseudo-3D
 * Optimizada para alto rendimiento (60+ FPS constante en GPU):
 * 1. Obstáculo transversal del ancho completo de la pista que pasa por debajo de los buggies (z-index bajo).
 * 2. Si un buggy esquiva o supera el obstáculo, realiza un salto aéreo o maniobra ágil de esquiva.
 * 3. Los buggies que quedan eliminados desaparecen inmediatamente de la pista.
 * 4. Posicionamiento con hardware acceleration (translate3d) y sin transitions CSS en RAF.
 */
export default function ArcadeTrack25D({
  cars = [],
  rankedCars = [],
  progress = 0,
  currentSectorObstacle = {},
  userBuggyNames = [],
  userBuggyName = null,
  isUserRace = false,
  isFinished = false,
  ningunAutoLlego = false,
  fatalEliminationByCar = {},
  showPositionFlags = false,
}) {
  const { isMuted: isAudioMuted, toggleMute: toggleAudio } = useArcadeAudio();

  // Encontrar auto líder de la carrera
  const leaderCar = rankedCars.find((c) => !c.isEliminated) || rankedCars[0] || null;

  // Filtrar buggies activos que siguen en competencia
  const activeCars = useMemo(() => {
    return cars.filter((c) => !c.isEliminated);
  }, [cars]);

  // Rango relativo de distancia para ordenar a los buggies en perspectiva Z
  const { minX, maxX } = useMemo(() => {
    let min = 150;
    let max = 1140;
    if (activeCars.length > 0) {
      const xs = activeCars.map((c) => c.x);
      min = Math.min(...xs);
      max = Math.max(...xs);
    }
    return { minX: min, maxX: Math.max(min + 60, max) };
  }, [activeCars]);

  // Autos visibles en pista: los que siguen en carrera + los que acaban de ser destruidos
  // (para que se aprecie la animación de destrucción con fuego, humo y el aviso oficial de que no continúa más)
  const renderedCars = useMemo(() => {
    const numSegments = 8;
    const rawIndex = progress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
    const fraction = rawIndex - segIndex;

    return cars
      .map((car) => {
        if (!car.isEliminated) {
          return {
            ...car,
            isWreck: false,
            isCrashingNow: false,
            wreckOpacity: 1,
            crashProgress: 0,
          };
        }

        const fatal = fatalEliminationByCar[car.name];
        if (!fatal) {
          return null;
        }

        const isCrashSeg = segIndex === fatal.fatalSegmentIndex;
        const isNextSeg = segIndex === fatal.fatalSegmentIndex + 1;

        // Si estamos en el tramo donde ocurre el choque:
        if (isCrashSeg) {
          return {
            ...car,
            isWreck: fraction >= 0.44,
            isCrashingNow: fraction >= 0.44 && fraction <= 0.72,
            wreckOpacity: 1,
            crashProgress: fraction >= 0.44 ? (fraction - 0.44) / 0.56 : 0,
          };
        } else if (isNextSeg && fraction < 0.45) {
          // En el tramo posterior inmediato, el auto averiado se desvanece suavemente hacia el fondo
          return {
            ...car,
            isWreck: true,
            isCrashingNow: false,
            wreckOpacity: Math.max(0, 1 - fraction / 0.45),
            crashProgress: 1,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [cars, progress, fatalEliminationByCar]);

  // Auto recién destruido en el tramo actual para mostrar alerta oficial en pantalla
  const activeIncidentCar = useMemo(() => {
    const numSegments = 8;
    const rawIndex = progress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(rawIndex));
    const fraction = rawIndex - segIndex;

    return cars.find((c) => {
      if (!c.isEliminated) return false;
      const fatal = fatalEliminationByCar[c.name];
      if (!fatal) return false;
      return segIndex === fatal.fatalSegmentIndex && fraction >= 0.44 && fraction <= 0.94;
    });
  }, [cars, progress, fatalEliminationByCar]);

  // Distribución dinámica y uniforme de carriles sobre la calzada ensanchada
  // (-0.85 a +0.85) para máxima separación entre autos sin amontonamiento
  const getCarLaneNorm = useCallback((carIndex, totalCars) => {
    const total = Math.max(2, totalCars || 6);
    const idx = Math.max(0, Math.min(total - 1, carIndex));
    return -0.85 + (1.70 / (total - 1)) * idx;
  }, []);

  // Cálculo de la aproximación en perspectiva 3D del obstáculo transversal para TODOS los autos
  const { isHazardVisible, hazardTop, hazardScale, hazardOpacity } = useMemo(() => {
    // Hay 8 tramos y transiciones
    const sectorFraction = (progress * 8) % 1;
    const isMeteor = currentSectorObstacle?.tipo === 'METEORITOS';
    const minFraction = isMeteor ? 0.21 : 0.12;
    const maxFraction = 0.68;

    // Visible mientras se aproxima desde el horizonte hasta pasar bajo los autos
    const isVisible = !isFinished && currentSectorObstacle?.tipo && sectorFraction >= minFraction && sectorFraction <= maxFraction;

    if (!isVisible) {
      return { isHazardVisible: false, hazardTop: 0, hazardScale: 1, hazardOpacity: 0 };
    }

    // Normalizado de 0 (horizonte lejano / impacto) a 1 (primer plano cruzado)
    const norm = Math.min(1, Math.max(0, (sectorFraction - minFraction) / (maxFraction - minFraction)));
    const curve = Math.pow(norm, 2.3); // aceleración en perspectiva 3D veloz

    // Para meteoritos, el cráter se estampa con impacto visible en plena calzada (top ~34%, scale ~0.55) a plena opacidad
    // Para otros obstáculos, emerge gradualmente desde el horizonte (~14%, scale ~0.22)
    const startTop = isMeteor ? 34 : 14;
    const top = startTop + curve * (86 - startTop);
    const startScale = isMeteor ? 0.55 : 0.22;
    const scale = startScale + curve * (1.38 - startScale);
    const opacity = isMeteor ? (norm > 0.88 ? (1 - norm) / 0.12 : 1) : (norm < 0.08 ? norm / 0.08 : (norm > 0.88 ? (1 - norm) / 0.12 : 1));

    return {
      isHazardVisible: true,
      hazardTop: top,
      hazardScale: scale,
      hazardOpacity: opacity,
    };
  }, [progress, isFinished, currentSectorObstacle]);

  // Estado para el aviso gigante arriba de la pista que luego desaparece
  const [bigAlert, setBigAlert] = useState(null);
  const lastAlertedTramoRef = useRef(null);

  useEffect(() => {
    const sectorFraction = (progress * 8) % 1;
    // Mostrar la alerta gigante al inicio del sector (cuando entran los meteoritos o se aproxima el obstáculo)
    if (sectorFraction >= 0.04 && currentSectorObstacle?.nombre && !isFinished) {
      const tramoKey = `${currentSectorObstacle.tramo}-${currentSectorObstacle.tipo}`;
      if (lastAlertedTramoRef.current !== tramoKey) {
        lastAlertedTramoRef.current = tramoKey;
        setBigAlert({
          nombre: currentSectorObstacle.nombre,
          icono: currentSectorObstacle.icono || '⚠️',
          tipo: currentSectorObstacle.tipo,
          tramo: currentSectorObstacle.tramo,
          key: Date.now(),
        });
      }
    }
  }, [progress, currentSectorObstacle, isFinished]);

  // Fracción actual del sector para coordinar saltos y esquives de los buggies
  const sectorFraction = (progress * 8) % 1;
  const isMeteorImpactShake =
    currentSectorObstacle?.tipo === 'METEORITOS' &&
    sectorFraction >= 0.20 &&
    sectorFraction <= 0.36;

  // Carretera pseudo-3D estilo Super Nintendo: las curvas salen del circuito GPS en la posición
  // del auto que va adelante (el que persigue la cámara), igual que el blip del minimapa
  const cameraTrackPct = activeCars.length > 0 ? carTrackPct(maxX) : progress;
  const roadState = useMemo(
    () => getRoadState(progress, cameraTrackPct),
    [progress, cameraTrackPct]
  );
  const roadCurve = roadState.curve;

  // Canvas de la carretera (scanlines con perspectiva y curva)
  const groundRef = useRef(null);
  const roadCanvasRef = useRef(null);
  const canvasSizeRef = useRef({ w: 0, h: 0, aspect: 1.6 });
  const [canvasSizeTick, setCanvasSizeTick] = useState(0);

  useEffect(() => {
    const ground = groundRef.current;
    const canvas = roadCanvasRef.current;
    if (!ground || !canvas) return undefined;

    const resize = () => {
      // Resolución interna reducida: look pixelado retro y muchos menos píxeles por cuadro
      const w = Math.max(1, Math.round(ground.clientWidth * ROAD_RENDER_SCALE));
      const h = Math.max(1, Math.round(ground.clientHeight * ROAD_RENDER_SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      canvasSizeRef.current = {
        w,
        h,
        aspect: ground.clientWidth / Math.max(1, ground.clientHeight),
        gw: ground.clientWidth,
      };
      setCanvasSizeTick((n) => n + 1);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(ground);
    return () => ro.disconnect();
  }, []);

  // Pórtico de META anclado al mundo: se posiciona con la misma proyección que la carretera
  const gantryRef = useRef(null);
  const showFinish = !ningunAutoLlego;
  const placeGantry = (travel, curve) => {
    const el = gantryRef.current;
    if (!el) return;
    const layout = showFinish ? finishGantryLayout(travel, curve) : null;
    if (!layout) {
      el.style.visibility = 'hidden';
      return;
    }
    const gw = canvasSizeRef.current.gw || 1000;
    // Mismo orden de profundidad que los buggies (los autos más cercanos tapan los postes)
    const feetPct = layout.yn * 100 - 12;
    const z = Math.round(((feetPct - 38) / 34) * 100) + 14;
    el.style.visibility = 'visible';
    el.style.width = `${gw}px`;
    el.style.fontSize = `${gw / 24}px`;
    el.style.left = `${layout.x * 100}%`;
    el.style.top = `${layout.yn * 100}%`;
    el.style.opacity = String(layout.opacity);
    el.style.zIndex = String(Math.max(1, Math.min(220, z)));
    el.style.transform = `translate3d(-50%, -100%, 0) scale(${layout.width.toFixed(4)})`;
  };

  useLayoutEffect(() => {
    if (isFinished) return;
    const canvas = roadCanvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    const { w, h } = canvasSizeRef.current;
    if (!ctx || !w || !h) return;
    drawPseudoRoad(ctx, w, h, { ...roadState, finish: showFinish });
    placeGantry(roadState.travel, roadState.curve);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadState, canvasSizeTick, isFinished, showFinish]);

  // Al cruzar la META la pista no se congela de golpe: sigue avanzando y frena por inercia
  // (los autos atraviesan el pórtico y la línea a cuadros pasa bajo ellos)
  useEffect(() => {
    if (!isFinished) return undefined;
    const canvas = roadCanvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!ctx) return undefined;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const elapsed = now - start;
      const { w, h } = canvasSizeRef.current;
      const travel = roadState.travel + coastTravel(elapsed, 2200, 3.2);
      if (w && h) {
        drawPseudoRoad(ctx, w, h, { ...roadState, travel, finish: showFinish });
      }
      placeGantry(travel, roadState.curve);
      if (elapsed < 2200) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, canvasSizeTick]);

  // Parallax lateral del paisaje: al doblar a la derecha las montañas se desplazan a la izquierda
  const skyShiftPx = -roadState.heading * 220;

  return (
    <div className={`${styles.arcadeContainer} ${isFinished ? styles.trackPaused : ''}`}>
      {/* 1. HUD SUPERIOR ARCADE (HORIZON CHASE STYLE) */}
      <div className={styles.arcadeHudTop}>
        <div className={styles.arcadeSpeedometer}>
          <span className={styles.speedDigit}>{leaderCar?.speedKmh || 0}</span>
          <span className={styles.speedUnit}>KM/H</span>
        </div>

        <div className={styles.arcadeSectorBox}>
          <span className={styles.sectorIcon}>{currentSectorObstacle?.icono || '🏁'}</span>
          <span className={styles.sectorLabel}>
            TRAMO {currentSectorObstacle?.tramo || 1}/8 • {currentSectorObstacle?.nombre || 'Circuito'}
          </span>
        </div>

        {/* Botón de control de sonido arcade integrado en el HUD */}
        <button
          type="button"
          className={`${styles.hudSoundBtn} ${isAudioMuted ? styles.hudSoundBtnMuted : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? 'Activar Sonido y Música' : 'Silenciar Sonido'}
          aria-label={isAudioMuted ? 'Activar Sonido' : 'Silenciar Sonido'}
        >
          <span className={styles.hudSoundIcon}>{isAudioMuted ? '🔇' : '🔊'}</span>
          <span className={styles.hudSoundText}>{isAudioMuted ? 'MUDO' : 'AUDIO'}</span>
        </button>
      </div>

      {/* Alerta oficial de incidente en pista cuando un auto es destruido */}
      {activeIncidentCar && (
        <div className={styles.raceIncidentAlert}>
          <div className={styles.raceIncidentIcon}>💥</div>
          <div className={styles.raceIncidentContent}>
            <span className={styles.raceIncidentHead}>
              🚨 INCIDENTE EN PISTA • AUTO {activeIncidentCar.buggy.name.toUpperCase()}
            </span>
            <span className={styles.raceIncidentMessage}>
              ¡DESTRUIDO POR {activeIncidentCar.causaEliminacion || activeIncidentCar.fatalObstacle?.nombre || 'OBSTÁCULO'}!
            </span>
            <span className={styles.raceIncidentSub}>
              ⛔ EL AUTO QUEDA FUERA DE CARRERA • NO CONTINÚA MÁS
            </span>
          </div>
        </div>
      )}

      {/* RÁFAGAS AERODINÁMICAS LATERALES A ALTA VELOCIDAD */}
      {(leaderCar?.speedKmh || 0) > 145 && (
        <div className={styles.arcadeSpeedStreaksOverlay}>
          <div className={styles.arcadeWindStreakLeft} />
          <div className={styles.arcadeWindStreakRight} />
        </div>
      )}

      {/* AVISO GIGANTE EN GRANDE ARRIBA DE LA PISTA QUE LUEGO DESAPARECE */}
      {bigAlert && (
        <div key={bigAlert.key} className={styles.bigHazardOverlay}>
          <div className={styles.bigHazardBox}>
            <div className={styles.bigHazardHeaderLine}>
              <span className={styles.flashingWarningIcon}>⚠️</span>
              <span className={styles.bigHazardHeaderText}>¡OBSTÁCULO EN PISTA!</span>
              <span className={styles.flashingWarningIcon}>⚠️</span>
            </div>
            <div className={styles.bigHazardTitleRow}>
              <span className={styles.bigHazardIcon}>{bigAlert.icono}</span>
              <span className={styles.bigHazardTitle}>{bigAlert.nombre.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* OBJETOS QUE CAEN DESDE EL CIELO (METEORITOS Y AVALANCHAS) */}
      <ArcadeSkyFallingHazards
        tipo={currentSectorObstacle?.tipo}
        nombre={currentSectorObstacle?.nombre}
        sectorFraction={sectorFraction}
        isFinished={isFinished}
        viewMode="25D"
        roadCurve={roadCurve}
      />

      {/* 2. CIELO Y HORIZONTE DEL DESIERTO (PARALLAX RETRO) */}
      <div className={styles.arcadeSky}>
        <div
          className={styles.retroSun}
          style={{ transform: `translate3d(calc(-50% + ${skyShiftPx * 0.25}px), 0, 0)` }}
        />
        <div
          className={styles.mountainSilhouettes}
          style={{ transform: `translate3d(${skyShiftPx * 0.6}px, 0, 0)` }}
        />
        <div
          className={styles.rollingDunes}
          style={{ transform: `translate3d(${skyShiftPx}px, 0, 0)` }}
        />
        <div className={styles.heatShimmer} />
      </div>

      {/* 3. PISTA EN PERSPECTIVA PSEUDO-3D */}
      <div className={`${styles.arcadeGround} ${isMeteorImpactShake ? styles.groundMeteorImpactShake : ''}`} ref={groundRef}>
        {/* Destello térmico cegador de impacto en pantalla */}
        {isMeteorImpactShake && <div className={styles.screenMeteorImpactFlash} />}

        {/* Carretera pseudo-3D por scanlines (arena, bordillos, asfalto, carriles y props laterales) */}
        <canvas
          ref={roadCanvasRef}
          className={`${styles.roadCanvas} ${isMeteorImpactShake ? styles.roadCanvasImpactShake : ''}`}
          aria-hidden="true"
        />

        {/* La línea de META a cuadros se pinta en el canvas de la carretera (misma perspectiva y curva) */}

        {/* 4. OBSTÁCULO TRANSVERSAL DEL ANCHO COMPLETO DE LA PISTA (PASA POR DEBAJO DE LOS BUGGIES) */}
        {isHazardVisible && (
          <div
            className={styles.arcadeFullTrackHazard}
            style={{
              top: `${hazardTop}%`,
              left: `${roadCenterX(hazardTop / 100, roadCurve) * 100}%`,
              transform: `translate3d(-50%, -50%, 0) scale(${hazardScale})`,
              opacity: hazardOpacity,
              zIndex: 6, // Estrictamente por debajo de los buggies (buggies tienen zIndex 15-120)
            }}
          >
            <ArcadeRoadHazardZone
              tipo={currentSectorObstacle.tipo}
              nombre={currentSectorObstacle.nombre}
              icono={currentSectorObstacle.icono}
              isImpactingNow={isMeteorImpactShake}
            />
          </div>
        )}

        {/* 5. Capa de los Buggies en Perspectiva 2.5D (Activos y Destruidos en Obstáculo) */}
        <div className={styles.arcadeCarsLayer}>
          {/* Pórtico de META anclado a la carretera (posición/escala calculadas en cada cuadro) */}
          {showFinish && (
            <div ref={gantryRef} className={styles.worldGantry} aria-hidden="true">
              <div className={`${styles.worldGantryPost} ${styles.worldGantryPostLeft}`} />
              <div className={`${styles.worldGantryPost} ${styles.worldGantryPostRight}`} />
              <div className={styles.worldGantryBanner}>
                <div className={styles.worldGantryFlag} />
                <div className={styles.worldGantryBoard}>
                  <span className={styles.worldGantryTitle}>META</span>
                  <span className={styles.worldGantrySub}>DUNAS DEL PACÍFICO • 1.140 M</span>
                </div>
                <div className={styles.worldGantryFlag} />
              </div>
            </div>
          )}
          {renderedCars.map((car, idx) => {
            const rank = rankedCars.findIndex((c) => c.name === car.name) + 1;
            const isUserChoice =
              isUserRace && (
                (Array.isArray(userBuggyNames) && userBuggyNames.includes(car.buggy.name.toUpperCase())) ||
                (userBuggyName && userBuggyName.includes(car.buggy.name.toUpperCase()))
              );
            const isLeader = rank === 1 && !car.isWreck;
            const carIdx = car.index !== undefined ? car.index : idx;

            let topPct;
            let scale;
            let baseZIndex;
            let jumpY = 0;
            let jumpScaleBonus = 0;
            let evasionX = 0;
            let dynamicTilt = 0;
            let isEvasionActive = false;
            let isJumping = false;

            if (car.isWreck) {
              // Auto chocado/destruido: se queda en su carril humeando y retrocede con la calzada
              const driftY = (car.crashProgress || 0) * 16;
              topPct = Math.min(84, 64 + driftY);
              scale = 1.10 + (topPct - 64) * 0.012;
              baseZIndex = Math.round(topPct) + 5;
              dynamicTilt = (car.index % 2 === 0 ? 0.35 : -0.35); // Ladeo por eje roto/colisión
            } else {
              // Autos activos en competencia
              const rawDistRatio = maxX > minX ? (car.x - minX) / (maxX - minX) : 0;
              const spreadFactor = Math.min(1, Math.max(0, (progress - 0.02) * 5));
              const distRatio = rawDistRatio * spreadFactor;

              topPct = 72 - distRatio * 34;
              scale = (1.10 - distRatio * 0.34) * 1.45;
              baseZIndex = Math.round((1 - distRatio) * 100) + 15;

              // Ventana en la que este auto en particular esquiva o salta el obstáculo
              const carReactionOffset = (1 - distRatio) * 0.06;
              const encounterStart = 0.38 + carReactionOffset;
              const encounterEnd = 0.58 + carReactionOffset;

              if (sectorFraction >= encounterStart && sectorFraction <= encounterEnd) {
                isEvasionActive = true;
                const t = (sectorFraction - encounterStart) / (encounterEnd - encounterStart);
                const sinArc = Math.sin(t * Math.PI);

                if (
                  currentSectorObstacle?.tipo === 'DUNAS' ||
                  currentSectorObstacle?.tipo === 'HOYOS' ||
                  currentSectorObstacle?.tipo === 'GRIETAS'
                ) {
                  isJumping = true;
                  jumpY = -sinArc * 32;
                  jumpScaleBonus = sinArc * 0.12;
                  dynamicTilt = (t < 0.5 ? -0.12 : 0.16) * sinArc;
                } else {
                  const swerveDir = idx % 2 === 0 ? 1 : -1;
                  evasionX = Math.sin(t * Math.PI) * 10 * swerveDir;
                  dynamicTilt = Math.sin(t * Math.PI) * 0.25 * swerveDir;
                  jumpY = -sinArc * 6;
                }
              } else if (isFinished) {
                dynamicTilt = 0;
              } else {
                // Pequeñas correcciones de volante (sutiles para no parecer que tambalean)
                dynamicTilt = Math.sin(progress * 26 + idx) * 0.08;
              }
            }

            // Posición sobre la carretera curva: cada auto sigue el trazado de su fila en perspectiva
            const rowYn = Math.min(1, Math.max(0, topPct / 100));
            const laneNorm = getCarLaneNorm(carIdx, cars.length);
            const roadXPct = laneX(rowYn, laneNorm, roadCurve) * 100;

            // Giro del auto siguiendo la dirección de la carretera en 3D
            const headingDeg = car.isWreck
              ? 0
              : Math.max(-28, Math.min(28, roadHeadingDeg(rowYn, roadCurve, canvasSizeRef.current.aspect)));
            const carSteer = car.isWreck ? 0 : steerAtTrackPct(carTrackPct(car.x));
            const yawDeg = headingDeg + (isFinished ? 0 : carSteer * 8);

            // Valor normalizado de dirección (-1 a +1) para las ruedas delanteras y suspensión
            const steeringValue = car.isWreck
              ? 0
              : Math.max(-1, Math.min(1, (headingDeg / 24) * 0.7 + carSteer * 0.5 + dynamicTilt));

            // Rotación 3D en perspectiva pura: yaw sobre eje vertical + roll por fuerza centrífuga (sin deformación skewX)
            const turnAngleY = Math.max(-20, Math.min(20, yawDeg * 0.52));
            const rollAngleZ = Math.max(-5, Math.min(5, yawDeg * 0.16));

            return (
              <div
                key={car.name}
                className={`${styles.arcadeBuggySlot} ${car.isCrashingNow ? styles.wreckImpactShake : ''}`}
                style={{
                  left: `calc(${roadXPct}% + ${evasionX}px)`,
                  top: `${topPct}%`,
                  transform: `translate3d(-50%, calc(-50% + ${jumpY}px), 0) scale(${scale + jumpScaleBonus})`,
                  zIndex: Math.round(baseZIndex + (isJumping ? 30 : 0)),
                  opacity: car.wreckOpacity !== undefined ? car.wreckOpacity : 1,
                  filter: car.isWreck ? 'saturate(0.7) brightness(0.9)' : 'none',
                }}
              >
                {/* Destello de explosión en el momento del impacto fatal */}
                {car.isCrashingNow && <div className={styles.wreckExplosionFlash} />}

                {/* Sombra proyectada en el asfalto alineada al giro */}
                <div
                  className={styles.arcadeCarShadow}
                  style={{
                    transform: `translate3d(-50%, ${-jumpY}px, 0) scale(${Math.max(0.6, 1 - jumpScaleBonus * 1.2)}) rotate(${turnAngleY * 0.35}deg)`,
                    opacity: isJumping ? 0.35 : 0.75,
                    filter: isJumping ? 'blur(6px)' : 'none',
                  }}
                />

                {/* Estela de arena todoterreno viva detrás de los neumáticos traseros */}
                {!isFinished && !car.isWreck && !isJumping && car.speedKmh > 35 && (
                  <div className={styles.arcadeTireDustWrapper}>
                    <div className={styles.sandDustPlumeLeft} />
                    <div className={styles.sandDustPlumeRight} />
                  </div>
                )}

                {/* SPRITE VECTORIAL TRASERO DEDICADO DEL BUGGY (ROTACIÓN 3D REAL) */}
                <div
                  className={styles.buggyYawWrap}
                  style={{
                    transform: `perspective(650px) rotateY(${turnAngleY.toFixed(1)}deg) rotateZ(${rollAngleZ.toFixed(1)}deg)`,
                    transformOrigin: '50% 88%',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <ArcadeBuggyRearSprite
                    buggy={car.buggy}
                    isEliminated={car.isWreck}
                    isBoosting={!car.isWreck && (car.isBoosting || isEvasionActive)}
                    carNumber={car.buggy.number || (car.index !== undefined ? car.index + 1 : idx + 1)}
                    speedKmh={car.isWreck ? 0 : car.speedKmh}
                    steering={steeringValue}
                  />
                </div>

                {/* Si el auto fue destruido: Aviso oficial flotante de que ya no continúa más */}
                {car.isWreck ? (
                  <div className={styles.carDestroyedBadge}>
                    <span className={styles.carDestroyedIcon}>💥</span>
                    <div className={styles.carDestroyedText}>
                      <span className={styles.carDestroyedTitle}>¡{car.name} DESTRUIDO!</span>
                      <span className={styles.carDestroyedStatus}>NO CONTINÚA MÁS</span>
                    </div>
                  </div>
                ) : (
                  /* Etiquetas superiores flotantes para autos en carrera */
                  <div className={styles.arcadeCarBadgeGroup}>
                    {showPositionFlags && rank >= 1 && rank <= 3 && (
                      <PositionFlag position={rank} size="sm" />
                    )}
                    {progress > 0.04 && isLeader && (
                      <span className={styles.arcadeRankPill} style={{ background: '#facc15' }}>
                        {isFinished ? '🏆 1º GANADOR' : '👑 P1 LÍDER'}
                      </span>
                    )}
                    {progress > 0.04 && !isLeader && (
                      <span
                        className={styles.arcadeRankPill}
                        style={{ background: car.buggy.color, color: '#000' }}
                      >
                        P{rank}
                      </span>
                    )}
                    {isUserChoice && (
                      <span className={styles.arcadeUserChoiceTag}>TU AUTO</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
