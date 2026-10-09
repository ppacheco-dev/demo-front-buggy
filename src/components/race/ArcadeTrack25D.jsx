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
  userBuggyName = null,
  isUserRace = false,
  isFinished = false,
}) {
  // Encontrar auto líder de la carrera
  const leaderCar = rankedCars.find((c) => !c.isEliminated) || rankedCars[0] || null;

  // Filtrar exclusivamente los buggies que están EN CARRERA activa:
  // Los buggies eliminados DESAPARECEN de la pista inmediatamente
  const activeCars = useMemo(() => {
    return cars.filter((c) => !c.isEliminated);
  }, [cars]);

  // Rango relativo de distancia para ordenar a los buggies activos en perspectiva Z
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

  // Carriles horizontales distribuidos estilizados
  const laneOffsets = useMemo(() => {
    return [18, 30, 44, 56, 70, 82];
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

  return (
    <div className={styles.arcadeContainer}>
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
        {/* Desierto lateral exterior */}
        <div className={styles.desertSandLeft} />
        <div className={styles.desertSandRight} />

        {/* Carretera con bordillos y líneas de velocidad optimizadas a 60 FPS */}
        <div className={`${styles.roadSurface} ${isMeteorImpactShake ? styles.roadSurfaceImpactShake : ''}`}>
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

          {/* Arco pórtico de meta 3D en los últimos metros */}
          {progress > 0.82 && (
            <div
              className={styles.finishArch25D}
              style={{
                top: `${Math.min(85, 18 + (progress - 0.82) * 330)}%`,
                transform: `translateX(-50%) scale(${0.65 + (progress - 0.82) * 2.4})`,
                opacity: Math.min(1, (progress - 0.82) * 6),
              }}
            >
              <div className={styles.finishArchTruss}>
                <span className={styles.finishArchBanner}>🏁 META FINAL • 1.140 METROS 🏁</span>
              </div>
            </div>
          )}
        </div>

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

        {/* 5. Capa de los Buggies Activos en Perspectiva 2.5D (Saltan o esquivan al cruzar) */}
        <div className={styles.arcadeCarsLayer}>
          {activeCars.map((car, idx) => {
            const rank = rankedCars.findIndex((c) => c.name === car.name) + 1;
            const isUserChoice =
              isUserRace &&
              userBuggyName &&
              userBuggyName.includes(car.buggy.name.toUpperCase());
            const isLeader = rank === 1;

            // Carril asignado
            const lanePct = laneOffsets[idx % laneOffsets.length];

            // Posición Z/Y: autos más adelantados están más cerca de la meta
            const distRatio = (car.x - minX) / (maxX - minX || 1); // 0 (atrás) a 1 (líder)

            // Y position base en el plano de asfalto (36% horizonte a 78% primer plano)
            const topPct = 78 - distRatio * 38;
            const scale = 1.18 - distRatio * 0.38;
            const baseZIndex = Math.round((1 - distRatio) * 100) + 15;

            // Ventana en la que este auto en particular esquiva o salta el obstáculo
            const carReactionOffset = (1 - distRatio) * 0.08;
            const encounterStart = 0.36 + carReactionOffset;
            const encounterEnd = 0.64 + carReactionOffset;

            let jumpY = 0;
            let jumpScaleBonus = 0;
            let evasionX = 0;
            let dynamicTilt = 0;
            let isEvasionActive = false;
            let isJumping = false;

            if (sectorFraction >= encounterStart && sectorFraction <= encounterEnd) {
              isEvasionActive = true;
              const t = (sectorFraction - encounterStart) / (encounterEnd - encounterStart);
              const sinArc = Math.sin(t * Math.PI); // Parábola de salto 0 -> 1 -> 0

              if (
                currentSectorObstacle?.tipo === 'DUNAS' ||
                currentSectorObstacle?.tipo === 'HOYOS' ||
                currentSectorObstacle?.tipo === 'GRIETAS'
              ) {
                // SALTO EN EL AIRE: El buggy despega acrobáticamente sobre el obstáculo mientras este pasa por debajo
                isJumping = true;
                jumpY = -sinArc * 36; // Eleva el auto 36px en el aire
                jumpScaleBonus = sinArc * 0.16; // Crece hacia la cámara
                dynamicTilt = (t < 0.5 ? -0.15 : 0.22) * sinArc;
              } else {
                // ESQUIVA LATERAL / SLALOM ÁGIL: El buggy zigzaguea con inclinación de viraje cerrado
                const swerveDir = idx % 2 === 0 ? 1 : -1;
                evasionX = Math.sin(t * Math.PI * 2) * 18 * swerveDir; // Desplazamiento lateral ±18px
                dynamicTilt = Math.cos(t * Math.PI * 2) * 0.75 * swerveDir; // Inclinación fuerte
                jumpY = -sinArc * 8; // Bote de suspensión
              }
            } else {
              // Inclinación normal de balanceo de motor y curva
              dynamicTilt = isLeader
                ? Math.sin(progress * 28 + idx) * 0.35
                : Math.sin(progress * 18 + idx) * 0.2;
            }

            return (
              <div
                key={car.name}
                className={styles.arcadeBuggySlot}
                style={{
                  left: `calc(${lanePct}% + ${evasionX}px)`,
                  top: `${topPct}%`,
                  transform: `translate3d(-50%, calc(-50% + ${jumpY}px), 0) scale(${scale + jumpScaleBonus})`,
                  zIndex: Math.round(baseZIndex + (isJumping ? 30 : 0)),
                }}
              >
                {/* Sombra proyectada en el asfalto (permanece en el suelo mientras el auto salta en el aire) */}
                <div
                  className={styles.arcadeCarShadow}
                  style={{
                    transform: `translate3d(-50%, ${-jumpY}px, 0) scale(${Math.max(0.6, 1 - jumpScaleBonus * 1.2)})`,
                    opacity: isJumping ? 0.35 : 0.75,
                    filter: isJumping ? 'blur(6px)' : 'none',
                  }}
                />

                {/* SPRITE VECTORIAL TRASERO DEDICADO DEL BUGGY (60 FPS NATIVO) */}
                <ArcadeBuggyRearSprite
                  buggy={car.buggy}
                  isEliminated={false}
                  isBoosting={car.isBoosting || isEvasionActive}
                  carNumber={car.buggy.number || (idx + 1)}
                  speedKmh={car.speedKmh}
                  steering={dynamicTilt}
                />

                {/* Etiquetas superiores flotantes */}
                <div className={styles.arcadeCarBadgeGroup}>
                  {isLeader && (
                    <span className={styles.arcadeRankPill} style={{ background: '#facc15' }}>
                      👑 P1 LÍDER
                    </span>
                  )}
                  {!isLeader && (
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
