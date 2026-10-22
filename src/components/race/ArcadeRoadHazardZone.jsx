import React from 'react';
import styles from './ArcadeRoadHazardZone.module.css';

/**
 * ArcadeRoadHazardZone:
 * Obstáculo transversal de calzada completa con profundidad 3D real, facetas iluminadas
 * por el sol del desierto, sombras proyectadas sobre el asfalto, espesor de corte de carretera
 * y cráteres incandescentes con magma vivo y humo volumétrico.
 */
export default function ArcadeRoadHazardZone({
  tipo = 'ROCAS',
  nombre = 'Campo de Rocas',
  icono = '🪨',
  isImpactingNow = false,
}) {
  const normTipo = (tipo || 'ROCAS').toUpperCase();

  return (
    <div className={styles.hazardZoneContainer}>
      {/* =========================================================================
          1. ROCAS GIGANTES / AVALANCHA (Modelado 3D Facetado con Luz y Sombra Real)
          ========================================================================= */}
      {normTipo === 'ROCAS' && (
        <div className={styles.hazardContentGroup}>
          <div className={styles.rockDustHaze} />

          <svg className={styles.hazardFullSvg} viewBox="0 0 520 110" preserveAspectRatio="none" fill="none">
            <defs>
              {/* Sombra de oclusión en el suelo */}
              <radialGradient id="rockGroundOcclusion" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#050813" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#050813" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#050813" stopOpacity="0" />
              </radialGradient>

              {/* Facetas iluminadas (Sol del desierto desde arriba-izquierda) */}
              <linearGradient id="facetHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#f5f5f4" />
                <stop offset="75%" stopColor="#d6d3d1" />
                <stop offset="100%" stopColor="#a8a29e" />
              </linearGradient>

              {/* Facetas de tono medio */}
              <linearGradient id="facetMidtone" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a8a29e" />
                <stop offset="50%" stopColor="#78716c" />
                <stop offset="100%" stopColor="#57534e" />
              </linearGradient>

              {/* Facetas en sombra propia profunda */}
              <linearGradient id="facetShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#57534e" />
                <stop offset="60%" stopColor="#292524" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>

              {/* Boulders de fondo (más oscuros y distantes para profundidad) */}
              <linearGradient id="facetBackDrop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#44403c" />
                <stop offset="100%" stopColor="#1c1917" />
              </linearGradient>
            </defs>

            {/* --- 1. SOMBRAS DE SUELO 3D PROYECTADAS EN EL ASFALTO --- */}
            <ellipse cx="90" cy="94" rx="85" ry="14" fill="url(#rockGroundOcclusion)" />
            <ellipse cx="260" cy="96" rx="130" ry="16" fill="url(#rockGroundOcclusion)" />
            <ellipse cx="430" cy="94" rx="85" ry="14" fill="url(#rockGroundOcclusion)" />

            {/* Grietas de fractura en el pavimento bajo el peso */}
            <path d="M 20 92 Q 130 88 260 94 Q 390 88 500 92" stroke="#050813" strokeWidth="3" strokeLinecap="round" />
            <path d="M 80 94 L 110 102 M 240 96 L 270 104 M 400 94 L 430 102" stroke="#090d16" strokeWidth="2" strokeLinecap="round" />

            {/* --- 2. CAPA TRASERA (BOULDERS DISTANTES EN PROFUNDIDAD) --- */}
            <g id="backLayerBoulders" opacity="0.88">
              {/* Roca fondo izq */}
              <polygon points="40,88 60,35 110,30 135,88" fill="url(#facetBackDrop)" stroke="#090d16" strokeWidth="1.5" />
              <polygon points="60,35 110,30 105,55 75,58" fill="#57534e" />
              {/* Boulder fondo centro-izq */}
              <polygon points="160,92 185,25 240,20 265,92" fill="url(#facetBackDrop)" stroke="#090d16" strokeWidth="2" />
              <polygon points="185,25 240,20 235,50 195,54" fill="#57534e" />
              {/* Boulder fondo centro-der */}
              <polygon points="275,92 305,22 360,26 385,92" fill="url(#facetBackDrop)" stroke="#090d16" strokeWidth="2" />
              <polygon points="305,22 360,26 350,52 315,50" fill="#57534e" />
              {/* Roca fondo der */}
              <polygon points="395,88 420,34 470,38 490,88" fill="url(#facetBackDrop)" stroke="#090d16" strokeWidth="1.5" />
            </g>

            {/* --- 3. CAPA FRONTAL (GRANDES BOULDERS FACETADOS CON LUZ 3D) --- */}
            {/* BLOQUE IZQUIERDO */}
            <g id="frontBlockLeft">
              {/* Boulder 1: Sombra base */}
              <polygon points="15,92 35,52 80,48 105,92" fill="url(#facetShadow)" stroke="#090d16" strokeWidth="2" />
              {/* Cara frontal intermedia */}
              <polygon points="35,52 80,48 72,72 40,75" fill="url(#facetMidtone)" />
              {/* Cara superior biselada brillante */}
              <polygon points="35,52 80,48 68,36 30,40" fill="url(#facetHighlight)" />
              {/* Gran Boulder 2 Izq */}
              <polygon points="70,92 95,24 155,18 185,62 165,92" fill="url(#facetShadow)" stroke="#090d16" strokeWidth="2.5" />
              <polygon points="95,24 155,18 150,54 105,58" fill="url(#facetHighlight)" />
              <polygon points="105,58 150,54 185,62 145,92 90,92" fill="url(#facetMidtone)" />
              {/* Arista biselada de fractura */}
              <line x1="95" y1="24" x2="125" y2="65" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="125" y1="65" x2="145" y2="92" stroke="#1c1917" strokeWidth="2" />
            </g>

            {/* BLOQUE CENTRAL GIGANTE (Protagonista principal de calzada) */}
            <g id="frontBlockCenter">
              {/* Boulder colosal: Silueta y sombra */}
              <polygon points="195,94 230,14 310,8 355,54 330,94" fill="url(#facetShadow)" stroke="#090d16" strokeWidth="3" />
              {/* Cara superior bañada por el sol */}
              <polygon points="230,14 310,8 325,40 260,46" fill="url(#facetHighlight)" />
              {/* Faceta frontal con luz rasante */}
              <polygon points="260,46 325,40 355,54 300,94 225,94" fill="url(#facetMidtone)" />
              {/* Faceta lateral derecha en sombra profunda */}
              <polygon points="325,40 355,54 330,94 300,94" fill="#1c1917" />
              {/* Grieta 3D en la roca central */}
              <path d="M 310 8 L 290 42 L 310 65 L 295 94" stroke="#050813" strokeWidth="3" strokeLinecap="round" />
              <path d="M 292 42 L 312 65" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.6" />
              {/* Roca satélite incrustada al frente */}
              <polygon points="170,94 195,48 235,44 248,94" fill="url(#facetShadow)" stroke="#090d16" strokeWidth="2" />
              <polygon points="195,48 235,44 228,68 200,70" fill="url(#facetHighlight)" />
            </g>

            {/* BLOQUE DERECHO */}
            <g id="frontBlockRight">
              {/* Boulder grande der */}
              <polygon points="345,92 375,22 435,26 465,66 445,92" fill="url(#facetShadow)" stroke="#090d16" strokeWidth="2.5" />
              <polygon points="375,22 435,26 425,56 385,54" fill="url(#facetHighlight)" />
              <polygon points="385,54 425,56 465,66 420,92 365,92" fill="url(#facetMidtone)" />
              <line x1="435" y1="26" x2="410" y2="68" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
              {/* Roca menor derecha */}
              <polygon points="435,92 455,52 495,48 510,92" fill="url(#facetShadow)" stroke="#090d16" strokeWidth="2" />
              <polygon points="455,52 495,48 488,70 460,72" fill="url(#facetHighlight)" />
            </g>

            {/* --- 4. SEÑALIZACIÓN REFLECTANTE ARCADE Y PEDRUSCOS MENORES --- */}
            {/* Piedras y grava en primer plano */}
            <ellipse cx="140" cy="98" rx="8" ry="4" fill="#78716c" stroke="#1c1917" strokeWidth="1" />
            <ellipse cx="270" cy="100" rx="12" ry="5" fill="#a8a29e" stroke="#1c1917" strokeWidth="1" />
            <ellipse cx="380" cy="98" rx="9" ry="4.5" fill="#57534e" stroke="#1c1917" strokeWidth="1" />

            {/* Franjas diagonales reflectantes de peligro en las rocas */}
            <g stroke="#facc15" strokeWidth="3.5" strokeLinecap="round" filter="drop-shadow(0 0 5px rgba(250, 204, 21, 0.7))">
              <line x1="120" y1="68" x2="142" y2="75" />
              <line x1="270" y1="64" x2="298" y2="72" />
              <line x1="400" y1="68" x2="422" y2="75" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          2. GRAN FOSO / SOCAVÓN TRANSVERSAL (Profundidad Abisal con Corte de Asfalto)
          ========================================================================= */}
      {normTipo === 'HOYOS' && (
        <div className={styles.hazardContentGroup}>
          <svg className={styles.hazardFullSvg} viewBox="0 0 520 105" preserveAspectRatio="none" fill="none">
            <defs>
              {/* Gradiente del abismo profundo */}
              <linearGradient id="chasmAbyssDeep" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000000" />
                <stop offset="50%" stopColor="#050813" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Corte transversal de las capas del asfalto (Pavimento + Grava) */}
              <linearGradient id="asphaltCrossSection" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="25%" stopColor="#27272a" />
                <stop offset="60%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#1e0902" />
              </linearGradient>

              {/* Sombra proyectada del labio superior */}
              <linearGradient id="chasmTopLipShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Sombra envolvente en el asfalto */}
            <ellipse cx="260" cy="68" rx="255" ry="28" fill="#050813" opacity="0.9" />

            {/* Borde exterior del foso con corte de capas de asfalto visibles en 3D */}
            <path
              d="M 5 60 Q 260 98 515 60 L 515 72 Q 260 108 5 72 Z"
              fill="url(#asphaltCrossSection)"
              stroke="#090d16"
              strokeWidth="2"
            />

            {/* Fondo abisal negro profundo del socavón */}
            <path
              d="M 12 62 Q 260 94 508 62 Q 260 36 12 62 Z"
              fill="url(#chasmAbyssDeep)"
              stroke="#000000"
              strokeWidth="2.5"
            />

            {/* Sombra cavernosa bajo el labio superior del corte */}
            <path
              d="M 12 62 Q 260 42 508 62 Q 260 52 12 62 Z"
              fill="url(#chasmTopLipShadow)"
            />

            {/* Fracturas dentadas en el borde del asfalto roto */}
            <path
              d="M 12 62 L 45 67 L 75 62 L 110 69 L 150 63 L 195 72 L 245 64 L 275 75 L 315 65 L 360 73 L 410 64 L 450 69 L 508 62"
              stroke="#18181b"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Varillas de acero de armadura (rebar) retorcidas saliendo del asfalto roto */}
            <g stroke="#e4e4e7" strokeWidth="1.8" strokeLinecap="round">
              <line x1="85" y1="64" x2="90" y2="74" />
              <line x1="175" y1="68" x2="182" y2="79" />
              <line x1="260" y1="70" x2="265" y2="82" />
              <line x1="340" y1="69" x2="345" y2="80" />
              <line x1="430" y1="66" x2="436" y2="76" />
            </g>

            {/* Conos y tambores de seguridad con sombras 3D y franjas reflectantes */}
            {[50, 130, 215, 305, 390, 470].map((cx, i) => (
              <g key={i} transform={`translate(${cx}, ${56 + Math.sin(i * 0.7) * 7})`}>
                <ellipse cx="0" cy="18" rx="10" ry="3" fill="#050813" opacity="0.8" />
                <polygon points="-9,18 0,-12 9,18" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.2" />
                <polygon points="-6,6 0,-12 6,6" fill="#ffffff" />
                <polygon points="-7,12 0,4 7,12" fill="#ffffff" />
                <ellipse cx="0" cy="18" rx="10" ry="3" fill="#9a3412" />
                {/* Reflejo de luz superior en el cono */}
                <circle cx="0" cy="-12" r="1.5" fill="#fef08a" />
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* =========================================================================
          3. METEORITOS (Cráteres de Impacto con Magma Vivo y Bólido Incrustado)
          ========================================================================= */}
      {normTipo === 'METEORITOS' && (
        <div className={styles.hazardContentGroup}>
          {/* Llamarada de impacto y onda expansiva detonando sobre el asfalto */}
          {isImpactingNow && (
            <div className={styles.craterActiveImpactOverlay}>
              <div className={styles.craterImpactFireball} />
              <div className={styles.craterShockwaveRing} />
            </div>
          )}

          <div className={styles.meteorMultiSmokeLeft} />
          <div className={styles.meteorMultiSmokeCenter} />
          <div className={styles.meteorMultiSmokeRight} />

          <svg className={styles.hazardFullSvg} viewBox="0 0 520 115" preserveAspectRatio="none" fill="none">
            <defs>
              {/* Asfalto quemado por el calor de reentrada */}
              <radialGradient id="meteorScorchWide" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#b91c1c" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#18181b" stopOpacity="0.95" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              {/* Magma ardiente de las fracturas del cráter */}
              <linearGradient id="lavaVeinsHot" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="20%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>

              {/* Borde elevado 3D del cráter */}
              <linearGradient id="craterRim3D" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="30%" stopColor="#78350f" />
                <stop offset="75%" stopColor="#27272a" />
                <stop offset="100%" stopColor="#09090b" />
              </linearGradient>
            </defs>

            {/* Suelo calcinado térmico (Tres zonas de impacto: izq, centro, der) */}
            <ellipse cx="105" cy="85" rx="90" ry="18" fill="url(#meteorScorchWide)" />
            <ellipse cx="260" cy="88" rx="120" ry="22" fill="url(#meteorScorchWide)" />
            <ellipse cx="415" cy="85" rx="90" ry="18" fill="url(#meteorScorchWide)" />

            {/* Grietas de lava transversal sobre la calzada */}
            <path
              d="M 15 85 Q 135 80 260 88 Q 385 80 505 85"
              stroke="url(#lavaVeinsHot)"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={styles.lavaGlowLayer}
            />

            {/* --- CRÁTER IZQUIERDO --- */}
            <g id="craterLeft">
              {/* Borde exterior levantado */}
              <ellipse cx="105" cy="85" rx="60" ry="14" fill="url(#craterRim3D)" stroke="#09090b" strokeWidth="2" />
              {/* Cavidad cóncava */}
              <ellipse cx="105" cy="86" rx="46" ry="10" fill="#09090b" />
              {/* Lago de magma interior */}
              <ellipse cx="105" cy="87" rx="30" ry="6" fill="#f97316" className={styles.lavaGlowLayer} />
              <ellipse cx="105" cy="87" rx="16" ry="3" fill="#fef08a" />
              {/* Fragmento de meteorito incrustado */}
              <polygon points="90,85 108,55 125,58 120,85" fill="#18181b" stroke="#000" strokeWidth="1.5" />
              <polygon points="108,55 125,58 122,70 102,68" fill="#3f3f46" />
            </g>

            {/* --- CRÁTER CENTRAL MASIVO CON METEORITO GIGANTE --- */}
            <g id="craterCenter">
              {/* Borde exterior colosal elevado en 3D */}
              <ellipse cx="260" cy="88" rx="95" ry="20" fill="url(#craterRim3D)" stroke="#000" strokeWidth="2.5" />
              {/* Cavidad profunda */}
              <ellipse cx="260" cy="90" rx="75" ry="14" fill="#050507" />
              {/* Corazón de magma líquido fundido */}
              <ellipse cx="260" cy="91" rx="55" ry="9" fill="#ea580c" className={styles.lavaGlowLayer} />
              <ellipse cx="260" cy="91" rx="32" ry="5" fill="#fef08a" />
              <ellipse cx="260" cy="91" rx="15" ry="2.5" fill="#ffffff" />

              {/* Bólido de meteorito central incrustado en el cráter en 3D */}
              <polygon points="215,88 238,24 295,18 325,56 300,88" fill="#09090b" stroke="#000" strokeWidth="2.8" />
              {/* Facetas superiores iluminadas por el fuego */}
              <polygon points="238,24 295,18 285,46 250,50" fill="#27272a" />
              <polygon points="250,50 285,46 325,56 290,88 240,88" fill="#18181b" />

              {/* Venas de lava fundida al rojo vivo incrustadas en el bólido */}
              <path d="M 250 32 L 265 52 L 258 72 L 285 82" stroke="url(#lavaVeinsHot)" strokeWidth="3.5" strokeLinecap="round" className={styles.lavaGlowLayer} />
              <path d="M 265 52 L 298 48 L 312 70" stroke="url(#lavaVeinsHot)" strokeWidth="3" strokeLinecap="round" className={styles.lavaGlowLayer} />
              <circle cx="265" cy="52" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #fef08a)" />
            </g>

            {/* --- CRÁTER DERECHO --- */}
            <g id="craterRight">
              <ellipse cx="415" cy="85" rx="60" ry="14" fill="url(#craterRim3D)" stroke="#09090b" strokeWidth="2" />
              <ellipse cx="415" cy="86" rx="46" ry="10" fill="#09090b" />
              <ellipse cx="415" cy="87" rx="30" ry="6" fill="#f97316" className={styles.lavaGlowLayer} />
              <ellipse cx="415" cy="87" rx="16" ry="3" fill="#fef08a" />
              <polygon points="400,85 418,54 435,58 430,85" fill="#18181b" stroke="#000" strokeWidth="1.5" />
              <polygon points="418,54 435,58 430,70 412,68" fill="#3f3f46" />
            </g>
          </svg>
        </div>
      )}

      {/* =========================================================================
          4. DUNAS / GRIETAS (Cresta de Arena Volumétrica y Falla Tectónica)
          ========================================================================= */}
      {(normTipo === 'DUNAS' || normTipo === 'GRIETAS') && (
        <div className={styles.hazardContentGroup}>
          <svg className={styles.hazardFullSvg} viewBox="0 0 520 95" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="duneWave3D" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              <linearGradient id="duneDropShadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#050813" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#050813" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Sombra de asfalto bajo la cresta */}
            <ellipse cx="260" cy="82" rx="255" ry="12" fill="url(#duneDropShadow)" />

            {/* Rampa volumétrica de arena dorada cortando la calzada de borde a borde */}
            <path
              d="M 5 82 Q 260 20 515 82 L 510 88 Q 260 30 10 88 Z"
              fill="url(#duneWave3D)"
              stroke="#78350f"
              strokeWidth="2.5"
            />

            {/* Estratos de ondulación del viento (Ripples en 3D) */}
            <path d="M 40 82 Q 260 36 480 82" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" strokeLinecap="round" />
            <path d="M 80 82 Q 260 48 440 82" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 130 82 Q 260 60 390 82" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />

            {/* Chevrons reflectantes de salto de neón en cada carril (▲ ▲ ▲ ▲ ▲ ▲) */}
            {[50, 134, 218, 302, 386, 470].map((cx, i) => (
              <g key={i} transform={`translate(${cx}, ${56 + Math.cos((i - 2.5) * 0.7) * 8})`}>
                <polygon points="0,-12 -8,4 0,-1 8,4" fill="#ffffff" filter="drop-shadow(0 0 8px #facc15)" />
                <polygon points="0,-3 -7,9 0,5 7,9" fill="#facc15" />
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
