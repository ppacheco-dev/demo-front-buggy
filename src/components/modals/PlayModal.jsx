import React, { useRef, useEffect, useState } from 'react';
import { TICKET_PRICE } from '../../game/config/raceTimeService';
import styles from './PlayModal.module.css';

/**
 * PlayModal: Voucher oficial de participación.
 * Muestra a un lado el recibo oficial de compra y al otro lado el mapa detallado
 * del Circuito Dunas del Pacífico donde se correrá la carrera elegida.
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

  if (!isOpen) return null;

  const marketName = selection?.market?.name || 'PRIMER LUGAR';
  const buggyName = selection?.buggy
    ? `Buggy ${selection.buggy.name}`
    : (selection?.market?.id === 'ningun_auto' ? 'Ningún auto' : 'Buggy Amarillo');
  const marketColor = selection?.market?.accentColor || '#f59e0b';
  const buggyColor = selection?.buggy?.color || '#facc15';
  const buggySymbol = selection?.buggy?.symbol || '⚡';

  const nextRaceNumber =
    selection?.targetRaceNumber ||
    selection?.raceInfo?.nextRaceNumber ||
    ((selection?.raceInfo?.currentRaceNumber || 184) + 1);
  const nextRaceTime = selection?.targetRaceTime || selection?.raceInfo?.nextRaceTime || '15:15';
  const ticketPrice = selection?.monto || selection?.precio || TICKET_PRICE;
  const ticketId = selection?.ticketId || selection?.id || 'BG-583921';

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
        {/* Botón cerrar X */}
        <button
          type="button"
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Cerrar voucher"
        >
          <i className="ph ph-x" aria-hidden="true" />
        </button>

        {/* Layout en dos columnas: Izquierda Voucher | Derecha Mapa de la Carrera */}
        <div className={styles.voucherGrid}>
          {/* ================================================================
              COLUMNA 1: RECIBO OFICIAL / VOUCHER DE COMPRA
              ================================================================ */}
          <div className={styles.voucherLeftCol}>
            {/* Encabezado del Voucher */}
            <div className={styles.voucherHeader}>
              <div className={styles.ticketIconCircle}>
                <i className="ph ph-ticket" aria-hidden="true" />
              </div>
              <span className={styles.subTitle}>
                VOUCHER DE PARTICIPACIÓN OFICIAL
              </span>
              <h2 className={styles.mainTitle}>
                ¡SELECCIÓN CONFIRMADA!
              </h2>
              <span className={styles.ticketIdText}>
                Ticket ID: #{ticketId} • Válido para transmisión oficial
              </span>
            </div>

            {/* Detalles del Voucher */}
            <div className={styles.voucherDetailsCard}>
              {/* Fila 1: Carrera & Precio */}
              <div className={styles.rowGrid}>
                <div className={styles.detailBox}>
                  <div className={styles.detailLabel}>Carrera Elegida</div>
                  <div className={styles.detailValueRace}>
                    Carrera #{nextRaceNumber}
                  </div>
                  <div className={styles.detailSub}>
                    Hora: {nextRaceTime} hrs
                  </div>
                </div>

                <div className={styles.detailBoxHighlight}>
                  <div className={styles.detailLabel}>Precio Pagado</div>
                  <div className={styles.detailValuePrice}>{ticketPrice}</div>
                  <div className={styles.detailSubConfirmed}>✓ Pago Confirmado</div>
                </div>
              </div>

              {/* Fila 2: Mercado & Vehículo */}
              <div className={styles.rowGrid}>
                <div className={styles.detailBox}>
                  <div className={styles.detailLabel}>Mercado</div>
                  <div style={{ fontSize: '0.92rem', color: marketColor, fontWeight: 900, marginTop: '2px' }}>
                    {marketName}
                  </div>
                </div>

                <div className={styles.detailBox}>
                  <div className={styles.detailLabel}>Vehículo Elegido</div>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      color: buggyColor,
                      fontWeight: 900,
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{buggySymbol}</span>
                    <span>{buggyName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Dónde ver la carrera */}
            <div className={styles.infoBanner}>
              <div className={styles.infoBannerIcon}>
                <i className="ph ph-television-simple" aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  ¿Dónde ver la carrera?
                </div>
                <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.45, marginTop: '2px' }}>
                  Al cumplirse las <strong>{nextRaceTime} hrs</strong>, presiona <strong>"VER CARRERA"</strong> para seguir la transmisión en vivo en directo.
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className={styles.actionBtns}>
              <button
                type="button"
                onClick={handleWatchRace}
                className={styles.watchRaceBtn}
              >
                <i className="ph ph-broadcast" style={{ fontSize: '1.2rem' }} aria-hidden="true" />
                <span>VER CARRERA EN DIRECTO AHORA</span>
              </button>

              <button
                type="button"
                onClick={handleGoHome}
                className={styles.goHomeBtn}
              >
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

            {/* Contenedor del Mapa Vectorial */}
            <div className={styles.mapSvgWrapper}>
              <svg viewBox="0 0 310 170" className={styles.svgCircuit}>
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

            {/* Posición en Grilla de Salida */}
            {selection?.buggy ? (
              <div className={styles.userGridBadge}>
                <div className={styles.userGridLeft}>
                  <span
                    className={styles.userGridSymbol}
                    style={{ background: buggyColor, color: '#000' }}
                  >
                    {buggySymbol}
                  </span>
                  <div>
                    <div className={styles.userGridText}>
                      {buggyName} en la Grilla de Salida
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      Carrera #{nextRaceNumber} • {nextRaceTime} hrs
                    </div>
                  </div>
                </div>
                <span className={styles.userGridTag}>CONFIRMADO</span>
              </div>
            ) : (
              <div className={styles.userGridBadge}>
                <div className={styles.userGridLeft}>
                  <span
                    className={styles.userGridSymbol}
                    style={{ background: '#0ea5e9', color: '#000' }}
                  >
                    ✕
                  </span>
                  <div>
                    <div className={styles.userGridText}>Pronóstico: Ningún Auto Llega</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      Supervivencia extrema en los 7 sectores
                    </div>
                  </div>
                </div>
                <span className={styles.userGridTag}>ACTIVO</span>
              </div>
            )}

            {/* Ficha Técnica de la Pista */}
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
