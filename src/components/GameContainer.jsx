import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import InfoModal from './modals/InfoModal';
import PlayModal from './modals/PlayModal';
import styles from './GameContainer.module.css';

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

async function requestElementFullscreen(element) {
  if (!element) return;
  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }
  if (element.webkitRequestFullscreen) {
    await element.webkitRequestFullscreen();
    return;
  }
  if (element.msRequestFullscreen) {
    await element.msRequestFullscreen();
  }
}

async function exitDocumentFullscreen() {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }
  if (document.webkitExitFullscreen) {
    await document.webkitExitFullscreen();
    return;
  }
  if (document.msExitFullscreen) {
    await document.msExitFullscreen();
  }
}

export default function GameContainer() {
  const { containerRef, isVisualReady, estado } = useGame();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [infoModal, setInfoModal] = useState({ open: false, tab: 'rules' });
  const [playModalOpen, setPlayModalOpen] = useState(false);

  const [audioSettings, setAudioSettings] = useState({
    enabled: true,
    music: 60,
    effects: 90,
  });

  const sideNavRef = useRef(null);

  // Escuchar cambio de estado fullscreen nativo
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Escuchar evento de clic en JUGAR desde Phaser
  useEffect(() => {
    const handlePlayClicked = () => {
      setPlayModalOpen(true);
    };

    window.addEventListener('game:play-clicked', handlePlayClicked);
    return () => window.removeEventListener('game:play-clicked', handlePlayClicked);
  }, []);

  // Alternar pantalla completa
  const toggleFullscreen = async () => {
    try {
      if (getFullscreenElement()) {
        await exitDocumentFullscreen();
      } else {
        await requestElementFullscreen(document.documentElement);
      }
    } catch (err) {
      console.warn('[GameContainer] Error alternando pantalla completa:', err);
    }
  };

  // Alternar sonido y notificar a Phaser
  const toggleAudio = useCallback(() => {
    setAudioSettings((prev) => {
      const nextEnabled = !prev.enabled;
      window.dispatchEvent(
        new CustomEvent('game:audio-toggle', {
          detail: { muted: !nextEnabled },
        })
      );
      return { ...prev, enabled: nextEnabled };
    });
  }, []);

  const updateMusicVolume = useCallback((value) => {
    const num = Number(value);
    setAudioSettings((prev) => {
      const next = { ...prev, music: num };
      window.dispatchEvent(
        new CustomEvent('game:audio-volume', {
          detail: { music: next.music, effects: next.effects },
        })
      );
      return next;
    });
  }, []);

  const updateEffectsVolume = useCallback((value) => {
    const num = Number(value);
    setAudioSettings((prev) => {
      const next = { ...prev, effects: num };
      window.dispatchEvent(
        new CustomEvent('game:audio-volume', {
          detail: { music: next.music, effects: next.effects },
        })
      );
      return next;
    });
  }, []);

  const openInfoModal = (tab = 'rules') => {
    setInfoModal({ open: true, tab });
  };

  const closeInfoModal = () => {
    setInfoModal((prev) => ({ ...prev, open: false }));
  };

  // Definición de botones laterales (idénticos a front-caja_fuerte)
  const sideButtons = [
    {
      id: 'fullscreen',
      label: isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa',
      title: isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa',
      onClick: toggleFullscreen,
      iconClass: isFullscreen ? 'ph-corners-in' : 'ph-corners-out',
    },
    {
      id: 'info',
      label: 'Reglas y Ajustes',
      title: 'Reglas y Ajustes del juego',
      onClick: () => openInfoModal('rules'),
      iconClass: 'ph-info',
    },
    {
      id: 'sound',
      label: audioSettings.enabled ? 'Silenciar' : 'Activar sonido',
      title: audioSettings.enabled ? 'Silenciar' : 'Activar sonido',
      onClick: toggleAudio,
      iconClass: audioSettings.enabled ? 'ph-speaker-high' : 'ph-speaker-slash',
    },
  ];

  const fullscreenButton = sideButtons[0];
  const drawerButtons = sideButtons.slice(1);

  const wrapperClassName = [
    styles.wrapper,
    isVisualReady ? styles.wrapperReady : '',
    infoModal.open || playModalOpen ? styles.overlayOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClassName}>
      {/* Contenedor del Canvas Phaser */}
      <div ref={containerRef} className={styles.canvas} id="phaser-game-container" />

      {/* Barra de herramientas derecha (UI Buttons copiados de front-caja_fuerte) */}
      <nav
        ref={sideNavRef}
        className={`${styles.sideToolbar} ${isMobileMenuOpen ? styles.sideToolbarMenuOpen : ''}`}
        aria-label="Acciones del juego"
        data-drawer-enabled="true"
      >
        <div className={styles.sideToolbarTop}>
          <button
            type="button"
            className={styles.sideToolbarButton}
            onClick={fullscreenButton.onClick}
            aria-label={fullscreenButton.label}
            title={fullscreenButton.title}
          >
            <i className={`${styles.sideToolbarIcon} ph ${fullscreenButton.iconClass}`} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.sideToolbarMenu}>
          {/* Toggle para vista móvil (<= 720px) */}
          <button
            type="button"
            className={`${styles.sideToolbarButton} ${styles.sideToolbarMenuToggle}`}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? 'Cerrar menu del juego' : 'Abrir menu del juego'}
            aria-expanded={isMobileMenuOpen}
            title={isMobileMenuOpen ? 'Cerrar menu' : 'Menu'}
          >
            <i className={`${styles.sideToolbarIcon} ph ${isMobileMenuOpen ? 'ph-x' : 'ph-list'}`} aria-hidden="true" />
          </button>

          {/* Botones de acción desplegables */}
          <div className={styles.sideToolbarMenuItems}>
            {drawerButtons.map((button) => (
              <button
                key={button.id}
                type="button"
                className={styles.sideToolbarButton}
                onClick={() => {
                  button.onClick?.();
                  setIsMobileMenuOpen(false);
                }}
                aria-label={button.label}
                title={button.title}
              >
                <i className={`${styles.sideToolbarIcon} ph ${button.iconClass}`} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Modal de Información y Reglas */}
      <InfoModal
        isOpen={infoModal.open}
        tab={infoModal.tab}
        onTabChange={(tab) => setInfoModal((prev) => ({ ...prev, tab }))}
        onClose={closeInfoModal}
        audioSettings={audioSettings}
        onToggleAudio={toggleAudio}
        onUpdateMusic={updateMusicVolume}
        onUpdateEffects={updateEffectsVolume}
      />

      {/* Modal de Demostración al presionar JUGAR */}
      <PlayModal isOpen={playModalOpen} onClose={() => setPlayModalOpen(false)} />
    </div>
  );
}
