import React, { useRef, useEffect, useState } from 'react';
import { getUserBets, getBetStatus } from '../../game/config/userBetsService';
import styles from '../GameContainer.module.css';
import betStyles from './InfoModal.module.css';

export default function InfoModal({
  isOpen,
  tab,
  onTabChange,
  onClose,
  audioSettings,
  onToggleAudio,
  onUpdateMusic,
  onUpdateEffects,
  onViewBet,
  onWatchRace,
  onGoToBet,
}) {
  const dialogRef = useRef(null);
  const [bets, setBets] = useState([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setBets(getUserBets());
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.infoModalDialog}
      aria-labelledby="info-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={styles.infoModalCard}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Pestañas: Mis Apuestas, Reglas y Ajustes */}
        <div className={styles.modalTabBar}>
          <button
            type="button"
            className={`${styles.modalTabButton} ${tab === 'bets' ? styles.modalTabButtonActive : ''}`}
            onClick={() => onTabChange('bets')}
          >
            <i className="ph ph-receipt" aria-hidden="true" />
            <span>Mis Apuestas</span>
          </button>
          <button
            type="button"
            className={`${styles.modalTabButton} ${tab === 'rules' ? styles.modalTabButtonActive : ''}`}
            onClick={() => onTabChange('rules')}
          >
            <i className="ph ph-book-open" aria-hidden="true" />
            <span>Reglas</span>
          </button>
          <button
            type="button"
            className={`${styles.modalTabButton} ${tab === 'settings' ? styles.modalTabButtonActive : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <i className="ph ph-gear" aria-hidden="true" />
            <span>Ajustes</span>
          </button>
        </div>

        <div className={styles.modalTabPanel}>
          {tab === 'bets' ? (
            <>
              <div className={styles.infoModalHeader}>
                <p className={styles.infoModalEyebrow}>Historial del Jugador</p>
                <h2 id="info-dialog-title" className={styles.infoModalTitle}>
                  Mis Apuestas Jugadas
                </h2>
                <p className={styles.infoModalSubtitle}>
                  Historial de tus apuestas realizadas, con fechahora, monto, resultado oficial y comprobante.
                </p>
              </div>

              {bets.length > 0 && (
                <div className={betStyles.betsSummaryBar}>
                  <div className={betStyles.summaryItem}>
                    <span className={betStyles.summaryLabel}>Total Jugadas</span>
                    <span className={betStyles.summaryValue}>{bets.length}</span>
                  </div>
                  <div className={betStyles.summaryItem}>
                    <span className={betStyles.summaryLabel}>Invertido</span>
                    <span className={betStyles.summaryValue}>${(bets.length * 2500).toLocaleString('es-CL')}</span>
                  </div>
                  <div className={betStyles.summaryItem}>
                    <span className={betStyles.summaryLabel}>Ganadas</span>
                    <span className={`${betStyles.summaryValue} ${betStyles.summaryWon}`}>
                      {bets.filter((b) => getBetStatus(b).estado === 'GANADA').length}
                    </span>
                  </div>
                  <div className={betStyles.summaryItem}>
                    <span className={betStyles.summaryLabel}>Pendientes</span>
                    <span className={`${betStyles.summaryValue} ${betStyles.summaryPending}`}>
                      {bets.filter((b) => ['PENDIENTE', 'EN_CURSO'].includes(getBetStatus(b).estado)).length}
                    </span>
                  </div>
                </div>
              )}

              {bets.length === 0 ? (
                <div className={betStyles.emptyBetsState}>
                  <i className={`ph ph-receipt-x ${betStyles.emptyBetsIcon}`} aria-hidden="true" />
                  <h3 className={betStyles.emptyBetsTitle}>No tienes apuestas registradas</h3>
                  <p className={betStyles.emptyBetsDesc}>
                    Realiza tu primera jugada seleccionando tu buggy favorito o el mercado especial en el circuito.
                  </p>
                  {onGoToBet && (
                    <button
                      type="button"
                      className={betStyles.irAJugarBtn}
                      onClick={onGoToBet}
                    >
                      <i className="ph ph-flag-checkered" aria-hidden="true" />
                      <span>Ir a Jugar</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className={betStyles.betsList}>
                  {bets.map((bet) => {
                    const status = getBetStatus(bet);
                    const cardClass = `${betStyles.betCard} ${
                      status.estado === 'GANADA'
                        ? betStyles.betCardWon
                        : status.estado === 'PERDIDA'
                        ? betStyles.betCardLost
                        : ''
                    }`;

                    return (
                      <div key={bet.id || bet.ticketId} className={cardClass}>
                        {/* Header: Ticket ID, FechaHora y Monto */}
                        <div className={betStyles.betHeader}>
                          <div className={betStyles.betMetaLeft}>
                            <span className={betStyles.betTicketBadge}>#{bet.ticketId || bet.id}</span>
                            <span className={betStyles.betDateTime}>
                              <i className="ph ph-calendar-blank" aria-hidden="true" />
                              {bet.fechahora || `${bet.fecha || ''} ${bet.hora || ''}`}
                            </span>
                          </div>
                          <span className={betStyles.betMonto}>{bet.monto || '$2.500'}</span>
                        </div>

                        {/* Body: Mercado, Buggy y Carrera */}
                        <div className={betStyles.betBody}>
                          <div className={betStyles.betChoiceGroup}>
                            <span className={betStyles.betMarketName}>
                              {bet.market?.name || 'Primer Lugar'}
                            </span>
                            <div
                              className={betStyles.betBuggyTag}
                              style={{ color: bet.buggy?.color || '#facc15' }}
                            >
                              <span>{bet.buggy?.symbol || '⚡'}</span>
                              <span>
                                {bet.buggy?.name
                                  ? `Buggy ${bet.buggy.name}`
                                  : (bet.market?.id === 'ningun_auto' ? 'Catástrofe (Ningún auto)' : 'Buggy')}
                              </span>
                            </div>
                          </div>

                          <div className={betStyles.betRaceTag}>
                            <span>Carrera <strong>#{bet.targetRaceNumber}</strong></span>
                            <span>Hora: {bet.targetRaceTime} hrs</span>
                          </div>
                        </div>

                        {/* Footer: Resultado Oficial y Botón Ver Jugada */}
                        <div className={betStyles.betFooter}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className={`${betStyles.betStatusBadge} ${betStyles[status.badgeClass] || ''}`}>
                              {status.estado === 'GANADA' && <i className="ph ph-trophy" aria-hidden="true" />}
                              {status.estado === 'PERDIDA' && <i className="ph ph-x-circle" aria-hidden="true" />}
                              {status.estado === 'EN_CURSO' && <i className="ph ph-broadcast" aria-hidden="true" />}
                              {status.estado === 'PENDIENTE' && <i className="ph ph-clock" aria-hidden="true" />}
                              <span>{status.label}</span>
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                              {status.detalle}
                            </span>
                          </div>

                          <div className={betStyles.betActionsGroup}>
                            <button
                              type="button"
                              className={betStyles.verJugadaBtn}
                              onClick={() => onViewBet?.(bet)}
                              title="Ver comprobante y detalle de jugada"
                            >
                              <i className="ph ph-ticket" aria-hidden="true" />
                              <span>Ver Jugada</span>
                            </button>

                            {onWatchRace && status.race && (
                              <button
                                type="button"
                                className={betStyles.verCarreraActionBtn}
                                onClick={() => onWatchRace?.(status.race)}
                                title="Ver carrera correspondiente"
                              >
                                <i className="ph ph-video" aria-hidden="true" />
                                <span>Ver Carrera</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : tab === 'rules' ? (
            <>
              <div className={styles.infoModalHeader}>
                <p className={styles.infoModalEyebrow}>Reglas y Dinámica Oficial</p>
                <h2 id="info-dialog-title" className={styles.infoModalTitle}>
                  Buggy: Circuito Dunas del Pacífico
                </h2>
                <p className={styles.infoModalSubtitle}>
                  Carreras 4x4 en vivo cada 5 minutos, con obstáculos extremos en 8 tramos y múltiples opciones de pronóstico.
                </p>
              </div>

              <div className={styles.infoModalBody}>
                <div className={styles.infoRulesBlock}>
                  <p className={styles.infoRuleItem}>
                    1. <strong>Carreras en Vivo cada 5 Minutos:</strong> Se transmite una carrera oficial en tiempo real con 6 buggies, telemetría, velocímetro y radar GPS de circuito.
                  </p>
                  <p className={styles.infoRuleItem}>
                    2. <strong>Mercados de Selección:</strong> Pronostica cuál buggy obtendrá el <strong>1º Lugar</strong>, <strong>2º Lugar</strong>, <strong>3º Lugar (Podio)</strong>, o si <strong>Ningún Auto Llega a la Meta</strong>.
                  </p>
                  <p className={styles.infoRuleItem}>
                    3. <strong>Obstáculos Letales en 8 Tramos:</strong> En cada tramo aparecen rocas gigantes, socavones, dunas cortantes y meteoritos. Los buggies intentan esquivarlos o saltarlos; si colisionan quedan destruidos y eliminados de la carrera.
                  </p>
                  <p className={styles.infoRuleItem}>
                    4. <strong>Condición de Catástrofe:</strong> Si la pista destruye a todos los 6 buggies y ninguno cruza la meta final, el mercado <em>"Ningún auto llega a la meta"</em> es el ganador oficial.
                  </p>
                  <p className={styles.infoRuleItem}>
                    5. <strong>Dos Cámaras de Transmisión:</strong> Durante la carrera en vivo puedes alternar libremente entre la vista <strong>Clásica 2D</strong> y la vista en perspectiva <strong>Arcade 2.5D</strong>.
                  </p>
                </div>
                <div
                  className={styles.infoAssetBlock}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <i className="ph ph-flag-checkered" style={{ fontSize: '42px', color: '#f59e0b', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#facc15', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    PRECIO POR JUGADA: $2.500
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', textAlign: 'center', lineHeight: 1.35 }}>
                    Elige tu mercado, selecciona tu buggy y sigue la carrera en vivo con su voucher oficial numerado.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.settingsHeaderRow}>
                <div className={styles.infoModalHeader}>
                  <p className={styles.infoModalEyebrow}>Configuración</p>
                  <h2 id="info-dialog-title" className={styles.infoModalTitle}>
                    Configuración de Audio
                  </h2>
                  <p className={styles.infoModalSubtitle}>Gestiona el sonido y los efectos del juego.</p>
                </div>
                <button
                  type="button"
                  className={audioSettings.enabled ? styles.settingsStateEnabled : styles.settingsStateMuted}
                  onClick={onToggleAudio}
                >
                  {audioSettings.enabled ? 'Habilitado' : 'Muteado'}
                </button>
              </div>

              <div className={styles.settingsModalBody}>
                <div className={styles.settingsSliderBlock}>
                  <label className={styles.settingsSliderLabel} htmlFor="music-volume-range">
                    Música
                    <span>{audioSettings.music}%</span>
                  </label>
                  <input
                    id="music-volume-range"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={audioSettings.music}
                    onChange={(e) => onUpdateMusic(e.target.value)}
                    className={styles.settingsSlider}
                  />
                </div>

                <div className={styles.settingsSliderBlock}>
                  <label className={styles.settingsSliderLabel} htmlFor="sfx-volume-range">
                    Efectos
                    <span>{audioSettings.effects}%</span>
                  </label>
                  <input
                    id="sfx-volume-range"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={audioSettings.effects}
                    onChange={(e) => onUpdateEffects(e.target.value)}
                    className={styles.settingsSlider}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <button type="button" className={styles.infoModalButton} onClick={onClose}>
          ENTENDIDO
        </button>
      </div>
    </dialog>
  );
}
