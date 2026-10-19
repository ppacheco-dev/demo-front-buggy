import React, { useMemo, useState, useEffect, useRef } from 'react';
import ArcadeBuggyRearSprite from './ArcadeBuggyRearSprite';
import ArcadeRoadHazardZone from './ArcadeRoadHazardZone';
import ArcadeSkyFallingHazards from './ArcadeSkyFallingHazards';
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
}) {
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
    const numSegments = 7;
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
    const numSegments = 7;
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

  // Carriles horizontales centrados dentro de la calzada ajustada (ancho 58%)
  const laneOffsets = useMemo(() => {
    return [24, 34, 45, 55, 66, 76];
  }, []);

  // Cálculo de la aproximación en perspectiva 3D del obstáculo transversal para TODOS los autos
  const { isHazardVisible, hazardTop, hazardScale, hazardOpacity } = useMemo(() => {
    // Hay 7 transiciones entre tramos
    const sectorFraction = (progress * 7) % 1;
    const isMeteor = currentSectorObstacle?.tipo === 'METEORITOS';
    // Para meteoritos, el cráter en el suelo se manifiesta en el momento del impacto (a partir de 0.32)
    const minFraction = isMeteor ? 0.32 : 0.06;

    // Visible mientras se aproxima desde el horizonte hasta pasar bajo los autos
    const isVisible = !isFinished && currentSectorObstacle?.tipo && sectorFraction >= minFraction && sectorFraction <= 0.82;

    if (!isVisible) {
      return { isHazardVisible: false, hazardTop: 0, hazardScale: 1, hazardOpacity: 0 };
    }

    // Normalizado de 0 (horizonte lejano / impacto) a 1 (primer plano cruzado)
    const norm = Math.min(1, Math.max(0, (sectorFraction - minFraction) / (0.82 - minFraction)));
    const curve = norm * norm; // aceleración cuadrática en perspectiva 3D

    const startTop = isMeteor ? 38 : 30; // Los meteoritos impactan en la carretera (38%)
    const top = startTop + curve * (84 - startTop);
    const startScale = isMeteor ? 0.55 : 0.40;
    const scale = startScale + curve * (1.25 - startScale);
    const opacity = norm < 0.08 ? norm / 0.08 : (norm > 0.88 ? (1 - norm) / 0.12 : 1);

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
    const sectorFraction = (progress * 7) % 1;
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
  const sectorFraction = (progress * 7) % 1;
  const isMeteorImpactShake =
    currentSectorObstacle?.tipo === 'METEORITOS' &&
    sectorFraction >= 0.32 &&
    sectorFraction <= 0.44;

  // Curvatura dinámica de la carretera según el tramo (efecto Horizon Chase / OutRun)
  const trackCurve = useMemo(() => {
    const tramo = currentSectorObstacle?.tramo || 1;
    const curves = [0, 24, -28, 20, -34, 26, -18, 0];
    const targetCurve = curves[(tramo - 1) % curves.length];
    const t = (progress * 7) % 1;
    return targetCurve * Math.sin(t * Math.PI);
  }, [progress, currentSectorObstacle]);

  // Pórtico de META en 2.5D: aparece en la recta final hacia la meta y se detiene exactamente
  // enmarcando al auto líder cuando este llega al pórtico (o se oculta si ningún auto llega)
  const finishGantry = useMemo(() => {
    if (ningunAutoLlego) {
      return { visible: false, roadY: 0, opacity: 0 };
    }

    // Inicia en la recta final hacia la meta
    const startProgress = 0.88;
    if (progress < startProgress) {
      return { visible: false, roadY: 0, opacity: 0 };
    }

    // Progreso del sprint de llegada (0 a 1)
    const t = Math.min(1, Math.max(0, (progress - startProgress) / (1.0 - startProgress)));

    // Posición a lo largo de la calzada:
    // Empieza en 16% en la lejanía y desciende hasta 45% (la altura exacta donde el líder cruza bajo el pórtico)
    const roadY = 16 + Math.pow(t, 1.35) * 29;

    // Aparece completo desde el inicio con fade-in rápido y firme
    const opacity = Math.min(1, 0.45 + t * 4);

    return {
      visible: true,
      roadY,
      opacity,
    };
  }, [progress, ningunAutoLlego]);

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
      />

      {/* 2. CIELO Y HORIZONTE DEL DESIERTO (PARALLAX RETRO) */}
      <div className={styles.arcadeSky}>
        <div className={styles.retroSun} />
        <div className={styles.mountainSilhouettes} />
        <div className={styles.rollingDunes} />
        <div className={styles.heatShimmer} />
      </div>

      {/* 3. PISTA EN PERSPECTIVA PSEUDO-3D */}
      <div className={styles.arcadeGround}>
        {/* Desierto lateral exterior con props de rally */}
        <div className={styles.desertSandLeft}>
          <div className={styles.roadsidePropBillboardLeft}>
            <span>PACÍFICO RALLY</span>
          </div>
          <div className={styles.roadsidePropPalmLeft}>🌴</div>
        </div>
        <div className={styles.desertSandRight}>
          <div className={styles.roadsidePropBillboardRight}>
            <span>TURBO 99</span>
          </div>
          <div className={styles.roadsidePropPalmRight}>🌴</div>
        </div>

        {/* Carretera con bordillos, bandas de asfalto y líneas de velocidad */}
        <div
          className={`${styles.roadSurface} ${isMeteorImpactShake ? styles.roadSurfaceImpactShake : ''}`}
          style={{
            transform: `translate3d(calc(-50% + ${trackCurve}px), 0, 0) rotateX(46deg) rotateZ(${-trackCurve * 0.12}deg)`,
          }}
        >
          {/* Bandas de asfalto alternadas estilo OutRun / Horizon Chase */}
          <div className={styles.roadAsphaltStripes} />

          {/* Bordillos vibratorios rayados laterales directos */}
          <div className={styles.roadCurbLeft} />
          <div className={styles.roadCurbRight} />

          {/* Postes reflectores de borde de carretera */}
          <div className={styles.roadsideMarkersLeft} />
          <div className={styles.roadsideMarkersRight} />

          {/* Líneas divisorias de carril en perspectiva (sin máscaras de software) */}
          <div className={styles.roadLanesContainer}>
            <div className={styles.roadLaneMarker} />
            <div className={styles.roadLaneMarker} />
            <div className={styles.roadLaneMarker} />
            <div className={styles.roadLaneMarker} />
            <div className={styles.roadLaneMarker} />
          </div>

        </div>

        {/* Línea de meta a cuadros en el asfalto (mismo plano 3D que la carretera, por debajo de los buggies) */}
        {finishGantry.visible && (
          <div
            className={styles.groundFinishTrackPlane}
            style={{
              transform: `translate3d(calc(-50% + ${trackCurve}px), 0, 0) rotateX(46deg) rotateZ(${-trackCurve * 0.12}deg)`,
              opacity: finishGantry.opacity,
            }}
          >
            <div
              className={styles.asphaltFinishCheckers}
              style={{ top: `${finishGantry.roadY}%` }}
            />
          </div>
        )}

        {/* 4. OBSTÁCULO TRANSVERSAL DEL ANCHO COMPLETO DE LA PISTA (PASA POR DEBAJO DE LOS BUGGIES) */}
        {isHazardVisible && (
          <div
            className={styles.arcadeFullTrackHazard}
            style={{
              top: `${hazardTop}%`,
              transform: `translate3d(-50%, -50%, 0) scale(${hazardScale})`,
              opacity: hazardOpacity,
              zIndex: 6, // Estrictamente por debajo de los buggies (buggies tienen zIndex 15-120)
            }}
          >
            <ArcadeRoadHazardZone
              tipo={currentSectorObstacle.tipo}
              nombre={currentSectorObstacle.nombre}
              icono={currentSectorObstacle.icono}
            />
          </div>
        )}

        {/* 5. Capa de los Buggies en Perspectiva 2.5D (Activos y Destruidos en Obstáculo) */}
        <div className={styles.arcadeCarsLayer}>
          {renderedCars.map((car, idx) => {
            const rank = rankedCars.findIndex((c) => c.name === car.name) + 1;
            const isUserChoice =
              isUserRace && (
                (Array.isArray(userBuggyNames) && userBuggyNames.includes(car.buggy.name.toUpperCase())) ||
                (userBuggyName && userBuggyName.includes(car.buggy.name.toUpperCase()))
              );
            const isLeader = rank === 1 && !car.isWreck;

            // Carril asignado
            const lanePct = laneOffsets[car.index !== undefined ? car.index % laneOffsets.length : idx % laneOffsets.length];

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
              const carReactionOffset = (1 - distRatio) * 0.08;
              const encounterStart = 0.36 + carReactionOffset;
              const encounterEnd = 0.64 + carReactionOffset;

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
                  jumpY = -sinArc * 36;
                  jumpScaleBonus = sinArc * 0.16;
                  dynamicTilt = (t < 0.5 ? -0.15 : 0.22) * sinArc;
                } else {
                  const swerveDir = idx % 2 === 0 ? 1 : -1;
                  evasionX = Math.sin(t * Math.PI * 2) * 18 * swerveDir;
                  dynamicTilt = Math.cos(t * Math.PI * 2) * 0.75 * swerveDir;
                  jumpY = -sinArc * 8;
                }
              } else if (isFinished) {
                dynamicTilt = 0;
              } else {
                dynamicTilt = isLeader
                  ? Math.sin(progress * 28 + idx) * 0.35
                  : Math.sin(progress * 18 + idx) * 0.2;
              }
            }

            return (
              <div
                key={car.name}
                className={`${styles.arcadeBuggySlot} ${car.isCrashingNow ? styles.wreckImpactShake : ''}`}
                style={{
                  left: `calc(${lanePct}% + ${evasionX}px)`,
                  top: `${topPct}%`,
                  transform: `translate3d(-50%, calc(-50% + ${jumpY}px), 0) scale(${scale + jumpScaleBonus})`,
                  zIndex: Math.round(baseZIndex + (isJumping ? 30 : 0)),
                  opacity: car.wreckOpacity !== undefined ? car.wreckOpacity : 1,
                  filter: car.isWreck ? 'saturate(0.7) brightness(0.9)' : 'none',
                }}
              >
                {/* Destello de explosión en el momento del impacto fatal */}
                {car.isCrashingNow && <div className={styles.wreckExplosionFlash} />}

                {/* Sombra proyectada en el asfalto */}
                <div
                  className={styles.arcadeCarShadow}
                  style={{
                    transform: `translate3d(-50%, ${-jumpY}px, 0) scale(${Math.max(0.6, 1 - jumpScaleBonus * 1.2)})`,
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

                {/* SPRITE VECTORIAL TRASERO DEDICADO DEL BUGGY (60 FPS NATIVO) */}
                <ArcadeBuggyRearSprite
                  buggy={car.buggy}
                  isEliminated={car.isWreck}
                  isBoosting={!car.isWreck && (car.isBoosting || isEvasionActive)}
                  carNumber={car.buggy.number || (car.index !== undefined ? car.index + 1 : idx + 1)}
                  speedKmh={car.isWreck ? 0 : car.speedKmh}
                  steering={dynamicTilt}
                />

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

        {/* Pórtico superior de META (mismo plano 3D que la carretera, elevado sobre los autos) */}
        {finishGantry.visible && (
          <div
            className={styles.overheadFinishTrackPlane}
            style={{
              transform: `translate3d(calc(-50% + ${trackCurve}px), 0, 0) rotateX(46deg) rotateZ(${-trackCurve * 0.12}deg)`,
              opacity: finishGantry.opacity,
            }}
          >
            <div
              className={styles.gantry3DArch}
              style={{ top: `${finishGantry.roadY}%` }}
            >
              {/* Pilar izquierdo anclado directamente en el bordillo izquierdo */}
              <div className={styles.gantry3DPillarLeft}>
                <div className={styles.gantry3DPillarBody} />
                <div className={styles.gantry3DPillarBase} />
              </div>

              {/* Pilar derecho anclado directamente en el bordillo derecho */}
              <div className={styles.gantry3DPillarRight}>
                <div className={styles.gantry3DPillarBody} />
                <div className={styles.gantry3DPillarBase} />
              </div>

              {/* Banner superior con semáforo y cartel de META */}
              <div className={styles.gantry3DBanner}>
                <div className={styles.gantry3DLights}>
                  <span className={styles.gantryLightGreen} />
                  <span className={styles.gantryLightAmber} />
                  <span className={styles.gantryLightRed} />
                </div>
                <div className={styles.gantry3DBannerFrame}>
                  <div className={styles.gantry3DFlagWing} />
                  <div className={styles.gantry3DCenterBoard}>
                    <span className={styles.gantry3DTitle}>META</span>
                    <span className={styles.gantry3DSub}>DUNAS DEL PACÍFICO • 1.140 M</span>
                  </div>
                  <div className={styles.gantry3DFlagWing} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
