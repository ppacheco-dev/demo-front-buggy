import React, { useMemo } from 'react';
import styles from './ArcadeSkyFallingHazards.module.css';

/**
 * ArcadeSkyFallingHazards:
 * Animaciones cinematográficas de alta velocidad de objetos que caen efectivamente desde el cielo
 * (Meteoritos con estela de fuego, reentrada atmosférica, impacto explosivo y onda de choque en el suelo).
 */
export default function ArcadeSkyFallingHazards({
  tipo = 'ROCAS',
  nombre = '',
  sectorFraction = 0,
  isFinished = false,
}) {
  const normTipo = (tipo || '').toUpperCase();
  const isMeteor = normTipo === 'METEORITOS';
  const isAvalancha = normTipo === 'ROCAS' && (nombre || '').toLowerCase().includes('avalancha');

  // Si la carrera finalizó o no corresponde a un evento aéreo/caída, no renderizar
  if (isFinished || (!isMeteor && !isAvalancha)) {
    return null;
  }

  // Ventana activa de meteoritos en este sector: 0.04 a 0.54
  const isMeteorActive = isMeteor && sectorFraction >= 0.04 && sectorFraction <= 0.54;
  // Ventana activa de avalancha: 0.05 a 0.44
  const isAvalanchaActive = isAvalancha && sectorFraction >= 0.05 && sectorFraction <= 0.44;

  if (!isMeteorActive && !isAvalanchaActive) {
    return null;
  }

  // =========================================================================
  // METEORITOS: 3 Bólidos con Trayectoria Balística Realista desde el Espacio
  // =========================================================================
  // 1. Meteorito Izquierdo
  const tFall1 = Math.min(1, Math.max(0, (sectorFraction - 0.05) / 0.27));
  const ease1 = tFall1 * tFall1;
  const m1X = 22 + (30 - 22) * ease1; // %
  const m1Y = -14 + (46 - (-14)) * ease1; // %
  const m1Scale = 0.35 + ease1 * 0.80;
  const m1Visible = tFall1 > 0 && tFall1 < 1;

  // Impacto 1
  const tImpact1 = Math.min(1, Math.max(0, (sectorFraction - 0.32) / 0.16));
  const showImpact1 = tFall1 >= 1 && tImpact1 < 1;

  // 2. Meteorito Central GIGANTE (Protagonista principal del cielo)
  const tFall2 = Math.min(1, Math.max(0, (sectorFraction - 0.07) / 0.26));
  const ease2 = tFall2 * tFall2;
  const m2X = 50; // %
  const m2Y = -24 + (51 - (-24)) * ease2; // %
  const m2Scale = 0.45 + ease2 * 1.15;
  const m2Visible = tFall2 > 0 && tFall2 < 1;

  // Impacto 2 (El más masivo)
  const tImpact2 = Math.min(1, Math.max(0, (sectorFraction - 0.33) / 0.18));
  const showImpact2 = tFall2 >= 1 && tImpact2 < 1;

  // 3. Meteorito Derecho
  const tFall3 = Math.min(1, Math.max(0, (sectorFraction - 0.06) / 0.27));
  const ease3 = tFall3 * tFall3;
  const m3X = 78 + (70 - 78) * ease3; // %
  const m3Y = -16 + (48 - (-16)) * ease3; // %
  const m3Scale = 0.38 + ease3 * 0.82;
  const m3Visible = tFall3 > 0 && tFall3 < 1;

  // Impacto 3
  const tImpact3 = Math.min(1, Math.max(0, (sectorFraction - 0.33) / 0.16));
  const showImpact3 = tFall3 >= 1 && tImpact3 < 1;

  // =========================================================================
  // AVALANCHA DE PIEDRAS: Boulders rodando colina abajo
  // =========================================================================
  const tRock1 = Math.min(1, Math.max(0, (sectorFraction - 0.06) / 0.28));
  const easeRock1 = tRock1 * tRock1;
  const r1X = 10 + (24 - 10) * easeRock1;
  const r1Y = 22 + (48 - 22) * easeRock1 + Math.abs(Math.sin(tRock1 * Math.PI * 3)) * -6;
  const r1Rot = tRock1 * 720;
  const r1Scale = 0.45 + easeRock1 * 0.65;

  const tRock2 = Math.min(1, Math.max(0, (sectorFraction - 0.08) / 0.28));
  const easeRock2 = tRock2 * tRock2;
  const r2X = 90 + (74 - 90) * easeRock2;
  const r2Y = 20 + (49 - 20) * easeRock2 + Math.abs(Math.sin(tRock2 * Math.PI * 3.5)) * -7;
  const r2Rot = -tRock2 * 840;
  const r2Scale = 0.40 + easeRock2 * 0.70;

  return (
    <div className={styles.skyHazardOverlay} aria-hidden="true">
      {/* 1. RESPLANDOR ROJIZO DE REENTRADA ATMOSFÉRICA */}
      {isMeteorActive && (
        <>
          <div className={styles.atmosphericEntryGlow} />
          {/* Estelas sónicas en la estratosfera */}
          <div className={styles.sonicStreaksContainer}>
            <div className={styles.sonicStreakLine} style={{ left: '26%', top: '4%', height: '70px', transform: 'rotate(-8deg)' }} />
            <div className={styles.sonicStreakLine} style={{ left: '50%', top: '2%', height: '95px', transform: 'rotate(0deg)' }} />
            <div className={styles.sonicStreakLine} style={{ left: '74%', top: '5%', height: '75px', transform: 'rotate(8deg)' }} />
          </div>
        </>
      )}

      {/* 2. METEORITO 1 (IZQUIERDO) */}
      {isMeteorActive && m1Visible && (
        <div
          className={styles.fallingMeteorItem}
          style={{
            left: `${m1X}%`,
            top: `${m1Y}%`,
            transform: `translate(-50%, -50%) scale(${m1Scale}) rotate(-10deg)`,
          }}
        >
          <svg className={styles.meteorSvg} width="64" height="150" viewBox="0 0 64 150" fill="none">
            <defs>
              <linearGradient id="plasmaTailGrad1" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                <stop offset="40%" stopColor="#ea580c" stopOpacity="0.45" />
                <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.85" />
                <stop offset="95%" stopColor="#fef08a" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
              <radialGradient id="plasmaCore1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#dc2626" />
              </radialGradient>
            </defs>
            {/* Cola de fuego y plasma aerodinámica */}
            <path d="M 32 8 Q 12 75 22 136 L 42 136 Q 52 75 32 8 Z" fill="url(#plasmaTailGrad1)" />
            <path d="M 32 40 Q 24 90 28 138 L 36 138 Q 40 90 32 40 Z" fill="#ffffff" opacity="0.8" />
            {/* Núcleo ardiente de la roca */}
            <circle cx="32" cy="136" r="14" fill="url(#plasmaCore1)" filter="drop-shadow(0 0 10px #f59e0b)" />
            <circle cx="32" cy="136" r="7" fill="#ffffff" />
          </svg>
        </div>
      )}

      {/* 3. METEORITO 2 (CENTRAL GIGANTE) */}
      {isMeteorActive && m2Visible && (
        <div
          className={styles.fallingMeteorItem}
          style={{
            left: `${m2X}%`,
            top: `${m2Y}%`,
            transform: `translate(-50%, -50%) scale(${m2Scale})`,
          }}
        >
          <svg className={styles.meteorSvg} width="90" height="210" viewBox="0 0 90 210" fill="none">
            <defs>
              <linearGradient id="plasmaTailGrad2" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#b91c1c" stopOpacity="0" />
                <stop offset="30%" stopColor="#ea580c" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="92%" stopColor="#fef08a" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
              <radialGradient id="plasmaCore2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#fef08a" />
                <stop offset="65%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#b91c1c" />
              </radialGradient>
            </defs>
            {/* Manto ancho de plasma exterior */}
            <path d="M 45 10 Q 14 110 30 190 L 60 190 Q 76 110 45 10 Z" fill="url(#plasmaTailGrad2)" />
            {/* Haz central hiper-incandescente */}
            <path d="M 45 50 Q 32 130 38 192 L 52 192 Q 58 130 45 50 Z" fill="#ffffff" opacity="0.92" />
            {/* Chispas y eyecta desprendiéndose de la cola */}
            <circle cx="28" cy="115" r="3" fill="#facc15" />
            <circle cx="62" cy="130" r="3.5" fill="#facc15" />
            <circle cx="34" cy="70" r="2.5" fill="#f97316" />
            <circle cx="56" cy="85" r="2" fill="#ef4444" />
            {/* Núcleo esférico colosal */}
            <circle cx="45" cy="190" r="19" fill="url(#plasmaCore2)" filter="drop-shadow(0 0 16px #f59e0b) drop-shadow(0 0 32px #ef4444)" />
            <circle cx="45" cy="190" r="10" fill="#ffffff" />
          </svg>
        </div>
      )}

      {/* 4. METEORITO 3 (DERECHO) */}
      {isMeteorActive && m3Visible && (
        <div
          className={styles.fallingMeteorItem}
          style={{
            left: `${m3X}%`,
            top: `${m3Y}%`,
            transform: `translate(-50%, -50%) scale(${m3Scale}) rotate(10deg)`,
          }}
        >
          <svg className={styles.meteorSvg} width="64" height="150" viewBox="0 0 64 150" fill="none">
            <defs>
              <linearGradient id="plasmaTailGrad3" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                <stop offset="40%" stopColor="#ea580c" stopOpacity="0.45" />
                <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.85" />
                <stop offset="95%" stopColor="#fef08a" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path d="M 32 8 Q 12 75 22 136 L 42 136 Q 52 75 32 8 Z" fill="url(#plasmaTailGrad3)" />
            <path d="M 32 40 Q 24 90 28 138 L 36 138 Q 40 90 32 40 Z" fill="#ffffff" opacity="0.8" />
            <circle cx="32" cy="136" r="14" fill="url(#plasmaCore1)" filter="drop-shadow(0 0 10px #f59e0b)" />
            <circle cx="32" cy="136" r="7" fill="#ffffff" />
          </svg>
        </div>
      )}

      {/* =========================================================================
          DETONACIONES DE IMPACTO EN EL SUELO (Flash térmico, Onda expansiva y Chispas)
          ========================================================================= */}
      {/* Detonación 1 (Izquierda) */}
      {isMeteorActive && showImpact1 && (
        <div className={styles.impactBlastPoint} style={{ left: '30%', top: '46%' }}>
          {/* Flash esférico de impacto */}
          <div
            className={styles.impactFlashSphere}
            style={{
              width: `${50 + tImpact1 * 130}px`,
              height: `${50 + tImpact1 * 130}px`,
              opacity: (1 - tImpact1) * 0.95,
            }}
          />
          {/* Anillo de onda de choque elíptico en perspectiva */}
          <div
            className={styles.impactShockwaveRing}
            style={{
              width: `${70 + tImpact1 * 210}px`,
              height: `${30 + tImpact1 * 95}px`,
              opacity: 1 - tImpact1,
            }}
          />
          {/* Chispas y esquirlas de fuego */}
          <svg
            className={styles.impactSparksSvg}
            width="140"
            height="100"
            viewBox="-70 -50 140 100"
            style={{ opacity: 1 - tImpact1 }}
          >
            {[-45, -25, -5, 15, 35, 55].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const dist = 20 + tImpact1 * 50;
              const x = Math.sin(rad) * dist;
              const y = -Math.cos(rad) * dist * 0.7;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={Math.max(1, 4 - tImpact1 * 3)}
                  fill={i % 2 === 0 ? '#ffffff' : '#facc15'}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* Detonación 2 (CENTRAL MASIVA) */}
      {isMeteorActive && showImpact2 && (
        <div className={styles.impactBlastPoint} style={{ left: '50%', top: '51%' }}>
          {/* Flash hiper-gigante */}
          <div
            className={styles.impactFlashSphere}
            style={{
              width: `${80 + tImpact2 * 210}px`,
              height: `${80 + tImpact2 * 210}px`,
              opacity: (1 - tImpact2) * 1,
            }}
          />
          {/* Onda de choque doble */}
          <div
            className={styles.impactShockwaveRing}
            style={{
              width: `${100 + tImpact2 * 320}px`,
              height: `${45 + tImpact2 * 140}px`,
              opacity: (1 - tImpact2) * 0.95,
              borderColor: '#ffffff',
            }}
          />
          {/* Chispas y eyecta volcánica */}
          <svg
            className={styles.impactSparksSvg}
            width="220"
            height="150"
            viewBox="-110 -75 220 150"
            style={{ opacity: 1 - tImpact2 }}
          >
            {[-60, -40, -20, 0, 20, 40, 60].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const dist = 30 + tImpact2 * 85;
              const x = Math.sin(rad) * dist;
              const y = -Math.cos(rad) * dist * 0.8;
              return (
                <g key={i}>
                  <line
                    x1={x * 0.5}
                    y1={y * 0.5}
                    x2={x}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth={Math.max(1.5, 3.5 - tImpact2 * 2)}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.max(1.5, 4.5 - tImpact2 * 3)}
                    fill="#fef08a"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Detonación 3 (Derecha) */}
      {isMeteorActive && showImpact3 && (
        <div className={styles.impactBlastPoint} style={{ left: '70%', top: '48%' }}>
          <div
            className={styles.impactFlashSphere}
            style={{
              width: `${50 + tImpact3 * 130}px`,
              height: `${50 + tImpact3 * 130}px`,
              opacity: (1 - tImpact3) * 0.95,
            }}
          />
          <div
            className={styles.impactShockwaveRing}
            style={{
              width: `${70 + tImpact3 * 210}px`,
              height: `${30 + tImpact3 * 95}px`,
              opacity: 1 - tImpact3,
            }}
          />
        </div>
      )}

      {/* =========================================================================
          AVALANCHA DE PIEDRAS: Boulders Rodando y Rebotando desde las Alturas
          ========================================================================= */}
      {isAvalanchaActive && (
        <>
          {/* Roca rodante 1 (Colina izquierda) */}
          <div
            className={styles.fallingBoulderItem}
            style={{
              left: `${r1X}%`,
              top: `${r1Y}%`,
              transform: `translate(-50%, -50%) scale(${r1Scale}) rotate(${r1Rot}deg)`,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <polygon points="24,4 40,14 44,32 30,44 12,42 4,26 8,12" fill="#44403c" stroke="#1c1917" strokeWidth="2.5" />
              <polygon points="24,4 40,14 36,28 20,24" fill="#78716c" />
              <circle cx="28" cy="20" r="2" fill="#a8a29e" />
            </svg>
          </div>

          {/* Roca rodante 2 (Colina derecha) */}
          <div
            className={styles.fallingBoulderItem}
            style={{
              left: `${r2X}%`,
              top: `${r2Y}%`,
              transform: `translate(-50%, -50%) scale(${r2Scale}) rotate(${r2Rot}deg)`,
            }}
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <polygon points="26,4 44,16 48,36 34,48 14,46 4,28 10,12" fill="#292524" stroke="#090d16" strokeWidth="2.5" />
              <polygon points="26,4 44,16 38,30 22,26" fill="#57534e" />
              <path d="M 26 4 L 28 28 L 48 36" stroke="#1c1917" strokeWidth="1.8" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
