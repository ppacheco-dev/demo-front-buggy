/**
 * pseudoRoad: carretera pseudo-3D por scanlines al estilo Super Nintendo (Top Gear, F-Zero, OutRun).
 *
 * Cada fila horizontal de la pista se proyecta con perspectiva (escala = profundidad inversa) y se
 * desplaza lateralmente según la curva, de modo que la carretera se dobla de verdad hacia la izquierda
 * o la derecha en el horizonte mientras el primer plano permanece bajo la cámara.
 *
 * Se usa en dos cámaras:
 *  - Arcade 2.5D (`drawPseudoRoad`): coordenadas normalizadas del área de suelo.
 *  - 1ª persona  (`drawCockpitRoad`): coordenadas del "mundo" fijo de la cabina (2048x613).
 *
 * Rendimiento: el canvas se dibuja a resolución reducida (look retro pixelado).
 *
 * Curvas: cada fila de la pista representa una distancia por delante de la cámara y toma la
 * curvatura REAL del circuito GPS en ese punto (ver ./circuitTrack.js). Así una curva aparece
 * primero en el horizonte y va avanzando hacia los autos a medida que llegan a ella.
 */

import { circuitCurveAt, circuitHeadingAt } from './circuitTrack';

// ---------------------------------------------------------------------------
// Parámetros comunes del trazado
// ---------------------------------------------------------------------------

// Las curvas salen del mismo trazado que dibuja el minimapa GPS (ver ./circuitTrack.js)

// Distancia total recorrida por la cámara durante la carrera (unidades de profundidad)
const TOTAL_TRAVEL = 99;

// Escala interna de los canvas respecto a su tamaño en pantalla (menos píxeles = más FPS)
export const ROAD_RENDER_SCALE = 0.6;

// Escala del giro acumulado para el parallax del cielo (compatibilidad con skyShift = -heading * px)
const HEADING_SCALE = 0.9;

// Fracción de vuelta visible desde la cámara hasta el horizonte
const VIEW_AHEAD = 0.13;
const BEND_SAMPLES = 64;
// Escala mínima de perspectiva (horizonte) usada para mapear filas a distancia
const S_MIN = 0.06 / 1.06;

/** Distancia por delante (fracción de vuelta) que representa la fila con profundidad u (0 cámara, 1 horizonte). */
function aheadAt(u) {
  const s = Math.max(S_MIN, 1 - u * (1 - S_MIN));
  // Mezcla lineal + perspectiva: la curva se insinúa en el horizonte con antelación y entra suave
  const persp = (1 / s - 1) / (1 / S_MIN - 1);
  return (0.55 * u + 0.45 * persp) * VIEW_AHEAD;
}

/**
 * Perfil de la curva visible: desplazamiento lateral y pendiente de la carretera por fila.
 * Doble integral de la curvatura del circuito a lo largo de la profundidad de la pantalla.
 */
function buildBend(pct) {
  const off = new Float32Array(BEND_SAMPLES + 1);
  const slope = new Float32Array(BEND_SAMPLES + 1);
  const du = 1 / BEND_SAMPLES;
  let sl = 0;
  let of = 0;
  for (let i = 1; i <= BEND_SAMPLES; i++) {
    const c = circuitCurveAt(Math.min(1, pct + aheadAt((i - 0.5) * du)));
    const prev = sl;
    sl += 2 * c * du;
    of += ((prev + sl) / 2) * du;
    off[i] = of;
    slope[i] = sl;
  }
  return { off, slope };
}

function lookup(arr, u) {
  const x = Math.min(1, Math.max(0, u)) * BEND_SAMPLES;
  const i = Math.min(BEND_SAMPLES - 1, Math.floor(x));
  return arr[i] + (arr[i + 1] - arr[i]) * (x - i);
}

/** Desplazamiento de la curva en la profundidad u. `bend` puede ser un perfil o una curvatura fija. */
const bendOff = (bend, u) => (typeof bend === 'number' ? bend * u * u : lookup(bend.off, u));
const bendSlope = (bend, u) => (typeof bend === 'number' ? 2 * bend * u : lookup(bend.slope, u));

/**
 * Estado de la carretera para la cámara.
 * @param {number} progress progreso temporal de la carrera (0..1): controla el avance del asfalto
 * @param {number} [trackPct] posición en el circuito GPS (0..1) del auto que sigue la cámara
 * @returns {{curve: object, steer: number, heading: number, travel: number}}
 *   curve = perfil de curva por fila (para geometría), steer = curvatura bajo la cámara (-1..1)
 */
export function getRoadState(progress, trackPct = progress) {
  const p = Math.min(1, Math.max(0, progress));
  const pct = Math.min(1, Math.max(0, trackPct));
  const curve = buildBend(pct);
  const steer = circuitCurveAt(Math.min(1, pct + 0.008));
  const heading = Math.max(-1.1, Math.min(1.1, circuitHeadingAt(pct) * HEADING_SCALE));
  return { curve, steer, heading, travel: p * TOTAL_TRAVEL };
}

/** Curvatura del circuito (-1 izquierda .. +1 derecha) en la posición GPS de un auto. */
export const steerAtTrackPct = (pct) => circuitCurveAt(Math.min(1, Math.max(0, pct + 0.008)));

/**
 * Inercia tras cruzar la META: distancia extra que la cámara sigue avanzando mientras frena.
 * @param {number} elapsedMs tiempo desde que terminó la carrera
 * @param {number} durationMs duración total del frenado
 * @param {number} maxTravel distancia extra máxima
 */
export function coastTravel(elapsedMs, durationMs, maxTravel) {
  const t = Math.min(1, Math.max(0, elapsedMs / durationMs));
  // ease-out cúbico: arranca a velocidad de carrera y se detiene suavemente
  return maxTravel * (1 - Math.pow(1 - t, 3));
}

// ---------------------------------------------------------------------------
// Cámara ARCADE 2.5D
// ---------------------------------------------------------------------------

// Margen bajo el horizonte para que la carretera no colapse a ancho cero
const HORIZON_PAD = 0.06;
// Semiancho de la calzada en el borde inferior (fracción del ancho)
const ROAD_HALF_WIDTH = 0.46;
// Intensidad máxima del desplazamiento de la curva en el horizonte (suave y realista)
const CURVE_STRENGTH = 0.34;
// Factor de separación de carriles respecto al semiancho de la calzada
export const LANE_SPREAD = 0.86;
// Longitud (en unidades de profundidad) de cada banda alternada de asfalto/arena/bordillo
const BAND_LENGTH = 0.3;

/** Escala de perspectiva (0 en el horizonte, 1 en primer plano) para una fila. */
export function rowScale(yn) {
  return (yn + HORIZON_PAD) / (1 + HORIZON_PAD);
}

/** Profundidad normalizada de pantalla (0 primer plano, 1 horizonte) de la fila `yn`. */
const rowDepth = (yn) => (1 - rowScale(yn)) / (1 - S_MIN);

/** Centro de la calzada (fracción del ancho) en la fila `yn` según el perfil de curva. */
export function roadCenterX(yn, curve) {
  return 0.5 + CURVE_STRENGTH * bendOff(curve, rowDepth(yn));
}

/** Semiancho de la calzada (fracción del ancho) en la fila `yn`. */
export function roadHalfWidth(yn) {
  return rowScale(yn) * ROAD_HALF_WIDTH;
}

/** Posición X (fracción del ancho) de un carril normalizado (-1..1) en la fila `yn`. */
export function laneX(yn, laneNorm, curve) {
  return roadCenterX(yn, curve) + laneNorm * roadHalfWidth(yn) * LANE_SPREAD;
}

/** Orientación aparente (grados) de la calzada en la fila `yn`: positivo = hacia la derecha. */
export function roadHeadingDeg(yn, curve, aspect = 1.6) {
  const slope = (CURVE_STRENGTH * bendSlope(curve, rowDepth(yn))) / (1 + HORIZON_PAD) / (1 - S_MIN);
  return (Math.atan(slope * aspect) * 180) / Math.PI;
}

// ---------------------------------------------------------------------------
// META anclada al mundo (misma proyección que la carretera)
// ---------------------------------------------------------------------------

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Fila de pantalla (0..1 del suelo) para una profundidad relativa a la cámara. */
const depthToRow = (z) => (1 + HORIZON_PAD) / z - HORIZON_PAD;

// Al terminar la carrera la línea de META queda justo bajo las ruedas del líder (fila 0.5)
const FINISH_ROW_AT_END = 0.5;
const FINISH_LEN = 0.09;
export const FINISH_TRAVEL = TOTAL_TRAVEL + (1 + HORIZON_PAD) / (FINISH_ROW_AT_END + HORIZON_PAD);
// Ancho exterior (bordillo a bordillo) respecto al semiancho del asfalto
const OUTER_WIDTH = 1.12;

/** Dibuja una fila de cuadros blanco/negro entre xL y xR. */
function drawCheckerRow(ctx, xL, xR, y, hgt, rowIdx, cols) {
  const cw = (xR - xL) / cols;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(xL, y, xR - xL, hgt);
  ctx.fillStyle = '#05070d';
  for (let c = (rowIdx & 1); c < cols; c += 2) {
    ctx.fillRect(xL + c * cw, y, cw + 0.5, hgt);
  }
}

/**
 * Posición del pórtico de META en la vista 2.5D (fracciones del área de suelo), o null si no se ve.
 * Sigue la misma perspectiva y curva que la carretera, por lo que aparece en el horizonte,
 * se acerca a la velocidad real de la pista y pasa por encima de los autos al frenar.
 */
export function finishGantryLayout(travel, curve) {
  const z = FINISH_TRAVEL - travel;
  if (z < 0.5) return null;
  const yn = depthToRow(z);
  if (yn < -0.01 || yn > 2.4) return null;
  return {
    yn,
    x: roadCenterX(yn, curve),
    width: roadHalfWidth(yn) * 2 * OUTER_WIDTH,
    opacity: clamp01((yn + 0.01) / 0.08),
  };
}

function drawFinishLine2D(ctx, w, h, curve, travel) {
  const zNear = FINISH_TRAVEL - travel;
  const zFar = zNear + FINISH_LEN;
  if (zFar <= 0.3) return;
  const yFar = depthToRow(zFar) * h;
  const yNear = zNear > 0.3 ? depthToRow(zNear) * h : h * 4;
  if (yFar >= h || yNear < 0) return;
  const top = Math.max(0, Math.floor(yFar));
  const bottom = Math.min(h, Math.max(top + 1, Math.ceil(yNear)));
  const thick = bottom - top;
  for (let y = top; y < bottom; y++) {
    const yn = (y + 0.5) / h;
    const depth = 1 / rowScale(yn);
    const r = Math.min(3, Math.max(0, Math.floor(((zFar - depth) / FINISH_LEN) * 4)));
    const cx = roadCenterX(yn, curve) * w;
    const half = roadHalfWidth(yn) * w * OUTER_WIDTH;
    if (thick >= 5 && (y === top || y === bottom - 1)) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - half, y, half * 2, 1);
    } else {
      drawCheckerRow(ctx, cx - half, cx + half, y, 1, r, 16);
    }
  }
}

const COLORS = {
  sandLight: '#c9712e',
  sandDark: '#b25f22',
  roadLight: '#3d424f',
  roadDark: '#353945',
  rumbleRed: '#dc2626',
  rumbleWhite: '#f8fafc',
  lane: 'rgba(255, 255, 255, 0.9)',
};

const LANE_DIVIDERS = [-0.81, -0.4, 0, 0.4, 0.81];
let fogCache = { h: 0, grad: null };

/**
 * Dibuja la carretera de la cámara 2.5D en el canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w ancho interno del canvas
 * @param {number} h alto interno del canvas
 * @param {{curve:number, travel:number, finish?:boolean}} state
 */
export function drawPseudoRoad(ctx, w, h, { curve, travel, finish = false }) {
  // Paso por scanline: ~150 filas mantienen el look retro y un costo bajo
  const step = Math.max(1, Math.round(h / 150));

  for (let y = 0; y < h; y += step) {
    const yn = (y + step / 2) / h;
    const s = rowScale(yn);
    const band = Math.floor((1 / s + travel) / BAND_LENGTH);
    const even = (band & 1) === 0;

    const cx = roadCenterX(yn, curve) * w;
    const half = roadHalfWidth(yn) * w;
    const rumble = half * 0.12;

    ctx.fillStyle = even ? COLORS.sandLight : COLORS.sandDark;
    ctx.fillRect(0, y, w, step);

    ctx.fillStyle = even ? COLORS.rumbleRed : COLORS.rumbleWhite;
    ctx.fillRect(cx - half - rumble, y, half * 2 + rumble * 2, step);

    ctx.fillStyle = even ? COLORS.roadLight : COLORS.roadDark;
    ctx.fillRect(cx - half, y, half * 2, step);

    if (even) {
      const lw = Math.max(1, half * 0.022);
      ctx.fillStyle = COLORS.lane;
      for (let i = 0; i < LANE_DIVIDERS.length; i++) {
        ctx.fillRect(cx + LANE_DIVIDERS[i] * half * LANE_SPREAD - lw / 2, y, lw, step);
      }
    }
  }

  // Línea de META a cuadros pintada sobre el asfalto con la misma perspectiva y curva
  if (finish) drawFinishLine2D(ctx, w, h, curve, travel);

  // Bruma de distancia en el horizonte (gradiente cacheado)
  if (fogCache.h !== h || !fogCache.grad) {
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.3);
    grad.addColorStop(0, 'rgba(254, 215, 170, 0.6)');
    grad.addColorStop(1, 'rgba(254, 215, 170, 0)');
    fogCache = { h, grad };
  }
  ctx.fillStyle = fogCache.grad;
  ctx.fillRect(0, 0, w, h * 0.3);
}

// ---------------------------------------------------------------------------
// Cámara 1ª PERSONA (mundo fijo de la cabina)
// ---------------------------------------------------------------------------

export const FPV = {
  CX: 505, // eje central de la carretera (coordenadas de referencia)
  YH: 210, // horizonte donde empieza el asfalto
  BOTTOM: 613,
  LANE: 147, // ancho de carril en el horizonte
  SEG: 0.7, // largo de cada franja en unidades de profundidad
  CURVE_PX: 420, // desplazamiento suave de la curva en el horizonte
};

/** Escala de perspectiva de la cabina en la fila `y` (coordenadas de referencia). */
export const fpvScale = (y) => (y + 161) / 371;

/** Profundidad normalizada de pantalla (0 capó, 1 horizonte) de la fila `y` de la cabina. */
const fpvDepth = (y) => 1 - Math.min(1, Math.max(0, (y - FPV.YH) / (FPV.BOTTOM - FPV.YH)));

/** Desplazamiento lateral de la carretera por la curva en la fila `y`. */
export function fpvCurveOffset(y, curve) {
  return FPV.CURVE_PX * bendOff(curve, fpvDepth(y));
}

/** X de un carril `k` (en anchos de carril desde el centro) en la fila `y`, siguiendo la curva. */
export function fpvLaneX(k, y, curve) {
  return FPV.CX + fpvCurveOffset(y, curve) + k * FPV.LANE * fpvScale(y);
}

/** Orientación aparente (grados) de la carretera en la fila `y` de la cabina. */
export function fpvHeadingDeg(y, curve) {
  const span = FPV.BOTTOM - FPV.YH;
  const slope = (FPV.CURVE_PX * bendSlope(curve, fpvDepth(y))) / span;
  return (Math.atan(slope) * 180) / Math.PI;
}

// META en la cabina: al terminar la carrera la línea queda frente al capó (fila 420)
const FPV_FINISH = 520 + 400 / (420 - FPV.YH) - 1;
const FPV_FINISH_LEN = 0.6;
const FPV_KERB_OUTER = (s) => 2.67 * FPV.LANE * s + 20 * s;

/** Posición del pórtico de META en la cabina (coordenadas de referencia), o null si no se ve. */
export function fpvFinishLayout(scroll, curve) {
  const z = FPV_FINISH - scroll + 1;
  if (z < 0.45) return null;
  const y = FPV.YH + 400 / z;
  if (y < FPV.YH + 2 || y > FPV.BOTTOM + 700) return null;
  const s = fpvScale(y);
  return {
    y,
    x: FPV.CX + fpvCurveOffset(y, curve),
    width: FPV_KERB_OUTER(s) * 2,
    opacity: clamp01((y - FPV.YH - 2) / 36),
  };
}

function drawFinishLineFpv(ctx, curve, scroll) {
  const { YH, BOTTOM } = FPV;
  const zNear = FPV_FINISH - scroll + 1;
  const zFar = zNear + FPV_FINISH_LEN;
  if (zFar <= 0.45) return;
  const yFar = YH + 400 / zFar;
  const yNear = zNear > 0.45 ? YH + 400 / zNear : BOTTOM + 1;
  if (yFar >= BOTTOM || yNear <= YH) return;
  const top = Math.max(YH, Math.floor(yFar));
  const bottom = Math.min(BOTTOM, Math.max(top + 1, Math.ceil(yNear)));
  const thick = bottom - top;
  for (let y = top; y < bottom; y++) {
    const yMid = y + 0.5;
    const z = 400 / Math.max(0.5, yMid - YH);
    const r = Math.min(3, Math.max(0, Math.floor(((zFar - z) / FPV_FINISH_LEN) * 4)));
    const s = fpvScale(yMid);
    const cx = FPV.CX + fpvCurveOffset(yMid, curve);
    const half = FPV_KERB_OUTER(s);
    if (thick >= 6 && (y < top + 2 || y >= bottom - 2)) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - half, y, half * 2, 1);
    } else {
      drawCheckerRow(ctx, cx - half, cx + half, y, 1, r, 18);
    }
  }
}

/**
 * Dibuja tierra, asfalto, pianos y líneas de carril de la cabina.
 * El contexto debe venir transformado a coordenadas de referencia (x de referencia, y del mundo).
 * @param {CanvasRenderingContext2D} ctx
 * @param {{curve:number, scroll:number, finish?:boolean}} state
 */
export function drawCockpitRoad(ctx, { curve, scroll, finish = false }) {
  const { YH, BOTTOM, LANE, SEG } = FPV;
  const step = 2;
  const left = -512;
  const width = 2048;

  ctx.clearRect(left, 0, width, BOTTOM);

  for (let y = YH - 1; y < BOTTOM; y += step) {
    const yMid = y + step / 2;
    const dy = Math.max(0.5, yMid - YH);
    const z = 400 / dy;
    const band = Math.floor((z - 1) / SEG + scroll / SEG);
    const even = (band & 1) === 0;
    const t = (yMid - YH) / (BOTTOM - YH);
    const s = fpvScale(yMid);
    const cx = FPV.CX + fpvCurveOffset(yMid, curve);
    const half = 2.7 * LANE * s;

    // Tierra del desierto (degradado vertical + bandas alternadas)
    const r = Math.round(178 - 84 * t);
    const g = Math.round(90 - 46 * t);
    const b = Math.round(31 - 15 * t);
    ctx.fillStyle = even ? `rgb(${r},${g},${b})` : `rgb(${r - 14},${g - 8},${b - 4})`;
    ctx.fillRect(left, y, width, step);

    // Pianos rojo/blanco
    const kw = 40 * s;
    const kerbX = 2.67 * LANE * s;
    ctx.fillStyle = even ? '#e63a3a' : '#f5f5f7';
    ctx.fillRect(cx - kerbX - kw / 2, y, kw, step);
    ctx.fillRect(cx + kerbX - kw / 2, y, kw, step);

    // Asfalto con franjas
    ctx.fillStyle = even ? '#222a3c' : '#1a2030';
    ctx.fillRect(cx - kerbX + kw / 2, y, (kerbX - kw / 2) * 2, step);

    // Franja amarilla interior del piano cada 3 bandas
    if (band % 3 === 0) {
      ctx.fillStyle = '#facc15';
      const yw = kw * 0.2;
      ctx.fillRect(cx - kerbX + kw / 2, y, yw, step);
      ctx.fillRect(cx + kerbX - kw / 2 - yw, y, yw, step);
    }

    // Líneas de carril
    if (even) {
      const lw = 4.6 * s;
      ctx.fillStyle = '#f4f4fa';
      for (let k = -2; k <= 2; k++) {
        ctx.fillRect(cx + k * LANE * s - lw / 2, y, lw, step);
      }
    }

    // Bruma azulada sobre el asfalto cerca del horizonte
    if (yMid < 340) {
      ctx.fillStyle = `rgba(95,110,160,${(0.55 * (1 - (yMid - YH) / 130)).toFixed(3)})`;
      ctx.fillRect(cx - half, y, half * 2, step);
    }
  }

  // Línea de META a cuadros sobre el asfalto (sigue curva y perspectiva)
  if (finish) drawFinishLineFpv(ctx, curve, scroll);
}
