import React, { useMemo } from 'react';
import ArcadeBuggyRearSprite from './ArcadeBuggyRearSprite';
import ArcadeRoadHazardZone from './ArcadeRoadHazardZone';
import styles from './ArcadeTrack25D.module.css';

/**
 * ArcadeTrack25D: Pista de carreras en perspectiva 2.5D pseudo-3D
 * Optimizada para alto rendimiento (60+ FPS constante en GPU):
 * 1. Obstáculo transversal a lo ancho de la pista para todos los autos simultáneamente.
 * 2. Los buggies que quedan eliminados desaparecen inmediatamente de la pista.
 * 3. Posicionamiento con hardware acceleration (translate3d) y sin transitions CSS en RAF.
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
  const { isHazardVisible, hazardTop, hazardScale, hazardOpacity, hazardZIndex } = useMemo(() => {
    // Hay 7 transiciones entre tramos
    const sectorFraction = (progress * 7) % 1;

    // Visible mientras se aproxima desde el horizonte hasta pasar bajo los autos (0.06 a 0.78)
    const isVisible = !isFinished && currentSectorObstacle?.tipo && sectorFraction >= 0.06 && sectorFraction <= 0.78;

    if (!isVisible) {
      return { isHazardVisible: false, hazardTop: 0, hazardScale: 1, hazardOpacity: 0, hazardZIndex: 1 };
    }

    // Normalizado de 0 (horizonte lejano) a 1 (primer plano cruzado)
    const norm = Math.min(1, Math.max(0, (sectorFraction - 0.06) / 0.66));
    const curve = norm * norm; // aceleración cuadrática en perspectiva 3D

    const top = 30 + curve * 52; // de 30% (horizonte) a 82% (cerca de cámara)
    const scale = 0.38 + curve * 0.82; // escala proporcional de 0.38 a 1.20
    const opacity = norm < 0.12 ? norm / 0.12 : (norm > 0.88 ? (1 - norm) / 0.12 : 1);
    const zIndex = Math.round((1 - curve) * 80) + 15;

    return {
      isHazardVisible: true,
      hazardTop: top,
      hazardScale: scale,
      hazardOpacity: opacity,
      hazardZIndex: zIndex,
    };
  }, [progress, isFinished, currentSectorObstacle]);

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
        <div className={styles.roadSurface}>
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

        {/* 4. OBSTÁCULO TRANSVERSAL A LO ANCHO DE TODA LA PISTA PARA TODOS LOS AUTOS */}
        {isHazardVisible && (
          <div
            className={styles.arcadeFullTrackHazard}
            style={{
              top: `${hazardTop}%`,
              transform: `translate3d(-50%, -50%, 0) scale(${hazardScale})`,
              opacity: hazardOpacity,
              zIndex: hazardZIndex,
            }}
          >
            <ArcadeRoadHazardZone
              tipo={currentSectorObstacle.tipo}
              nombre={currentSectorObstacle.nombre}
              icono={currentSectorObstacle.icono}
            />
          </div>
        )}

        {/* 5. Capa de los Buggies Activos en Perspectiva 2.5D (Los eliminados desaparecen) */}
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

            // Y position en el plano de asfalto (36% horizonte a 78% primer plano)
            const topPct = 78 - distRatio * 38;
            const scale = 1.18 - distRatio * 0.38;
            const zIndex = Math.round((1 - distRatio) * 100) + 10;

            // Inclinación suave si adelanta
            const steeringTilt = isLeader
              ? Math.sin(progress * 28 + idx) * 0.35
              : Math.sin(progress * 18 + idx) * 0.2;

            return (
              <div
                key={car.name}
                className={styles.arcadeBuggySlot}
                style={{
                  left: `${lanePct}%`,
                  top: `${topPct}%`,
                  transform: `translate3d(-50%, -50%, 0) scale(${scale})`,
                  zIndex: zIndex,
                }}
              >
                {/* Sombra proyectada del vehículo sobre el asfalto */}
                <div className={styles.arcadeCarShadow} />

                {/* SPRITE VECTORIAL TRASERO DEDICADO DEL BUGGY (60 FPS NATIVO) */}
                <ArcadeBuggyRearSprite
                  buggy={car.buggy}
                  isEliminated={false}
                  isBoosting={car.isBoosting}
                  carNumber={car.buggy.number || (idx + 1)}
                  speedKmh={car.speedKmh}
                  steering={steeringTilt}
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
