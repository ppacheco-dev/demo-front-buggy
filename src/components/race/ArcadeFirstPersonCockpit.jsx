import React, { useMemo } from 'react';
import ArcadeRoadHazardZone from './ArcadeRoadHazardZone';
import ArcadeSkyFallingHazards from './ArcadeSkyFallingHazards';
import ArcadeBuggyRearSprite from './ArcadeBuggyRearSprite';
import styles from './ArcadeFirstPersonCockpit.module.css';

/**
 * ArcadeFirstPersonCockpit: Vista inmersiva en Primera Persona (FPV / Cabina del Piloto).
 * Correcciones de perspectiva y proporciones:
 * 1. Los autos rivales adelante se mantienen SIEMPRE sobre la carretera en perspectiva correcta
 *    (de 44% en el horizonte a 62% frente al capó), sin quedar tapados por el volante ni verse desproporcionadamente gigantes.
 * 2. Capó frontal del buggy visible que delimita físicamente la carretera y da profundidad 3D real.
 * 3. Carretera de rally con olas de espuma en el mar a la izquierda, acantilados a la derecha y huellas en la arena.
 * 4. Volante deportivo optimizado con guantes de piloto, rotando fluidamente con virajes y esquives.
 * 5. Espejo retrovisor superior central con reflejo interactivo de rivales y faros.
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

    // De 44% (horizonte) a 63% (frente a nuestro morro)
    const topPct = 44 + curve * 19;
    const scale = 0.22 + curve * 0.48;
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
  const speed = playerCar?.speedKmh || 163;
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
          2. CARRETERA EN PERSPECTIVA FRONTAL - RALLY PLAYA
          ==================================================================== */}
      <div
        className={styles.groundLayer}
        style={{
          transform: `translateY(${-jumpOffset * 0.4}px)`,
        }}
      >
        {/* Costado Izquierdo: Costa y Océano turquesa con olas de espuma animadas */}
        <div className={styles.desertShoulderLeft}>
          <div className={styles.oceanSurfWaves} />
          <div className={styles.seaStackRock} />
        </div>

        {/* Costado Derecho: Acantilados y dunas de rally */}
        <div className={styles.desertShoulderRight}>
          <div className={styles.cliffStrata} />
          <span className={styles.palmTreeDecor}>🌴</span>
        </div>

        {/* Superficie de la Carretera en Perspectiva */}
        <div className={styles.roadSurface}>
          {/* Bordillos vibratorios rayados */}
          <div className={styles.roadCurbLeft} />
          <div className={styles.roadCurbRight} />

          {/* Huellas de neumáticos paralelas grabadas en la arena */}
          <div className={styles.tireTrackGrooves} />

          {/* Líneas divisorias de carril */}
          <div className={styles.roadLanes} />

          {/* Arco de meta frontal en el tramo final */}
          {progress > 0.82 && (
            <div
              className={styles.finishArchFpv}
              style={{
                top: `${Math.min(78, 20 + (progress - 0.82) * 280)}%`,
                transform: `translateX(-50%) scale(${0.45 + (progress - 0.82) * 2.2})`,
                opacity: Math.min(1, (progress - 0.82) * 6),
              }}
            >
              <div className={styles.finishArchGantry}>
                🏁 META FINAL • RALLY PLAYA 🏁
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

          {/* Autos rivales que van ADELANTE del usuario (Perspectiva y Escala Corregidas) */}
          {carsAhead.map((car, idx) => {
            const distAhead = Math.max(8, car.x - (playerCar?.x || 150));
            // Proximidad normalizada (0 = pegado a nuestro morro, 1 = lejos en el horizonte)
            const normDist = Math.min(1, Math.max(0, distAhead / 180));
            const pFactor = Math.pow(1 - normDist, 1.8);

            // Perspectiva: de 44% (horizonte) a 62% (justo encima de nuestro capó)
            const top = 44 + pFactor * 18;

            // Escala proporcionada: 0.16 (lejos) a 0.42 (cerca del morro)
            const scale = 0.16 + pFactor * 0.26;

            // Desplazamiento lateral proporcional al ancho de la carretera en esa distancia
            const laneWidth = 14 + pFactor * 65;
            const laneOffset = ((car.index % 3) - 1) * laneWidth;

            return (
              <div
                key={car.name}
                className={styles.rivalCarAhead}
                style={{
                  top: `${top}%`,
                  left: `calc(50% + ${laneOffset}px)`,
                  transform: `translate(-50%, -100%) scale(${scale})`,
                  zIndex: Math.round(10 + pFactor * 20),
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
                const distRatio = Math.min(1, Math.max(0, distBehind / 140));
                const mirrorScale = 1.15 - distRatio * 0.65;
                const mirrorTop = 72 - distRatio * 32;
                const laneOffset = ((car.index % 3) - 1) * 36;

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
          4. CABINA DEL PILOTO Y CAPÓ DEL BUGGY (ROLL CAGE & HOOD)
          ==================================================================== */}
      <div
        className={styles.cockpitFrameLayer}
        style={{
          transform: `rotate(${steeringTilt * 0.18}deg) translateY(${jumpOffset * 0.25}px)`,
        }}
      >
        <div className={styles.rollCageTopBar} />
        <div className={styles.rollCageLeft} style={{ borderLeft: `5px solid ${buggyColor}` }} />
        <div className={styles.rollCageRight} style={{ borderRight: `5px solid ${buggyColor}` }} />

        {/* Capó delantero del buggy visible en la base del parabrisas */}
        <div
          className={styles.buggyHoodNose}
          style={{
            transform: `translateX(-50%) translateY(${Math.sin(progress * 55) * 1.5}px)`,
          }}
        >
          <div className={styles.hoodScoopAirIntake} />
          <div className={styles.hoodSponsorDecal} style={{ color: buggyColor }}>
            BUGGY {buggyName}
          </div>
        </div>

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
            6. VOLANTE DEPORTIVO DE CARRERAS CON GUANTES (100% SVG)
               Gira en sincronía con los esquives y curvas sin tapar la pista
            ================================================================== */}
        <div
          className={styles.steeringWheelWrapper}
          style={{
            transform: `translateX(-50%) rotate(${steeringTilt}deg) translateY(${jumpOffset * 0.15 + Math.sin(progress * 50) * 1.2}px)`,
          }}
        >
          <svg viewBox="0 0 320 260" className={styles.wheelSvg} aria-label="Volante Deportivo">
            <defs>
              <linearGradient id="wheelRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="spokeMetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="gloveLeatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="40%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
            </defs>

            {/* Aro exterior del volante */}
            <circle
              cx="160"
              cy="150"
              r="90"
              fill="none"
              stroke="url(#wheelRimGrad)"
              strokeWidth="20"
            />
            {/* Grip de cuero perforado */}
            <circle
              cx="160"
              cy="150"
              r="90"
              fill="none"
              stroke="#334155"
              strokeWidth="16"
              strokeDasharray="60 35 60 120"
            />
            {/* Marca de las 12 en punto */}
            <path
              d="M 155 60 L 165 60"
              stroke={buggyColor}
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Radios metálicos del volante (3 radios) */}
            <line x1="160" y1="150" x2="72" y2="150" stroke="url(#spokeMetalGrad)" strokeWidth="14" />
            <line x1="160" y1="150" x2="248" y2="150" stroke="url(#spokeMetalGrad)" strokeWidth="14" />
            <line x1="160" y1="150" x2="160" y2="235" stroke="url(#spokeMetalGrad)" strokeWidth="14" />

            {/* Núcleo central / bocina */}
            <circle cx="160" cy="150" r="36" fill="#0f172a" stroke="#475569" strokeWidth="3" />
            <circle cx="160" cy="150" r="28" fill="#020617" stroke={buggyColor} strokeWidth="2" />
            <text
              x="160"
              y="156"
              fill={buggyColor}
              fontSize="18"
              fontWeight="900"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {buggySymbol}
            </text>

            {/* GUANTES DEPORTIVOS EN LAS POSICIONES 9 Y 3 EN PUNTO */}
            {/* Mano Izquierda */}
            <g>
              <path
                d="M 35 260 L 58 190 L 88 198 L 70 260 Z"
                fill="url(#gloveLeatherGrad)"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <path d="M 56 190 L 88 198" stroke={buggyColor} strokeWidth="3.5" strokeLinecap="round" />
              <path
                d="M 58 185 C 54 168, 58 152, 68 140 C 80 130, 96 135, 98 150 C 101 166, 96 185, 88 194 Z"
                fill="url(#gloveLeatherGrad)"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <path d="M 64 160 Q 72 155 80 162" stroke={buggyColor} strokeWidth="3" strokeLinecap="round" fill="none" />
              <path
                d="M 84 150 C 92 145, 102 148, 100 158 C 98 166, 88 167, 82 160 Z"
                fill="#0f172a"
                stroke={buggyColor}
                strokeWidth="1.5"
              />
            </g>

            {/* Mano Derecha */}
            <g>
              <path
                d="M 285 260 L 262 190 L 232 198 L 250 260 Z"
                fill="url(#gloveLeatherGrad)"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <path d="M 264 190 L 232 198" stroke={buggyColor} strokeWidth="3.5" strokeLinecap="round" />
              <path
                d="M 262 185 C 266 168, 262 152, 252 140 C 240 130, 224 135, 222 150 C 219 166, 224 185, 232 194 Z"
                fill="url(#gloveLeatherGrad)"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <path d="M 256 160 Q 248 155 240 162" stroke={buggyColor} strokeWidth="3" strokeLinecap="round" fill="none" />
              <path
                d="M 236 150 C 228 145, 218 148, 220 158 C 222 166, 232 167, 238 160 Z"
                fill="#0f172a"
                stroke={buggyColor}
                strokeWidth="1.5"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
