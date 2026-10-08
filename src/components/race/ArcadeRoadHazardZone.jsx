import React from 'react';
import styles from './ArcadeRoadHazardZone.module.css';

/**
 * ArcadeRoadHazardZone:
 * Obstáculo transversal que abarca la pista completa (todos los carriles)
 * para que todos los buggies se enfrenten al obstáculo al mismo tiempo en el sector.
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
          1. ROCAS GIGANTES / AVALANCHA A LO ANCHO DE LA PISTA (TODOS LOS CARRILES)
          ========================================================================= */}
      {normTipo === 'ROCAS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTag}>
            <span className={styles.hazardBlinkIcon}>⚠️</span>
            <span className={styles.hazardBannerText}>AVALANCHA DE ROCAS EN PISTA</span>
          </div>

          <svg className={styles.hazardFullSvg} viewBox="0 0 400 90" fill="none">
            <defs>
              <radialGradient id="rockGroundWide" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#000000" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="rockFacetSun" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5f5f4" />
                <stop offset="40%" stopColor="#d6d3d1" />
                <stop offset="80%" stopColor="#78716c" />
                <stop offset="100%" stopColor="#44403c" />
              </linearGradient>

              <linearGradient id="rockFacetDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#57534e" />
                <stop offset="70%" stopColor="#292524" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>

            {/* Sombras de suelo continuas a lo ancho de la carretera */}
            <ellipse cx="75" cy="74" rx="65" ry="12" fill="url(#rockGroundWide)" />
            <ellipse cx="200" cy="76" rx="85" ry="14" fill="url(#rockGroundWide)" />
            <ellipse cx="325" cy="74" rx="65" ry="12" fill="url(#rockGroundWide)" />

            {/* Fracturas en el pavimento conectando todo el ancho */}
            <path
              d="M 30 74 L 80 72 L 130 76 L 190 73 L 260 76 L 310 72 L 370 75"
              stroke="#090d16"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* --- BLOQUE 1: CARRILES IZQUIERDOS (1 y 2) --- */}
            <g id="rockClusterLeft">
              <polygon points="25,74 45,35 75,42 85,74" fill="url(#rockFacetDark)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="45,35 65,22 85,42 75,42" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.2" />
              <polygon points="65,22 105,32 120,74 85,74" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="1.5" />
              <polygon points="65,22 85,42 120,74 105,32" fill="#78716c" opacity="0.85" />
              {/* Grietas */}
              <line x1="65" y1="22" x2="78" y2="52" stroke="#1c1917" strokeWidth="1.6" />
              <line x1="78" y1="52" x2="95" y2="60" stroke="#1c1917" strokeWidth="1.2" />
            </g>

            {/* --- BLOQUE 2: CARRILES CENTRALES (3 y 4) --- */}
            <g id="rockClusterCenter">
              <polygon points="140,76 165,26 210,18 245,45 235,76" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="2" />
              <polygon points="165,26 210,18 220,38 185,46" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="185,46 220,38 245,45 210,76 160,76" fill="#78716c" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="210,18 255,28 265,76 235,76" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="1.5" />
              {/* Fisura profunda central */}
              <path d="M 210 18 L 202 42 L 215 58 L 208 76" stroke="#0c0a09" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* --- BLOQUE 3: CARRILES DERECHOS (5 y 6) --- */}
            <g id="rockClusterRight">
              <polygon points="280,74 295,38 335,28 355,50 345,74" fill="url(#rockFacetDark)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="295,38 335,28 340,46 315,52" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.2" />
              <polygon points="335,28 365,36 380,74 345,74" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="1.5" />
              {/* Grieta */}
              <line x1="335" y1="28" x2="330" y2="55" stroke="#1c1917" strokeWidth="1.6" />
            </g>

            {/* Piedras menores y gravilla desparramada por toda la pista */}
            <polygon points="125,75 132,68 138,75" fill="#a8a29e" stroke="#1c1917" strokeWidth="0.8" />
            <polygon points="268,76 274,70 280,76" fill="#78716c" stroke="#1c1917" strokeWidth="0.8" />
            <polygon points="382,75 388,71 392,75" fill="#a8a29e" stroke="#1c1917" strokeWidth="0.8" />
          </svg>
        </div>
      )}

      {/* =========================================================================
          2. GRAN FOSO / CRÁTER TRANSVERSAL (TODOS LOS CARRILES)
          ========================================================================= */}
      {normTipo === 'HOYOS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTagHole}>
            <span className={styles.hazardBlinkIcon}>⚠️</span>
            <span className={styles.hazardBannerText}>GRAN FOSO TRANSVERSAL EN PISTA</span>
          </div>

          <svg className={styles.hazardFullSvg} viewBox="0 0 400 80" fill="none">
            <defs>
              <linearGradient id="chasmVoid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="60%" stopColor="#030712" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <linearGradient id="chasmEarth" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="60%" stopColor="#291002" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>
            </defs>

            {/* Sombra y fracturas exteriores del socavón */}
            <ellipse cx="200" cy="46" rx="190" ry="24" fill="#090d16" opacity="0.7" />

            {/* Borde exterior de tierra y asfalto roto continuo */}
            <path
              d="M 15 42 Q 200 68 385 42 Q 200 24 15 42 Z"
              fill="url(#chasmEarth)"
              stroke="#78350f"
              strokeWidth="2"
            />

            {/* Abismo profundo en negro absoluto */}
            <path
              d="M 30 43 Q 200 64 370 43 Q 200 30 30 43 Z"
              fill="url(#chasmVoid)"
              stroke="#000000"
              strokeWidth="1.5"
            />

            {/* Fracturas radiales en el asfalto */}
            <g stroke="#090d16" strokeWidth="2" strokeLinecap="round">
              <line x1="25" y1="42" x2="5" y2="44" />
              <line x1="100" y1="56" x2="92" y2="68" />
              <line x1="200" y1="62" x2="200" y2="76" />
              <line x1="300" y1="56" x2="308" y2="68" />
              <line x1="375" y1="42" x2="395" y2="44" />
            </g>

            {/* 4 Conos de Señalización de Seguridad Reflectantes 3D a lo largo del foso */}
            {/* Cono 1 (Carril Izquierdo) */}
            <g id="coneLane1">
              <polygon points="45,45 52,24 59,45" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="48,37 52,24 56,37" fill="#ffffff" />
            </g>
            {/* Cono 2 (Carril Central-Izq) */}
            <g id="coneLane2">
              <polygon points="145,55 152,34 159,55" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="148,47 152,34 156,47" fill="#ffffff" />
            </g>
            {/* Cono 3 (Carril Central-Der) */}
            <g id="coneLane3">
              <polygon points="245,55 252,34 259,55" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="248,47 252,34 256,47" fill="#ffffff" />
            </g>
            {/* Cono 4 (Carril Derecho) */}
            <g id="coneLane4">
              <polygon points="345,45 352,24 359,45" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="348,37 352,24 356,37" fill="#ffffff" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          3. LLUVIA DE METEORITOS EN PISTA (TODOS LOS CARRILES)
          ========================================================================= */}
      {normTipo === 'METEORITOS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTagMeteor}>
            <span className={styles.hazardBlinkIcon}>☄️</span>
            <span className={styles.hazardBannerText}>ZONA DE IMPACTO DE METEORITOS</span>
          </div>

          {/* Partículas de fuego y columnas de humo volcánico */}
          <div className={styles.meteorMultiSmokeLeft} />
          <div className={styles.meteorMultiSmokeCenter} />
          <div className={styles.meteorMultiSmokeRight} />

          <svg className={styles.hazardFullSvg} viewBox="0 0 400 95" fill="none">
            <defs>
              <radialGradient id="meteorScorchWide" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#7c2d12" stopOpacity="0.8" />
                <stop offset="85%" stopColor="#18181b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <linearGradient id="lavaVeins" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Suelo calcinado radiante bajo cada cráter */}
            <ellipse cx="80" cy="70" rx="65" ry="16" fill="url(#meteorScorchWide)" />
            <ellipse cx="205" cy="72" rx="80" ry="18" fill="url(#meteorScorchWide)" />
            <ellipse cx="330" cy="70" rx="65" ry="16" fill="url(#meteorScorchWide)" />

            {/* Grietas de magma que conectan los 3 cráteres */}
            <path
              d="M 60 70 L 120 72 L 180 71 L 240 73 L 300 70 L 350 72"
              stroke="url(#lavaVeins)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* --- METEORITO 1: IZQUIERDA --- */}
            <g id="meteorLeft">
              <polygon points="50,72 65,36 95,30 115,58 98,74 58,74" fill="#18181b" stroke="#000" strokeWidth="1.8" />
              <polygon points="65,36 95,30 90,48 70,52" fill="#27272a" />
              <path d="M 68 40 L 78 54 L 92 64" stroke="url(#lavaVeins)" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* --- METEORITO 2: CENTRO GIGANTE --- */}
            <g id="meteorCenter">
              <polygon points="160,74 180,24 225,18 250,54 235,76 175,76" fill="#09090b" stroke="#000" strokeWidth="2.2" />
              <polygon points="180,24 225,18 215,44 185,48" fill="#27272a" />
              <path d="M 185 30 L 195 48 L 190 66 L 210 74" stroke="url(#lavaVeins)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 195 48 L 225 42 L 235 62" stroke="url(#lavaVeins)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="195" cy="48" r="2.5" fill="#ffffff" />
            </g>

            {/* --- METEORITO 3: DERECHA --- */}
            <g id="meteorRight">
              <polygon points="295,72 312,38 348,32 365,60 348,74 305,74" fill="#18181b" stroke="#000" strokeWidth="1.8" />
              <polygon points="312,38 348,32 340,48 320,52" fill="#27272a" />
              <path d="M 318 42 L 332 54 L 345 66" stroke="url(#lavaVeins)" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          4. CRESTA DE DUNA / RAMPA CONTINUA (TODOS LOS CARRILES)
          ========================================================================= */}
      {(normTipo === 'DUNAS' || normTipo === 'GRIETAS') && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTagDune}>
            <span className={styles.hazardBlinkIcon}>▲</span>
            <span className={styles.hazardBannerText}>CRESTA DE SALTO OBLIGATORIO</span>
          </div>

          <svg className={styles.hazardFullSvg} viewBox="0 0 400 75" fill="none">
            <defs>
              <linearGradient id="duneWaveWide" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* Sombra de la rampa sobre la pista */}
            <ellipse cx="200" cy="65" rx="190" ry="8" fill="rgba(0,0,0,0.6)" />

            {/* Cresta de Duna continua de borde a borde */}
            <path
              d="M 10 65 L 390 26 L 390 65 Z"
              fill="url(#duneWaveWide)"
              stroke="#451a03"
              strokeWidth="2"
            />

            {/* Estratos de arena y crestas eólicas */}
            <line x1="60" y1="65" x2="390" y2="35" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="140" y1="65" x2="390" y2="45" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="230" y1="65" x2="390" y2="55" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />

            {/* Franjas reflectantes de despegue (Chevrons a lo largo de toda la pista) */}
            <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
              <line x1="70" y1="58" x2="70" y2="64" />
              <line x1="130" y1="52" x2="130" y2="60" />
              <line x1="190" y1="46" x2="190" y2="56" />
              <line x1="250" y1="40" x2="250" y2="52" />
              <line x1="310" y1="34" x2="310" y2="48" />
              <line x1="370" y1="28" x2="370" y2="44" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
