import React, { useMemo } from 'react';
import ArcadeRoadHazardZone from './ArcadeRoadHazardZone';
import ArcadeSkyFallingHazards from './ArcadeSkyFallingHazards';
import ArcadeBuggyRearSprite from './ArcadeBuggyRearSprite';
import styles from './ArcadeFirstPersonCockpit.module.css';

/**
 * ArcadeFirstPersonCockpit: Vista inmersiva en Primera Persona (FPV / Cabina del Piloto).
 * Permite al usuario experimentar la carrera desde el interior de su Buggy:
 * 1. Espejo retrovisor superior central con reflejo de los autos que vienen atrás.
 * 2. Carretera y paisaje frontal en perspectiva acelerada (dunas, montañas, cielo).
 * 3. Obstáculos aproximándose de frente (meteoritos, rocas, hoyos, grietas).
 * 4. Autos rivales que van adelante si el usuario no va en P1.
 * 5. Volante deportivo interactivo con emblema del Buggy y tablero digital (KM/H, RPM, Puesto).
 * 6. Física de saltos y esquives que inclinan la cabina.
 */
export default function ArcadeFirstPersonCockpit({
  cars = [],
  rankedCars = [],
  progress = 0,
  currentSectorObstacle = {},
  userBuggyName = null,
  isUserRace = true,
  isFinished = false,
  fatalEliminationByCar = {},
}) {
  // Identificar el buggy del usuario
  const playerCar = useMemo(() => {
    if (userBuggyName) {
      const match = cars.find((c) =>
        userBuggyName.toUpperCase().includes(c.buggy.name.toUpperCase())
      );
      if (match) return match;
    }
    return rankedCars[0] || cars[0] || null;
  }, [cars, rankedCars, userBuggyName]);

  const playerRank = useMemo(() => {
    if (!playerCar) return 1;
    const idx = rankedCars.findIndex((c) => c.name === playerCar.name);
    return idx >= 0 ? idx + 1 : 1;
  }, [rankedCars, playerCar]);

  const isLeader = playerRank === 1 && !playerCar?.isEliminated;
  const isPlayerEliminated = Boolean(playerCar?.isEliminated);

  // Autos activos que van DETRÁS del usuario (para el espejo retrovisor)
  const carsBehind = useMemo(() => {
    if (!playerCar || isPlayerEliminated) return [];
    return cars
      .filter((c) => c.name !== playerCar.name && !c.isEliminated && c.x <= playerCar.x)
      .sort((a, b) => b.x - a.x); // Más cercano al usuario primero
  }, [cars, playerCar, isPlayerEliminated]);

  // Autos eliminados detrás del usuario
  const crashedBehind = useMemo(() => {
    if (!playerCar) return [];
    return cars.filter((c) => c.name !== playerCar.name && c.isEliminated && c.x <= playerCar.x);
  }, [cars, playerCar]);

  // Autos activos que van ADELANTE del usuario (visibles en la carretera al frente)
  const carsAhead = useMemo(() => {
    if (!playerCar || isPlayerEliminated) return [];
    return cars
      .filter((c) => c.name !== playerCar.name && !c.isEliminated && c.x > playerCar.x)
      .sort((a, b) => a.x - b.x); // Más cercano al usuario primero
  }, [cars, playerCar, isPlayerEliminated]);

  // Fracción del sector para coordinar la llegada de obstáculos
  const sectorFraction = (progress * 7) % 1;
  const isMeteor = currentSectorObstacle?.tipo === 'METEORITOS';
  const minFraction = isMeteor ? 0.28 : 0.08;

  // Aproximación del obstáculo transversal hacia el parabrisas
  const hazardApproach = useMemo(() => {
    const isVisible =
      !isFinished &&
      currentSectorObstacle?.tipo &&
      sectorFraction >= minFraction &&
      sectorFraction <= 0.82;

    if (!isVisible) {
      return { isVisible: false, topPct: 0, scale: 1, opacity: 0 };
    }

    const norm = Math.min(1, Math.max(0, (sectorFraction - minFraction) / (0.82 - minFraction)));
    const curve = norm * norm; // aceleración de perspectiva frontal

    const topPct = 48 + curve * 40; // Desde horizonte (48%) hasta ruedas (88%)
    const scale = 0.35 + curve * 1.25;
    const opacity = norm < 0.08 ? norm / 0.08 : norm > 0.88 ? (1 - norm) / 0.12 : 1;

    return { isVisible: true, topPct, scale, opacity };
  }, [isFinished, currentSectorObstacle, sectorFraction, minFraction]);

  // Dinámica de inclinación del volante y cabina
  const steeringTilt = useMemo(() => {
    if (playerCar?.isDodging) {
      return playerCar.dodgeRotateDeg ? playerCar.dodgeRotateDeg * 3.2 : -18;
    }
    if (isLeader) {
      return Math.sin(progress * 24) * 8;
    }
    return Math.sin(progress * 18 + 1) * 6;
  }, [playerCar, isLeader, progress]);

  // Física de suspensión / salto en el aire
  const jumpOffset = playerCar?.isJumping ? (playerCar?.dodgeOffsetY || -18) * 1.5 : 0;

  // RPM LEDs (12 segmentos)
  const speed = playerCar?.speedKmh || 180;
  const rpmCount = Math.min(12, Math.max(4, Math.round((speed / 230) * 12)));

  const buggyColor = playerCar?.buggy?.color || '#facc15';
  const buggySymbol = playerCar?.buggy?.symbol || '⚡';
  const buggyName = playerCar?.buggy?.name || 'AMARILLO';

  return (
    <div className={styles.cockpitContainer}>
      {/* ====================================================================
          1. PAISAJE Y CIELO FRONTAL (PARALLAX EN PRIMERA PERSONA)
          ==================================================================== */}
      <div className={styles.skyLayer}>
        <div className={styles.sunGlow} />
        <div className={styles.mountainRidge} />
        <div className={styles.dunesBacking} />
        <div className={styles.heatHaze} />
      </div>

      {/* ====================================================================
          2. CARRETERA EN PERSPECTIVA FRONTAL HACIA EL PILOTO
          ==================================================================== */}
      <div
        className={styles.groundLayer}
        style={{
          transform: `translateY(${-jumpOffset * 0.4}px)`,
        }}
      >
        <div className={styles.desertShoulderLeft} />
        <div className={styles.desertShoulderRight} />

        <div className={styles.roadSurface}>
          <div className={styles.roadCurbLeft} />
          <div className={styles.roadCurbRight} />
          <div className={styles.roadLanes} />

          {/* Arco de meta frontal en el tramo final */}
          {progress > 0.82 && (
            <div
              className={styles.finishArchFpv}
              style={{
                top: `${Math.min(85, 20 + (progress - 0.82) * 320)}%`,
                transform: `translateX(-50%) scale(${0.5 + (progress - 0.82) * 2.8})`,
                opacity: Math.min(1, (progress - 0.82) * 6),
              }}
            >
              <div className={styles.finishArchGantry}>
                🏁 META FINAL • CIRCUITO DUNAS 🏁
              </div>
            </div>
          )}

          {/* Obstáculo transversal aproximándose de frente */}
          {hazardApproach.isVisible && (
            <div
              className={styles.fpvApproachingHazard}
              style={{
                top: `${hazardApproach.topPct}%`,
                transform: `translate(-50%, -50%) scale(${hazardApproach.scale})`,
                opacity: hazardApproach.opacity,
              }}
            >
              <ArcadeRoadHazardZone
                tipo={currentSectorObstacle.tipo}
                nombre={currentSectorObstacle.nombre}
                icono={currentSectorObstacle.icono}
              />
            </div>
          )}

          {/* Autos rivales que van ADELANTE del usuario */}
          {carsAhead.map((car, idx) => {
            const distAhead = Math.max(10, car.x - (playerCar?.x || 150));
            // Proximidad normalizada (más cerca = más abajo en el parabrisas y más grande)
            const normDist = Math.min(1, Math.max(0, distAhead / 160));
            const top = 48 + (1 - normDist) * 32; // de 48% a 80%
            const scale = 0.35 + (1 - normDist) * 0.65;
            const laneOffset = ((car.index % 3) - 1) * 60 * (scale * 1.5);

            return (
              <div
                key={car.name}
                className={styles.rivalCarAhead}
                style={{
                  top: `${top}%`,
                  left: `calc(50% + ${laneOffset}px)`,
                  transform: `translate(-50%, -100%) scale(${scale})`,
                  zIndex: Math.round(10 + (1 - normDist) * 20),
                }}
              >
                <span
                  className={styles.aheadBadge}
                  style={{ background: car.buggy.color }}
                >
                  {car.buggy.symbol} #{car.buggy.number || (car.index + 1)} {car.buggy.name}
                </span>

                <ArcadeBuggyRearSprite
                  buggy={car.buggy}
                  isEliminated={false}
                  isBoosting={car.isBoosting}
                  carNumber={car.buggy.number || (car.index + 1)}
                  speedKmh={car.speedKmh}
                  steering={0}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Peligros que caen desde el cielo (meteoritos / rocas) */}
      <ArcadeSkyFallingHazards
        tipo={currentSectorObstacle?.tipo}
        nombre={currentSectorObstacle?.nombre}
        sectorFraction={sectorFraction}
        isFinished={isFinished}
      />

      {/* Alerta de obstáculo frontal en el parabrisas */}
      {hazardApproach.isVisible && sectorFraction < 0.45 && (
        <div className={styles.windshieldWarningBanner}>
          <i className="ph ph-warning" aria-hidden="true" />
          <span>¡ALERTA EN PISTA: {currentSectorObstacle.nombre?.toUpperCase()}!</span>
        </div>
      )}

      {/* ====================================================================
          3. ESPEJO RETROVISOR SUPERIOR CENTRAL (REARVIEW MIRROR)
             Muestra los autos que vienen persiguiendo detrás del usuario
          ==================================================================== */}
      <div className={styles.rearviewMirrorContainer}>
        <div className={styles.mirrorMountStem} />

        <div className={styles.rearviewMirrorHousing}>
          <div className={styles.mirrorGlass}>
            <div className={styles.mirrorGlassGlare} />

            {/* Cabecera del espejo retrovisor */}
            <div className={styles.mirrorHeaderTag}>
              <span className={styles.mirrorRadarDot} />
              <span>
                RETROVISOR • {carsBehind.length}{' '}
                {carsBehind.length === 1 ? 'AUTO ATRÁS' : 'AUTOS ATRÁS'}
              </span>
            </div>

            {/* Carretera reflejada hacia atrás */}
            <div className={styles.mirrorRoadBehind}>
              <div className={styles.mirrorRoadCenterLine} />
            </div>

            {/* Autos que persiguen detrás del usuario */}
            {carsBehind.length > 0 ? (
              carsBehind.map((car, idx) => {
                const distBehind = Math.max(12, (playerCar?.x || 0) - car.x);
                // Si la distancia es pequeña, el auto se ve muy grande en el espejo
                const distRatio = Math.min(1, Math.max(0, distBehind / 140)); // 0 = muy cerca, 1 = lejos
                const mirrorScale = 1.15 - distRatio * 0.65; // 0.5 a 1.15
                const mirrorTop = 72 - distRatio * 32; // 40% a 72%
                const laneOffset = ((car.index % 3) - 1) * 36; // Distribución en carriles

                return (
                  <div
                    key={car.name}
                    className={styles.mirrorCarBehindSlot}
                    style={{
                      top: `${mirrorTop}%`,
                      left: `calc(50% + ${laneOffset}px)`,
                      transform: `translate(-50%, -50%) scale(${mirrorScale})`,
                      zIndex: Math.round(10 - idx),
                    }}
                  >
                    {/* Representación frontal del auto perseguidor reflejado */}
                    <div
                      className={styles.mirrorCarBody}
                      style={{
                        background: car.buggy.color,
                        boxShadow: `0 0 12px ${car.buggy.glowColor || car.buggy.color}`,
                      }}
                    >
                      <span style={{ fontSize: '11px' }}>{car.buggy.symbol}</span>
                      {/* Luces delanteras reflejadas hacia nosotros */}
                      <div className={styles.mirrorHeadlights}>
                        <div className={styles.mirrorHeadlightBeam} />
                        <div className={styles.mirrorHeadlightBeam} />
                      </div>
                    </div>

                    <span className={styles.mirrorCarTag}>
                      #{car.buggy.number || (car.index + 1)} -{Math.round(distBehind)}m
                    </span>
                  </div>
                );
              })
            ) : (
              <div className={styles.mirrorEmptyRoadMsg}>
                {isLeader ? '👑 LIDERANDO • PISTA TRASERA DESPEJADA' : 'PISTA TRASERA LIBRE'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          4. CABINA Y BARRAS ANTIVUELCO (ROLL CAGE & COCKPIT FRAME)
          ==================================================================== */}
      <div
        className={styles.cockpitFrameLayer}
        style={{
          transform: `rotate(${steeringTilt * 0.25}deg) translateY(${jumpOffset * 0.25}px)`,
        }}
      >
        <div className={styles.rollCageTopBar} />
        <div className={styles.rollCageLeft} style={{ borderLeft: `4px solid ${buggyColor}` }} />
        <div className={styles.rollCageRight} style={{ borderRight: `4px solid ${buggyColor}` }} />
        <div className={styles.windshieldGlassSheen} />
      </div>

      {/* Parabrisas roto si el usuario sufrió choque fatal */}
      {isPlayerEliminated && (
        <div className={styles.crackedWindshieldOverlay}>
          <div className={styles.crashAlertBox}>
            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>💥</div>
            <div style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.25rem' }}>
              ¡VEHÍCULO ACCIDENTADO!
            </div>
            <div style={{ color: '#fff', fontSize: '0.84rem', marginTop: '4px' }}>
              {playerCar?.causaEliminacion || 'Choque en el sector'}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          5. TABLERO DE INSTRUMENTOS (DASHBOARD & DIGITAL HUD)
          ==================================================================== */}
      <div className={styles.dashboardPanel}>
        <div className={styles.dashboardBackground} />

        <div className={styles.dashboardHudRow}>
          {/* Cluster Izquierdo: Velocímetro digital + RPM */}
          <div className={styles.dashClusterLeft}>
            <div className={styles.dashSpeedGroup}>
              <span className={styles.dashSpeedNumber}>{speed}</span>
              <span className={styles.dashSpeedUnit}>KM/H</span>
            </div>

            {/* Barra de LEDs de RPM */}
            <div className={styles.dashRpmBar}>
              {[...Array(12)].map((_, i) => {
                const isActive = i < rpmCount;
                let ledClass = '';
                if (isActive) {
                  if (i < 6) ledClass = styles.rpmLedActiveGreen;
                  else if (i < 9) ledClass = styles.rpmLedActiveYellow;
                  else ledClass = styles.rpmLedActiveRed;
                }
                return <div key={i} className={`${styles.rpmLed} ${ledClass}`} />;
              })}
            </div>
          </div>

          {/* Cluster Derecho: Posición de carrera + Piloto */}
          <div className={styles.dashClusterRight}>
            <div className={styles.dashPositionPill}>
              <span>POSICIÓN:</span>
              <span
                className={isLeader ? styles.positionBadgeGold : styles.positionBadgeStandard}
              >
                {isLeader ? '👑 P1 LÍDER' : `P${playerRank}`}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: buggyColor,
                fontWeight: 800,
              }}
            >
              <span>{buggySymbol}</span>
              <span>BUGGY {buggyName}</span>
              {playerCar?.isBoosting && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                  }}
                >
                  NITRO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================================
            6. VOLANTE DEPORTIVO DE CARRERAS (STEERING WHEEL)
               Gira en sincronía con los esquives y curvas
            ================================================================== */}
        <div
          className={styles.steeringWheelWrapper}
          style={{
            transform: `translateX(-50%) rotate(${steeringTilt}deg) translateY(${jumpOffset * 0.15}px)`,
          }}
        >
          <svg viewBox="0 0 240 240" className={styles.wheelSvg}>
            {/* Aro exterior del volante */}
            <circle
              cx="120"
              cy="120"
              r="95"
              fill="none"
              stroke="#0f172a"
              strokeWidth="24"
              strokeLinecap="round"
            />
            {/* Grips de cuero perforado */}
            <circle
              cx="120"
              cy="120"
              r="95"
              fill="none"
              stroke="#334155"
              strokeWidth="20"
              strokeDasharray="90 50 90 150"
            />
            {/* Acento de color en el aro superior (marca de las 12 en punto) */}
            <path
              d="M 115 25 L 125 25"
              stroke={buggyColor}
              strokeWidth="22"
              strokeLinecap="round"
            />

            {/* Radios metálicos del volante (3-spoke) */}
            <line x1="120" y1="120" x2="35" y2="120" stroke="#475569" strokeWidth="14" />
            <line x1="120" y1="120" x2="205" y2="120" stroke="#475569" strokeWidth="14" />
            <line x1="120" y1="120" x2="120" y2="205" stroke="#475569" strokeWidth="14" />

            {/* Levas de cambio detrás del volante (paddle shifters) */}
            <rect x="25" y="70" width="8" height="34" rx="3" fill="#64748b" />
            <rect x="207" y="70" width="8" height="34" rx="3" fill="#64748b" />

            {/* Núcleo central / bocina */}
            <circle cx="120" cy="120" r="38" fill="#1e293b" stroke="#334155" strokeWidth="3" />
            <circle cx="120" cy="120" r="32" fill="#0f172a" stroke={buggyColor} strokeWidth="2" />

            {/* Símbolo del Buggy en el centro del volante */}
            <text
              x="120"
              y="126"
              fontSize="24"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {buggySymbol}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
