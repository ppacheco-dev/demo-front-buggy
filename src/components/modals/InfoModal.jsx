import React, { useRef, useEffect, useState } from 'react';
import { getUserBets, getBetStatus } from '../../game/config/userBetsService';
import styles from '../GameContainer.module.css';
import tableStyles from './InfoModal.module.css';

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

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
      setCurrentPage(1);
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(bets.length / ITEMS_PER_PAGE));
  const pagedBets = bets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const isHistoryActive = tab === 'history' || tab === 'bets';

  const stopModalEvents = (e) => {
    e.stopPropagation();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.infoModalDialog}
      aria-labelledby="info-dialog-title"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onPointerDown={stopModalEvents}
      onPointerUp={stopModalEvents}
      onMouseDown={stopModalEvents}
      onMouseUp={stopModalEvents}
      onTouchStart={stopModalEvents}
      onTouchEnd={stopModalEvents}
    >
      <div
        className={styles.infoModalCard}
        onClick={stopModalEvents}
        onPointerDown={stopModalEvents}
        onPointerUp={stopModalEvents}
        onMouseDown={stopModalEvents}
        onMouseUp={stopModalEvents}
        onTouchStart={stopModalEvents}
        onTouchEnd={stopModalEvents}
      >
        {/* Pestañas: 1. Reglas, 2. Historial (al medio), 3. Ajustes */}
        <div className={styles.modalTabBar}>
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
            className={`${styles.modalTabButton} ${isHistoryActive ? styles.modalTabButtonActive : ''}`}
            onClick={() => onTabChange('history')}
          >
            <i className="ph ph-clock-counter-clockwise" aria-hidden="true" />
            <span>Historial</span>
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
          {isHistoryActive ? (
            /* TABLA OFICIAL DE HISTORIAL (Idéntica a imagen de referencia) */
            <div className={tableStyles.historyTableContainer}>
              <div className={tableStyles.historyTopHeader}>
                <i className={`ph ph-clock-counter-clockwise ${tableStyles.historyTopIcon}`} aria-hidden="true" />
                <h2 id="info-dialog-title" className={tableStyles.historyTopTitle}>
                  Historial
                </h2>
              </div>

              {bets.length === 0 ? (
                <div className={tableStyles.emptyHistory}>
                  <i className={`ph ph-receipt-x ${tableStyles.emptyHistoryIcon}`} aria-hidden="true" />
                  <p>No hay jugadas registradas en el historial.</p>
                </div>
              ) : (
                <div className={tableStyles.tableWrapper}>
                  <table className={tableStyles.historyTable}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>N°Ticket</th>
                        <th>Precio</th>
                        <th>Premio</th>
                        <th>Ver jugada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedBets.map((bet) => {
                        const status = getBetStatus(bet);
                        const isWon = status.estado === 'GANADA';
                        const prizeText = isWon ? (status.premio || '$4.000') : '$0';
                        const ticketDisplay = String(bet.ticketId || bet.id).replace(/^BG-?/i, '');
                        const dateDisplay = bet.fechahora || `${bet.fecha || ''}, ${bet.hora || ''}`;

                        return (
                          <tr key={bet.id || bet.ticketId}>
                            <td className={tableStyles.dateCol}>{dateDisplay}</td>
                            <td className={tableStyles.ticketCol}>{ticketDisplay}</td>
                            <td className={tableStyles.priceCol}>{bet.precio || bet.monto || '$2.000'}</td>
                            <td className={isWon ? tableStyles.prizeWonCol : tableStyles.prizeZeroCol}>
                              {prizeText}
                            </td>
                            <td className={tableStyles.actionCol}>
                              <button
                                type="button"
                                className={tableStyles.viewBetBtn}
                                onClick={() => onViewBet?.(bet)}
                                title="Ver comprobante de esta jugada"
                              >
                                <i className="ph ph-eye" aria-hidden="true" />
                                <span>Ver jugada</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginación idéntica a la referencia: < Pág 1 de 1 > */}
              <div className={tableStyles.paginationRow}>
                <button
                  type="button"
                  className={tableStyles.pageNavBtn}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  <i className="ph ph-caret-left" aria-hidden="true" />
                </button>
                <span className={tableStyles.pageInfo}>
                  Pág {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  className={tableStyles.pageNavBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Página siguiente"
                >
                  <i className="ph ph-caret-right" aria-hidden="true" />
                </button>
              </div>
            </div>
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
                    PRECIO POR JUGADA: $2.000
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
