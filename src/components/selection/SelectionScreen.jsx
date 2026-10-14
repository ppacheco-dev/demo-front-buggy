import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { MARKETS, BUGGIES, getBetMultiplier } from '../../game/config/selectionData';
import { getRaceSchedule, formatSecondsToCountdown, TICKET_PRICE } from '../../game/config/raceTimeService';
import { getUserBets } from '../../game/config/userBetsService';
import styles from './SelectionScreen.module.css';

const Buggy3DViewer = React.lazy(() => import('./Buggy3DViewer'));

// Escala mínima permitida al ajustar la pantalla al tamaño disponible
const MIN_FIT_ZOOM = 0.4;

export default function SelectionScreen({ onConfirm, onBackToMenu, onOpenSettings, schedule: propSchedule }) {
  const [selectedMarketId, setSelectedMarketId] = useState('primer_lugar');
  const [selectedBuggyId, setSelectedBuggyId] = useState('amarillo');
  const [previewBuggy, setPreviewBuggy] = useState(null);
  const [localSchedule, setLocalSchedule] = useState(() => getRaceSchedule());

  const schedule = propSchedule || localSchedule;

  // Temporizador sincronizado con carreras sólo si no viene del padre
  useEffect(() => {
    if (propSchedule) return;
    const timer = setInterval(() => {
      setLocalSchedule(getRaceSchedule());
    }, 1000);
    return () => clearInterval(timer);
  }, [propSchedule]);

  // Apuestas ya realizadas por el usuario para el sorteo próximo
  const [existingBets, setExistingBets] = useState(() => {
    return getUserBets().filter(
      (b) => Number(b.targetRaceNumber) === Number(schedule?.nextRaceNumber)
    );
  });

  useEffect(() => {
    const syncBets = () => {
      const all = getUserBets();
      setExistingBets(
        all.filter((b) => Number(b.targetRaceNumber) === Number(schedule?.nextRaceNumber))
      );
    };
    syncBets();
    const interval = setInterval(syncBets, 1000);
    return () => clearInterval(interval);
  }, [schedule?.nextRaceNumber]);

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

  const activeMultiplier = getBetMultiplier(requiresBuggy ? selectedBuggy.name : null, selectedMarketId);
  const estimatedPrize = Math.round(2000 * activeMultiplier);

  // Verificación de si la combinación actual ya fue apostada para este sorteo
  const isCurrentSelectionDuplicate = useMemo(() => {
    return existingBets.some((b) => {
      if (b.market?.id !== selectedMarketId) return false;
      if (!requiresBuggy) return true; // Mercado 'ningun_auto'
      return b.buggy?.name?.toUpperCase() === selectedBuggy.name.toUpperCase();
    });
  }, [existingBets, selectedMarketId, selectedBuggy, requiresBuggy]);

  // Helper para saber si el mercado 'ningun_auto' ya fue jugado para este sorteo
  const isNingunAutoAlreadyBet = existingBets.some((b) => b.market?.id === 'ningun_auto');

  // Selección directa e instantánea sin abrir popup modal invasivo
  const handleSelectBuggy = (buggy) => {
    if (!requiresBuggy) return;
    setSelectedBuggyId(buggy.id);
  };

  const handleConfirm = () => {
    if (isCurrentSelectionDuplicate) return;
    onConfirm?.({
      market: selectedMarket,
      buggy: requiresBuggy ? selectedBuggy : null,
      raceInfo: schedule,
      multiplier: activeMultiplier,
      premioEstimado: `$${estimatedPrize.toLocaleString('es-CL')}`,
    });
  };

  // ---------------------------------------------------------------------------
  // Ajuste al viewport: escala toda la pantalla (manteniendo el diseño original)
  // para que siempre quepa completa dentro del iframe, sin scrollbars.
  // Se usa `zoom` (no `transform`) para no alterar los elementos `position: fixed`.
  // ---------------------------------------------------------------------------
  const containerRef = useRef(null);
  const zoomRef = useRef(1);

  const fitToViewport = useCallback(() => {
    const el = containerRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const W = parent.clientWidth;
    const H = parent.clientHeight;
    if (!W || !H) return; // Pantalla oculta (display: none)

    const apply = (z) => {
      el.style.zoom = String(z);
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.width = `${W / z}px`;
      el.style.height = `${H / z}px`;
    };

    // Alto visual natural del contenido (sin estirar por space-between)
    const measure = (z) => {
      const cs = window.getComputedStyle(el);
      const kids = Array.from(el.children).filter(
        (c) => !c.classList.contains(styles.previewBackdrop)
      );
      let total = (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) * z;
      const gap = parseFloat(cs.rowGap) || 0;
      total += gap * Math.max(0, kids.length - 1) * z;
      kids.forEach((k) => {
        const ks = window.getComputedStyle(k);
        total += k.getBoundingClientRect().height;
        total += ((parseFloat(ks.marginTop) || 0) + (parseFloat(ks.marginBottom) || 0)) * z;
      });
      return total;
    };

    let z = zoomRef.current || 1;
    for (let i = 0; i < 5; i += 1) {
      apply(z);
      const content = measure(z);
      if (!content) break;
      const next = Math.max(MIN_FIT_ZOOM, Math.min(1, z * (H / content) * 0.995));
      if (Math.abs(next - z) < 0.002) {
        z = next;
        break;
      }
      z = next;
    }
    apply(z);
    zoomRef.current = z;
  }, []);

  useLayoutEffect(() => {
    fitToViewport();
    const parent = containerRef.current?.parentElement;
    const ro = new ResizeObserver(() => fitToViewport());
    if (parent) ro.observe(parent);
    window.addEventListener('resize', fitToViewport);
    // Recalcular cuando terminan de cargar las imágenes
    const imgs = containerRef.current?.querySelectorAll('img') || [];
    imgs.forEach((img) => img.addEventListener('load', fitToViewport));
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fitToViewport);
      imgs.forEach((img) => img.removeEventListener('load', fitToViewport));
    };
  }, [fitToViewport]);

  // Recalcular si cambia contenido que altera alturas
  useLayoutEffect(() => {
    fitToViewport();
  }, [fitToViewport, existingBets.length, isCurrentSelectionDuplicate, selectedMarketId]);

  return (
    <div className={styles.container} ref={containerRef}>
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
            {existingBets.length > 0 && (
              <div
                className={styles.activeBetsPill}
                title={`Tienes ${existingBets.length} apuesta(s) registrada(s) para la carrera Nº ${schedule.nextRaceNumber}`}
              >
                <i className="ph ph-ticket" aria-hidden="true" />
                <span className={styles.activeBetsLabel}>APUESTAS:</span>
                <span className={styles.activeBetsCount}>{existingBets.length}</span>
              </div>
            )}
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
            const isMarketAlreadyBet = market.id === 'ningun_auto' && isNingunAutoAlreadyBet;
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
                  {isMarketAlreadyBet && (
                    <div className={styles.marketAlreadyBetBadge}>
                      ✓ YA JUGADO
                    </div>
                  )}
                  {market.ruleBadge && (
                    <div
                      className={styles.marketRuleBadge}
                      style={{
                        borderColor: market.accentColor,
                        color: market.accentColor,
                      }}
                    >
                      {market.ruleBadge}
                    </div>
                  )}
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
                  {requiresBuggy && (
                    <span
                      className={styles.buggyOddsPill}
                      title={`Factor para ${selectedMarket.name}: ${getBetMultiplier(buggy.name, selectedMarketId).toFixed(1).replace('.', ',')}x`}
                    >
                      {getBetMultiplier(buggy.name, selectedMarketId).toFixed(1).replace('.', ',')}x
                    </span>
                  )}
                </div>

                <span
                  className={styles.buggyZoomHint}
                  title={`Ver ficha técnica 3D de Buggy ${buggy.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewBuggy(buggy);
                  }}
                >
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
        <div className={styles.confirmButtonWrapper}>
          {isCurrentSelectionDuplicate && (
            <div className={styles.duplicateWarning}>
              <i className="ph ph-warning-circle" aria-hidden="true" />
              <span>Ya apostaste por esta combinación para este sorteo</span>
            </div>
          )}
          <button
            type="button"
            className={`${styles.confirmButton} ${isCurrentSelectionDuplicate ? styles.confirmButtonDisabled : ''}`}
            onClick={isCurrentSelectionDuplicate ? undefined : handleConfirm}
            disabled={isCurrentSelectionDuplicate}
            title={
              isCurrentSelectionDuplicate
                ? `Ya realizaste esta apuesta para el sorteo Nº ${schedule.nextRaceNumber}.`
                : 'Confirmar Selección y Jugar'
            }
          >
            <span>Confirmar Selección y Jugar</span>
            <i className={`ph ph-caret-double-right ${styles.confirmButtonIcon}`} aria-hidden="true" />
          </button>
        </div>
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
