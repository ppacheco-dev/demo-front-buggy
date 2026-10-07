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
                <p className={styles.infoModalEyebrow}>Normas del Juego</p>
                <h2 id="info-dialog-title" className={styles.infoModalTitle}>
                  Buggy - Carrera Playera
                </h2>
                <p className={styles.infoModalSubtitle}>
                  Compite por la costa arenosa, esquiva obstáculos y recolecta monedas doradas.
                </p>
              </div>

              <div className={styles.infoModalBody}>
                <div className={styles.infoRulesBlock}>
                  <p className={styles.infoRuleItem}>
                    1. Presiona <strong>JUGAR</strong> para iniciar tu turno en la carrera.
                  </p>
                  <p className={styles.infoRuleItem}>
                    2. Los buggies compiten a gran velocidad a lo largo del circuito costero.
                  </p>
                  <p className={styles.infoRuleItem}>
                    3. Recolecta monedas de oro en la pista para multiplicar tu puntuación y tus recompensas.
                  </p>
                  <p className={styles.infoRuleItem}>
                    4. Mantén la concentración en las curvas de arena para evitar derrapes.
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
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <i className="ph ph-trophy" style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '8px' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f3f4f6', letterSpacing: '0.05em' }}>
                    GRAN PREMIO BUGGY
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', textAlign: 'center' }}>
                    Gana monedas y sube en la clasificación
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
