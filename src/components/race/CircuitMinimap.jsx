import React, { useRef, useEffect, useState } from 'react';
import styles from './CircuitMinimap.module.css';

/**
 * CircuitMinimap: Minimapa radar GPS estilo videojuego arcade.
 * Representa el trazado cerrado del Circuito Dunas del Pacífico con los 6 buggies
 * moviéndose en tiempo real, sectores, obstáculos y meta.
 */
export default function CircuitMinimap({
  cars = [],
  rankedCars = [],
  progress = 0,
  userBuggyName = null,
  isUserRace = false,
  isFinished = false,
}) {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);

  // Trazado del circuito Dunas del Pacífico (SVG path cerrado)
  const trackPathD =
    'M 75 145 L 225 145 C 265 145, 290 120, 280 85 C 270 48, 230 35, 195 45 C 165 55, 150 72, 125 52 C 100 32, 60 26, 40 60 C 20 95, 28 132, 55 144 Z';

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Función para obtener coordenada en el mapa a partir del progreso (0 a 1)
  const getPointAt = (pct) => {
    if (!pathRef.current || !pathLength) {
      return { x: 75, y: 145 };
    }
    const clamped = Math.max(0, Math.min(0.999, pct));
    const dist = clamped * pathLength;
    return pathRef.current.getPointAtLength(dist);
  };

  // Posiciones de los 8 sectores y obstáculos a lo largo del circuito
  const sectorMarkers = [
    { label: 'S1', icon: '🪨', pct: 0.125, name: 'Rocas' },
    { label: 'S2', icon: '🕳️', pct: 0.25, name: 'Hoyos' },
    { label: 'S3', icon: '☄️', pct: 0.375, name: 'Meteoritos' },
    { label: 'S4', icon: '🏜️', pct: 0.50, name: 'Dunas' },
    { label: 'S5', icon: '⚡', pct: 0.625, name: 'Grietas' },
    { label: 'S6', icon: '🪨', pct: 0.75, name: 'Avalancha' },
    { label: 'S7', icon: '☄️', pct: 0.875, name: 'Impacto' },
  ];

  // Coordenadas calculadas de cada auto
  const leaderCar = rankedCars.find((c) => !c.isEliminated) || rankedCars[0] || null;
  const activeCount = cars.filter((c) => !c.isEliminated).length;

  return (
    <div className={styles.minimapCard}>
      {/* Header del Radar */}
      <div className={styles.minimapHeader}>
        <div className={styles.radarTitleGroup}>
          <i className={`ph ph-radar ${styles.radarIcon}`} aria-hidden="true" />
          <span className={styles.radarTitle}>GPS RADAR • DUNAS</span>
        </div>

        <div className={styles.liveTag}>
          <span className={styles.liveDot} />
          <span>{isFinished ? 'FINAL' : 'EN VIVO'}</span>
        </div>
      </div>

      {/* Contenedor del Mapa Vectorial */}
      <div className={styles.mapSvgWrapper}>
        <div className={styles.radarSweep} />

        <svg viewBox="0 0 310 170" className={styles.svgMap}>
          {/* Anillos concéntricos de radar */}
          <circle cx="155" cy="85" r="40" className={styles.gridRing} />
          <circle cx="155" cy="85" r="75" className={styles.gridRing} />
          <line x1="155" y1="5" x2="155" y2="165" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />
          <line x1="5" y1="85" x2="305" y2="85" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />

          {/* 1. Capas del trazado de la pista */}
          {/* Resplandor exterior */}
          <path d={trackPathD} className={styles.trackGlow} />
          {/* Base asfáltica */}
          <path d={trackPathD} className={styles.trackBacking} />
          {/* Pista principal */}
          <path d={trackPathD} className={styles.trackMain} />
          {/* Bordillos vibratorios */}
          <path d={trackPathD} className={styles.trackCurb} />
          {/* Línea central discontinua */}
          <path ref={pathRef} d={trackPathD} className={styles.trackCenterLine} />

          {/* 2. Marcador de Meta / Largada (75, 145) */}
          <g className={styles.finishMarker} transform="translate(68, 137)">
            <rect x="0" y="0" width="14" height="16" fill="#000" rx="2" />
            <rect x="0" y="0" width="7" height="8" fill="#fff" />
            <rect x="7" y="8" width="7" height="8" fill="#fff" />
            <rect x="0" y="0" width="14" height="16" fill="none" stroke="#f59e0b" strokeWidth="1" rx="2" />
          </g>

          {/* 3. Marcadores de Sectores y Obstáculos */}
          {pathLength > 0 &&
            sectorMarkers.map((sec, i) => {
              const pt = getPointAt(sec.pct);
              return (
                <g key={i} className={styles.circuitMarker} transform={`translate(${pt.x}, ${pt.y})`}>
                  <circle cx="0" cy="0" r="5" className={styles.markerCircle} />
                  <text x="0" y="0.5" className={styles.markerIcon}>
                    {sec.icon}
                  </text>
                </g>
              );
            })}

          {/* 4. Blips de los 6 Buggies en tiempo real */}
          {pathLength > 0 &&
            cars.map((car, idx) => {
              // Progreso relativo del auto a lo largo de la pista (150m a 1140m)
              const carPct = Math.min(0.999, Math.max(0, (car.x - 150) / (1140 - 150)));
              const pt = getPointAt(carPct);

              const isUserBuggy =
                isUserRace &&
                userBuggyName &&
                userBuggyName.includes(car.buggy.name.toUpperCase());

              return (
                <g
                  key={car.name}
                  className={styles.blipGroup}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  style={{ '--car-color': car.buggy.color }}
                >
                  {/* Aura brillante detrás del auto activo */}
                  {!car.isEliminated && (
                    <circle cx="0" cy="0" r="8" fill={car.buggy.color} className={styles.blipAura} />
                  )}

                  {/* Baliza de radar si es el auto por el que apostó el usuario */}
                  {isUserBuggy && !car.isEliminated && (
                    <circle cx="0" cy="0" r="6" className={styles.userTargetBeacon} />
                  )}

                  {/* Blip central del auto */}
                  {car.isEliminated ? (
                    <>
                      <circle cx="0" cy="0" r="5" className={styles.crashedBlipCore} />
                      <text x="0" y="0.5" className={styles.crashedCross}>
                        ✕
                      </text>
                    </>
                  ) : (
                    <>
                      <circle
                        cx="0"
                        cy="0"
                        r="5.5"
                        fill={car.buggy.color}
                        className={styles.blipCore}
                      />
                      <text x="0" y="0.5" className={styles.blipNumber}>
                        {idx + 1}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Footer con mini telemetría */}
      <div className={styles.minimapFooter}>
        <div className={styles.footerLeft}>
          <span>Líder:</span>
          <span className={styles.leaderPill}>
            {leaderCar ? `${leaderCar.buggy.symbol} ${leaderCar.buggy.name}` : 'Nadie'}
          </span>
        </div>

        <div className={styles.footerRight}>
          <span>Activos:</span>
          <span className={styles.distBadge}>
            {activeCount}/{cars.length}
          </span>
        </div>
      </div>
    </div>
  );
}
