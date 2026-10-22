/**
 * circuitTrack: geometría única del Circuito Dunas del Pacífico.
 *
 * La comparten el minimapa GPS (dibujo del trazado y posición de los blips) y las vistas
 * Arcade 2.5D / 1ª persona (curvas de la carretera), para que ambas muestren exactamente
 * las mismas curvas en el mismo punto de la carrera.
 *
 * Coordenadas en el espacio del SVG del minimapa (viewBox 0 0 310 170, eje Y hacia abajo).
 */

// Segmentos del trazado en orden de carrera (sale de la META en 75,145 hacia la derecha)
const SEGMENTS = [
  { type: 'L', p: [[75, 145], [225, 145]] },
  { type: 'C', p: [[225, 145], [265, 145], [290, 120], [280, 85]] },
  { type: 'C', p: [[280, 85], [270, 48], [230, 35], [195, 45]] },
  { type: 'C', p: [[195, 45], [165, 55], [150, 72], [125, 52]] },
  { type: 'C', p: [[125, 52], [100, 32], [60, 26], [40, 60]] },
  { type: 'C', p: [[40, 60], [20, 95], [28, 132], [55, 144]] },
  { type: 'L', p: [[55, 144], [75, 145]] },
];

/** Path SVG cerrado del circuito (generado desde los mismos segmentos). */
export const CIRCUIT_PATH_D = (() => {
  const f = ([x, y]) => `${x} ${y}`;
  let d = `M ${f(SEGMENTS[0].p[0])}`;
  SEGMENTS.forEach((s, i) => {
    if (s.type === 'L') {
      if (i < SEGMENTS.length - 1) d += ` L ${f(s.p[1])}`;
    } else {
      d += ` C ${f(s.p[1])}, ${f(s.p[2])}, ${f(s.p[3])}`;
    }
  });
  return `${d} Z`;
})();

/** Porcentaje del circuito (0..1) recorrido por un auto según su posición X en metros. */
export const carTrackPct = (x) => Math.min(0.999, Math.max(0, (x - 150) / (1140 - 150)));

function pointOn(seg, t) {
  if (seg.type === 'L') {
    const [a, b] = seg.p;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  const [a, b, c, d] = seg.p;
  const u = 1 - t;
  const k0 = u * u * u;
  const k1 = 3 * u * u * t;
  const k2 = 3 * u * t * t;
  const k3 = t * t * t;
  return [
    k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0],
    k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1],
  ];
}

// ---------------------------------------------------------------------------
// Perfil de curvatura precalculado (por longitud de arco, igual que getPointAtLength del SVG)
// ---------------------------------------------------------------------------

const N = 1000;
const LOOK_AHEAD = 0; // la vista ya recorre la curva por filas (sin adelantar el giro)
const SMOOTH = 0.05;
const HEADING_DECAY = 0.12; // el paisaje vuelve lentamente al centro tras cada curva

const profile = (() => {
  // 1) Polilínea fina con longitud acumulada
  const pts = [];
  SEGMENTS.forEach((s, i) => {
    const steps = s.type === 'L' ? 20 : 200;
    for (let j = i === 0 ? 0 : 1; j <= steps; j++) pts.push(pointOn(s, j / steps));
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1];

  // 2) Remuestreo uniforme por longitud de arco
  const uni = [];
  let k = 0;
  for (let i = 0; i <= N; i++) {
    const target = (i / N) * total;
    while (k < cum.length - 2 && cum[k + 1] < target) k++;
    const span = cum[k + 1] - cum[k] || 1;
    const t = (target - cum[k]) / span;
    uni.push([
      pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t,
      pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t,
    ]);
  }

  // 3) Rumbo (Y hacia abajo: un aumento del ángulo = giro a la DERECHA del piloto)
  const theta = [];
  for (let i = 0; i < N; i++) {
    let a = Math.atan2(uni[i + 1][1] - uni[i][1], uni[i + 1][0] - uni[i][0]);
    if (i > 0) {
      while (a - theta[i - 1] > Math.PI) a -= 2 * Math.PI;
      while (a - theta[i - 1] < -Math.PI) a += 2 * Math.PI;
    }
    theta.push(a);
  }
  theta.push(theta[N - 1]);

  // 4) Curvatura (radianes por fracción de vuelta), suavizada
  const raw = [];
  for (let i = 0; i < N; i++) raw.push((theta[i + 1] - theta[i]) * N);
  raw.push(raw[N - 1]);
  const w = Math.max(1, Math.round(SMOOTH * N));
  const smooth = raw.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let j = i - w; j <= i + w; j++) {
      if (j >= 0 && j <= N) {
        sum += raw[j];
        n++;
      }
    }
    return sum / n;
  });

  // 5) Mirada hacia adelante: lo que el piloto ve venir en la carretera
  const la = Math.round(LOOK_AHEAD * N);
  const ahead = smooth.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let j = i; j <= Math.min(N, i + la); j++) {
      sum += smooth[j];
      n++;
    }
    return sum / n;
  });
  const maxAbs = ahead.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-6);
  const curve = ahead.map((v) => {
    const n = Math.min(1, Math.abs(v) / maxAbs);
    return Math.sign(v) * n;
  });

  // 6) Giro acumulado con retorno suave (parallax lateral del cielo, acotado)
  const heading = [0];
  const decay = Math.exp(-1 / (HEADING_DECAY * N));
  for (let i = 1; i <= N; i++) heading.push(heading[i - 1] * decay + smooth[i] / N);

  return { curve, heading };
})();

function sample(arr, pct) {
  const x = Math.min(1, Math.max(0, pct)) * N;
  const i = Math.min(N - 1, Math.floor(x));
  const t = x - i;
  return arr[i] + (arr[i + 1] - arr[i]) * t;
}

/** Curvatura de la carretera (-1 izquierda .. +1 derecha) en ese punto del circuito. */
export const circuitCurveAt = (pct) => sample(profile.curve, pct);

/** Giro acumulado (radianes, acotado por el retorno suave) para el parallax del paisaje. */
export const circuitHeadingAt = (pct) => sample(profile.heading, pct);
