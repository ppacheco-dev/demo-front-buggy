import React, { useRef, useEffect, useState } from 'react';
import { TICKET_PRICE, getRaceSchedule } from '../../game/config/raceTimeService';
import { getBetMultiplier } from '../../game/config/selectionData';
import styles from './PlayModal.module.css';

/**
 * PlayModal: Voucher oficial de participación.
 * Layout limpio en dos columnas, sin datos repetidos:
 *  - Izquierda: carrera (número, hora, estado), resumen de la apuesta (mercado, vehículo,
 *    apuesta, factor y premio) y acciones.
 *  - Derecha: mapa del circuito con una ficha técnica mínima.
 */
export default function PlayModal({ isOpen, onClose, selection, onViewLiveRace, onGoToHome, onGoToBet }) {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);

  // Trazado oficial del Circuito Dunas del Pacífico
  const trackPathD =
    'M 75 145 L 225 145 C 265 145, 290 120, 280 85 C 270 48, 230 35, 195 45 C 165 55, 150 72, 125 52 C 100 32, 60 26, 40 60 C 20 95, 28 132, 55 144 Z';

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [isOpen]);

  // Reloj para que el botón de directo aparezca solo cuando comienza la carrera apostada
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!isOpen) return undefined;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const marketName = selection?.market?.name || 'PRIMER LUGAR';
  const buggyName = selection?.buggy
    ? `Buggy ${selection.buggy.name}`
    : (selection?.market?.id === 'ningun_auto' ? 'Sin Ganador' : 'Buggy Amarillo');
  const marketColor = selection?.market?.accentColor || '#f59e0b';
  const buggyColor = selection?.buggy?.color || '#facc15';
  const buggySymbol = selection?.buggy?.symbol || '⚡';

  const factor = getBetMultiplier(selection?.buggy?.name, selection?.market?.id);
  const montoBase = selection?.montoNum || 2000;
  const estimatedPrize = Math.round(montoBase * factor);

  const nextRaceNumber =
    selection?.targetRaceNumber ||
    selection?.raceInfo?.nextRaceNumber ||
    ((selection?.raceInfo?.currentRaceNumber || 184) + 1);
  const nextRaceTime = selection?.targetRaceTime || selection?.raceInfo?.nextRaceTime || '15:15';
  const ticketPrice = selection?.monto || selection?.precio || TICKET_PRICE;
  const ticketId = selection?.ticketId || selection?.id || 'BG-583921';

  // El botón "Ver carrera en directo" solo aplica si la carrera apostada es la que se está transmitiendo ahora
  const isTargetRaceLive = Number(nextRaceNumber) === getRaceSchedule(new Date(nowTick)).currentRaceNumber;

  // Posiciones de los 7 sectores tácticos con obstáculos en el mapa
  const sectorMarkers = [
    { label: 'S1', icon: '🪨', pct: 0.125, name: 'Rocas' },
    { label: 'S2', icon: '🕳️', pct: 0.25, name: 'Hoyos' },
    { label: 'S3', icon: '☄️', pct: 0.375, name: 'Meteoritos' },
    { label: 'S4', icon: '🏜️', pct: 0.50, name: 'Dunas' },
    { label: 'S5', icon: '⚡', pct: 0.625, name: 'Grietas' },
    { label: 'S6', icon: '🪨', pct: 0.75, name: 'Avalancha' },
    { label: 'S7', icon: '☄️', pct: 0.875, name: 'Impacto' },
  ];

  const getPointAt = (pct) => {
    if (!pathRef.current || !pathLength) {
      return { x: 75, y: 145 };
    }
    const clamped = Math.max(0, Math.min(0.999, pct));
    const dist = clamped * pathLength;
    return pathRef.current.getPointAtLength(dist);
  };

  const handleWatchRace = () => {
    onClose?.();
    onViewLiveRace?.(selection);
  };

  const handleGoHome = () => {
    onClose?.();
    onGoToHome?.();
  };

  const stopModalEvents = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      onPointerDown={stopModalEvents}
      onPointerUp={stopModalEvents}
      onMouseDown={stopModalEvents}
      onMouseUp={stopModalEvents}
      onTouchStart={stopModalEvents}
      onTouchEnd={stopModalEvents}
    >
      <div
        className={styles.modalCard}
        onClick={stopModalEvents}
        onPointerDown={stopModalEvents}
        onPointerUp={stopModalEvents}
      >
        <button
          type="button"
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Cerrar voucher"
        >
          <i className="ph ph-x" aria-hidden="true" />
        </button>

        <div className={styles.voucherGrid}>
          {/* ================================================================
              COLUMNA 1: VOUCHER (carrera, apuesta y acciones)
              ================================================================ */}
          <div className={styles.voucherLeftCol}>
            <div className={styles.voucherHeader}>
              <div className={styles.ticketIconCircle}>
                <i className="ph ph-ticket" aria-hidden="true" />
              </div>
              <div className={styles.headerTexts}>
                <h2 className={styles.mainTitle}>¡Selección confirmada!</h2>
                <span className={styles.ticketIdText}>Ticket #{ticketId}</span>
              </div>
            </div>

            {/* Carrera: número, hora y estado en una sola franja */}
            <div className={styles.raceStrip}>
              <div className={styles.raceStripMain}>
                <span className={styles.raceStripLabel}>CARRERA</span>
                <span className={styles.raceStripNumber}>{`Nº ${nextRaceNumber}`}</span>
              </div>
              <div className={styles.raceStripSide}>
                <span className={styles.raceStripTime}>{nextRaceTime} hrs</span>
                <span className={isTargetRaceLive ? styles.statusLive : styles.statusWait}>
                  {isTargetRaceLive ? '● EN VIVO' : 'PRÓXIMA'}
                </span>
              </div>
            </div>

            {/* Resumen de la apuesta */}
            <div className={styles.betCard}>
              <div className={styles.betRow}>
                <span className={styles.detailLabel}>Mercado</span>
                <span className={styles.betRowValue} style={{ color: marketColor }}>{marketName}</span>
              </div>
              <div className={styles.betRow}>
                <span className={styles.detailLabel}>Vehículo</span>
                <span className={styles.betRowValue} style={{ color: buggyColor }}>
                  {buggySymbol} {buggyName}
                </span>
              </div>
              <div className={styles.betTiles}>
                <div className={styles.betTile}>
                  <span className={styles.detailLabel}>Apuesta</span>
                  <span className={styles.betValue}>{ticketPrice}</span>
                </div>
                <div className={styles.betTile}>
                  <span className={styles.detailLabel}>Factor</span>
                  <span className={`${styles.betValue} ${styles.betFactor}`}>
                    {factor.toFixed(1).replace('.', ',')}x
                  </span>
                </div>
                <div className={`${styles.betTile} ${styles.betTilePrize}`}>
                  <span className={styles.detailLabel}>Premio si ganas</span>
                  <span className={`${styles.betValue} ${styles.betPrize}`}>
                    ${estimatedPrize.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.actionBtns}>
              <button
                type="button"
                onClick={handleWatchRace}
                className={styles.watchRaceBtn}
                title="Ver la carrera en directo"
              >
                <span className={styles.watchRaceLiveDot} />
                <span>VER CARRERA</span>
              </button>
              {onGoToBet && (
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onGoToBet?.();
                  }}
                  className={styles.addAnotherBetBtn}
                  title="Hacer otra jugada para este mismo sorteo"
                >
                  <i className="ph ph-plus-circle" aria-hidden="true" />
                  <span>HACER OTRA APUESTA</span>
                </button>
              )}
              <button type="button" onClick={handleGoHome} className={styles.goHomeBtn}>
                VOLVER AL INICIO
              </button>
            </div>
          </div>

          {/* ================================================================
              COLUMNA 2: MAPA DEL CIRCUITO
              ================================================================ */}
          <div className={styles.voucherRightCol}>
            <div className={styles.mapTitleHeader}>
              <i className={`ph ph-compass ${styles.mapRadarIcon}`} aria-hidden="true" />
              <span className={styles.mapTitleText}>CIRCUITO DUNAS DEL PACÍFICO</span>
            </div>

            <div className={styles.mapSvgWrapper}>
              <svg viewBox="0 0 310 170" className={styles.svgCircuit} aria-label="Mapa del circuito Dunas del Pacífico">
                {/* Cuadrícula de radar táctico */}
                <circle cx="155" cy="85" r="42" className={styles.gridRing} />
                <circle cx="155" cy="85" r="75" className={styles.gridRing} />
                <line x1="155" y1="6" x2="155" y2="164" stroke="rgba(56,189,248,0.06)" strokeDasharray="2 4" />
                <line x1="6" y1="85" x2="304" y2="85" stroke="rgba(56,189,248,0.06)" strokeDasharray="2 4" />

                {/* Trazado de pista */}
                <path d={trackPathD} className={styles.trackGlow} />
                <path d={trackPathD} className={styles.trackBase} />
                <path d={trackPathD} className={styles.trackMain} />
                <path ref={pathRef} d={trackPathD} className={styles.trackCenterLine} />

                {/* Marcador de Largada y Meta con bandera a cuadros */}
                <g transform="translate(67, 137)">
                  <rect x="0" y="0" width="16" height="16" fill="#000" rx="3" />
                  <rect x="0" y="0" width="8" height="8" fill="#fff" />
                  <rect x="8" y="8" width="8" height="8" fill="#fff" />
                  <rect x="0" y="0" width="16" height="16" fill="none" stroke="#f59e0b" strokeWidth="1.2" rx="3" />
                  <text x="8" y="-4" fill="#facc15" fontSize="7" fontWeight="900" textAnchor="middle">
                    META / SALIDA
                  </text>
                </g>

                {/* Marcadores de los 7 obstáculos a lo largo del circuito */}
                {pathLength > 0 &&
                  sectorMarkers.map((sec, i) => {
                    const pt = getPointAt(sec.pct);
                    return (
                      <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
                        <circle cx="0" cy="0" r="6" className={styles.markerCircle} />
                        <text x="0" y="0.5" className={styles.markerIcon}>
                          {sec.icon}
                        </text>
                      </g>
                    );
                  })}

                {/* Posición en grilla de salida del buggy seleccionado */}
                {selection?.buggy && (
                  <g transform="translate(76, 145)">
                    <circle cx="0" cy="0" r="8" fill={buggyColor} opacity="0.45">
                      <animate attributeName="r" values="6;11;6" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="5.5" fill={buggyColor} stroke="#fff" strokeWidth="1.5" />
                    <text x="0" y="0.5" fontSize="6" fill="#000" fontWeight="900" textAnchor="middle" dominantBaseline="central">
                      {selection.buggy.name?.[0] || '1'}
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Ficha técnica mínima */}
            <div className={styles.circuitStatsGrid}>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Longitud</div>
                <div className={styles.statPillValue}>1,140 m</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Tramos</div>
                <div className={styles.statPillValue}>8</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Peligros</div>
                <div className={styles.statPillValue} style={{ color: '#ef4444' }}>7 zonas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
