import React, { useMemo } from 'react';
import styles from './ArcadeBuggyRearSprite.module.css';

/**
 * Paleta de colores e identidades para los buggies de competición
 */
const BUGGY_PALETTES = {
  amarillo: {
    primary: '#facc15',
    secondary: '#eab308',
    dark: '#713f12',
    accent: '#fef08a',
    glow: 'rgba(250, 204, 21, 0.75)',
    number: '1',
    symbol: '⚡',
  },
  rojo: {
    primary: '#ef4444',
    secondary: '#dc2626',
    dark: '#7f1d1d',
    accent: '#fca5a5',
    glow: 'rgba(239, 68, 68, 0.75)',
    number: '2',
    symbol: '🔥',
  },
  azul: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    dark: '#1e3a8a',
    accent: '#93c5fd',
    glow: 'rgba(59, 130, 246, 0.75)',
    number: '3',
    symbol: '🌊',
  },
  verde: {
    primary: '#22c55e',
    secondary: '#16a34a',
    dark: '#14532d',
    accent: '#86efac',
    glow: 'rgba(34, 197, 94, 0.75)',
    number: '4',
    symbol: '🍃',
  },
  naranja: {
    primary: '#f97316',
    secondary: '#ea580c',
    dark: '#7c2d12',
    accent: '#fdba74',
    glow: 'rgba(249, 115, 22, 0.75)',
    number: '5',
    symbol: '🏔️',
  },
  morado: {
    primary: '#a855f7',
    secondary: '#9333ea',
    dark: '#581c87',
    accent: '#d8b4fe',
    glow: 'rgba(168, 85, 247, 0.75)',
    number: '6',
    symbol: '🔮',
  },
};

/**
 * ArcadeBuggyRearSprite:
 * Renderizado de alta fidelidad desde perspectiva de persecución trasera con giro dinámico 3D
 * estilo arcade rally (Horizon Chase Turbo / Sega Rally / OutRun).
 * Presenta ruedas delanteras direccionadas visibles en curvas, transferencia de peso en suspensión,
 * flanco 3D visible al virar y cabeza del piloto orientada al vértice.
 */
function ArcadeBuggyRearSpriteBase({
  buggy = {},
  isEliminated = false,
  isBoosting = false,
  carNumber = null,
  speedKmh = 100,
  steering = 0, // -1 izquierda, 0 recto, 1 derecha
}) {
  const palette = useMemo(() => {
    const rawId = (buggy.id || buggy.name || '').toLowerCase();
    if (rawId.includes('amarill')) return BUGGY_PALETTES.amarillo;
    if (rawId.includes('roj')) return BUGGY_PALETTES.rojo;
    if (rawId.includes('azul')) return BUGGY_PALETTES.azul;
    if (rawId.includes('verd')) return BUGGY_PALETTES.verde;
    if (rawId.includes('naranj')) return BUGGY_PALETTES.naranja;
    if (rawId.includes('morad') || rawId.includes('blanc')) return BUGGY_PALETTES.morado;
    return BUGGY_PALETTES.amarillo;
  }, [buggy.id, buggy.name]);

  const displayNum = carNumber || buggy.number || palette.number;

  // Normalización de dirección (-1 izquierda a +1 derecha)
  const steerNorm = Math.max(-1, Math.min(1, Number(steering) || 0));

  // Dinámicas de suspensión y giro
  const swayX = steerNorm * 2.8;              // Desplazamiento lateral de carrocería
  const rollDeg = steerNorm * 3.4;            // Inclinación centrífuga de suspensión
  const frontAngle = steerNorm * 22;          // Giro de ruedas delanteras (grados)
  const helmetX = 50 + steerNorm * 3.5;       // Cabeza del piloto mirando hacia la curva
  const wingShiftX = steerNorm * 3.2;         // Perspectiva del alerón superior

  return (
    <div className={styles.rearBuggyContainer}>
      {/* VECTOR SVG DEL BUGGY EN PERSPECTIVA TRASERA 3D */}
      <svg
        className={styles.rearBuggySvg}
        viewBox="0 0 100 78"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Degradado para los neumáticos de caucho todoterreno */}
          <linearGradient id={`tireGrad_${palette.number}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0b0f19" />
            <stop offset="35%" stopColor="#252f42" />
            <stop offset="70%" stopColor="#182030" />
            <stop offset="100%" stopColor="#090c14" />
          </linearGradient>

          {/* Degradado metálico para el chasis tubular */}
          <linearGradient id={`cageGrad_${palette.number}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Degradado de pintura de carrocería oficial */}
          <linearGradient id={`bodyGrad_${palette.number}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.accent} />
            <stop offset="25%" stopColor={palette.primary} />
            <stop offset="80%" stopColor={palette.secondary} />
            <stop offset="100%" stopColor={palette.dark} />
          </linearGradient>

          {/* Degradado para el alerón trasero */}
          <linearGradient id={`wingGrad_${palette.number}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="25%" stopColor={palette.primary} />
            <stop offset="75%" stopColor={palette.secondary} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* =========================================================================
            1. RUEDAS DELANTERAS DIRECCIONADAS (Visibles al doblar en perspectiva)
            ========================================================================= */}
        {/* Rueda delantera izquierda doblada hacia la izquierda */}
        {steerNorm < -0.06 && (
          <g
            id="frontWheelLeft"
            transform={`translate(${8 + steerNorm * 4}, 28) rotate(${frontAngle})`}
          >
            <rect x="-4.5" y="-12" width="9" height="25" rx="3.5" fill="#090d16" stroke="#000" strokeWidth="1" />
            <line x1="-4.5" y1="-7" x2="4.5" y2="-7" stroke="#334155" strokeWidth="1.2" />
            <line x1="-4.5" y1="-1" x2="4.5" y2="-1" stroke="#334155" strokeWidth="1.2" />
            <line x1="-4.5" y1="5" x2="4.5" y2="5" stroke="#334155" strokeWidth="1.2" />
            <line x1="-4.5" y1="11" x2="4.5" y2="11" stroke="#334155" strokeWidth="1.2" />
          </g>
        )}

        {/* Rueda delantera derecha doblada hacia la derecha */}
        {steerNorm > 0.06 && (
          <g
            id="frontWheelRight"
            transform={`translate(${92 + steerNorm * 4}, 28) rotate(${frontAngle})`}
          >
            <rect x="-4.5" y="-12" width="9" height="25" rx="3.5" fill="#090d16" stroke="#000" strokeWidth="1" />
            <line x1="-4.5" y1="-7" x2="4.5" y2="-7" stroke="#334155" strokeWidth="1.2" />
            <line x1="-4.5" y1="-1" x2="4.5" y2="-1" stroke="#334155" strokeWidth="1.2" />
            <line x1="-4.5" y1="5" x2="4.5" y2="5" stroke="#334155" strokeWidth="1.2" />
            <line x1="-4.5" y1="11" x2="4.5" y2="11" stroke="#334155" strokeWidth="1.2" />
          </g>
        )}

        {/* =========================================================================
            2. FLANCO LATERAL 3D VISIBLE AL DOBLAR (Nerf Bars & Chasis lateral)
            ========================================================================= */}
        {/* Flanco derecho visible cuando el auto apunta hacia la izquierda */}
        {steerNorm < -0.12 && (
          <g id="rightFlank3D" opacity={Math.min(1, Math.abs(steerNorm) * 1.35)}>
            <polygon
              points={`75,44 ${78 + Math.abs(steerNorm) * 6},26 ${76 + Math.abs(steerNorm) * 5},56 73,56`}
              fill={palette.dark}
              stroke="#090c14"
              strokeWidth="1"
            />
            {/* Barra tubular lateral cromada */}
            <line
              x1="74"
              y1="50"
              x2={77 + Math.abs(steerNorm) * 6}
              y2="28"
              stroke="#94a3b8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Flanco izquierdo visible cuando el auto apunta hacia la derecha */}
        {steerNorm > 0.12 && (
          <g id="leftFlank3D" opacity={Math.min(1, Math.abs(steerNorm) * 1.35)}>
            <polygon
              points={`25,44 ${22 - Math.abs(steerNorm) * 6},26 ${24 - Math.abs(steerNorm) * 5},56 27,56`}
              fill={palette.dark}
              stroke="#090c14"
              strokeWidth="1"
            />
            {/* Barra tubular lateral cromada */}
            <line
              x1="26"
              y1="50"
              x2={23 - Math.abs(steerNorm) * 6}
              y2="28"
              stroke="#94a3b8"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* =========================================================================
            3. NEUMÁTICOS TRASEROS PRINCIPALES (Con camber dinámico de apoyo)
            ========================================================================= */}
        {/* Neumático Trasero Izquierdo */}
        <g
          id="leftWheel"
          transform={`rotate(${steerNorm * -2.4} 12.5 70)`}
        >
          <rect
            x="4"
            y="26"
            width="17"
            height="46"
            rx="4"
            fill={`url(#tireGrad_${palette.number})`}
            stroke="#050810"
            strokeWidth="1.2"
          />
          {/* Tacos de tracción profunda */}
          <line x1="4" y1="32" x2="20" y2="32" stroke="#050810" strokeWidth="1.8" />
          <line x1="4" y1="39" x2="20" y2="39" stroke="#050810" strokeWidth="1.8" />
          <line x1="4" y1="46" x2="20" y2="46" stroke="#050810" strokeWidth="1.8" />
          <line x1="4" y1="53" x2="20" y2="53" stroke="#050810" strokeWidth="1.8" />
          <line x1="4" y1="60" x2="20" y2="60" stroke="#050810" strokeWidth="1.8" />
          <line x1="4" y1="67" x2="20" y2="67" stroke="#050810" strokeWidth="1.8" />

          {/* Llanta de aleación deportiva */}
          <circle cx="12.5" cy="51" r="5.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="12.5" cy="51" r="2.2" fill="#e2e8f0" />
        </g>

        {/* Neumático Trasero Derecho */}
        <g
          id="rightWheel"
          transform={`rotate(${steerNorm * -2.4} 87.5 70)`}
        >
          <rect
            x="79"
            y="26"
            width="17"
            height="46"
            rx="4"
            fill={`url(#tireGrad_${palette.number})`}
            stroke="#050810"
            strokeWidth="1.2"
          />
          {/* Tacos de tracción profunda */}
          <line x1="79" y1="32" x2="95" y2="32" stroke="#050810" strokeWidth="1.8" />
          <line x1="79" y1="39" x2="95" y2="39" stroke="#050810" strokeWidth="1.8" />
          <line x1="79" y1="46" x2="95" y2="46" stroke="#050810" strokeWidth="1.8" />
          <line x1="79" y1="53" x2="95" y2="53" stroke="#050810" strokeWidth="1.8" />
          <line x1="79" y1="60" x2="95" y2="60" stroke="#050810" strokeWidth="1.8" />
          <line x1="79" y1="67" x2="95" y2="67" stroke="#050810" strokeWidth="1.8" />

          {/* Llanta de aleación deportiva */}
          <circle cx="87.5" cy="51" r="5.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="87.5" cy="51" r="2.2" fill="#e2e8f0" />
        </g>

        {/* Polvo en neumáticos al acelerar */}
        {!isEliminated && speedKmh > 30 && (
          <g opacity="0.6">
            <ellipse cx="12" cy="72" rx="7" ry="2.5" fill="#d97706" />
            <ellipse cx="88" cy="72" rx="7" ry="2.5" fill="#d97706" />
          </g>
        )}

        {/* =========================================================================
            4. ESTRUCTURA SUSPENDIDA: BALANCEO Y TRANSFERENCIA DE PESO (BODY ROLL)
            ========================================================================= */}
        <g id="suspendedChassis" transform={`translate(${swayX.toFixed(2)}, 0) rotate(${rollDeg.toFixed(2)} 50 62)`}>
          {/* Brazos de suspensión inferiores (A-Arms) */}
          <line x1="21" y1="54" x2="42" y2="60" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="79" y1="54" x2="58" y2="60" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />

          {/* Resortes de amortiguación helicoidales */}
          <g stroke={palette.primary} strokeWidth="2" strokeLinecap="round">
            <line x1="23" y1="44" x2="27" y2="48" />
            <line x1="23" y1="48" x2="27" y2="52" />
            <line x1="23" y1="52" x2="27" y2="56" />

            <line x1="77" y1="44" x2="73" y2="48" />
            <line x1="77" y1="48" x2="73" y2="52" />
            <line x1="77" y1="52" x2="73" y2="56" />
          </g>

          {/* Caja de Diferencial Central */}
          <circle cx="50" cy="60" r="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <circle cx="50" cy="60" r="2.5" fill="#64748b" />

          {/* Placa protectora inferior / Skidplate */}
          <polygon points="32,67 68,67 64,72 36,72" fill="#334155" stroke="#1e293b" strokeWidth="1" />

          {/* Fondo oscuro de la cabina */}
          <polygon points="28,45 32,20 68,20 72,45" fill="#090d16" />

          {/* Asiento tipo baquet de competición */}
          <rect x="42" y="28" width="16" height="18" rx="4" fill="#1e293b" />
          <rect x="44" y="22" width="12" height="8" rx="3" fill="#0f172a" />

          {/* Casco del piloto orientado dinámicamente hacia el vértice */}
          <g id="driverHelmet">
            <ellipse cx={helmetX} cy="27" rx="6" ry="6.5" fill="#1e1b4b" stroke={palette.primary} strokeWidth="1.2" />
            <path
              d={`M ${helmetX - 2} 21 Q ${helmetX} 20 ${helmetX + 2} 21 L ${helmetX + 2} 25 Q ${helmetX} 26 ${helmetX - 2} 25 Z`}
              fill={palette.accent}
            />
          </g>

          {/* Barras cruzadas en X para seguridad antivuelco */}
          <line x1="31" y1="21" x2="69" y2="44" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="69" y1="21" x2="31" y2="44" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />

          {/* Estructura tubular externa de la jaula (Roll Cage) */}
          <path
            d="M 24 50 L 30 19 Q 50 15 70 19 L 76 50"
            stroke={`url(#cageGrad_${palette.number})`}
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Barra de Luces LED en el Techo (6 Focos de Alta Intensidad) */}
          <rect x="29" y="14" width="42" height="4.5" rx="2" fill="#020617" stroke="#475569" strokeWidth="0.8" />
          <circle cx="34" cy="16.2" r="1.5" fill="#fef08a" />
          <circle cx="40" cy="16.2" r="1.5" fill="#fef08a" />
          <circle cx="46.5" cy="16.2" r="1.5" fill="#ffffff" />
          <circle cx="53.5" cy="16.2" r="1.5" fill="#ffffff" />
          <circle cx="60" cy="16.2" r="1.5" fill="#fef08a" />
          <circle cx="66" cy="16.2" r="1.5" fill="#fef08a" />

          {/* Alerón / Spoiler Aerodinámico Superior con inclinación */}
          <g id="rearWing" transform={`translate(${wingShiftX.toFixed(2)}, 0)`}>
            <polygon
              points="19,18 81,18 85,23 15,23"
              fill={`url(#wingGrad_${palette.number})`}
              stroke="#000000"
              strokeWidth="1.2"
            />
            {/* Endplates del alerón (aletas laterales aerodinámicas) */}
            <rect x="14" y="16" width="3" height="9" rx="1" fill={palette.primary} stroke="#000" strokeWidth="0.8" />
            <rect x="83" y="16" width="3" height="9" rx="1" fill={palette.primary} stroke="#000" strokeWidth="0.8" />
            {/* Soportes verticales del alerón */}
            <line x1="28" y1="23" x2="28" y2="28" stroke="#1e293b" strokeWidth="2.5" />
            <line x1="72" y1="23" x2="72" y2="28" stroke="#1e293b" strokeWidth="2.5" />
          </g>

          {/* Paneles laterales ensanchados (Fender Flares) */}
          <polygon points="19,46 29,43 27,56 19,53" fill={palette.secondary} stroke="#050810" strokeWidth="1" />
          <polygon points="81,46 71,43 73,56 81,53" fill={palette.secondary} stroke="#050810" strokeWidth="1" />

          {/* Panel central principal de la carrocería */}
          <path
            d="M 26 43 L 74 43 L 72 63 L 28 63 Z"
            fill={`url(#bodyGrad_${palette.number})`}
            stroke="#090c14"
            strokeWidth="1.8"
          />

          {/* Salidas de aire y rejillas de ventilación del motor */}
          <line x1="32" y1="46" x2="44" y2="46" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="56" y1="46" x2="68" y2="46" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="50" x2="44" y2="50" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="56" y1="50" x2="66" y2="50" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

          {/* Placa dorsal de competición con el NÚMERO DEL AUTO */}
          <g id="raceNumberBadge">
            <rect
              x="44"
              y="49"
              width="12"
              height="11"
              rx="2.5"
              fill="#090d16"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            <text
              x="50"
              y="57.8"
              fontSize="8.5"
              fontWeight="900"
              fontFamily="'Impact', 'Arial Black', sans-serif"
              textAnchor="middle"
              fill={palette.primary}
            >
              {displayNum}
            </text>
          </g>

          {/* Luces Traseras LED Neón de Competición */}
          <g id="tailLights">
            {/* Luz Trasera Izquierda */}
            <rect x="23" y="47" width="8" height="4" rx="1.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
            <rect x="25" y="48.5" width="4" height="1" rx="0.5" fill="#ffffff" />
            {/* Luz Trasera Derecha */}
            <rect x="69" y="47" width="8" height="4" rx="1.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
            <rect x="71" y="48.5" width="4" height="1" rx="0.5" fill="#ffffff" />
          </g>

          {/* Tubos de escape duales con acabado en titanio */}
          <g id="dualExhausts">
            <circle cx="34" cy="63" r="3.2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="34" cy="63" r="1.8" fill="#000000" />

            <circle cx="66" cy="63" r="3.2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="66" cy="63" r="1.8" fill="#000000" />
          </g>
        </g>
      </svg>

      {/* FUEGO REACTIVO DE NITRO EN ACELERACIÓN */}
      {!isEliminated && isBoosting && (
        <div className={styles.nitroExhaust}>
          <div className={styles.nitroJetLeft} />
          <div className={styles.nitroJetRight} />
        </div>
      )}

      {/* HUMO Y FUEGO SI QUEDÓ DESTRUIDO POR UN OBSTÁCULO */}
      {isEliminated && (
        <div className={styles.crashFx}>
          <div className={styles.smokeCloud1} />
          <div className={styles.smokeCloud2} />
          <div className={styles.fireTongue} />
        </div>
      )}
    </div>
  );
}

/**
 * Cuantización suave (16 pasos en el rango -1 a +1) para actualización a 60 FPS fluida
 * sin causar re-renders innecesarios en micro-ruido.
 */
const steeringBucket = (s) => Math.round((s || 0) * 8);

const ArcadeBuggyRearSprite = React.memo(ArcadeBuggyRearSpriteBase, (prev, next) => (
  (prev.buggy?.id || prev.buggy?.name) === (next.buggy?.id || next.buggy?.name) &&
  prev.isEliminated === next.isEliminated &&
  prev.isBoosting === next.isBoosting &&
  prev.carNumber === next.carNumber &&
  (prev.speedKmh > 30) === (next.speedKmh > 30) &&
  steeringBucket(prev.steering) === steeringBucket(next.steering)
));

export default ArcadeBuggyRearSprite;
