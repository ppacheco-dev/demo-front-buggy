import React, { useState, useEffect } from 'react';
import { MARKETS, BUGGIES } from '../../game/config/selectionData';
import { getRaceSchedule, formatSecondsToCountdown, TICKET_PRICE } from '../../game/config/raceTimeService';
import styles from './SelectionScreen.module.css';

const Buggy3DViewer = React.lazy(() => import('./Buggy3DViewer'));

export default function SelectionScreen({ onConfirm, onBackToMenu, onOpenSettings }) {
  const [selectedMarketId, setSelectedMarketId] = useState('primer_lugar');
  const [selectedBuggyId, setSelectedBuggyId] = useState('amarillo');
  const [previewBuggy, setPreviewBuggy] = useState(null);
  const [schedule, setSchedule] = useState(() => getRaceSchedule());

  // Temporizador sincronizado con carreras cada 5 minutos
  useEffect(() => {
    const timer = setInterval(() => {
      setSchedule(getRaceSchedule());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cerrar preview con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewBuggy(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedMarket = MARKETS.find((m) => m.id === selectedMarketId) || MARKETS[0];
  const selectedBuggy = BUGGIES.find((b) => b.id === selectedBuggyId) || BUGGIES[0];
  const requiresBuggy = selectedMarket.requiresBuggy !== false;

  const handleSelectBuggy = (buggy) => {
    if (!requiresBuggy) return;
    setSelectedBuggyId(buggy.id);
    setPreviewBuggy(buggy);
  };

  const handleConfirm = () => {
    onConfirm?.({
      market: selectedMarket,
      buggy: requiresBuggy ? selectedBuggy : null,
      raceInfo: schedule,
    });
  };

  return (
    <div className={styles.container}>
      {/* 1. TOP BAR */}
      <header className={styles.topBar}>
        <div className={styles.topBarMainRow}>
          <button
            type="button"
            className={styles.backButton}
            onClick={onBackToMenu}
            title="Volver al menú principal"
          >
            <i className="ph ph-arrow-left" aria-hidden="true" />
            <span>Inicio</span>
          </button>

          <div className={styles.brandLogoWrap} onClick={onBackToMenu} title="Volver al menú principal">
            <img src="/assets/images/logo_clean.webp" alt="Buggy Logo" className={styles.brandLogoImg} />
          </div>

          <div className={styles.statsGroup}>
            <div className={styles.pricePill} title="Precio por jugada">
              <span className={styles.priceLabel}>PRECIO:</span>
              <span className={styles.priceValue}>{TICKET_PRICE}</span>
            </div>
          </div>
        </div>

        <div className={styles.centerInfo}>
          <div className={styles.raceTimeBlock}>
            <span className={styles.infoLabel}>Próxima Carrera</span>
            <span className={styles.raceTimeValue}>{schedule.nextRaceTime}</span>
          </div>

          <div className={styles.countdownBlock}>
            <span className={styles.infoLabel}>Cierre de Selección</span>
            <div className={styles.countdownRow}>
              <i className={`ph ph-timer ${styles.countdownIcon}`} aria-hidden="true" />
              <span className={styles.countdownValue}>
                {formatSecondsToCountdown(schedule.remainingSeconds)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SECTION 1: MERCADOS */}
      <section className={styles.marketsSection}>
        <div className={styles.sectionBanner}>
          <span className={styles.sectionTitle}>1. Elige el Mercado</span>
        </div>

        <div className={styles.marketsGrid}>
          {MARKETS.map((market) => {
            const isSelected = selectedMarketId === market.id;
            return (
              <div
                key={market.id}
                className={`${styles.marketCard} ${isSelected ? styles.marketCardSelected : ''}`}
                onClick={() => setSelectedMarketId(market.id)}
                style={{
                  '--accent-color': market.accentColor,
                  '--accent-glow': market.borderGlow,
                }}
              >
                <div className={styles.marketHeader}>
                  <h3 className={styles.marketTitle}>{market.name}</h3>
                  <p className={styles.marketDesc}>{market.description}</p>
                </div>

                <div className={styles.marketIconWrap}>
                  <img src={market.icon} alt={market.name} className={styles.marketIconImg} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SECTION 2: BUGGIES */}
      <section className={styles.buggiesSection}>
        <div className={styles.sectionBanner}>
          <span className={styles.sectionTitle}>2. Elige tu Buggy</span>
        </div>

        <div className={styles.buggiesGrid}>
          {BUGGIES.map((buggy) => {
            const isSelected = selectedBuggyId === buggy.id && requiresBuggy;
            const isDisabled = !requiresBuggy;
            return (
              <div
                key={buggy.id}
                className={`${styles.buggyCard} ${isSelected ? styles.buggyCardSelected : ''} ${
                  isDisabled ? styles.buggyDisabled : ''
                }`}
                onClick={() => handleSelectBuggy(buggy)}
                style={{
                  '--buggy-color': buggy.color,
                  '--buggy-glow': buggy.glowColor,
                }}
              >
                <div className={styles.buggyImageWrap}>
                  <img src={buggy.image} alt={buggy.name} className={styles.buggyImg} />
                </div>

                <div className={styles.buggyPlatform} />

                <div className={styles.buggyFooter}>
                  <span className={styles.buggySymbol}>{buggy.symbol}</span>
                  <span className={styles.buggyName}>{buggy.name}</span>
                </div>

                <span className={styles.buggyZoomHint} title="Presionar para ver muestra ampliada">
                  <i className="ph ph-magnifying-glass-plus" aria-hidden="true" />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. BOTTOM BAR */}
      <footer className={styles.bottomBar}>
        {/* Info Box */}
        <div className={styles.infoBox}>
          <i className={`ph ph-info ${styles.infoIcon}`} aria-hidden="true" />
          <div className={styles.infoTextWrap}>
            <span className={styles.infoTitle}>Cada carrera es un sorteo</span>
            <span className={styles.infoSubtitle}>
              El resultado de la carrera se determina al azar. Revisa las reglas del juego para más información.
            </span>
          </div>
        </div>

        {/* Selected Summary */}
        <div className={styles.selectionBox}>
          <span className={styles.selectionBoxTitle}>Tu Selección</span>
          <div className={styles.selectionRow}>
            {/* Mercado Seleccionado */}
            <div className={styles.selectionItem}>
              <img src={selectedMarket.icon} alt={selectedMarket.name} className={styles.selectionItemImg} />
              <div className={styles.selectionItemText}>
                <span className={styles.selectionItemLabel}>Mercado</span>
                <span className={styles.selectionItemValue} style={{ color: selectedMarket.accentColor }}>
                  {selectedMarket.name}
                </span>
              </div>
            </div>

            {/* Buggy Seleccionado */}
            <div className={styles.selectionItem}>
              {requiresBuggy ? (
                <>
                  <img src={selectedBuggy.image} alt={selectedBuggy.name} className={styles.selectionItemImg} />
                  <div className={styles.selectionItemText}>
                    <span className={styles.selectionItemLabel}>Buggy</span>
                    <span className={styles.selectionItemValue} style={{ color: selectedBuggy.color }}>
                      {selectedBuggy.name}
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.selectionItemText} style={{ paddingLeft: '8px' }}>
                  <span className={styles.selectionItemLabel}>Vehículo</span>
                  <span className={styles.selectionItemValue} style={{ color: '#94a3b8' }}>
                    Ningún Auto
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirm & Play Button */}
        <button
          type="button"
          className={styles.confirmButton}
          onClick={handleConfirm}
          title="Confirmar Selección y Jugar"
        >
          <span>Confirmar Selección y Jugar</span>
          <i className={`ph ph-caret-double-right ${styles.confirmButtonIcon}`} aria-hidden="true" />
        </button>
      </footer>

      {/* Modal Ampliado: Izquierda Imagen/Animación, Derecha Detalles */}
      {previewBuggy && (
        <div className={styles.previewBackdrop} onClick={() => setPreviewBuggy(null)}>
          <div
            className={styles.previewCard}
            onClick={(e) => e.stopPropagation()}
            style={{
              '--preview-color': previewBuggy.color,
              '--preview-glow': previewBuggy.glowColor,
            }}
          >
            <button
              type="button"
              className={styles.previewCloseBtn}
              onClick={() => setPreviewBuggy(null)}
              aria-label="Cerrar muestra"
            >
              <i className="ph ph-x" aria-hidden="true" />
            </button>

            {/* COLUMNA IZQUIERDA: Imagen y Animación del Buggy */}
            <div className={styles.previewLeftStage}>
              <div className={styles.previewTagBadge}>
                <span>{previewBuggy.tagline || 'EDICIÓN ESPECIAL'}</span>
              </div>

              <div className={styles.previewGlowCircle} />

              <div className={styles.previewCarContainer}>
                {previewBuggy.model ? (
                  <React.Suspense
                    fallback={
                      <img
                        src={previewBuggy.image}
                        alt={previewBuggy.name}
                        className={styles.previewCarImg}
                      />
                    }
                  >
                    <Buggy3DViewer
                      modelUrl={previewBuggy.model}
                      fallbackImage={previewBuggy.image}
                      buggyColor={previewBuggy.color}
                      glowColor={previewBuggy.glowColor}
                      buggyName={previewBuggy.name}
                    />
                  </React.Suspense>
                ) : (
                  <img
                    src={previewBuggy.image}
                    alt={previewBuggy.name}
                    className={styles.previewCarImg}
                  />
                )}
              </div>

              {!previewBuggy.model && (
                <div className={styles.previewPlatformBase} />
              )}
            </div>

            {/* COLUMNA DERECHA: Detalles del Buggy */}
            <div className={styles.previewRightDetails}>
              <div className={styles.previewDetailsHeader}>
                <span className={styles.previewEyebrow}>FICHA TÉCNICA DEL VEHÍCULO</span>
                <h3 className={styles.previewTitle} style={{ color: previewBuggy.color }}>
                  {previewBuggy.symbol} BUGGY {previewBuggy.name}
                </h3>
                {previewBuggy.description && (
                  <p className={styles.previewDesc}>{previewBuggy.description}</p>
                )}
              </div>

              {/* Barras de rendimiento */}
              {previewBuggy.stats && (
                <div className={styles.previewStatsList}>
                  <div className={styles.previewStatItem}>
                    <div className={styles.previewStatHead}>
                      <span>Velocidad</span>
                      <span className={styles.previewStatNum}>{previewBuggy.stats.velocidad}%</span>
                    </div>
                    <div className={styles.previewProgressBar}>
                      <div
                        className={styles.previewProgressFill}
                        style={{ width: `${previewBuggy.stats.velocidad}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.previewStatItem}>
                    <div className={styles.previewStatHead}>
                      <span>Aceleración</span>
                      <span className={styles.previewStatNum}>{previewBuggy.stats.aceleracion}%</span>
                    </div>
                    <div className={styles.previewProgressBar}>
                      <div
                        className={styles.previewProgressFill}
                        style={{ width: `${previewBuggy.stats.aceleracion}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.previewStatItem}>
                    <div className={styles.previewStatHead}>
                      <span>Tracción / Agarre</span>
                      <span className={styles.previewStatNum}>{previewBuggy.stats.traccion}%</span>
                    </div>
                    <div className={styles.previewProgressBar}>
                      <div
                        className={styles.previewProgressFill}
                        style={{ width: `${previewBuggy.stats.traccion}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Especificaciones en badges */}
              {previewBuggy.specs && (
                <div className={styles.previewSpecsGrid}>
                  <div className={styles.previewSpecBadge}>
                    <span className={styles.previewSpecLabel}>Motor</span>
                    <span className={styles.previewSpecValue}>{previewBuggy.specs.motor}</span>
                  </div>
                  <div className={styles.previewSpecBadge}>
                    <span className={styles.previewSpecLabel}>Potencia</span>
                    <span className={styles.previewSpecValue}>{previewBuggy.specs.potencia}</span>
                  </div>
                  <div className={styles.previewSpecBadge}>
                    <span className={styles.previewSpecLabel}>Tracción</span>
                    <span className={styles.previewSpecValue}>{previewBuggy.specs.traccion}</span>
                  </div>
                  <div className={styles.previewSpecBadge}>
                    <span className={styles.previewSpecLabel}>Peso</span>
                    <span className={styles.previewSpecValue}>{previewBuggy.specs.peso}</span>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className={styles.previewActions}>
                <button
                  type="button"
                  className={styles.previewSelectBtn}
                  onClick={() => {
                    setSelectedBuggyId(previewBuggy.id);
                    setPreviewBuggy(null);
                  }}
                >
                  <i className="ph ph-check-bold" aria-hidden="true" />
                  <span>SELECCIONAR ESTE AUTO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
