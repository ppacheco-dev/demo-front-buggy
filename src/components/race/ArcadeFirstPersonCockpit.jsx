import React, { useMemo, useState } from 'react';
import ArcadeRoadHazardZone from './ArcadeRoadHazardZone';
import ArcadeSkyFallingHazards from './ArcadeSkyFallingHazards';
import ArcadeBuggyRearSprite from './ArcadeBuggyRearSprite';
import styles from './ArcadeFirstPersonCockpit.module.css';

/**
 * ArcadeFirstPersonCockpit: Vista inmersiva en Primera Persona (FPV / Cabina del Piloto).
 * Rediseñada fielmente basada en la estética de la imagen de referencia:
 * 1. Enorme sol poniente brillante en el horizonte con cielo degradado al atardecer (sunset synthwave).
 * 2. Carretera amplia de 5 carriles en perspectiva con bordillos vibratorios rojos y blancos (kerbs) y líneas amarillas.
 * 3. Autos rivales en sus respectivos carriles con placas flotantes redondeadas estilo píldora (P1 LÍDER, P4, P6, etc.).
 * 4. Ruedas delanteras todoterreno visibles en las esquinas inferiores exteriores (Open-Wheel Dune Buggy).
 * 5. Jaula antivuelco tubular con ventanas laterales abiertas y soportes triangulares.
 * 6. Capó delantero en el color del buggy visible sobre el tablero.
 * 7. Tablero de mandos con panel de interruptores a la izquierda y cuadro de instrumentos en arco con velocímetro digital.
 * 8. Volante deportivo de 3 radios con brazos y guantes de piloto en posición de conducción.
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
  // Selector opcional de cámara para el espectador
  const [spectatorSelectedName, setSpectatorSelectedName] = useState(null);

  // Identificar el buggy del usuario o el auto seguido
  const playerCar = useMemo(() => {
    // Si el usuario apostó por un buggy, se le fija ese buggy
    if (userBuggyName) {
      const match = cars.find((c) =>
        userBuggyName.toUpperCase().includes(c.buggy.name.toUpperCase())
      );
      if (match) return match;
    }
    // Si el espectador cambió manualmente de auto
    if (spectatorSelectedName) {
      const match = cars.find((c) => c.buggy.name.toUpperCase() === spectatorSelectedName);
      if (match) return match;
    }
    // Por defecto para espectador: elegimos uno de los autos del pelotón intermedio/trasero
    // para que vea los demás autos compitiendo adelante hacia el sol poniente (como en la referencia)
    if (rankedCars.length >= 4) {
      return rankedCars[rankedCars.length - 1] || cars[cars.length - 1] || null;
    }
    return rankedCars[0] || cars[0] || null;
  }, [cars, rankedCars, userBuggyName, spectatorSelectedName]);

  const playerRank = useMemo(() => {
    if (!playerCar) return 1;
    const idx = rankedCars.findIndex((c) => c.name === playerCar.name);
    return idx >= 0 ? idx + 1 : 1;
  }, [rankedCars, playerCar]);

  const isLeader = playerRank === 1 && !playerCar?.isEliminated;
  const isPlayerEliminated = Boolean(playerCar?.isEliminated);

  // Autos activos que van ADELANTE del auto del jugador (visibles en la pista frente a nosotros)
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
    const curve = norm * norm;

    // Desde el horizonte (10%) hasta el morro del capó (62%)
    const topPct = 10 + curve * 52;
    const scale = 0.22 + curve * 0.52;
    const opacity = norm < 0.08 ? norm / 0.08 : norm > 0.88 ? (1 - norm) / 0.12 : 1;

    return { isVisible: true, topPct, scale, opacity };
  }, [isFinished, currentSectorObstacle, sectorFraction, minFraction]);

  // Dinámica de giro e inclinación del volante y la cabina
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

  // Datos de telemetría del buggy
  const speed = playerCar?.speedKmh || 164;
  const buggyColor = playerCar?.buggy?.color || '#ea580c';
  const buggySymbol = playerCar?.buggy?.symbol || '🔥';
  const buggyName = playerCar?.buggy?.name || 'NARANJA';

  // Marcha simulada
  const currentGear = useMemo(() => {
    if (speed < 35) return '1';
    if (speed < 75) return '2';
    if (speed < 115) return '3';
    if (speed < 155) return '4';
    if (speed < 195) return '5';
    return '6';
  }, [speed]);

  return (
    <div className={styles.cockpitStage}>
      {/* ====================================================================
          1. CIELO AL ATARDECER Y ENORME SOL PONIENTE EN EL HORIZONTE
          ==================================================================== */}
      <div className={styles.skyBackdrop}>
        {/* Rayas de velocidad/estilo en las esquinas superiores */}
        <div className={styles.sideTintLinesLeft} />
        <div className={styles.sideTintLinesRight} />

        {/* Enorme Sol Radiante Atardecer Centrado en el Horizonte */}
        <div className={styles.sunsetSun}>
          <div className={styles.sunInnerCore} />
          <div className={styles.sunCoronaGlow} />
        </div>

        {/* Siluetas de montañas oscuras a lo largo del horizonte */}
        <div className={styles.horizonMountains} />
      </div>

      {/* ====================================================================
          2. CARRETERA EN PERSPECTIVA DE 5 CARRILES Y HOMBROS DE ARENA
          ==================================================================== */}
      <div
        className={styles.groundPlane}
        style={{
          transform: `translateY(${-jumpOffset * 0.4}px)`,
        }}
      >
        {/* Hombros de desierto / dunas doradas a los costados */}
        <div className={styles.desertShoulderLeft} />
        <div className={styles.desertShoulderRight} />

        {/* Pista de Carretera en Perspectiva */}
        <div className={styles.highwayRoad}>
          {/* Bordillos vibratorios laterales rayados en rojo y blanco con borde amarillo */}
          <div className={styles.kerbRumbleLeft} />
          <div className={styles.kerbRumbleRight} />

          {/* Líneas divisorias de carril discontinuas en perspectiva 3D */}
          <div className={styles.laneMarkerCol} style={{ left: '20%' }} />
          <div className={styles.laneMarkerCol} style={{ left: '35%' }} />
          <div className={styles.laneMarkerCol} style={{ left: '50%' }} />
          <div className={styles.laneMarkerCol} style={{ left: '65%' }} />
          <div className={styles.laneMarkerCol} style={{ left: '80%' }} />

          {/* Arco de meta en los últimos metros */}
          {progress > 0.82 && (
            <div
              className={styles.finishArchGantry}
              style={{
                top: `${Math.min(75, 12 + (progress - 0.82) * 320)}%`,
                transform: `translateX(-50%) scale(${0.45 + (progress - 0.82) * 2.2})`,
                opacity: Math.min(1, (progress - 0.82) * 6),
              }}
            >
              🏁 META FINAL • 1.140M 🏁
            </div>
          )}

          {/* Obstáculo en aproximación frontal */}
          {hazardApproach.isVisible && (
            <div
              className={styles.approachingHazard}
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

          {/* AUTOS RIVALES QUE VAN ADELANTE (Con placas de posición estilo píldora como la imagen) */}
          {carsAhead.map((car, idx) => {
            const rank = rankedCars.findIndex((c) => c.name === car.name) + 1;
            const isCarLeader = rank === 1;

            const distAhead = Math.max(6, car.x - (playerCar?.x || 150));
            // Proximidad normalizada
            const normDist = Math.min(1, Math.max(0, distAhead / 190));
            const pFactor = Math.pow(1 - normDist, 1.6);

            // Perspectiva vertical: desde 10% (horizonte) hasta 62% (justo encima de nuestro capó)
            const top = 10 + pFactor * 52;

            // Escala proporcional realista
            const scale = 0.16 + pFactor * 0.38;

            // Carril distribuido en los 5 carriles de la pista
            const laneIndex = (car.index % 5) - 2; // -2, -1, 0, 1, 2
            const laneSpread = 22 + pFactor * 130;
            const laneOffset = laneIndex * laneSpread;

            return (
              <div
                key={car.name}
                className={styles.rivalBuggySlot}
                style={{
                  top: `${top}%`,
                  left: `calc(50% + ${laneOffset}px)`,
                  transform: `translate(-50%, -100%) scale(${scale})`,
                  zIndex: Math.round(10 + pFactor * 30),
                }}
              >
                {/* Sombra en el asfalto debajo del auto */}
                <div className={styles.rivalShadow} />

                {/* Placa de posición estilo píldora (idéntica a la imagen: P1 LÍDER, P4, P6, etc.) */}
                <div
                  className={`${styles.rivalRankPill} ${isCarLeader ? styles.pillGoldLeader : ''}`}
                  style={{
                    background: isCarLeader ? '#facc15' : car.buggy.color,
                    color: '#000000',
                  }}
                >
                  {isCarLeader ? 'P1 LÍDER' : `P${rank}`}
                </div>

                {/* Sprite del Buggy con luces traseras y alerón */}
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

      {/* Peligros cayendo del cielo si aplica */}
      <ArcadeSkyFallingHazards
        tipo={currentSectorObstacle?.tipo}
        nombre={currentSectorObstacle?.nombre}
        sectorFraction={sectorFraction}
        isFinished={isFinished}
      />

      {/* ====================================================================
          3. RUEDAS DELANTERAS TODOTERRENO VISIBLES (OPEN-WHEEL DUNE BUGGY)
             Visibles en las esquinas inferiores exteriores de la cabina
          ==================================================================== */}
      <div
        className={styles.frontWheelsLayer}
        style={{
          transform: `translateY(${jumpOffset * 0.3}px)`,
        }}
      >
        {/* Rueda Delantera Izquierda con neumático todoterreno knobby */}
        <div className={styles.frontWheelLeft}>
          <div className={styles.tireTreads} />
          <div className={styles.wheelRimCenter} />
          <div className={styles.suspensionArm} />
        </div>

        {/* Rueda Delantera Derecha */}
        <div className={styles.frontWheelRight}>
          <div className={styles.tireTreads} />
          <div className={styles.wheelRimCenter} />
          <div className={styles.suspensionArm} />
        </div>
      </div>

      {/* ====================================================================
          4. CAPÓ DELANTERO DEL BUGGY (En el color del auto del jugador)
          ==================================================================== */}
      <div
        className={styles.buggyHoodContainer}
        style={{
          transform: `translateX(-50%) translateY(${Math.sin(progress * 50) * 1.2}px)`,
        }}
      >
        <div
          className={styles.hoodBodyShape}
          style={{
            background: buggyColor,
            boxShadow: `0 0 25px ${buggyColor}55`,
          }}
        >
          {/* Líneas angulares negras del capó */}
          <div className={styles.hoodCowlLines} />
          <div className={styles.hoodCenterVent} />
        </div>
      </div>

      {/* ====================================================================
          5. JAULA ANTIVUELCO TUBULAR DE ACERO (ROLL CAGE)
             Tubos de acero oscuros con ventanas abiertas al costado
          ==================================================================== */}
      <div
        className={styles.rollCageContainer}
        style={{
          transform: `rotate(${steeringTilt * 0.15}deg)`,
        }}
      >
        {/* Barra de techo horizontal superior */}
        <div className={styles.cageRoofBar} />

        {/* Pilar A Izquierdo inclinado */}
        <div className={styles.cagePillarLeft}>
          <div className={styles.cageGussetLeft} />
        </div>

        {/* Pilar A Derecho inclinado */}
        <div className={styles.cagePillarRight}>
          <div className={styles.cageGussetRight} />
        </div>

        {/* Tubos diagonales laterales que forman las ventanas abiertas laterales */}
        <div className={styles.cageSideDiagonalLeft} />
        <div className={styles.cageSideDiagonalRight} />

        {/* Barra transversal inferior de soporte */}
        <div className={styles.cageCrossbarBase} />
      </div>

      {/* ====================================================================
          6. TABLERO DE MANDOS CON INSTRUMENTOS Y BOTONES (DASHBOARD)
          ==================================================================== */}
      <div className={styles.dashboardConsole}>
        {/* Panel de interruptores de palanca a la izquierda (idéntico a la imagen) */}
        <div className={styles.dashSwitchPanel}>
          <div className={styles.rockerSwitchOrange} />
          <div className={styles.rockerSwitchYellow} />
        </div>

        {/* Cúpula del cuadro de instrumentos centrada detrás del volante */}
        <div className={styles.instrumentBinnacle}>
          <svg viewBox="0 0 240 70" className={styles.gaugesSvg} aria-label="Instrumentos">
            {/* Esfera Izquierda: Indicador auxiliar / Turbo */}
            <path
              d="M 30 55 A 20 20 0 0 1 65 30"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line x1="48" y1="42" x2="38" y2="48" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

            {/* Esfera Central Principal: Velocímetro / Tacómetro grande */}
            <path
              d="M 85 55 A 38 38 0 0 1 155 55"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 90 55 A 34 34 0 0 1 150 55"
              fill="none"
              stroke="#083344"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Aguja del velocímetro en naranja brillante */}
            <line x1="120" y1="52" x2="110" y2="24" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
            <circle cx="120" cy="52" r="4.5" fill="#f97316" />

            {/* Display Digital LCD en la base del velocímetro */}
            <rect x="104" y="56" width="32" height="10" rx="2" fill="#020617" stroke="#06b6d4" strokeWidth="1" />
            <text x="120" y="64" fill="#06b6d4" fontSize="8" fontWeight="900" textAnchor="middle">
              {speed}
            </text>

            {/* Esfera Derecha: Temperatura / RPM */}
            <path
              d="M 175 30 A 20 20 0 0 1 210 55"
              fill="none"
              stroke="#f97316"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line x1="192" y1="42" x2="202" y2="48" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Panel derecho del tablero */}
        <div className={styles.dashRightBezel}>
          <div className={styles.gearPillMini}>
            <span>GEAR</span>
            <strong>{currentGear}</strong>
          </div>
        </div>
      </div>

      {/* ====================================================================
          7. VOLANTE DEPORTIVO DE 3 RADIOS CON GUANTES DE PILOTO (100% SVG)
          ==================================================================== */}
      <div
        className={styles.steeringWheelLayer}
        style={{
          transform: `translateX(-50%) rotate(${steeringTilt}deg) translateY(${Math.sin(progress * 48) * 1.5}px)`,
        }}
      >
        <svg viewBox="0 0 460 260" className={styles.steeringSvg} aria-label="Volante y Manos">
          <defs>
            <linearGradient id="wheelRimShade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="spokeShade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="armSkin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="gloveDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Aro del Volante (Grip circular deportivo) */}
          <circle
            cx="230"
            cy="145"
            r="82"
            fill="none"
            stroke="url(#wheelRimShade)"
            strokeWidth="22"
          />
          {/* Textura de costura y relieve del aro */}
          <circle
            cx="230"
            cy="145"
            r="82"
            fill="none"
            stroke="#0f172a"
            strokeWidth="16"
            strokeDasharray="50 30 50 120"
          />

          {/* Radios metálicos del volante (Izquierdo, Derecho, Inferior) */}
          <line x1="230" y1="145" x2="154" y2="145" stroke="url(#spokeShade)" strokeWidth="15" />
          <line x1="230" y1="145" x2="306" y2="145" stroke="url(#spokeShade)" strokeWidth="15" />
          <line x1="230" y1="145" x2="230" y2="225" stroke="url(#spokeShade)" strokeWidth="15" />

          {/* Núcleo central del volante / Bocina */}
          <circle cx="230" cy="145" r="32" fill="#0f172a" stroke="#475569" strokeWidth="3" />
          <circle cx="230" cy="145" r="22" fill="#020617" stroke="#334155" strokeWidth="2" />
          <circle cx="230" cy="145" r="10" fill="#1e293b" />

          {/* ================================================================
              BRAZO Y GUANTE IZQUIERDO (Agarrando el volante a las 9 en punto)
              ================================================================ */}
          <g id="driverLeftArm">
            {/* Antebrazo entrando desde la esquina inferior izquierda */}
            <path
              d="M 120 260 L 165 190 L 195 200 L 155 260 Z"
              fill="url(#armSkin)"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Puño del guante */}
            <path d="M 160 192 L 196 202" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />

            {/* Mano enguantada envolviendo el aro */}
            <path
              d="M 162 186 C 152 170, 154 150, 168 138 C 182 126, 200 134, 202 152 C 205 170, 198 190, 188 198 Z"
              fill="url(#gloveDark)"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* Panel de refuerzo en el dorso del guante (gris claro) */}
            <path
              d="M 168 152 C 166 142, 175 138, 184 144 C 188 152, 184 165, 175 166 Z"
              fill="#94a3b8"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Pulgar sobre el radio */}
            <path
              d="M 188 148 C 196 142, 208 146, 206 158 C 202 168, 192 166, 186 158 Z"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          </g>

          {/* ================================================================
              BRAZO Y GUANTE DERECHO (Agarrando el volante a las 3 en punto)
              ================================================================ */}
          <g id="driverRightArm">
            {/* Antebrazo entrando desde la esquina inferior derecha */}
            <path
              d="M 340 260 L 295 190 L 265 200 L 305 260 Z"
              fill="url(#armSkin)"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Puño del guante */}
            <path d="M 300 192 L 264 202" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />

            {/* Mano enguantada envolviendo el aro */}
            <path
              d="M 298 186 C 308 170, 306 150, 292 138 C 278 126, 260 134, 258 152 C 255 170, 262 190, 272 198 Z"
              fill="url(#gloveDark)"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* Panel de refuerzo en el dorso del guante */}
            <path
              d="M 292 152 C 294 142, 285 138, 276 144 C 272 152, 276 165, 285 166 Z"
              fill="#94a3b8"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Pulgar sobre el radio */}
            <path
              d="M 272 148 C 264 142, 252 146, 254 158 C 258 168, 268 166, 274 158 Z"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>

      {/* ====================================================================
          8. BOTÓN DE CAMBIO DE CÁMARA PARA ESPECTADOR (Si no apostó)
          ==================================================================== */}
      {!userBuggyName && cars.length > 1 && (
        <div className={styles.spectatorCockpitSwitch}>
          <span className={styles.switchLabel}>PILOTO:</span>
          {cars.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`${styles.spectatorCarBtn} ${playerCar?.name === c.name ? styles.spectatorCarBtnActive : ''}`}
              style={{
                borderColor: c.buggy.color,
                color: playerCar?.name === c.name ? '#000' : '#fff',
                background: playerCar?.name === c.name ? c.buggy.color : 'rgba(0,0,0,0.6)',
              }}
              onClick={() => setSpectatorSelectedName(c.buggy.name.toUpperCase())}
            >
              {c.buggy.symbol} #{c.buggy.number || ''}
            </button>
          ))}
        </div>
      )}

      {/* Overlay si el auto sufre colisión */}
      {isPlayerEliminated && (
        <div className={styles.crashAlertOverlay}>
          <div className={styles.crashBox}>
            <div style={{ fontSize: '2rem' }}>💥</div>
            <div style={{ color: '#ef4444', fontWeight: 900 }}>¡VEHÍCULO ACCIDENTADO!</div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              {playerCar?.causaEliminacion || 'Impacto en el tramo'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
