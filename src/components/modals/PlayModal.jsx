import React, { useRef, useEffect, useState } from 'react';
import { TICKET_PRICE, getRaceSchedule } from '../../game/config/raceTimeService';
import { getBetMultiplier } from '../../game/config/selectionData';
import styles from './PlayModal.module.css';

/**
 * PlayModal: Voucher oficial de participación.
 * Layout compacto en dos columnas: a la izquierda el recibo (carrera, apuesta, factor, premio,
 * dónde ver la carrera y acciones) y a la derecha el mapa del circuito con la ficha técnica.
 * El número de carrera es el dato más visible y aparece una sola vez.
 */
export default function PlayModal({ isOpen, onClose, selection, onViewLiveRace, onGoToHome }) {
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
              COLUMNA 1: RECIBO OFICIAL / VOUCHER DE COMPRA
              ================================================================ */}
          <div className={styles.voucherLeftCol}>
            {/* Encabezado */}
            <div className={styles.voucherHeader}>
              <div className={styles.ticketIconCircle}>
                <i className="ph ph-ticket" aria-hidden="true" />
              </div>
              <div className={styles.headerTexts}>
                <span className={styles.subTitle}>VOUCHER DE PARTICIPACIÓN OFICIAL</span>
                <h2 className={styles.mainTitle}>¡SELECCIÓN CONFIRMADA!</h2>
                <span className={styles.ticketIdText}>
                  Ticket ID: #{ticketId} • Válido para transmisión oficial
                </span>
              </div>
            </div>

            {/* Número de carrera: dato principal */}
            <div className={styles.raceStrip}>
              <div className={styles.raceStripMain}>
                <span className={styles.raceStripLabel}>CARRERA</span>
                <span className={styles.raceStripNumber}>Nº {nextRaceNumber}</span>
              </div>
              <div className={styles.raceStripSide}>
                <span className={styles.raceStripTime}>Hora: {nextRaceTime} hrs</span>
                <span className={isTargetRaceLive ? styles.statusLive : styles.statusWait}>
                  {isTargetRaceLive ? '● EN VIVO AHORA' : 'PRÓXIMA CARRERA • AÚN NO COMIENZA'}
                </span>
              </div>
            </div>

            {/* Detalles de la apuesta */}
            <div className={styles.betCard}>
              <div className={styles.betItem}>
                <span className={styles.detailLabel}>Mercado</span>
                <span className={styles.betValue} style={{ color: marketColor }}>{marketName}</span>
                {selection?.market?.ruleBadge && (
                  <span className={styles.betSub}>{selection.market.ruleBadge}</span>
                )}
              </div>

              <div className={styles.betItem}>
                <span className={styles.detailLabel}>Vehículo Elegido</span>
                <span className={styles.betValue} style={{ color: buggyColor }}>
                  {buggySymbol} {buggyName}
                </span>
              </div>

              <div className={`${styles.betItem} ${styles.betItemHighlight}`}>
                <span className={styles.detailLabel}>Precio Pagado</span>
                <span className={styles.betValue}>{ticketPrice}</span>
                <span className={styles.paidOk}>✓ Pago Confirmado</span>
              </div>

              <div className={styles.betItem}>
                <span className={styles.detailLabel}>Factor de Apuesta</span>
                <span className={`${styles.betValue} ${styles.betFactor}`}>
                  {factor.toFixed(1).replace('.', ',')}x
                </span>
                <span className={styles.betSub}>Multiplicador oficial</span>
              </div>

              <div className={`${styles.betItem} ${styles.betItemHighlight} ${styles.betItemWide}`}>
                <span className={styles.detailLabel}>Premio en caso de Ganar</span>
                <span className={`${styles.betValue} ${styles.betPrize}`}>
                  ${estimatedPrize.toLocaleString('es-CL')}
                </span>
                <span className={styles.paidOk}>Pago estimado</span>
              </div>
            </div>

            {/* Dónde ver la carrera */}
            <div className={styles.infoBanner}>
              <div className={styles.infoBannerIcon}>
                <i className="ph ph-television-simple" aria-hidden="true" />
              </div>
              <div className={styles.infoBannerText}>
                <span className={styles.infoBannerTitle}>¿Dónde ver la carrera?</span>
                <span className={styles.infoBannerBody}>
                  Al cumplirse las <strong>{nextRaceTime} hrs</strong>, presiona <strong>"VER CARRERA"</strong> para
                  seguir la transmisión en vivo.
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className={styles.actionBtns}>
              {isTargetRaceLive && (
                <button type="button" onClick={handleWatchRace} className={styles.watchRaceBtn}>
                  <i className="ph ph-broadcast" aria-hidden="true" />
                  <span>VER CARRERA EN DIRECTO AHORA</span>
                </button>
              )}
              <button type="button" onClick={handleGoHome} className={styles.goHomeBtn}>
                VOLVER AL INICIO A ESPERAR LA CARRERA
              </button>
            </div>
          </div>

          {/* ================================================================
              COLUMNA 2: MAPA DE LA CARRERA QUE SE VA A REALIZAR
              ================================================================ */}
          <div className={styles.voucherRightCol}>
            <div className={styles.mapTitleHeader}>
              <div className={styles.mapTitleLeft}>
                <i className={`ph ph-compass ${styles.mapRadarIcon}`} aria-hidden="true" />
                <span className={styles.mapTitleText}>MAPA OFICIAL DEL CIRCUITO</span>
              </div>
              <span className={styles.circuitTag}>DUNAS DEL PACÍFICO</span>
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

            {/* Posición en la grilla de salida */}
            {selection?.buggy ? (
              <div className={styles.userGridBadge}>
                <div className={styles.userGridLeft}>
                  <span className={styles.userGridSymbol} style={{ background: buggyColor, color: '#000' }}>
                    {buggySymbol}
                  </span>
                  <div>
                    <div className={styles.userGridText}>{buggyName} en la Grilla de Salida</div>
                    <div className={styles.userGridSub}>Carrera Nº {nextRaceNumber} • {nextRaceTime} hrs</div>
                  </div>
                </div>
                <span className={styles.userGridTag}>CONFIRMADO</span>
              </div>
            ) : (
              <div className={styles.userGridBadge}>
                <div className={styles.userGridLeft}>
                  <span className={styles.userGridSymbol} style={{ background: '#0ea5e9', color: '#000' }}>
                    ✕
                  </span>
                  <div>
                    <div className={styles.userGridText}>Pronóstico: Ningún Auto Llega</div>
                    <div className={styles.userGridSub}>Supervivencia extrema en los 7 sectores</div>
                  </div>
                </div>
                <span className={styles.userGridTag}>ACTIVO</span>
              </div>
            )}

            {/* Ficha técnica de la pista */}
            <div className={styles.circuitStatsGrid}>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Longitud</div>
                <div className={styles.statPillValue}>1,140 m</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Sectores</div>
                <div className={styles.statPillValue}>8 Tramos</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Peligros</div>
                <div className={styles.statPillValue} style={{ color: '#ef4444' }}>7 Zonas</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Superficie</div>
                <div className={styles.statPillValue}>Arena / Asfalto</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Clima</div>
                <div className={styles.statPillValue} style={{ color: '#facc15' }}>Dunas Soleadas</div>
              </div>
              <div className={styles.statPill}>
                <div className={styles.statPillLabel}>Dificultad</div>
                <div className={styles.statPillValue} style={{ color: '#f59e0b' }}>Extrema</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
