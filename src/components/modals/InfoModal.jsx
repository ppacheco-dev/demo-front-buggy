import React, { useRef, useEffect } from 'react';
import styles from '../GameContainer.module.css';

export default function InfoModal({
  isOpen,
  tab,
  onTabChange,
  onClose,
  audioSettings,
  onToggleAudio,
  onUpdateMusic,
  onUpdateEffects,
}) {
  const dialogRef = useRef(null);

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
        {/* Pestañas: Reglas y Ajustes */}
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
            className={`${styles.modalTabButton} ${tab === 'settings' ? styles.modalTabButtonActive : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <i className="ph ph-gear" aria-hidden="true" />
            <span>Ajustes</span>
          </button>
        </div>

        <div className={styles.modalTabPanel}>
          {tab === 'rules' ? (
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
