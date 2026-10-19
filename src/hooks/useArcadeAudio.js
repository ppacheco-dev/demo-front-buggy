import { useState, useEffect, useCallback } from 'react';
import arcadeAudio from '../game/audio/arcadeAudioEngine';

/**
 * Hook para integrar el motor de audio arcade con componentes de React.
 */
export function useArcadeAudio() {
  const [isMuted, setIsMuted] = useState(() => arcadeAudio.isMuted);
  const [volume, setVolumeState] = useState(() => arcadeAudio.volume);

  useEffect(() => {
    const unsubscribe = arcadeAudio.subscribe((muted, vol) => {
      setIsMuted(muted);
      setVolumeState(vol);
    });
    return unsubscribe;
  }, []);

  const toggleMute = useCallback(() => {
    return arcadeAudio.toggleMute();
  }, []);

  const setMuted = useCallback((muted) => {
    arcadeAudio.setMuted(muted);
  }, []);

  const setVolume = useCallback((vol) => {
    arcadeAudio.setVolume(vol);
  }, []);

  const playCountdown = useCallback((count) => {
    arcadeAudio.playCountdown(count);
  }, []);

  const startRaceAmbience = useCallback(() => {
    arcadeAudio.startEngine();
    arcadeAudio.startRaceMusic();
  }, []);

  const updateTelemetry = useCallback(({ speedKmh, progress, isBoosting }) => {
    arcadeAudio.setEngineSpeed(speedKmh, isBoosting);
    arcadeAudio.setRaceProgress(progress);
  }, []);

  const playCrash = useCallback((obstacleType) => {
    arcadeAudio.playCrashSound(obstacleType);
  }, []);

  const playJump = useCallback(() => {
    arcadeAudio.playJumpSound();
  }, []);

  const playMeteor = useCallback(() => {
    arcadeAudio.playMeteorImpact();
  }, []);

  const playCelebration = useCallback(() => {
    arcadeAudio.playCelebration();
  }, []);

  const stopAll = useCallback(() => {
    arcadeAudio.stopAll();
  }, []);

  return {
    isMuted,
    volume,
    toggleMute,
    setMuted,
    setVolume,
    playCountdown,
    startRaceAmbience,
    updateTelemetry,
    playCrash,
    playJump,
    playMeteor,
    playCelebration,
    stopAll,
  };
}

export default useArcadeAudio;
