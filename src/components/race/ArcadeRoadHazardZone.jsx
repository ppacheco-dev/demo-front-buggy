import React from 'react';
import styles from './ArcadeRoadHazardZone.module.css';

/**
 * ArcadeRoadHazardZone:
 * Obstáculo transversal de calzada completa que cubre el 100% del ancho de la pista
 * diseñado ESTRICTAMENTE DE FRENTE (frontal view en perspectiva 2.5D), no de lado.
 */
export default function ArcadeRoadHazardZone({
  tipo = 'ROCAS',
  nombre = 'Campo de Rocas',
  icono = '🪨',
}) {
  const normTipo = (tipo || 'ROCAS').toUpperCase();

  return (
    <div className={styles.hazardZoneContainer}>
      {/* =========================================================================
          1. ROCAS GIGANTES / AVALANCHA DE FRENTE (Sopladas en la calzada transversal)
          ========================================================================= */}
      {normTipo === 'ROCAS' && (
        <div className={styles.hazardContentGroup}>
          <svg className={styles.hazardFullSvg} viewBox="0 0 500 95" preserveAspectRatio="none" fill="none">
            <defs>
              <radialGradient id="rockGroundWideFront" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#000000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="rockFrontLit" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f5f5f4" />
                <stop offset="35%" stopColor="#d6d3d1" />
                <stop offset="75%" stopColor="#78716c" />
                <stop offset="100%" stopColor="#44403c" />
              </linearGradient>

              <linearGradient id="rockFrontDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#57534e" />
                <stop offset="60%" stopColor="#292524" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>

            {/* Sombras de suelo continuas y simétricas bajo cada bloque de rocas */}
            <ellipse cx="80" cy="80" rx="80" ry="12" fill="url(#rockGroundWideFront)" />
            <ellipse cx="250" cy="82" rx="110" ry="14" fill="url(#rockGroundWideFront)" />
            <ellipse cx="420" cy="80" rx="80" ry="12" fill="url(#rockGroundWideFront)" />

            {/* Fisuras transversales en el asfalto de frente */}
            <path
              d="M 10 80 Q 120 76 250 82 Q 380 76 490 80"
              stroke="#0a0f1d"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* --- BLOQUE 1: CARRILES IZQUIERDA (Vistas frontales) --- */}
            <g id="frontRocksLeft">
              {/* Roca menor izq */}
              <polygon points="20,80 35,46 65,42 85,80" fill="url(#rockFrontDark)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="35,46 65,42 60,62 38,64" fill="url(#rockFrontLit)" />
              {/* Roca grande izq */}
              <polygon points="65,80 85,28 135,22 165,58 150,80" fill="url(#rockFrontDark)" stroke="#090d16" strokeWidth="2" />
              <polygon points="85,28 135,22 140,50 95,54" fill="url(#rockFrontLit)" stroke="#1c1917" strokeWidth="1.2" />
              <line x1="85" y1="28" x2="110" y2="60" stroke="#1c1917" strokeWidth="2" />
            </g>

            {/* --- BLOQUE 2: CARRILES CENTRO (Gran Muralla de Boulders frontales) --- */}
            <g id="frontRocksCenter">
              {/* Boulder gigante central de frente */}
              <polygon points="185,82 215,22 285,16 325,52 305,82" fill="url(#rockFrontDark)" stroke="#090d16" strokeWidth="2.5" />
              <polygon points="215,22 285,16 295,44 240,50" fill="url(#rockFrontLit)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="240,50 295,44 325,52 280,82 215,82" fill="#78716c" opacity="0.9" />
              {/* Grieta frontal central */}
              <path d="M 285 16 L 270 46 L 285 64 L 275 82" stroke="#0c0a09" strokeWidth="2.6" strokeLinecap="round" />
              {/* Roca satélite centro-izq */}
              <polygon points="150,82 170,44 205,40 218,82" fill="url(#rockFrontDark)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="170,44 205,40 200,60 175,62" fill="url(#rockFrontLit)" />
            </g>

            {/* --- BLOQUE 3: CARRILES DERECHA (Simétrico frontal) --- */}
            <g id="frontRocksRight">
              {/* Roca grande der */}
              <polygon points="335,80 365,24 415,28 440,62 425,80" fill="url(#rockFrontDark)" stroke="#090d16" strokeWidth="2" />
              <polygon points="365,24 415,28 410,54 370,52" fill="url(#rockFrontLit)" stroke="#1c1917" strokeWidth="1.2" />
              <line x1="415" y1="28" x2="395" y2="60" stroke="#1c1917" strokeWidth="2" />
              {/* Roca menor der */}
              <polygon points="415,80 435,46 470,42 485,80" fill="url(#rockFrontDark)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="435,46 470,42 462,62 438,64" fill="url(#rockFrontLit)" />
            </g>

            {/* Franjas reflectantes de peligro colocadas en las rocas frontales */}
            <g stroke="#facc15" strokeWidth="3" strokeLinecap="round">
              <line x1="110" y1="62" x2="130" y2="68" />
              <line x1="250" y1="58" x2="275" y2="64" />
              <line x1="385" y1="62" x2="405" y2="68" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          2. GRAN FOSO / SOCAVÓN TRANSVERSAL DE FRENTE (Abismo que corta la pista)
          ========================================================================= */}
      {normTipo === 'HOYOS' && (
        <div className={styles.hazardContentGroup}>
          <svg className={styles.hazardFullSvg} viewBox="0 0 500 90" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="chasmFrontVoid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="60%" stopColor="#030712" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <linearGradient id="chasmFrontLip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5c2005" />
                <stop offset="50%" stopColor="#291002" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>
            </defs>

            {/* Sombra de suelo envolvente */}
            <ellipse cx="250" cy="56" rx="250" ry="24" fill="#090d16" opacity="0.85" />

            {/* Labio exterior del foso transversal simétrico de borde a borde */}
            <path
              d="M 5 50 Q 250 82 495 50 Q 250 24 5 50 Z"
              fill="url(#chasmFrontLip)"
              stroke="#78350f"
              strokeWidth="2.5"
            />

            {/* Vacío profundo negro del foso de frente */}
            <path
              d="M 15 52 Q 250 78 485 52 Q 250 30 15 52 Z"
              fill="url(#chasmFrontVoid)"
              stroke="#000000"
              strokeWidth="2"
            />

            {/* Dientes y fracturas de asfalto en el borde frontal */}
            <path
              d="M 15 52 L 40 56 L 65 52 L 95 58 L 130 53 L 175 62 L 220 54 L 250 64 L 285 55 L 325 62 L 370 54 L 405 58 L 440 52 L 485 52"
              stroke="#0c0a09"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />

            {/* 6 Conos de seguridad frontales alineados simétricamente a lo largo del foso */}
            {[45, 125, 205, 295, 375, 455].map((cx, i) => (
              <g key={i} transform={`translate(${cx}, ${48 + Math.sin(i * 0.6) * 6})`}>
                <polygon points="-8,16 0,-10 8,16" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
                <polygon points="-5,4 0,-10 5,4" fill="#ffffff" />
                <polygon points="-6,10 0,2 6,10" fill="#ffffff" />
                <ellipse cx="0" cy="16" rx="9" ry="2.5" fill="#c2410c" />
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* =========================================================================
          3. LLUVIA DE METEORITOS DE FRENTE (Cráteres de impacto y meteorito central)
          ========================================================================= */}
      {normTipo === 'METEORITOS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.meteorMultiSmokeLeft} />
          <div className={styles.meteorMultiSmokeCenter} />
          <div className={styles.meteorMultiSmokeRight} />

          <svg className={styles.hazardFullSvg} viewBox="0 0 500 95" preserveAspectRatio="none" fill="none">
            <defs>
              <radialGradient id="meteorGlowFront" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#7c2d12" stopOpacity="0.8" />
                <stop offset="85%" stopColor="#18181b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <linearGradient id="lavaVeinsFront" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="65%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Suelos calcinados simétricos (izq, centro, der) */}
            <ellipse cx="100" cy="74" rx="85" ry="16" fill="url(#meteorGlowFront)" />
            <ellipse cx="250" cy="76" rx="105" ry="18" fill="url(#meteorGlowFront)" />
            <ellipse cx="400" cy="74" rx="85" ry="16" fill="url(#meteorGlowFront)" />

            {/* Grietas de magma transversales */}
            <path
              d="M 15 74 Q 130 70 250 76 Q 370 70 485 74"
              stroke="url(#lavaVeinsFront)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Cráter Izquierdo */}
            <g id="meteorFrontLeft">
              <ellipse cx="100" cy="74" rx="55" ry="12" fill="#18181b" stroke="#000" strokeWidth="2" />
              <polygon points="75,74 95,44 125,48 135,74" fill="#27272a" stroke="#000" strokeWidth="1.5" />
              <path d="M 85,50 L 98,62 L 120,70" stroke="url(#lavaVeinsFront)" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Gran Meteorito Central de Frente con Fuego y Magma */}
            <g id="meteorFrontCenter">
              <ellipse cx="250" cy="76" rx="80" ry="16" fill="#09090b" stroke="#000" strokeWidth="2.5" />
              {/* Roca de meteorito central vista de frente */}
              <polygon points="205,76 225,24 275,18 305,52 285,76" fill="#18181b" stroke="#000" strokeWidth="2.4" />
              <polygon points="225,24 275,18 268,44 235,46" fill="#27272a" />
              {/* Venas de lava ardiente frontal */}
              <path d="M 235 30 L 250 48 L 244 66 L 270 74" stroke="url(#lavaVeinsFront)" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 250 48 L 278 44 L 292 64" stroke="url(#lavaVeinsFront)" strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="250" cy="48" r="3.5" fill="#ffffff" />
            </g>

            {/* Cráter Derecho */}
            <g id="meteorFrontRight">
              <ellipse cx="400" cy="74" rx="55" ry="12" fill="#18181b" stroke="#000" strokeWidth="2" />
              <polygon points="365,74 385,46 415,44 430,74" fill="#27272a" stroke="#000" strokeWidth="1.5" />
              <path d="M 380,50 L 396,62 L 420,70" stroke="url(#lavaVeinsFront)" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          4. CRESTA DE DUNA / RAMPA DE SALTO DE FRENTE (100% Simétrica y Frontal)
          ========================================================================= */}
      {(normTipo === 'DUNAS' || normTipo === 'GRIETAS') && (
        <div className={styles.hazardContentGroup}>
          <svg className={styles.hazardFullSvg} viewBox="0 0 500 88" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="duneFrontWave" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              <linearGradient id="duneFrontUnderShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Sombra de asfalto bajo la duna transversal */}
            <ellipse cx="250" cy="76" rx="245" ry="10" fill="url(#duneFrontUnderShadow)" />

            {/* Cresta de duna simétrica DE FRENTE de borde a borde (0 a 500) */}
            <path
              d="M 5 76 Q 250 22 495 76 L 490 82 Q 250 30 10 82 Z"
              fill="url(#duneFrontWave)"
              stroke="#78350f"
              strokeWidth="2.5"
            />

            {/* Estratos de arena y crestas onduladas frontales */}
            <path d="M 40 76 Q 250 36 460 76" stroke="#fef08a" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 80 76 Q 250 48 420 76" stroke="#fde047" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 130 76 Q 250 58 370 76" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />

            {/* Flechas / Chevrons frontales de salto en cada carril (▲ ▲ ▲ ▲ ▲ ▲) */}
            {[45, 125, 205, 295, 375, 455].map((cx, i) => (
              <g key={i} transform={`translate(${cx}, ${52 + Math.cos((i - 2.5) * 0.7) * 8})`}>
                <polygon points="0,-10 -7,4 0,0 7,4" fill="#ffffff" filter="drop-shadow(0 0 6px #facc15)" />
                <polygon points="0,-2 -6,9 0,6 6,9" fill="#facc15" />
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
