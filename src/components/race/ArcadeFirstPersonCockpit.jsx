import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ArcadeRoadHazardZone from './ArcadeRoadHazardZone';
import ArcadeSkyFallingHazards from './ArcadeSkyFallingHazards';
import ArcadeBuggyRearSprite from './ArcadeBuggyRearSprite';
import styles from './ArcadeFirstPersonCockpit.module.css';

/**
 * ArcadeFirstPersonCockpit: vista en primera persona (cabina de buggy abierto).
 *
 * Composición (inspirada en la referencia del cliente, dibujada 100% en vectores propios):
 *  - Atardecer con un sol enorme y montañas muy lejanas.
 *  - Autopista ancha con franjas horizontales, líneas de carril en fuga y pianos rojo/blanco.
 *  - Autos rivales vistos desde atrás con una píldora de posición (P1 LÍDER, P4, P5...).
 *  - Jaula antivuelco con pilares inclinados, travesaño superior y escuadras triangulares.
 *  - Ruedas delanteras abiertas, capó, tablero con 3 relojes, volante y manos con guantes.
 *
 * Todo vive en un "mundo" fijo de 2048x613 (la referencia ocupa x:0..1024 dentro de él)
 * que se escala para cubrir el contenedor, así los autos siempre coinciden con la ruta.
 */

const WORLD_W = 2048;
const WORLD_H = 613;
const X0 = 512; // desplazamiento: coordenada de referencia x=0 -> x=512 en el mundo

// Geometría de la autopista (coordenadas de referencia)
const CX = 505; // eje central de la carretera
const VPY = -161; // punto de fuga (muy por encima del horizonte visible)
const YH = 210; // horizonte donde empieza el asfalto
const LANE = 147; // ancho de carril en el borde del horizonte
const SEG = 0.7; // largo de cada franja en "unidades de mundo"
const SEG_COUNT = 30;

const sc = (y) => (y + 161) / 371;
const lx = (k, y) => CX + k * LANE * sc(y);
const yz = (z) => YH + 400 / z;
const P = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;

/** Construye franjas de asfalto, pianos y líneas de carril según el desplazamiento. */
function buildRoad(scroll) {
  const q = scroll / SEG;
  const base = Math.floor(q);
  const phase = q - base;
  const bands = [];
  const kerbs = [];
  const dashes = [];

  for (let i = 0; i < SEG_COUNT; i += 1) {
    const j = base + i;
    const zNear = Math.max(0.85, 1 + (i - phase) * SEG);
    const zFar = Math.max(0.85, 1 + (i + 1 - phase) * SEG);
    const yBot = yz(zNear);
    const yTop = yz(zFar);
    if (yTop >= yBot) continue;
    const even = j % 2 === 0;

    if (even) {
      bands.push(
        <polygon
          key={`b${j}`}
          points={`${P(lx(-2.7, yTop), yTop)} ${P(lx(2.7, yTop), yTop)} ${P(lx(2.7, yBot), yBot)} ${P(lx(-2.7, yBot), yBot)}`}
          fill="rgba(110,128,180,0.075)"
        />
      );
      const wT = 4.6 * sc(yTop);
      const wB = 4.6 * sc(yBot);
      [-2, -1, 0, 1, 2].forEach((k) => {
        dashes.push(
          <polygon
            key={`d${j}_${k}`}
            points={`${P(lx(k, yTop) - wT / 2, yTop)} ${P(lx(k, yTop) + wT / 2, yTop)} ${P(lx(k, yBot) + wB / 2, yBot)} ${P(lx(k, yBot) - wB / 2, yBot)}`}
            fill="#f4f4fa"
          />
        );
      });
    }

    [-1, 1].forEach((side) => {
      const cT = lx(side * 2.67, yTop);
      const cB = lx(side * 2.67, yBot);
      const kT = 40 * sc(yTop);
      const kB = 40 * sc(yBot);
      kerbs.push(
        <polygon
          key={`k${j}_${side}`}
          points={`${P(cT - kT / 2, yTop)} ${P(cT + kT / 2, yTop)} ${P(cB + kB / 2, yBot)} ${P(cB - kB / 2, yBot)}`}
          fill={even ? '#e63a3a' : '#f5f5f7'}
        />
      );
      if (j % 3 === 0) {
        const inT = side === -1 ? cT + kT / 2 : cT - kT / 2;
        const inB = side === -1 ? cB + kB / 2 : cB - kB / 2;
        const dT = (side === -1 ? -1 : 1) * kT * 0.2;
        const dB = (side === -1 ? -1 : 1) * kB * 0.2;
        kerbs.push(
          <polygon
            key={`ky${j}_${side}`}
            points={`${P(inT, yTop)} ${P(inT + dT, yTop)} ${P(inB + dB, yBot)} ${P(inB, yBot)}`}
            fill="#facc15"
          />
        );
      }
    });
  }
  return { bands, kerbs, dashes };
}

/** Arco para los relojes (ángulos en grados, 180=izquierda, 270=arriba, 360=derecha). */
function arc(cx, cy, r, a0, a1) {
  const rad = (d) => (d * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/** Tubo metálico con contorno y brillo. */
function Tube({ x1, y1, x2, y2, w, body = '#5a6478', edge = '#121625', hi = '#9099ae' }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const o = w * 0.24;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={edge} strokeWidth={w + 7} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={body} strokeWidth={w} />
      <line
        x1={x1 + nx * o}
        y1={y1 + ny * o}
        x2={x2 + nx * o}
        y2={y2 + ny * o}
        stroke={hi}
        strokeWidth={w * 0.2}
        opacity="0.7"
      />
    </g>
  );
}

/** Refleja el contenido respecto al eje de la cabina (x = 512). */
function Mirror({ children }) {
  return <g transform="translate(1024 0) scale(-1 1)">{children}</g>;
}

export default function ArcadeFirstPersonCockpit({
  cars = [],
  rankedCars = [],
  progress = 0,
  currentSectorObstacle = {},
  userBuggyNames = [],
  userBuggyName = null,
  isUserRace = true,
  isFinished = false,
  fatalEliminationByCar = {},
  ningunAutoLlego = false,
}) {
  // Normalizar nombres de buggies elegidos por el usuario en esta carrera
  const normalizedChosenNames = useMemo(() => {
    const list = [];
    if (Array.isArray(userBuggyNames)) {
      userBuggyNames.forEach((n) => {
        if (n && typeof n === 'string') {
          const upper = n.toUpperCase();
          if (!list.includes(upper)) list.push(upper);
        }
      });
    }
    if (userBuggyName && typeof userBuggyName === 'string') {
      const upper = userBuggyName.toUpperCase();
      if (!list.includes(upper)) list.push(upper);
    }
    return list;
  }, [userBuggyNames, userBuggyName]);

  // Buggy actualmente en vista en la cabina
  const [activeBuggyName, setActiveBuggyName] = useState(() => {
    return normalizedChosenNames[0] || null;
  });

  // Sincronizar buggy activo si cambian los elegidos
  useEffect(() => {
    if (normalizedChosenNames.length > 0) {
      if (!activeBuggyName || !normalizedChosenNames.includes(activeBuggyName)) {
        setActiveBuggyName(normalizedChosenNames[0]);
      }
    }
  }, [normalizedChosenNames, activeBuggyName]);

  const [spectatorSelectedName, setSpectatorSelectedName] = useState(null);

  // --- Escala del mundo para cubrir el contenedor ---
  const stageRef = useRef(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setK(Math.max(r.width / WORLD_W, r.height / WORLD_H));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- Auto desde el que se mira ---
  const playerCar = useMemo(() => {
    if (activeBuggyName) {
      const match = cars.find((c) =>
        c.buggy?.name?.toUpperCase() === activeBuggyName ||
        c.name?.toUpperCase() === activeBuggyName
      );
      if (match) return match;
    }
    if (spectatorSelectedName) {
      const match = cars.find((c) => c.buggy.name.toUpperCase() === spectatorSelectedName);
      if (match) return match;
    }
    // Espectador: por defecto se viaja en el último del pelotón para ver a todos adelante
    return rankedCars[rankedCars.length - 1] || cars[cars.length - 1] || null;
  }, [cars, rankedCars, activeBuggyName, spectatorSelectedName]);

  // Objetos de autos correspondientes a los buggies elegidos
  const chosenBuggyObjects = useMemo(() => {
    if (normalizedChosenNames.length === 0) return [];
    return normalizedChosenNames
      .map((name) => cars.find((c) => c.buggy?.name?.toUpperCase() === name || c.name?.toUpperCase() === name))
      .filter(Boolean);
  }, [normalizedChosenNames, cars]);

  // Si el auto activo se accidentó, buscar si tiene otro buggy elegido que siga en carrera
  const otherAliveBuggy = useMemo(() => {
    if (!playerCar?.isEliminated || chosenBuggyObjects.length <= 1) return null;
    return chosenBuggyObjects.find((c) => c.name !== playerCar.name && !c.isEliminated) || null;
  }, [playerCar, chosenBuggyObjects]);

  const isPlayerEliminated = Boolean(playerCar?.isEliminated);

  const carsAhead = useMemo(() => {
    if (!playerCar || isPlayerEliminated) return [];
    return cars
      .filter((c) => c.name !== playerCar.name && !c.isEliminated && c.x > playerCar.x)
      .sort((a, b) => a.x - b.x);
  }, [cars, playerCar, isPlayerEliminated]);

  const playerRank = useMemo(() => {
    if (!playerCar) return 1;
    const idx = rankedCars.findIndex((c) => c.name === playerCar.name);
    return idx >= 0 ? idx + 1 : 1;
  }, [rankedCars, playerCar]);

  // --- Obstáculo que se acerca a gran velocidad hacia el parabrisas/capó ---
  const sectorFraction = (progress * 7) % 1;
  const isMeteor = currentSectorObstacle?.tipo === 'METEORITOS';
  const minFraction = isMeteor ? 0.22 : 0.16;
  const maxFraction = 0.66;
  const hazard = useMemo(() => {
    const visible =
      !isFinished &&
      currentSectorObstacle?.tipo &&
      sectorFraction >= minFraction &&
      sectorFraction <= maxFraction;
    if (!visible) return null;
    const norm = Math.min(1, Math.max(0, (sectorFraction - minFraction) / (maxFraction - minFraction)));
    const curve = Math.pow(norm, 2.3);
    return {
      y: 218 + curve * 240,
      scale: 0.25 + curve * 1.35,
      opacity: norm < 0.10 ? norm / 0.10 : norm > 0.85 ? (1 - norm) / 0.15 : 1,
    };
  }, [isFinished, currentSectorObstacle, sectorFraction, minFraction, maxFraction]);

  // --- Telemetría / animación de alta velocidad ---
  const speed = playerCar?.speedKmh || 164;
  const buggyColor = playerCar?.buggy?.color || '#f26a1b';
  const steer = playerCar?.isDodging
    ? Math.max(-10, Math.min(10, (playerCar.dodgeRotateDeg || -8) * 0.8))
    : Math.sin(progress * 38) * 3.4;
  const bump = playerCar?.isJumping ? -14 : Math.sin(progress * 280) * 1.1;

  // Asfalto y ráfagas a velocidad arcade auténtica
  const scroll = progress * 520;
  const road = useMemo(() => buildRoad(scroll), [scroll]);
  const rainOffset = progress * 6800;
  const needle = 190 + 160 * Math.min(1, speed / 240);

  // Carriles donde viaja cada rival (centros entre las líneas blancas)
  const laneCenters = [-1.5, 0.5, -0.5, 1.5, -1.0, 1.0];

  return (
    <div className={styles.cockpitStage} ref={stageRef}>
      <div
        className={styles.world}
        style={{ transform: `translate(-50%, -50%) scale(${k})` }}
      >
        {/* ===================== ESCENA: cielo, sol, autopista ===================== */}
        <svg
          className={styles.layerSvg}
          viewBox={`${-X0} 0 ${WORLD_W} ${WORLD_H}`}
          width={WORLD_W}
          height={WORLD_H}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fpvSky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="214">
              <stop offset="0" stopColor="#2a1250" />
              <stop offset="0.34" stopColor="#5d1a5d" />
              <stop offset="0.6" stopColor="#a02351" />
              <stop offset="0.82" stopColor="#d9481f" />
              <stop offset="1" stopColor="#f2901c" />
            </linearGradient>
            <radialGradient id="fpvSun" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#fff2a8" />
              <stop offset="0.55" stopColor="#ffc233" />
              <stop offset="0.85" stopColor="#ff8a1f" />
              <stop offset="1" stopColor="#f9591a" />
            </radialGradient>
            <radialGradient id="fpvGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="rgba(255,170,50,0.55)" />
              <stop offset="1" stopColor="rgba(255,120,30,0)" />
            </radialGradient>
            <linearGradient id="fpvDirt" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="613">
              <stop offset="0" stopColor="#b25a1f" />
              <stop offset="0.5" stopColor="#8b4519" />
              <stop offset="1" stopColor="#5e2c10" />
            </linearGradient>
            <linearGradient id="fpvHaze" gradientUnits="userSpaceOnUse" x1="0" y1="210" x2="0" y2="340">
              <stop offset="0" stopColor="rgba(95,110,160,0.55)" />
              <stop offset="1" stopColor="rgba(95,110,160,0)" />
            </linearGradient>
          </defs>

          <rect x={-X0} y="-10" width={WORLD_W} height="226" fill="url(#fpvSky)" />
          <circle cx="507" cy="136" r="165" fill="url(#fpvGlow)" />
          <circle cx="507" cy="136" r="72" fill="url(#fpvSun)" />

          {/* Montañas lejanas */}
          <polygon
            fill="#5a1f27"
            points="-512,204 -420,186 -380,193 -300,180 -200,190 -60,184 20,179 70,186 120,190 200,177 260,186 330,192 420,184 560,174 640,181 700,188 760,178 840,186 920,181 1000,189 1100,182 1200,190 1300,180 1400,188 1536,184 1536,204"
          />
          {/* Franja de desierto en el horizonte */}
          <rect x={-X0} y="190" width={WORLD_W} height="22" fill="#c4521a" opacity="0.95" />
          <rect x={-X0} y="200" width={WORLD_W} height="12" fill="#a8421a" />

          {/* Tierra a los costados */}
          <rect x={-X0} y="209" width={WORLD_W} height="410" fill="url(#fpvDirt)" />

          {/* Asfalto */}
          <polygon
            fill="#1a2030"
            points={`${P(lx(-2.7, YH), YH)} ${P(lx(2.7, YH), YH)} ${P(lx(2.7, 640), 640)} ${P(lx(-2.7, 640), 640)}`}
          />
          {road.bands}
          <polygon
            fill="url(#fpvHaze)"
            points={`${P(lx(-2.7, YH), YH)} ${P(lx(2.7, YH), YH)} ${P(lx(2.7, 340), 340)} ${P(lx(-2.7, 340), 340)}`}
          />
          {road.dashes}
          {road.kerbs}
        </svg>

        {/* ===================== AUTOS RIVALES ===================== */}
        <div className={styles.carsLayer}>
          {carsAhead.map((car, idx) => {
            const rank = rankedCars.findIndex((c) => c.name === car.name) + 1;
            const isCarLeader = rank === 1;
            const dist = Math.max(6, car.x - (playerCar?.x || 150));
            const t = Math.pow(1 - Math.min(1, dist / 190), 1.5);
            const y = 224 + t * 150;
            const width = 56 + (y - 245) * 0.42;
            const lane =
              laneCenters[(car.index ?? idx) % laneCenters.length] +
              Math.sin(progress * 28 + (car.index ?? idx) * 1.7) * 0.09;
            const x = lx(lane, y);
            return (
              <div
                key={car.name}
                className={styles.rival}
                style={{
                  left: `${x + X0}px`,
                  top: `${y}px`,
                  width: `${width}px`,
                  zIndex: Math.round(y),
                }}
              >
                <div
                  className={styles.rivalPill}
                  style={{
                    background: isCarLeader ? '#ffcf1f' : car.buggy.color,
                    fontSize: `${11 + t * 3}px`,
                  }}
                >
                  {isCarLeader ? 'P1 LÍDER' : `P${rank}`}
                </div>
                <div className={styles.spriteFit}>
                  <div className={styles.rivalGlow} />
                  <ArcadeBuggyRearSprite
                    buggy={car.buggy}
                    isEliminated={false}
                    isBoosting={car.isBoosting}
                    carNumber={car.buggy.number || ((car.index ?? idx) + 1)}
                    speedKmh={car.speedKmh}
                    steering={0}
                  />
                </div>
              </div>
            );
          })}

          {carsAhead.length === 0 && !isPlayerEliminated && (
            <div className={styles.leadingNote}>
              {playerRank === 1 ? 'P1 LÍDER • PISTA DESPEJADA' : 'PISTA DESPEJADA'}
            </div>
          )}

          {hazard && (
            <div
              className={styles.hazard}
              style={{
                left: `${lx(0, hazard.y) + X0}px`,
                top: `${hazard.y}px`,
                opacity: hazard.opacity,
                transform: `translate(-50%, -50%) scale(${hazard.scale})`,
              }}
            >
              <ArcadeRoadHazardZone
                tipo={currentSectorObstacle.tipo}
                nombre={currentSectorObstacle.nombre}
                icono={currentSectorObstacle.icono}
              />
            </div>
          )}

          {progress > 0.82 && !ningunAutoLlego && (
            <div
              className={styles.finishBanner}
              style={{
                left: `${CX + X0}px`,
                top: `${Math.min(330, 226 + (progress - 0.82) * 560)}px`,
                opacity: Math.min(1, (progress - 0.82) * 6),
                transform: `translate(-50%, -50%) scale(${0.5 + (progress - 0.82) * 3})`,
              }}
            >
              🏁 META FINAL • 1.140 M 🏁
            </div>
          )}
        </div>

        {/* ===================== CABINA (marco, tablero, volante) ===================== */}
        <svg
          className={`${styles.layerSvg} ${styles.cockpitSvg}`}
          viewBox={`${-X0} 0 ${WORLD_W} ${WORLD_H}`}
          width={WORLD_W}
          height={WORLD_H}
          aria-label="Cabina del buggy"
          style={{ transform: `translateY(${bump * 0.6}px)` }}
        >
          <defs>
            <pattern
              id="fpvRain"
              width="70"
              height="140"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${-rainOffset * 0.44} ${rainOffset})`}
            >
              <line x1="62" y1="0" x2="22" y2="92" stroke="#ffffff" strokeWidth="2.4" opacity="0.75" />
              <line x1="14" y1="64" x2="-8" y2="116" stroke="#ffffff" strokeWidth="2" opacity="0.55" />
              <line x1="70" y1="96" x2="48" y2="140" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
            </pattern>
            <linearGradient id="fpvRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#141826" />
              <stop offset="1" stopColor="#242a3b" />
            </linearGradient>
            <linearGradient id="fpvHood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={buggyColor} />
              <stop offset="1" stopColor="#8a2f0c" />
            </linearGradient>
            <linearGradient id="fpvDash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#343b4e" />
              <stop offset="1" stopColor="#171b28" />
            </linearGradient>
            <linearGradient id="fpvSkin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f6b078" />
              <stop offset="1" stopColor="#e07a3a" />
            </linearGradient>
          </defs>

          {/* Lluvia / rayas de velocidad en las ventanas laterales */}
          <polygon
            points="-512,-10 108,-10 107,67 244,485 -512,682"
            fill="url(#fpvRain)"
          />
          <Mirror>
            <polygon
              points="-512,-10 108,-10 107,67 244,485 -512,682"
              fill="url(#fpvRain)"
            />
          </Mirror>

          {/* Techo y travesaño superior */}
          <polygon points="-8,-30 1032,-30 894,72 130,72" fill="url(#fpvRoof)" />
          <Tube x1="108" y1="60" x2="916" y2="60" w={26} />

          {/* Ruedas delanteras abiertas */}
          {[false, true].map((m) => {
            const Wrap = m ? Mirror : React.Fragment;
            return (
              <Wrap key={m ? 'wr' : 'wl'}>
                <path
                  d="M 84 562 C 76 520 90 482 120 466 C 160 450 210 452 242 458 L 254 540 C 236 568 160 580 84 562 Z"
                  fill="#212839"
                  stroke="#0b0e17"
                  strokeWidth="4"
                />
                <path
                  d="M 100 482 C 140 458 200 457 238 466"
                  fill="none"
                  stroke="#4b5572"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path d="M 112 520 C 150 506 196 506 236 516" fill="none" stroke="#0b0e17" strokeWidth="3" opacity="0.5" />
                <path d="M 112 540 C 150 528 196 528 238 538" fill="none" stroke="#0b0e17" strokeWidth="3" opacity="0.5" />
              </Wrap>
            );
          })}

          {/* Capó */}
          <path
            d="M 340 482 Q 398 436 512 434 Q 626 436 684 482 Z"
            fill="url(#fpvHood)"
            stroke="#1a0d08"
            strokeWidth="3"
          />
          <path
            d="M 372 462 Q 430 440 512 439 Q 594 440 652 462"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Tubos inferiores de la jaula (salpicadero lateral) */}
          <polygon points="250,518 250,613 -95,613" fill="#161b28" />
          <Tube x1="252" y1="498" x2="-520" y2="710" w={40} />
          <Mirror>
            <polygon points="250,518 250,613 -95,613" fill="#161b28" />
            <Tube x1="252" y1="498" x2="-520" y2="710" w={40} />
          </Mirror>

          {/* Tablero */}
          <path
            d="M 236 490 L 340 476 Q 420 462 512 462 Q 604 462 684 476 L 788 490 L 800 613 L 224 613 Z"
            fill="url(#fpvDash)"
            stroke="#0c101b"
            strokeWidth="4"
          />
          <path
            d="M 244 492 L 342 480 Q 420 467 512 467 Q 604 467 682 480 L 780 492"
            fill="none"
            stroke="#5b657c"
            strokeWidth="2.5"
            opacity="0.8"
          />

          {/* Panel de interruptores izquierdo */}
          <rect x="262" y="492" width="88" height="70" rx="7" fill="#1e2331" stroke="#0b0e17" strokeWidth="3" />
          <circle cx="284" cy="518" r="6" fill="#facc15" stroke="#0b0e17" strokeWidth="2" />
          <rect x="304" y="506" width="10" height="24" rx="3" fill="#e11d2e" stroke="#0b0e17" strokeWidth="2" />
          <circle cx="284" cy="546" r="6" fill="#f97316" stroke="#0b0e17" strokeWidth="2" />
          <circle cx="309" cy="546" r="6" fill="#0f131c" stroke="#3b4357" strokeWidth="2" />
          {/* Panel derecho */}
          <rect x="712" y="492" width="62" height="70" rx="7" fill="#1e2331" stroke="#0b0e17" strokeWidth="3" />
          <rect x="724" y="506" width="38" height="5" rx="2" fill="#0b0e17" />
          <rect x="724" y="520" width="38" height="5" rx="2" fill="#0b0e17" />
          <rect x="724" y="534" width="38" height="5" rx="2" fill="#0b0e17" />

          {/* Cuadro de instrumentos con 3 relojes */}
          <rect x="427" y="466" width="170" height="58" rx="20" fill="#0e121c" stroke="#3b4357" strokeWidth="3" />
          {/* reloj izquierdo */}
          <circle cx="467" cy="500" r="18" fill="#080b12" stroke="#1d2838" strokeWidth="2" />
          <path d={arc(467, 500, 15, 200, 340)} fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
          <line x1="467" y1="500" x2="458" y2="489" stroke="#ff7a1a" strokeWidth="2.4" strokeLinecap="round" />
          {/* reloj central (velocímetro) */}
          <circle cx="512" cy="502" r="30" fill="#080b12" stroke="#1d2838" strokeWidth="2" />
          <path d={arc(512, 502, 26, 190, 350)} fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
          <path
            d={arc(512, 502, 20, 190, 350)}
            fill="none"
            stroke="#0f5560"
            strokeWidth="3"
            strokeDasharray="3 5"
          />
          <line
            x1="512"
            y1="502"
            x2={512 + 23 * Math.cos((needle * Math.PI) / 180)}
            y2={502 + 23 * Math.sin((needle * Math.PI) / 180)}
            stroke="#ff7a1a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="512" cy="502" r="4.5" fill="#ff7a1a" />
          {/* reloj derecho */}
          <circle cx="557" cy="500" r="18" fill="#080b12" stroke="#1d2838" strokeWidth="2" />
          <path d={arc(557, 500, 15, 200, 340)} fill="none" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
          <path d={arc(557, 500, 15, 310, 340)} fill="none" stroke="#ff7a1a" strokeWidth="3" strokeLinecap="round" />
          <line x1="557" y1="500" x2="566" y2="490" stroke="#ff7a1a" strokeWidth="2.4" strokeLinecap="round" />
          {/* barra de velocidad digital */}
          <rect x="492" y="518" width="40" height="8" rx="2" fill="#22d3ee" />
          <text x="512" y="524.6" fontSize="7" fontWeight="900" fill="#04222a" textAnchor="middle">
            {speed}
          </text>

          {/* Pilares A, tubos de esquina y escuadras */}
          {[false, true].map((m) => {
            const Wrap = m ? Mirror : React.Fragment;
            return (
              <Wrap key={m ? 'pr' : 'pl'}>
                <polygon
                  points="153,72 214,72 176,128"
                  fill="#2a3144"
                  stroke="#12161f"
                  strokeWidth="3"
                />
                <Tube x1="-30" y1="-45" x2="128" y2="68" w={40} />
                <Tube x1="128" y1="60" x2="266" y2="482" w={42} />
              </Wrap>
            );
          })}

          {/* Volante + manos (giran juntos) */}
          <g transform={`rotate(${steer} 512 548)`}>
            <ellipse cx="512" cy="528" rx="124" ry="100" fill="none" stroke="#0f121b" strokeWidth="26" />
            <path
              d="M 392 486 A 124 100 0 0 1 512 428"
              fill="none"
              stroke="#323a4e"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* radios */}
            <polygon points="396,546 486,552 486,576 396,570" fill="#8d95a6" stroke="#0d1019" strokeWidth="3" />
            <polygon points="628,546 538,552 538,576 628,570" fill="#8d95a6" stroke="#0d1019" strokeWidth="3" />
            <polygon points="496,584 528,584 536,640 488,640" fill="#7a8396" stroke="#0d1019" strokeWidth="3" />
            {/* núcleo */}
            <ellipse cx="512" cy="563" rx="37" ry="30" fill="#6b7385" stroke="#0d1019" strokeWidth="4" />
            <ellipse cx="512" cy="563" rx="25" ry="19" fill="#394156" stroke="#0d1019" strokeWidth="2" />
            <circle cx="512" cy="563" r="7" fill={buggyColor} />

            {/* manos con guantes sin dedos */}
            <defs>
              <linearGradient id="fpvGlove" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0" stopColor="#3a4257" />
                <stop offset="0.55" stopColor="#262c3c" />
                <stop offset="1" stopColor="#171b27" />
              </linearGradient>
              <linearGradient id="fpvSleeve" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#141824" />
                <stop offset="1" stopColor="#252b3c" />
              </linearGradient>
              <radialGradient id="fpvKnuckle" cx="0.4" cy="0.35" r="0.7">
                <stop offset="0" stopColor="#4a5370" />
                <stop offset="1" stopColor="#222838" />
              </radialGradient>
            </defs>
            {[false, true].map((m) => {
              const Wrap = m ? Mirror : React.Fragment;
              return (
                <Wrap key={m ? 'hr' : 'hl'}>
                  {/* manga del traje */}
                  <path
                    d="M 262 613 L 316 546 L 398 580 L 388 613 Z"
                    fill="url(#fpvSleeve)"
                    stroke="#0b0e17"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <path d="M 276 600 L 322 560" stroke="#3b435a" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                  {/* puño elástico */}
                  <path
                    d="M 316 546 L 342 535 L 410 562 L 398 580 Z"
                    fill="#171b27"
                    stroke="#0b0e17"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <path d="M 326 548 L 402 573" stroke="#ff8a1f" strokeWidth="3" strokeLinecap="round" />

                  {/* dedos: segmento de guante + yema visible */}
                  {[
                    [354, 460, -16],
                    [373, 451, -7],
                    [393, 450, 3],
                    [412, 458, 13],
                  ].map(([fx, fy, rot]) => (
                    <g key={fx} transform={`rotate(${rot} ${fx + 8} ${fy + 20})`}>
                      <rect x={fx} y={fy + 12} width="17" height="30" rx="8.5" fill="url(#fpvGlove)" stroke="#0b0e17" strokeWidth="2.2" />
                      <rect x={fx + 0.5} y={fy} width="16" height="22" rx="8" fill="url(#fpvSkin)" stroke="#14161f" strokeWidth="2" />
                      <path d={`M ${fx + 4} ${fy + 7} Q ${fx + 8.5} ${fy + 3} ${fx + 13} ${fy + 7}`} fill="none" stroke="#ffe0c4" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
                      <path d={`M ${fx + 2} ${fy + 24} L ${fx + 15} ${fy + 24}`} stroke="#0b0e17" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
                    </g>
                  ))}

                  {/* dorso del guante */}
                  <path
                    d="M 336 556 C 322 522 332 490 360 479 C 392 468 430 482 438 514 C 442 540 424 564 396 578 Z"
                    fill="url(#fpvGlove)"
                    stroke="#0b0e17"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  {/* nudillos acolchados */}
                  {[
                    [358, 494],
                    [377, 488],
                    [396, 488],
                    [415, 495],
                  ].map(([kx, ky]) => (
                    <circle key={kx} cx={kx} cy={ky} r="9" fill="url(#fpvKnuckle)" stroke="#0b0e17" strokeWidth="2" />
                  ))}
                  {/* costuras y panel central */}
                  <path d="M 352 526 Q 388 508 424 524" fill="none" stroke="#0b0e17" strokeWidth="2" opacity="0.7" />
                  <path
                    d="M 356 531 Q 388 513 421 529"
                    fill="none"
                    stroke="#6b7590"
                    strokeWidth="1.4"
                    strokeDasharray="4 4"
                    opacity="0.8"
                  />
                  <path d="M 346 548 Q 372 540 400 556" fill="none" stroke="#0b0e17" strokeWidth="1.8" opacity="0.6" />
                  {/* correa de velcro en la muñeca */}
                  <path
                    d="M 340 546 L 404 570 L 398 580 L 334 556 Z"
                    fill="#1c2130"
                    stroke="#0b0e17"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="404" cy="568" r="3" fill="#ff8a1f" />

                  {/* pulgar */}
                  <g transform="rotate(-20 433 530)">
                    <ellipse cx="433" cy="530" rx="12" ry="22" fill="url(#fpvGlove)" stroke="#0b0e17" strokeWidth="2.5" />
                    <ellipse cx="433" cy="513" rx="8.5" ry="8" fill="url(#fpvSkin)" stroke="#14161f" strokeWidth="2" />
                    <path d="M 428 512 Q 433 508 438 512" fill="none" stroke="#ffe0c4" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
                  </g>
                </Wrap>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Peligros que caen del cielo */}
      <ArcadeSkyFallingHazards
        tipo={currentSectorObstacle?.tipo}
        nombre={currentSectorObstacle?.nombre}
        sectorFraction={sectorFraction}
        isFinished={isFinished}
      />

      {/* Selector de cámara para los buggies elegidos por el usuario */}
      {chosenBuggyObjects.length > 1 && (
        <div className={styles.userBuggiesSwitch}>
          <div className={styles.userSwitchHeader}>
            <span className={styles.userSwitchIcon}>🎮</span>
            <span className={styles.userSwitchLabel}>TUS BUGGIES:</span>
          </div>
          <div className={styles.userSwitchBtnGroup}>
            {chosenBuggyObjects.map((c) => {
              const isActive = (playerCar?.buggy?.name || '').toUpperCase() === c.buggy.name.toUpperCase();
              const isEliminated = Boolean(c.isEliminated);
              return (
                <button
                  key={c.name}
                  type="button"
                  className={`${styles.userBuggyBtn} ${isActive ? styles.userBuggyBtnActive : ''} ${
                    isEliminated ? styles.userBuggyBtnEliminated : ''
                  }`}
                  style={{
                    '--btn-buggy-color': c.buggy.color,
                  }}
                  onClick={() => setActiveBuggyName(c.buggy.name.toUpperCase())}
                  title={`Ver la carrera en 1ª persona desde tu Buggy ${c.buggy.name}${isEliminated ? ' (Accidentado)' : ''}`}
                >
                  <span className={styles.btnBuggySymbol}>{c.buggy.symbol}</span>
                  <span className={styles.btnBuggyName}>{c.buggy.name}</span>
                  {isActive && <span className={styles.btnBuggyActiveBadge}>EN CABINA</span>}
                  {isEliminated && <span className={styles.btnBuggyCrashedBadge}>💥</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Si eligió un solo buggy, mostrar su chapa identificadora */}
      {chosenBuggyObjects.length === 1 && (
        <div
          className={styles.singleBuggyBadge}
          style={{ '--btn-buggy-color': chosenBuggyObjects[0].buggy.color }}
        >
          <span className={styles.singleBuggyLabel}>CABINA:</span>
          <span className={styles.singleBuggyValue}>
            {chosenBuggyObjects[0].buggy.symbol} BUGGY {chosenBuggyObjects[0].buggy.name}
          </span>
        </div>
      )}

      {/* Selector para modo espectador (cuando no hay buggies elegidos) */}
      {chosenBuggyObjects.length === 0 && cars.length > 1 && (
        <div className={styles.spectatorSwitch}>
          <span className={styles.switchLabel}>VER DESDE:</span>
          {cars.map((c) => {
            const active = playerCar?.name === c.name;
            return (
              <button
                key={c.name}
                type="button"
                className={styles.spectatorBtn}
                style={{
                  borderColor: c.buggy.color,
                  color: active ? '#000' : '#fff',
                  background: active ? c.buggy.color : 'rgba(0,0,0,0.55)',
                }}
                onClick={() => setSpectatorSelectedName(c.buggy.name.toUpperCase())}
                title={`Ver la carrera desde el buggy ${c.buggy.name}`}
              >
                {c.buggy.symbol} #{c.buggy.number || ''}
              </button>
            );
          })}
        </div>
      )}

      {isPlayerEliminated && (
        <div className={styles.crashOverlay}>
          <div className={styles.crashBox}>
            <div style={{ fontSize: '2rem' }}>💥</div>
            <div style={{ color: '#ef4444', fontWeight: 900 }}>¡VEHÍCULO ACCIDENTADO!</div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: otherAliveBuggy ? '12px' : 0 }}>
              {playerCar?.causaEliminacion || 'Impacto en el tramo'}
            </div>
            {otherAliveBuggy && (
              <button
                type="button"
                className={styles.switchAliveBuggyBtn}
                style={{
                  borderColor: otherAliveBuggy.buggy.color,
                  boxShadow: `0 0 16px ${otherAliveBuggy.buggy.color}55`,
                }}
                onClick={() => setActiveBuggyName(otherAliveBuggy.buggy.name.toUpperCase())}
                title={`Cambiar a la cabina de tu otro buggy activo: ${otherAliveBuggy.buggy.name}`}
              >
                <span>CAMBIAR VISTA A {otherAliveBuggy.buggy.symbol} BUGGY {otherAliveBuggy.buggy.name}</span>
                <i className="ph ph-arrow-right" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
