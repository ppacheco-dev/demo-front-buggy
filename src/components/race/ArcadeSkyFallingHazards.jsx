import React, { useMemo } from 'react';
import { roadCenterX, roadHalfWidth, fpvLaneX } from './pseudoRoad';
import styles from './ArcadeSkyFallingHazards.module.css';

/**
 * ArcadeSkyFallingHazards:
 * Animaciones cinematográficas de alta velocidad de objetos que caen efectivamente hacia la calzada
 * con trayectoria balística 3D, targets de impacto en el asfalto, detonación expansiva en el plano
 * del suelo y rocas rodantes con física de rebote y polvo desértico.
 */
export default function ArcadeSkyFallingHazards({
  tipo = 'ROCAS',
  nombre = '',
  sectorFraction = 0,
  isFinished = false,
  viewMode = '25D',
  roadCurve = 0,
}) {
  const normTipo = (tipo || '').toUpperCase();
  const isMeteor = normTipo === 'METEORITOS';
  const isRockSector = normTipo === 'ROCAS';

  // Si la carrera finalizó o no corresponde a meteoritos o rocas, no renderizar
  if (isFinished || (!isMeteor && !isRockSector)) {
    return null;
  }

  // Ventana activa de meteoritos en este sector: 0.04 a 0.44
  const isMeteorActive = isMeteor && sectorFraction >= 0.04 && sectorFraction <= 0.44;
  // Ventana activa de rocas cayendo / avalancha: 0.05 a 0.38
  const isRockActive = isRockSector && sectorFraction >= 0.05 && sectorFraction <= 0.38;

  if (!isMeteorActive && !isRockActive) {
    return null;
  }

  const isFPV = viewMode === 'FPV';

  // =========================================================================
  // 1. METEORITOS: 3 Bólidos con Trayectoria Balística 3D Directa a la Pista
  // =========================================================================
  // Las coordenadas de impacto en la calzada conectan exactamente con donde
  // se manifiesta el obstáculo sobre el asfalto en 2.5D y FPV.

  // Base de suelo en 2.5D: la carretera ocupa de 48% a 100% de la altura total.
  // yn = 0.35 corresponde a la ubicación donde se estampa el obstáculo/cráter.
  const impactYn = 0.35;
  const impactScreenY = 48 + impactYn * 52; // ~66.2%
  const cxAtImpact = isFPV ? 0 : roadCenterX(impactYn, roadCurve) * 100;
  const hwAtImpact = isFPV ? 0 : roadHalfWidth(impactYn) * 100;
  const cxAtHorizon = isFPV ? 0 : roadCenterX(0, roadCurve) * 100;

  // En FPV, coordenadas en el espacio 2048x613 de styles.world (X0 = 512)
  const X0 = 512;
  const fpvImpactY = 325;

  // --- METEORITO 1 (IZQUIERDA - Carril izquierdo en asfalto) ---
  const tFall1 = Math.min(1, Math.max(0, (sectorFraction - 0.06) / 0.15));
  const ease1 = Math.pow(tFall1, 2.4); // aceleración gravitatoria
  const m1DestX = isFPV ? (fpvLaneX(-1.15, fpvImpactY - 10, roadCurve) + X0) : (cxAtImpact - hwAtImpact * 0.46);
  const m1DestY = isFPV ? (fpvImpactY - 10) : (impactScreenY - 1.2);
  const m1StartX = isFPV ? (m1DestX - 220) : (m1DestX - 16);
  const m1StartY = isFPV ? -60 : -18;
  const m1X = m1StartX + (m1DestX - m1StartX) * ease1;
  const m1Y = m1StartY + (m1DestY - m1StartY) * ease1;
  const m1Scale = (isFPV ? 0.35 : 0.28) + ease1 * (isFPV ? 1.05 : 0.95);
  const m1Visible = tFall1 > 0 && tFall1 < 1;

  // Target en el suelo antes del impacto (0.10 a 0.21)
  const targetWarmup1 = Math.min(1, Math.max(0, (sectorFraction - 0.10) / 0.11));
  const showTarget1 = targetWarmup1 > 0 && tFall1 < 1;

  // Impacto en el asfalto (0.21 a 0.37)
  const tImpact1 = Math.min(1, Math.max(0, (sectorFraction - 0.21) / 0.16));
  const showImpact1 = tFall1 >= 1 && tImpact1 < 1;

  // --- METEORITO 2 (CENTRAL GIGANTE - Centro exacto de la calzada) ---
  const tFall2 = Math.min(1, Math.max(0, (sectorFraction - 0.08) / 0.15));
  const ease2 = Math.pow(tFall2, 2.3);
  const m2DestX = isFPV ? (fpvLaneX(0, fpvImpactY, roadCurve) + X0) : cxAtImpact;
  const m2DestY = isFPV ? fpvImpactY : impactScreenY;
  const m2StartX = isFPV ? (fpvLaneX(0, 210, roadCurve) + X0) : cxAtHorizon;
  const m2StartY = isFPV ? -80 : -22;
  const m2X = m2StartX + (m2DestX - m2StartX) * ease2;
  const m2Y = m2StartY + (m2DestY - m2StartY) * ease2;
  const m2Scale = (isFPV ? 0.45 : 0.38) + ease2 * (isFPV ? 1.45 : 1.35);
  const m2Visible = tFall2 > 0 && tFall2 < 1;

  // Target central en el suelo
  const targetWarmup2 = Math.min(1, Math.max(0, (sectorFraction - 0.11) / 0.12));
  const showTarget2 = targetWarmup2 > 0 && tFall2 < 1;

  // Detonación central en el asfalto (0.23 a 0.39)
  const tImpact2 = Math.min(1, Math.max(0, (sectorFraction - 0.23) / 0.16));
  const showImpact2 = tFall2 >= 1 && tImpact2 < 1;

  // --- METEORITO 3 (DERECHA - Carril derecho en asfalto) ---
  const tFall3 = Math.min(1, Math.max(0, (sectorFraction - 0.07) / 0.15));
  const ease3 = Math.pow(tFall3, 2.4);
  const m3DestX = isFPV ? (fpvLaneX(1.15, fpvImpactY - 10, roadCurve) + X0) : (cxAtImpact + hwAtImpact * 0.46);
  const m3DestY = isFPV ? (fpvImpactY - 10) : (impactScreenY - 0.8);
  const m3StartX = isFPV ? (m3DestX + 220) : (m3DestX + 16);
  const m3StartY = isFPV ? -65 : -16;
  const m3X = m3StartX + (m3DestX - m3StartX) * ease3;
  const m3Y = m3StartY + (m3DestY - m3StartY) * ease3;
  const m3Scale = (isFPV ? 0.35 : 0.28) + ease3 * (isFPV ? 1.05 : 0.95);
  const m3Visible = tFall3 > 0 && tFall3 < 1;

  // Target derecho en el suelo
  const targetWarmup3 = Math.min(1, Math.max(0, (sectorFraction - 0.10) / 0.12));
  const showTarget3 = targetWarmup3 > 0 && tFall3 < 1;

  // Detonación derecha en el asfalto (0.22 a 0.38)
  const tImpact3 = Math.min(1, Math.max(0, (sectorFraction - 0.22) / 0.16));
  const showImpact3 = tFall3 >= 1 && tImpact3 < 1;

  // =========================================================================
  // 2. ROCAS CAYENDO: Cantos rodados gigantes rebotando hacia la calzada
  // =========================================================================
  // Roca 1 (Lateral Izquierda)
  const tRock1 = Math.min(1, Math.max(0, (sectorFraction - 0.06) / 0.17));
  const easeRock1 = tRock1 * tRock1;
  const r1DestX = isFPV ? (fpvLaneX(-1.1, 310, roadCurve) + X0) : (cxAtImpact - hwAtImpact * 0.52);
  const r1StartX = isFPV ? (r1DestX - 260) : (r1DestX - 22);
  const r1X = r1StartX + (r1DestX - r1StartX) * easeRock1;
  // Rebote parabólico (3 botes decrecientes)
  const bounce1 = Math.abs(Math.sin(tRock1 * Math.PI * 3)) * (1 - tRock1 * 0.7) * (isFPV ? -35 : -9);
  const r1BaseY = (isFPV ? 170 : 30) + ((isFPV ? 250 : 58) - (isFPV ? 170 : 30)) * easeRock1;
  const r1Y = r1BaseY + bounce1;
  const r1Rot = tRock1 * 920;
  const r1Scale = (isFPV ? 0.42 : 0.32) + easeRock1 * (isFPV ? 0.75 : 0.65);
  const r1Dust = Math.abs(bounce1) < 2.5 && tRock1 > 0.3 && tRock1 < 0.95;

  // Roca 2 (Lateral Derecha)
  const tRock2 = Math.min(1, Math.max(0, (sectorFraction - 0.08) / 0.17));
  const easeRock2 = tRock2 * tRock2;
  const r2DestX = isFPV ? (fpvLaneX(1.1, 310, roadCurve) + X0) : (cxAtImpact + hwAtImpact * 0.52);
  const r2StartX = isFPV ? (r2DestX + 260) : (r2DestX + 22);
  const r2X = r2StartX + (r2DestX - r2StartX) * easeRock2;
  const bounce2 = Math.abs(Math.sin(tRock2 * Math.PI * 3.5)) * (1 - tRock2 * 0.7) * (isFPV ? -32 : -8.5);
  const r2BaseY = (isFPV ? 165 : 28) + ((isFPV ? 254 : 59) - (isFPV ? 165 : 28)) * easeRock2;
  const r2Y = r2BaseY + bounce2;
  const r2Rot = -tRock2 * 1050;
  const r2Scale = (isFPV ? 0.40 : 0.30) + easeRock2 * (isFPV ? 0.72 : 0.62);
  const r2Dust = Math.abs(bounce2) < 2.5 && tRock2 > 0.3 && tRock2 < 0.95;

  // Roca 3 (Central Gigante)
  const tRock3 = Math.min(1, Math.max(0, (sectorFraction - 0.07) / 0.18));
  const easeRock3 = tRock3 * tRock3;
  const r3DestX = isFPV ? (fpvLaneX(0, 325, roadCurve) + X0) : cxAtImpact;
  const r3StartX = isFPV ? (r3DestX - 60) : (r3DestX - 6);
  const r3X = r3StartX + (r3DestX - r3StartX) * easeRock3;
  const bounce3 = Math.abs(Math.sin(tRock3 * Math.PI * 2.5)) * (1 - tRock3 * 0.6) * (isFPV ? -42 : -11);
  const r3BaseY = (isFPV ? 150 : 25) + ((isFPV ? 260 : 61) - (isFPV ? 150 : 25)) * easeRock3;
  const r3Y = r3BaseY + bounce3;
  const r3Rot = tRock3 * 760;
  const r3Scale = (isFPV ? 0.50 : 0.38) + easeRock3 * (isFPV ? 0.90 : 0.75);
  const r3Dust = Math.abs(bounce3) < 3.0 && tRock3 > 0.3 && tRock3 < 0.95;

  const unit = isFPV ? 'px' : '%';

  return (
    <div className={styles.skyHazardOverlay} aria-hidden="true">
      {/* =====================================================================
          1. RESPLANDOR ATMOSFÉRICO Y ESTELAS DE REENTRADA
          ===================================================================== */}
      {isMeteorActive && (
        <>
          <div className={styles.atmosphericEntryGlow} />
          <div className={styles.sonicStreaksContainer}>
            <div className={styles.sonicStreakLine} style={{ left: '28%', top: '2%', height: '80px', transform: 'rotate(-8deg)' }} />
            <div className={styles.sonicStreakLine} style={{ left: '50%', top: '0%', height: '110px', transform: 'rotate(0deg)' }} />
            <div className={styles.sonicStreakLine} style={{ left: '72%', top: '3%', height: '85px', transform: 'rotate(8deg)' }} />
          </div>
        </>
      )}

      {/* =====================================================================
          2. TARGETS TÉRMICOS EN EL ASFALTO (Muestran dónde va a caer el bólido)
          ===================================================================== */}
      {isMeteorActive && (
        <>
          {showTarget1 && (
            <div className={styles.meteorGroundTarget} style={{ left: `${m1DestX}${unit}`, top: `${m1DestY}${unit}` }}>
              <div
                className={styles.targetScorchEllipse}
                style={{
                  width: `${(isFPV ? 120 : 60) * targetWarmup1}px`,
                  height: `${(isFPV ? 60 : 30) * targetWarmup1}px`,
                  opacity: targetWarmup1 * 0.9,
                }}
              />
            </div>
          )}

          {showTarget2 && (
            <div className={styles.meteorGroundTarget} style={{ left: `${m2DestX}${unit}`, top: `${m2DestY}${unit}` }}>
              <div
                className={styles.targetScorchEllipse}
                style={{
                  width: `${(isFPV ? 160 : 85) * targetWarmup2}px`,
                  height: `${(isFPV ? 80 : 42) * targetWarmup2}px`,
                  opacity: targetWarmup2 * 0.95,
                }}
              />
            </div>
          )}

          {showTarget3 && (
            <div className={styles.meteorGroundTarget} style={{ left: `${m3DestX}${unit}`, top: `${m3DestY}${unit}` }}>
              <div
                className={styles.targetScorchEllipse}
                style={{
                  width: `${(isFPV ? 120 : 60) * targetWarmup3}px`,
                  height: `${(isFPV ? 60 : 30) * targetWarmup3}px`,
                  opacity: targetWarmup3 * 0.9,
                }}
              />
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          3. METEORITOS EN VUELO (Descenso balístico hacia la carretera)
          ===================================================================== */}
      {/* Meteorito 1 (Izquierdo) */}
      {isMeteorActive && m1Visible && (
        <div
          className={styles.fallingMeteorItem}
          style={{
            left: `${m1X}${unit}`,
            top: `${m1Y}${unit}`,
            transform: `translate(-50%, -50%) scale(${m1Scale}) rotate(-12deg)`,
          }}
        >
          <svg className={styles.meteorSvg} width="64" height="150" viewBox="0 0 64 150" fill="none">
            <defs>
              <linearGradient id="plasmaTailGrad1" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                <stop offset="35%" stopColor="#ea580c" stopOpacity="0.5" />
                <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.9" />
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
            <path d="M 32 6 Q 10 75 22 136 L 42 136 Q 54 75 32 6 Z" fill="url(#plasmaTailGrad1)" />
            <path d="M 32 40 Q 22 92 27 138 L 37 138 Q 42 92 32 40 Z" fill="#ffffff" opacity="0.85" />
            <circle cx="32" cy="136" r="15" fill="url(#plasmaCore1)" filter="drop-shadow(0 0 12px #f59e0b)" />
            <circle cx="32" cy="136" r="8" fill="#ffffff" />
          </svg>
        </div>
      )}

      {/* Meteorito 2 (Central Masivo) */}
      {isMeteorActive && m2Visible && (
        <div
          className={styles.fallingMeteorItem}
          style={{
            left: `${m2X}${unit}`,
            top: `${m2Y}${unit}`,
            transform: `translate(-50%, -50%) scale(${m2Scale})`,
          }}
        >
          <svg className={styles.meteorSvg} width="90" height="210" viewBox="0 0 90 210" fill="none">
            <defs>
              <linearGradient id="plasmaTailGrad2" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#b91c1c" stopOpacity="0" />
                <stop offset="30%" stopColor="#ea580c" stopOpacity="0.55" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.95" />
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
            <path d="M 45 8 Q 12 110 28 190 L 62 190 Q 78 110 45 8 Z" fill="url(#plasmaTailGrad2)" />
            <path d="M 45 50 Q 30 130 37 192 L 53 192 Q 60 130 45 50 Z" fill="#ffffff" opacity="0.95" />
            <circle cx="26" cy="115" r="3.5" fill="#facc15" />
            <circle cx="64" cy="130" r="4" fill="#facc15" />
            <circle cx="33" cy="70" r="3" fill="#f97316" />
            <circle cx="57" cy="85" r="2.5" fill="#ef4444" />
            <circle cx="45" cy="190" r="20" fill="url(#plasmaCore2)" filter="drop-shadow(0 0 18px #f59e0b) drop-shadow(0 0 35px #ef4444)" />
            <circle cx="45" cy="190" r="11" fill="#ffffff" />
          </svg>
        </div>
      )}

      {/* Meteorito 3 (Derecho) */}
      {isMeteorActive && m3Visible && (
        <div
          className={styles.fallingMeteorItem}
          style={{
            left: `${m3X}${unit}`,
            top: `${m3Y}${unit}`,
            transform: `translate(-50%, -50%) scale(${m3Scale}) rotate(12deg)`,
          }}
        >
          <svg className={styles.meteorSvg} width="64" height="150" viewBox="0 0 64 150" fill="none">
            <path d="M 32 6 Q 10 75 22 136 L 42 136 Q 54 75 32 6 Z" fill="url(#plasmaTailGrad1)" />
            <path d="M 32 40 Q 22 92 27 138 L 37 138 Q 42 92 32 40 Z" fill="#ffffff" opacity="0.85" />
            <circle cx="32" cy="136" r="15" fill="url(#plasmaCore1)" filter="drop-shadow(0 0 12px #f59e0b)" />
            <circle cx="32" cy="136" r="8" fill="#ffffff" />
          </svg>
        </div>
      )}

      {/* =====================================================================
          4. DETONACIONES EXPANSIVAS DIRECTAMENTE EN EL SUELO DE LA PISTA
          ===================================================================== */}
      {/* Detonación 1 (Izquierda en calzada) */}
      {isMeteorActive && showImpact1 && (
        <div className={styles.impactBlastPoint} style={{ left: `${m1DestX}${unit}`, top: `${m1DestY}${unit}` }}>
          <div
            className={styles.impactFlashSphere}
            style={{
              width: `${(isFPV ? 200 : 120) + tImpact1 * (isFPV ? 240 : 160)}px`,
              height: `${(isFPV ? 200 : 120) + tImpact1 * (isFPV ? 240 : 160)}px`,
              opacity: (1 - tImpact1) * 0.95,
            }}
          />
          <div
            className={styles.impactShockwaveRing}
            style={{
              width: `${(isFPV ? 240 : 150) + tImpact1 * (isFPV ? 320 : 220)}px`,
              height: `${(isFPV ? 240 : 150) + tImpact1 * (isFPV ? 320 : 220)}px`,
              opacity: 1 - tImpact1,
            }}
          />
          <svg
            className={styles.impactSparksSvg}
            width={isFPV ? '260' : '150'}
            height={isFPV ? '170' : '100'}
            viewBox="-75 -50 150 100"
            style={{ opacity: 1 - tImpact1 }}
          >
            {[-45, -25, -5, 15, 35, 55].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const dist = 20 + tImpact1 * 55;
              const x = Math.sin(rad) * dist;
              const y = -Math.cos(rad) * dist * 0.65;
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

      {/* Detonación 2 (CENTRAL GIGANTE en el asfalto) */}
      {isMeteorActive && showImpact2 && (
        <div className={styles.impactBlastPoint} style={{ left: `${m2DestX}${unit}`, top: `${m2DestY}${unit}` }}>
          <div
            className={styles.impactFlashSphere}
            style={{
              width: `${(isFPV ? 280 : 180) + tImpact2 * (isFPV ? 340 : 240)}px`,
              height: `${(isFPV ? 280 : 180) + tImpact2 * (isFPV ? 340 : 240)}px`,
              opacity: (1 - tImpact2),
            }}
          />
          <div
            className={styles.impactShockwaveRing}
            style={{
              width: `${(isFPV ? 320 : 220) + tImpact2 * (isFPV ? 500 : 360)}px`,
              height: `${(isFPV ? 320 : 220) + tImpact2 * (isFPV ? 500 : 360)}px`,
              opacity: (1 - tImpact2) * 0.95,
              borderColor: '#ffffff',
            }}
          />
          <div
            className={styles.impactShockwaveRingSecondary}
            style={{
              width: `${(isFPV ? 240 : 160) + tImpact2 * (isFPV ? 420 : 290)}px`,
              height: `${(isFPV ? 240 : 160) + tImpact2 * (isFPV ? 420 : 290)}px`,
              opacity: (1 - tImpact2) * 0.85,
            }}
          />
          <svg
            className={styles.impactSparksSvg}
            width={isFPV ? '340' : '240'}
            height={isFPV ? '220' : '160'}
            viewBox="-110 -75 220 150"
            style={{ opacity: 1 - tImpact2 }}
          >
            {[-60, -40, -20, 0, 20, 40, 60].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const dist = 30 + tImpact2 * 90;
              const x = Math.sin(rad) * dist;
              const y = -Math.cos(rad) * dist * 0.75;
              return (
                <g key={i}>
                  <line
                    x1={x * 0.45}
                    y1={y * 0.45}
                    x2={x}
                    y2={y}
                    stroke="#ffffff"
                    strokeWidth={Math.max(1.5, 4 - tImpact2 * 2.5)}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={Math.max(1.5, 5 - tImpact2 * 3.5)}
                    fill="#fef08a"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Detonación 3 (Derecha en calzada) */}
      {isMeteorActive && showImpact3 && (
        <div className={styles.impactBlastPoint} style={{ left: `${m3DestX}${unit}`, top: `${m3DestY}${unit}` }}>
          <div
            className={styles.impactFlashSphere}
            style={{
              width: `${(isFPV ? 200 : 120) + tImpact3 * (isFPV ? 240 : 160)}px`,
              height: `${(isFPV ? 200 : 120) + tImpact3 * (isFPV ? 240 : 160)}px`,
              opacity: (1 - tImpact3) * 0.95,
            }}
          />
          <div
            className={styles.impactShockwaveRing}
            style={{
              width: `${(isFPV ? 240 : 150) + tImpact3 * (isFPV ? 320 : 220)}px`,
              height: `${(isFPV ? 240 : 150) + tImpact3 * (isFPV ? 320 : 220)}px`,
              opacity: 1 - tImpact3,
            }}
          />
        </div>
      )}

      {/* =====================================================================
          5. ROCAS / AVALANCHA: Boulders Rodando y Rebotando con Polvo hacia la Calzada
          ===================================================================== */}
      {isRockActive && (
        <>
          {/* Sombra de suelo para Roca 1 */}
          <div
            className={styles.boulderGroundShadow}
            style={{
              left: `${r1X}${unit}`,
              top: `${r1BaseY}${unit}`,
              width: `${(isFPV ? 70 : 38) * r1Scale}px`,
              height: `${(isFPV ? 35 : 18) * r1Scale}px`,
              opacity: Math.max(0.2, 0.85 - Math.abs(bounce1) * 0.05),
            }}
          />
          {/* Nube de polvo en impacto de Roca 1 */}
          {r1Dust && (
            <div
              className={styles.boulderDustPuff}
              style={{
                left: `${r1X}${unit}`,
                top: `${r1BaseY}${unit}`,
                width: `${(isFPV ? 80 : 42) * r1Scale}px`,
                height: `${(isFPV ? 40 : 22) * r1Scale}px`,
              }}
            />
          )}
          {/* Roca 1 */}
          <div
            className={styles.fallingBoulderItem}
            style={{
              left: `${r1X}${unit}`,
              top: `${r1Y}${unit}`,
              transform: `translate(-50%, -50%) scale(${r1Scale}) rotate(${r1Rot}deg)`,
            }}
          >
            <svg className={styles.boulderSvg} width="54" height="54" viewBox="0 0 54 54" fill="none">
              <polygon points="27,4 46,14 50,34 35,48 14,46 4,28 10,12" fill="#44403c" stroke="#1c1917" strokeWidth="2.8" />
              <polygon points="27,4 46,14 40,30 22,26" fill="#a8a29e" />
              <polygon points="27,4 22,26 14,46 4,28" fill="#78716c" />
              <polygon points="46,14 50,34 35,48 40,30" fill="#292524" />
            </svg>
          </div>

          {/* Sombra y Roca 2 (Derecha) */}
          <div
            className={styles.boulderGroundShadow}
            style={{
              left: `${r2X}${unit}`,
              top: `${r2BaseY}${unit}`,
              width: `${(isFPV ? 65 : 36) * r2Scale}px`,
              height: `${(isFPV ? 32 : 17) * r2Scale}px`,
              opacity: Math.max(0.2, 0.85 - Math.abs(bounce2) * 0.05),
            }}
          />
          {r2Dust && (
            <div
              className={styles.boulderDustPuff}
              style={{
                left: `${r2X}${unit}`,
                top: `${r2BaseY}${unit}`,
                width: `${(isFPV ? 75 : 40) * r2Scale}px`,
                height: `${(isFPV ? 38 : 20) * r2Scale}px`,
              }}
            />
          )}
          <div
            className={styles.fallingBoulderItem}
            style={{
              left: `${r2X}${unit}`,
              top: `${r2Y}${unit}`,
              transform: `translate(-50%, -50%) scale(${r2Scale}) rotate(${r2Rot}deg)`,
            }}
          >
            <svg className={styles.boulderSvg} width="50" height="50" viewBox="0 0 50 50" fill="none">
              <polygon points="25,4 42,16 46,34 32,46 14,44 4,28 9,12" fill="#292524" stroke="#090d16" strokeWidth="2.8" />
              <polygon points="25,4 42,16 36,30 21,26" fill="#78716c" />
              <polygon points="25,4 21,26 14,44 4,28" fill="#57534e" />
            </svg>
          </div>

          {/* Sombra y Roca 3 (Central Gigante) */}
          <div
            className={styles.boulderGroundShadow}
            style={{
              left: `${r3X}${unit}`,
              top: `${r3BaseY}${unit}`,
              width: `${(isFPV ? 90 : 48) * r3Scale}px`,
              height: `${(isFPV ? 45 : 24) * r3Scale}px`,
              opacity: Math.max(0.2, 0.85 - Math.abs(bounce3) * 0.05),
            }}
          />
          {r3Dust && (
            <div
              className={styles.boulderDustPuff}
              style={{
                left: `${r3X}${unit}`,
                top: `${r3BaseY}${unit}`,
                width: `${(isFPV ? 105 : 55) * r3Scale}px`,
                height: `${(isFPV ? 52 : 28) * r3Scale}px`,
              }}
            />
          )}
          <div
            className={styles.fallingBoulderItem}
            style={{
              left: `${r3X}${unit}`,
              top: `${r3Y}${unit}`,
              transform: `translate(-50%, -50%) scale(${r3Scale}) rotate(${r3Rot}deg)`,
            }}
          >
            <svg className={styles.boulderSvg} width="66" height="66" viewBox="0 0 66 66" fill="none">
              <polygon points="33,4 56,16 62,42 44,60 18,58 4,36 12,14" fill="#1c1917" stroke="#090d16" strokeWidth="3.2" />
              <polygon points="33,4 56,16 48,38 28,32" fill="#d6d3d1" />
              <polygon points="33,4 28,32 18,58 4,36" fill="#78716c" />
              <polygon points="56,16 62,42 44,60 48,38" fill="#44403c" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
