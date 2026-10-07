import { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from '../game/config/phaserConfig';

export function useGame() {
  const [estado, setEstado] = useState('idle'); // idle | loading | ready
  const [isVisualReady, setIsVisualReady] = useState(false);
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  // Escuchar cuando el canvas visual de Phaser esté listo
  useEffect(() => {
    const handleVisualReady = () => setIsVisualReady(true);
    window.addEventListener('game:visual-ready', handleVisualReady);
    return () => window.removeEventListener('game:visual-ready', handleVisualReady);
  }, []);

  // Manejo de resize reactivo para Phaser
  useEffect(() => {
    let rafId = 0;
    let timeoutId = 0;

    const refreshScale = () => {
      const game = gameRef.current;
      const container = containerRef.current;
      if (!game || !container) return;
      if (container.clientWidth <= 0 || container.clientHeight <= 0) return;
      game.scale.refresh();
    };

    const scheduleRefresh = () => {
      refreshScale();
      if (rafId) window.cancelAnimationFrame(rafId);
      if (timeoutId) window.clearTimeout(timeoutId);
      rafId = window.requestAnimationFrame(refreshScale);
      timeoutId = window.setTimeout(refreshScale, 180);
    };

    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('orientationchange', scheduleRefresh);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('resize', scheduleRefresh);
      window.removeEventListener('orientationchange', scheduleRefresh);
    };
  }, []);

  // Inicializar Phaser
  useEffect(() => {
    if (!containerRef.current) return;

    setEstado('loading');
    const config = createPhaserConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    setEstado('ready');

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return {
    containerRef,
    gameRef,
    estado,
    isVisualReady,
  };
}
