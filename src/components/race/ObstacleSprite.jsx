import React from 'react';
import styles from './ObstacleSprite.module.css';

/**
 * ObstacleSprite:
 * Renderizado de alta definición de obstáculos en el circuito del desierto.
 * Incluye texturas realistas, sombras de contacto en asfalto/arena,
 * iluminación direccional y elementos de señalización de pista.
 */
export default function ObstacleSprite({ tipo = 'ROCAS', nombre = 'Obstáculo' }) {
  const normTipo = (tipo || 'ROCAS').toUpperCase();

  return (
    <div className={`${styles.obstacleContainer} ${styles['type_' + normTipo] || styles.type_ROCAS}`}>
      {/* =========================================================================
          1. ROCAS GIGANTES / AVALANCHA DE PIEDRAS
          ========================================================================= */}
      {normTipo === 'ROCAS' && (
        <div className={styles.rockGroup} title={nombre}>
          <svg className={styles.obstacleSvg} viewBox="0 0 100 68" fill="none">
            <defs>
              {/* Sombra de contacto difuminada sobre el asfalto */}
              <radialGradient id="rockGroundShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#000000" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Degradado para facetas iluminadas por el sol del desierto */}
              <linearGradient id="rockSunLit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5f5f4" />
                <stop offset="35%" stopColor="#d6d3d1" />
                <stop offset="70%" stopColor="#a8a29e" />
                <stop offset="100%" stopColor="#78716c" />
              </linearGradient>

              {/* Degradado para caras en sombra y grietas */}
              <linearGradient id="rockShadowFace" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#57534e" />
                <stop offset="60%" stopColor="#292524" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>

              {/* Roca lateral secundaria */}
              <linearGradient id="rockSideGrad" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#a8a29e" />
                <stop offset="50%" stopColor="#57534e" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>

            {/* Sombra de suelo realista */}
            <ellipse cx="50" cy="58" rx="46" ry="9" fill="url(#rockGroundShadow)" />

            {/* --- Roca Secundaria Izquierda --- */}
            <polygon points="12,56 8,42 22,28 36,36 32,56" fill="url(#rockSideGrad)" stroke="#1c1917" strokeWidth="1.2" />
            <polygon points="12,56 22,28 32,56" fill="#78716c" opacity="0.6" />

            {/* --- Roca Secundaria Derecha --- */}
            <polygon points="66,58 72,34 92,40 94,56 78,58" fill="url(#rockSideGrad)" stroke="#1c1917" strokeWidth="1.2" />
            <polygon points="72,34 92,40 82,58 66,58" fill="#57534e" opacity="0.75" />

            {/* --- Monolito Central Principal (Alta Definición) --- */}
            {/* Cara en sombra profunda derecha */}
            <polygon points="46,12 80,24 74,58 48,58" fill="url(#rockShadowFace)" stroke="#0c0a09" strokeWidth="1.5" />
            {/* Faceta superior iluminada por el sol */}
            <polygon points="26,22 46,12 60,26 36,32" fill="url(#rockSunLit)" stroke="#1c1917" strokeWidth="1.2" />
            {/* Faceta frontal con textura de roca y fractura */}
            <polygon points="26,22 36,32 48,58 20,58" fill="#78716c" stroke="#1c1917" strokeWidth="1.5" />
            {/* Arista brillante de corte */}
            <polygon points="36,32 60,26 48,58" fill="#a8a29e" stroke="#1c1917" strokeWidth="1.2" />

            {/* Fisuras y grietas geológicas en la roca principal */}
            <path d="M 46 12 L 42 26 L 48 38 L 44 56" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 42 26 L 33 34" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 48 38 L 58 44" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M 28 24 L 32 30" stroke="#f5f5f4" strokeWidth="1" strokeLinecap="round" opacity="0.8" />

            {/* Pedruscos y gravilla desparramada en la base */}
            <polygon points="18,58 22,54 26,58" fill="#a8a29e" stroke="#1c1917" strokeWidth="0.8" />
            <polygon points="46,59 50,55 54,59" fill="#78716c" stroke="#1c1917" strokeWidth="0.8" />
            <polygon points="68,60 74,55 77,60" fill="#a8a29e" stroke="#1c1917" strokeWidth="0.8" />
          </svg>
          <span className={styles.hazardLabel}>⚠ ROCAS</span>
        </div>
      )}

      {/* =========================================================================
          2. CRÁTER DE ARENA / HOYO EN EL ASFALTO
          ========================================================================= */}
      {normTipo === 'HOYOS' && (
        <div className={styles.holeGroup} title={nombre}>
          <svg className={styles.obstacleSvg} viewBox="0 0 110 65" fill="none">
            <defs>
              {/* Asfalto agrietado perimetral */}
              <radialGradient id="holeAsphaltCrater" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#090d16" />
                <stop offset="65%" stopColor="#1e293b" />
                <stop offset="90%" stopColor="#451a03" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              {/* Profundidad abismal del socavón */}
              <radialGradient id="holeAbyss" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="45%" stopColor="#030712" />
                <stop offset="85%" stopColor="#18181b" />
                <stop offset="100%" stopColor="#3f1a04" />
              </radialGradient>
            </defs>

            {/* Borde exterior de asfalto quebrado y tierra desplazada */}
            <ellipse cx="55" cy="36" rx="52" ry="24" fill="url(#holeAsphaltCrater)" />

            {/* Líneas de fractura radial en el pavimento */}
            <g stroke="#090d16" strokeWidth="1.6" strokeLinecap="round">
              <line x1="8" y1="36" x2="22" y2="36" />
              <line x1="16" y1="24" x2="28" y2="28" />
              <line x1="24" y1="16" x2="35" y2="22" />
              <line x1="86" y1="20" x2="74" y2="26" />
              <line x1="102" y1="36" x2="88" y2="36" />
              <line x1="94" y1="48" x2="82" y2="44" />
              <line x1="16" y1="48" x2="28" y2="44" />
            </g>

            {/* Paredes interiores del socavón con derrumbe de tierra */}
            <ellipse cx="55" cy="36" rx="42" ry="19" fill="#451a03" stroke="#78350f" strokeWidth="1.5" />
            <ellipse cx="55" cy="37" rx="36" ry="15" fill="#1c1917" />

            {/* Abismo profundo central en negro puro */}
            <ellipse cx="55" cy="38" rx="28" ry="11" fill="url(#holeAbyss)" stroke="#090d16" strokeWidth="1" />

            {/* Remolino de polvo que sube del foso */}
            <ellipse cx="55" cy="38" rx="16" ry="5" fill="#f59e0b" opacity="0.18" />

            {/* Conos de señalización de peligro 3D en los bordes del socavón */}
            {/* Cono Izquierdo */}
            <g id="coneLeft">
              <ellipse cx="18" cy="38" rx="5" ry="2" fill="rgba(0,0,0,0.6)" />
              <polygon points="14,37 18,22 22,37" fill="#f97316" stroke="#9a3412" strokeWidth="0.8" />
              <polygon points="15.2,32 18,22 20.8,32" fill="#ffffff" />
              <polygon points="16,28 18,22 20,28" fill="#f97316" />
            </g>

            {/* Cono Derecho */}
            <g id="coneRight">
              <ellipse cx="92" cy="38" rx="5" ry="2" fill="rgba(0,0,0,0.6)" />
              <polygon points="88,37 92,22 96,37" fill="#f97316" stroke="#9a3412" strokeWidth="0.8" />
              <polygon points="89.2,32 92,22 94.8,32" fill="#ffffff" />
              <polygon points="90,28 92,22 94,28" fill="#f97316" />
            </g>
          </svg>
          <span className={styles.hazardLabel}>⚠ HOYO PROFUNDO</span>
        </div>
      )}

      {/* =========================================================================
          3. IMPACTO DE METEORITO CON MAGMA INCANDESCENTE
          ========================================================================= */}
      {normTipo === 'METEORITOS' && (
        <div className={styles.meteorGroup} title={nombre}>
          {/* Capas de humo y partículas de fuego incandescentes */}
          <div className={styles.meteorSmokePlume} />
          <div className={styles.meteorSmokePlume2} />
          <div className={styles.meteorFlames} />
          <div className={styles.meteorSparks} />

          <svg className={styles.obstacleSvg} viewBox="0 0 100 74" fill="none">
            <defs>
              {/* Radiación térmica del asfalto quemado */}
              <radialGradient id="meteorScorchGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                <stop offset="35%" stopColor="#7c2d12" stopOpacity="0.75" />
                <stop offset="70%" stopColor="#18181b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              {/* Roca espacial extraterrestre de basalto oscuro */}
              <linearGradient id="meteorRockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="40%" stopColor="#18181b" />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>

              {/* Flujo de magma incandescente */}
              <linearGradient id="lavaFlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>

              {/* Filtro de resplandor térmico de lava */}
              <filter id="lavaGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Suelo calcinado y cráter con calor radiante */}
            <ellipse cx="50" cy="54" rx="46" ry="15" fill="url(#meteorScorchGrad)" />
            <ellipse cx="50" cy="53" rx="34" ry="10" fill="#18181b" stroke="#ef4444" strokeWidth="1.2" />

            {/* Grietas térmicas en el asfalto que emiten luz */}
            <g stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
              <line x1="22" y1="52" x2="12" y2="56" />
              <line x1="78" y1="52" x2="88" y2="56" />
              <line x1="48" y1="62" x2="52" y2="68" />
              <line x1="32" y1="58" x2="26" y2="64" />
              <line x1="68" y1="58" x2="74" y2="64" />
            </g>

            {/* Asteroide extraterrestre sólido incrustado */}
            <polygon
              points="24,52 36,22 62,18 78,44 68,58 32,58"
              fill="url(#meteorRockGrad)"
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Caras secundarias del meteorito */}
            <polygon points="36,22 62,18 56,38 34,40" fill="#27272a" />
            <polygon points="62,18 78,44 58,46 56,38" fill="#1c1917" />
            <polygon points="34,40 58,46 68,58 32,58" fill="#09090b" />

            {/* Venas de magma hirviendo en la corteza del meteorito */}
            <g filter="url(#lavaGlow)">
              <path
                d="M 38 26 L 46 36 L 42 48 L 50 56"
                stroke="url(#lavaFlow)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 46 36 L 58 32 L 66 44 L 62 54"
                stroke="url(#lavaFlow)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="46" cy="36" r="2.5" fill="#ffffff" />
              <circle cx="58" cy="32" r="2" fill="#ffffff" />
            </g>

            {/* Esquirlas incandescentes despedidas */}
            <polygon points="20,44 24,40 22,46" fill="#f97316" />
            <polygon points="80,38 84,35 83,42" fill="#f97316" />
          </svg>
          <span className={styles.hazardLabelMeteor}>☄ METEORITO INCANDESCENTE</span>
        </div>
      )}

      {/* =========================================================================
          4. CRESTA DE DUNA / FISURAS SÍSMICAS (SALTO EXTREMO)
          ========================================================================= */}
      {(normTipo === 'DUNAS' || normTipo === 'GRIETAS') && (
        <div className={styles.duneGroup} title={nombre}>
          <svg className={styles.obstacleSvg} viewBox="0 0 100 64" fill="none">
            <defs>
              <linearGradient id="duneSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              <linearGradient id="rampChevrons" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Sombra de la rampa sobre la pista */}
            <ellipse cx="50" cy="55" rx="46" ry="7" fill="rgba(0,0,0,0.6)" />

            {/* Estructura de la Duna / Rampa de Tierra */}
            <path
              d="M 6 54 L 88 20 L 88 54 Z"
              fill="url(#duneSandGrad)"
              stroke="#451a03"
              strokeWidth="1.5"
            />
            {/* Cara frontal del desnivel */}
            <polygon points="88,20 94,26 94,54 88,54" fill="#451a03" />

            {/* Estratos de arena modelada por el viento */}
            <path d="M 22 54 L 88 28" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M 40 54 L 88 36" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 58 54 L 88 44" stroke="#fde047" strokeWidth="1.2" strokeLinecap="round" />

            {/* Franjas reflectantes de alerta de salto (Chevrons de carrera) */}
            <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
              <line x1="30" y1="46" x2="30" y2="52" />
              <line x1="50" y1="38" x2="50" y2="48" />
              <line x1="70" y1="30" x2="70" y2="44" />
            </g>

            {/* Indicador de flecha de despegue / salto */}
            <polygon points="84,14 90,20 86,20 86,26 82,26 82,20 78,20" fill="#38bdf8" stroke="#0369a1" strokeWidth="0.8" />
          </svg>
          <span className={styles.hazardLabelDune}>▲ CRESTA DE SALTO</span>
        </div>
      )}
    </div>
  );
}
