import React from 'react';
import styles from './BuggySprite.module.css';

/**
 * BuggySprite: Vehículo Buggy de carreras estilo videojuego arcade 2D.
 * Con ruedas giratorias, suspensión activa, piloto con casco, luces frontales
 * y efectos dinámicos de nitro y choque.
 */
export default function BuggySprite({
  color = '#facc15',
  glowColor = 'rgba(250, 204, 21, 0.65)',
  name = 'AMARILLO',
  carNumber = 1,
  isRacing = true,
  isBoosting = false,
  isEliminated = false,
  isJumping = false,
}) {
  // Paletas de color para carrocería
  const palette = {
    AMARILLO: { primary: '#facc15', secondary: '#ca8a04', dark: '#854d0e', highlight: '#fef08a' },
    ROJO: { primary: '#ef4444', secondary: '#b91c1c', dark: '#7f1d1d', highlight: '#fca5a5' },
    AZUL: { primary: '#3b82f6', secondary: '#1d4ed8', dark: '#1e3a8a', highlight: '#93c5fd' },
    VERDE: { primary: '#22c55e', secondary: '#15803d', dark: '#14532d', highlight: '#86efac' },
    NARANJO: { primary: '#f97316', secondary: '#c2410c', dark: '#7c2d12', highlight: '#fed7aa' },
    NARANJA: { primary: '#f97316', secondary: '#c2410c', dark: '#7c2d12', highlight: '#fed7aa' },
    MORADO: { primary: '#a855f7', secondary: '#7e22ce', dark: '#581c87', highlight: '#d8b4fe' },
    BLANCO: { primary: '#e2e8f0', secondary: '#94a3b8', dark: '#475569', highlight: '#ffffff' },
  }[name.toUpperCase()] || { primary: color, secondary: '#d97706', dark: '#78350f', highlight: '#ffffff' };

  return (
    <div
      className={`${styles.buggyContainer} ${
        isEliminated
          ? styles.buggyEliminated
          : (isJumping ? styles.buggyJumping : (isBoosting ? styles.buggyBoosting : styles.buggyRacing))
      }`}
      style={{ '--glow-color': glowColor, '--primary-color': palette.primary }}
    >
      {/* 1. Llama de Nitro / Turbo en el escape */}
      {!isEliminated && isBoosting && (
        <div className={styles.nitroExhaust}>
          <span className={styles.nitroFlameMain} />
          <span className={styles.nitroFlameCore} />
        </div>
      )}

      {/* 2. Humo y Chispas de Choque si quedó eliminado */}
      {isEliminated && (
        <div className={styles.crashFx}>
          <div className={styles.blackSmoke1} />
          <div className={styles.blackSmoke2} />
          <div className={styles.fireTongue} />
          <div className={styles.sparkSpit} />
        </div>
      )}

      {/* 3. Sprite SVG Vectorial del Buggy */}
      <svg
        className={styles.buggySvg}
        viewBox="0 0 160 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Degradado metálico de la carrocería */}
          <linearGradient id={`bodyGrad_${name}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.highlight} />
            <stop offset="40%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.secondary} />
          </linearGradient>

          {/* Sombra de la carrocería */}
          <linearGradient id={`shadowGrad_${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.secondary} />
            <stop offset="100%" stopColor={palette.dark} />
          </linearGradient>

          {/* Rueda metálica */}
          <radialGradient id="rimGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="80%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* Chasis inferior / Skidplate */}
        <path d="M 28 58 L 132 58 L 126 64 L 34 64 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />

        {/* Motor V8 trasero expuesto */}
        <rect x="22" y="38" width="16" height="18" rx="2" fill="#334155" stroke="#0f172a" strokeWidth="1" />
        <rect x="24" y="35" width="5" height="4" fill="#64748b" />
        <rect x="31" y="35" width="5" height="4" fill="#64748b" />
        <path d="M 18 48 L 24 48" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="16" cy="48" r="2.5" fill="#f59e0b" />

        {/* Alerón trasero de competición */}
        <path d="M 14 26 L 36 28 L 34 32 L 12 30 Z" fill={palette.secondary} stroke="#0f172a" strokeWidth="1" />
        <path d="M 24 32 L 26 44" stroke="#475569" strokeWidth="2.5" />

        {/* Jaula antivuelco (Rollcage tubular) */}
        <path
          d="M 38 46 L 50 18 L 86 18 L 108 42"
          fill="none"
          stroke="#0f172a"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 38 46 L 50 18 L 86 18 L 108 42"
          fill="none"
          stroke="#475569"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Barra transversal */}
        <path d="M 68 18 L 74 46" stroke="#475569" strokeWidth="2.5" />

        {/* Piloto con casco de carreras */}
        <circle cx="68" cy="30" r="8" fill={palette.primary} stroke="#0f172a" strokeWidth="1.5" />
        {/* Visor oscuro del casco */}
        <path d="M 69 28 Q 76 28 75 32 Q 69 33 69 28" fill="#0f172a" />
        {/* Cuello / Traje de competición */}
        <path d="M 62 42 L 76 42 L 74 38 L 64 38 Z" fill="#1e293b" />

        {/* Barra de luces de techo (Rally Roof Lightbar) */}
        <rect x="52" y="13" width="32" height="5" rx="1.5" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
        <circle cx="57" cy="15.5" r="2.5" fill="#fef08a" />
        <circle cx="65" cy="15.5" r="2.5" fill="#fef08a" />
        <circle cx="73" cy="15.5" r="2.5" fill="#fef08a" />
        <circle cx="81" cy="15.5" r="2.5" fill="#fef08a" />

        {/* Carrocería principal (Offroad Dune Buggy Body) */}
        <path
          d="M 36 54 L 54 44 L 92 42 L 118 46 L 140 52 L 138 58 L 34 58 Z"
          fill={`url(#bodyGrad_${name})`}
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        {/* Moldura / sombra aerodinámica */}
        <path
          d="M 54 44 L 92 42 L 118 46 L 114 50 L 52 48 Z"
          fill={`url(#shadowGrad_${name})`}
          opacity="0.65"
        />
        {/* Franja de carrera racing */}
        <path d="M 62 43 L 130 51 L 129 54 L 60 46 Z" fill="#ffffff" opacity="0.85" />
        <path d="M 64 45 L 126 52 L 125 54 L 62 47 Z" fill="#0f172a" />

        {/* Dorsal / Número de carrera */}
        <circle cx="82" cy="50" r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
        <text
          x="82"
          y="53"
          textAnchor="middle"
          fontSize="7"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          fill="#0f172a"
        >
          {carNumber}
        </text>

        {/* Guardabarros / Fender delantero y trasero */}
        <path d="M 28 54 Q 38 42 52 54" fill="none" stroke="#0f172a" strokeWidth="3" />
        <path d="M 104 54 Q 116 42 130 54" fill="none" stroke="#0f172a" strokeWidth="3" />

        {/* Faro delantero principal (Halogen Rally Bumper Light) */}
        <ellipse cx="140" cy="52" rx="3.5" ry="5" fill="#fef08a" stroke="#0f172a" strokeWidth="1" />
        <ellipse cx="141" cy="52" rx="1.5" ry="3" fill="#ffffff" />

        {/* Amortiguadores / Resortes de suspensión */}
        <path d="M 36 50 L 40 58 M 38 52 L 42 60" stroke="#f59e0b" strokeWidth="1.5" />
        <path d="M 116 50 L 118 58 M 118 52 L 120 60" stroke="#f59e0b" strokeWidth="1.5" />

        {/* ==========================================
            RUEDA TRASERA (Con animación de giro)
            ========================================== */}
        <g className={!isEliminated && isRacing ? styles.wheelSpinning : ''} style={{ transformOrigin: '40px 60px' }}>
          {/* Neumático exterior rugoso */}
          <circle cx="40" cy="60" r="18" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Huellas / Tacos de tracción */}
          <circle cx="40" cy="60" r="17" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
          {/* Llanta de aleación */}
          <circle cx="40" cy="60" r="10.5" fill="url(#rimGrad)" stroke="#475569" strokeWidth="1" />
          {/* Rayos de la llanta */}
          <line x1="40" y1="51" x2="40" y2="69" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="31" y1="60" x2="49" y2="60" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="33" y1="53" x2="47" y2="67" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="33" y1="67" x2="47" y2="53" stroke="#cbd5e1" strokeWidth="1.8" />
          {/* Tapa central / Tuerca */}
          <circle cx="40" cy="60" r="3.5" fill={palette.primary} stroke="#0f172a" strokeWidth="1" />
        </g>

        {/* ==========================================
            RUEDA DELANTERA (Con animación de giro)
            ========================================== */}
        <g className={!isEliminated && isRacing ? styles.wheelSpinning : ''} style={{ transformOrigin: '118px 60px' }}>
          {/* Neumático exterior rugoso */}
          <circle cx="118" cy="60" r="18" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Huellas / Tacos de tracción */}
          <circle cx="118" cy="60" r="17" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
          {/* Llanta de aleación */}
          <circle cx="118" cy="60" r="10.5" fill="url(#rimGrad)" stroke="#475569" strokeWidth="1" />
          {/* Rayos de la llanta */}
          <line x1="118" y1="51" x2="118" y2="69" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="109" y1="60" x2="127" y2="60" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="111" y1="53" x2="125" y2="67" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="111" y1="67" x2="125" y2="53" stroke="#cbd5e1" strokeWidth="1.8" />
          {/* Tapa central / Tuerca */}
          <circle cx="118" cy="60" r="3.5" fill={palette.primary} stroke="#0f172a" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
