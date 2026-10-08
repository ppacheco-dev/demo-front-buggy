import React from 'react';
import styles from './ArcadeRoadHazardZone.module.css';

/**
 * ArcadeRoadHazardZone:
 * Obstáculo transversal de calzada completa que cubre el 100% del ancho de la pista
 * para que todos los carriles se enfrenten al obstáculo simultáneamente.
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
          1. ROCAS GIGANTES / AVALANCHA A LO ANCHO DE TODA LA PISTA (0% a 100%)
          ========================================================================= */}
      {normTipo === 'ROCAS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTag}>
            <span className={styles.hazardBlinkIcon}>⚠️</span>
            <span className={styles.hazardBannerText}>AVALANCHA DE ROCAS EN PISTA</span>
          </div>

          <svg className={styles.hazardFullSvg} viewBox="0 0 500 90" preserveAspectRatio="none" fill="none">
            <defs>
              <radialGradient id="rockGroundWide" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#000000" stopOpacity="0.35" />
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

            {/* Sombras de suelo continuas de borde a borde */}
            <ellipse cx="80" cy="74" rx="80" ry="14" fill="url(#rockGroundWide)" />
            <ellipse cx="250" cy="76" rx="100" ry="14" fill="url(#rockGroundWide)" />
            <ellipse cx="420" cy="74" rx="80" ry="14" fill="url(#rockGroundWide)" />

            {/* Fracturas geológicas en el asfalto cruzando de borde a borde */}
            <path
              d="M 0 74 L 60 72 L 130 76 L 210 73 L 310 76 L 410 72 L 500 75"
              stroke="#090d16"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* --- BLOQUE 1: BORDE IZQUIERDO Y CARRILES 1-2 --- */}
            <g id="rockClusterLeft">
              <polygon points="0,74 20,38 55,32 75,74" fill="url(#rockFacetDark)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="20,38 55,32 50,54 25,56" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.2" />
              <polygon points="50,74 75,28 115,22 145,54 135,74" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="1.8" />
              <polygon points="75,28 115,22 120,44 85,48" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.2" />
              <polygon points="85,48 120,44 145,54 110,74 65,74" fill="#78716c" opacity="0.85" />
              <line x1="75" y1="28" x2="95" y2="58" stroke="#1c1917" strokeWidth="1.8" />
            </g>

            {/* --- BLOQUE 2: CARRILES CENTRALES 3-4 --- */}
            <g id="rockClusterCenter">
              <polygon points="175,76 210,24 265,16 305,48 290,76" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="2.2" />
              <polygon points="210,24 265,16 275,38 230,46" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="230,46 275,38 305,48 265,76 200,76" fill="#78716c" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="265,16 320,26 335,76 290,76" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="1.8" />
              {/* Fisura profunda central */}
              <path d="M 265 16 L 255 44 L 270 60 L 260 76" stroke="#0c0a09" strokeWidth="2.4" strokeLinecap="round" />
            </g>

            {/* --- BLOQUE 3: CARRILES 5-6 Y BORDE DERECHO --- */}
            <g id="rockClusterRight">
              <polygon points="350,74 370,32 420,24 445,52 430,74" fill="url(#rockFacetDark)" stroke="#1c1917" strokeWidth="1.5" />
              <polygon points="370,32 420,24 425,44 395,50" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.2" />
              <polygon points="420,24 460,34 500,48 500,74 430,74" fill="url(#rockFacetDark)" stroke="#090d16" strokeWidth="1.8" />
              <polygon points="420,24 460,34 455,58 425,44" fill="url(#rockFacetSun)" stroke="#1c1917" strokeWidth="1.2" />
              <line x1="420" y1="24" x2="415" y2="58" stroke="#1c1917" strokeWidth="1.8" />
            </g>

            {/* Gravilla y piedras menores en la calzada */}
            <polygon points="155,75 163,67 170,75" fill="#a8a29e" stroke="#1c1917" strokeWidth="0.8" />
            <polygon points="338,76 345,69 352,76" fill="#78716c" stroke="#1c1917" strokeWidth="0.8" />
          </svg>
        </div>
      )}

      {/* =========================================================================
          2. GRAN FOSO / SOCAVÓN TRANSVERSAL DE BORDE A BORDE
          ========================================================================= */}
      {normTipo === 'HOYOS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTagHole}>
            <span className={styles.hazardBlinkIcon}>⚠️</span>
            <span className={styles.hazardBannerText}>GRAN FOSO TRANSVERSAL EN PISTA</span>
          </div>

          <svg className={styles.hazardFullSvg} viewBox="0 0 500 85" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="chasmVoidWide" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="65%" stopColor="#030712" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <linearGradient id="chasmEarthWide" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="60%" stopColor="#291002" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>
            </defs>

            {/* Sombra de asfalto quebrado continuo */}
            <ellipse cx="250" cy="48" rx="250" ry="26" fill="#090d16" opacity="0.8" />

            {/* Labio exterior de tierra y asfalto roto continuo de 0 a 500 */}
            <path
              d="M 0 44 Q 250 72 500 44 Q 250 20 0 44 Z"
              fill="url(#chasmEarthWide)"
              stroke="#78350f"
              strokeWidth="2.5"
            />

            {/* Abismo profundo en negro absoluto */}
            <path
              d="M 10 45 Q 250 68 490 45 Q 250 26 10 45 Z"
              fill="url(#chasmVoidWide)"
              stroke="#000000"
              strokeWidth="1.8"
            />

            {/* Fracturas radiales en el asfalto */}
            <g stroke="#090d16" strokeWidth="2.2" strokeLinecap="round">
              <line x1="50" y1="52" x2="35" y2="68" />
              <line x1="150" y1="58" x2="140" y2="74" />
              <line x1="250" y1="64" x2="250" y2="82" />
              <line x1="350" y1="58" x2="360" y2="74" />
              <line x1="450" y1="52" x2="465" y2="68" />
            </g>

            {/* 5 Conos de Señalización de Seguridad Reflectantes 3D a lo largo del foso */}
            {/* Cono 1 (Extremo Izquierdo) */}
            <g id="cone1">
              <polygon points="35,46 43,22 51,46" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="38,36 43,22 48,36" fill="#ffffff" />
            </g>
            {/* Cono 2 (Carriles Izq-Medio) */}
            <g id="cone2">
              <polygon points="135,56 143,32 151,56" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="138,46 143,32 148,46" fill="#ffffff" />
            </g>
            {/* Cono 3 (Centro) */}
            <g id="cone3">
              <polygon points="242,62 250,38 258,62" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="245,52 250,38 255,52" fill="#ffffff" />
            </g>
            {/* Cono 4 (Carriles Medio-Der) */}
            <g id="cone4">
              <polygon points="345,56 353,32 361,56" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="348,46 353,32 358,46" fill="#ffffff" />
            </g>
            {/* Cono 5 (Extremo Derecho) */}
            <g id="cone5">
              <polygon points="445,46 453,22 461,46" fill="#f97316" stroke="#7c2d12" strokeWidth="1" />
              <polygon points="448,36 453,22 458,36" fill="#ffffff" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          3. LLUVIA DE METEORITOS EN PISTA COMPLETA (0% a 100%)
          ========================================================================= */}
      {normTipo === 'METEORITOS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTagMeteor}>
            <span className={styles.hazardBlinkIcon}>☄️</span>
            <span className={styles.hazardBannerText}>ZONA DE IMPACTO DE METEORITOS</span>
          </div>

          <div className={styles.meteorMultiSmokeLeft} />
          <div className={styles.meteorMultiSmokeCenter} />
          <div className={styles.meteorMultiSmokeRight} />

          <svg className={styles.hazardFullSvg} viewBox="0 0 500 95" preserveAspectRatio="none" fill="none">
            <defs>
              <radialGradient id="meteorScorchWide" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="45%" stopColor="#7c2d12" stopOpacity="0.85" />
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

            {/* Suelo calcinado radiante bajo cada cráter continuo */}
            <ellipse cx="90" cy="72" rx="90" ry="18" fill="url(#meteorScorchWide)" />
            <ellipse cx="250" cy="74" rx="100" ry="20" fill="url(#meteorScorchWide)" />
            <ellipse cx="410" cy="72" rx="90" ry="18" fill="url(#meteorScorchWide)" />

            {/* Grietas de magma que conectan los cráteres de lado a lado */}
            <path
              d="M 10 70 L 80 72 L 160 70 L 250 73 L 340 70 L 420 72 L 490 70"
              stroke="url(#lavaVeins)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Cráter Izquierdo */}
            <g id="meteorLeft">
              <polygon points="50,72 70,34 110,28 135,58 115,74 65,74" fill="#18181b" stroke="#000" strokeWidth="2" />
              <polygon points="70,34 110,28 102,48 78,52" fill="#27272a" />
              <path d="M 75 38 L 88 54 L 108 64" stroke="url(#lavaVeins)" strokeWidth="2.8" strokeLinecap="round" />
            </g>

            {/* Cráter Central Gigante */}
            <g id="meteorCenter">
              <polygon points="195,74 220,22 275,16 310,54 290,76 215,76" fill="#09090b" stroke="#000" strokeWidth="2.4" />
              <polygon points="220,22 275,16 265,44 230,48" fill="#27272a" />
              <path d="M 230 30 L 242 48 L 236 66 L 260 74" stroke="url(#lavaVeins)" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M 242 48 L 275 42 L 290 62" stroke="url(#lavaVeins)" strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="242" cy="48" r="3" fill="#ffffff" />
            </g>

            {/* Cráter Derecho */}
            <g id="meteorRight">
              <polygon points="365,72 385,36 425,30 450,58 430,74 380,74" fill="#18181b" stroke="#000" strokeWidth="2" />
              <polygon points="385,36 425,30 415,48 392,52" fill="#27272a" />
              <path d="M 392 40 L 406 54 L 424 66" stroke="url(#lavaVeins)" strokeWidth="2.8" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          4. CRESTA DE DUNA / RAMPA CONTINUA (0% a 100%)
          ========================================================================= */}
      {(normTipo === 'DUNAS' || normTipo === 'GRIETAS') && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.hazardBannerTagDune}>
            <span className={styles.hazardBlinkIcon}>▲</span>
            <span className={styles.hazardBannerText}>CRESTA DE SALTO OBLIGATORIO</span>
          </div>

          <svg className={styles.hazardFullSvg} viewBox="0 0 500 80" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="duneWaveWide" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* Sombra continua bajo la rampa */}
            <ellipse cx="250" cy="70" rx="250" ry="9" fill="rgba(0,0,0,0.65)" />

            {/* Cresta de duna de borde a borde (0 a 500) */}
            <path
              d="M 0 70 L 500 24 L 500 70 Z"
              fill="url(#duneWaveWide)"
              stroke="#451a03"
              strokeWidth="2.5"
            />

            {/* Estratos de arena y crestas de salto */}
            <line x1="80" y1="70" x2="500" y2="35" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="180" y1="70" x2="500" y2="46" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
            <line x1="300" y1="70" x2="500" y2="58" stroke="#fde047" strokeWidth="1.8" strokeLinecap="round" />

            {/* Franjas reflectantes de salto continuo a lo ancho de toda la pista */}
            <g stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round">
              <line x1="50" y1="62" x2="50" y2="69" />
              <line x1="125" y1="56" x2="125" y2="64" />
              <line x1="200" y1="48" x2="200" y2="58" />
              <line x1="275" y1="42" x2="275" y2="52" />
              <line x1="350" y1="36" x2="350" y2="48" />
              <line x1="425" y1="30" x2="425" y2="44" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
