/**
 * Datos configurables para la pantalla de selección de mercados y buggies.
 * Puedes reemplazar fácilmente los textos, imágenes, cuotas y colores desde aquí.
 */

export const MARKETS = [
  {
    id: 'primer_lugar',
    name: 'PRIMER LUGAR',
    ruleBadge: 'LLEGA EN 1º LUGAR',
    description: 'Apuestas a que el auto elegido llegará en 1er lugar (Ganador).',
    icon: '/assets/images/markets/trophy_1.webp',
    accentColor: '#f59e0b',
    borderGlow: 'rgba(245, 158, 11, 0.75)',
    badge: '1º',
    requiresBuggy: true,
  },
  {
    id: 'segundo_lugar',
    name: 'SEGUNDO LUGAR',
    ruleBadge: 'LLEGA EN 1º O 2º LUGAR',
    description: 'Apuestas a que el auto elegido llegará en 1er o 2do lugar.',
    icon: '/assets/images/markets/trophy_2.webp',
    accentColor: '#ef4444',
    borderGlow: 'rgba(239, 68, 68, 0.75)',
    badge: '1º ó 2º',
    requiresBuggy: true,
  },
  {
    id: 'tercer_lugar',
    name: 'TERCER LUGAR',
    ruleBadge: 'LLEGA EN 1º, 2º O 3º LUGAR',
    description: 'Apuestas a que el auto elegido llegará en 3er, 2do o 1er lugar.',
    icon: '/assets/images/markets/trophy_3.webp',
    accentColor: '#f97316',
    borderGlow: 'rgba(249, 115, 22, 0.75)',
    badge: '1º, 2º ó 3º',
    requiresBuggy: true,
  },
  {
    id: 'ningun_auto',
    name: 'NINGÚN AUTO LLEGA',
    ruleBadge: 'SIN GANADOR',
    description: 'Apuestas a que ningún auto llegará a la meta.',
    icon: '/assets/images/markets/flag_crash.webp',
    accentColor: '#0ea5e9',
    borderGlow: 'rgba(14, 165, 233, 0.75)',
    badge: '✕',
    requiresBuggy: false,
  },
];

export const BUGGIES = [
  {
    id: 'amarillo',
    name: 'AMARILLO',
    symbol: '⚡',
    color: '#facc15',
    glowColor: 'rgba(250, 204, 21, 0.65)',
    image: '/assets/images/buggies/amarillo.webp',
    model: '/assets/models/amarillo.glb',
    tagline: 'Rayo del Desierto',
    description: 'Chasis ultra liviano diseñado para aceleración instantánea en rectas costeras.',
    stats: {
      velocidad: 94,
      aceleracion: 96,
      traccion: 88,
    },
    specs: {
      motor: 'V8 Twin-Turbo',
      potencia: '650 HP',
      traccion: '4x4 Dunas Pro',
      peso: '840 kg',
    },
  },
  {
    id: 'rojo',
    name: 'ROJO',
    symbol: '🔥',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.65)',
    image: '/assets/images/buggies/rojo.webp',
    tagline: 'Furia de las Dunas',
    description: 'Poder puro y velocidad terminal agresiva para liderar el circuito desde la largada.',
    stats: {
      velocidad: 98,
      aceleracion: 93,
      traccion: 86,
    },
    specs: {
      motor: 'V8 Nitro-Charged',
      potencia: '710 HP',
      traccion: 'Tracción Total',
      peso: '830 kg',
    },
  },
  {
    id: 'azul',
    name: 'AZUL',
    symbol: '🌊',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.65)',
    image: '/assets/images/buggies/azul.webp',
    tagline: 'Tormenta Costera',
    description: 'Excelente balance hidrodinámico y agarre superior en curvas cerradas sobre arena.',
    stats: {
      velocidad: 91,
      aceleracion: 90,
      traccion: 97,
    },
    specs: {
      motor: 'V6 Turbo Híbrido',
      potencia: '620 HP',
      traccion: '4WD Arena Pro',
      peso: '860 kg',
    },
  },
  {
    id: 'verde',
    name: 'VERDE',
    symbol: '🍃',
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.65)',
    image: '/assets/images/buggies/verde.webp',
    tagline: 'Bestia del Terreno',
    description: 'Suspensión adaptativa de competición que supera cualquier bache o desnivel del circuito.',
    stats: {
      velocidad: 89,
      aceleracion: 92,
      traccion: 98,
    },
    specs: {
      motor: 'V8 Atmosférico Pro',
      potencia: '600 HP',
      traccion: 'Bloqueo Diferencial',
      peso: '890 kg',
    },
  },
  {
    id: 'naranja',
    name: 'NARANJO',
    symbol: '🏔️',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.65)',
    image: '/assets/images/buggies/naranjo.webp',
    tagline: 'Impacto Extremo',
    description: 'Empuje explosivo de par motor que garantiza adelantamientos impecables en carrera.',
    stats: {
      velocidad: 93,
      aceleracion: 95,
      traccion: 91,
    },
    specs: {
      motor: 'V8 Bi-Turbo Sport',
      potencia: '675 HP',
      traccion: '4x4 Dinámico',
      peso: '850 kg',
    },
  },
  {
    id: 'morado',
    name: 'MORADO',
    symbol: '🔮',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.75)',
    image: '/assets/images/buggies/morado.webp',
    tagline: 'Fantasía Nitro',
    description: 'Aerodinámica de precisión quirúrgica con inyección nitro para aceleraciones fulminantes.',
    stats: {
      velocidad: 96,
      aceleracion: 94,
      traccion: 92,
    },
    specs: {
      motor: 'V8 Aero Performance',
      potencia: '690 HP',
      traccion: 'Vectoring 4WD',
      peso: '825 kg',
    },
  },
];

export function findBuggyByName(name) {
  const norm = (name || '').trim().toUpperCase();
  if (norm === 'NARANJO' || norm === 'NARANJA') {
    return BUGGIES.find((b) => b.id === 'naranja') || BUGGIES[4];
  }
  if (norm === 'MORADO' || norm === 'BLANCO') {
    return BUGGIES.find((b) => b.id === 'morado') || BUGGIES[5];
  }
  return BUGGIES.find((b) => b.name.toUpperCase() === norm) || BUGGIES[0];
}

export const INITIAL_USER_STATE = {
  coins: '125.000',
  diamonds: '350',
  nextRaceTime: '15:30',
  initialCountdownSeconds: 105, // 00:01:45
};

/**
 * Factores de apuesta oficiales (multiplicadores de premio):
 * Participante    | 1º Puesto | 2º Puesto | 3º Puesto
 * ---------------------------------------------------
 * ROJO            | 3,7 x     | 2,2 x     | 1,8 x
 * AZUL            | 3,7 x     | 2,2 x     | 1,8 x
 * VERDE           | 3,7 x     | 2,2 x     | 1,8 x
 * AMARILLO        | 6,0 x     | 3,3 x     | 2,6 x
 * MORADO          | 6,0 x     | 3,3 x     | 2,6 x
 * NARANJO         | 3,7 x     | 2,2 x     | 1,8 x
 * Mercado Nadie gana / Sin Ganador: 14,0 x
 */
export const BET_MULTIPLIERS = {
  ROJO: { primer_lugar: 3.7, segundo_lugar: 2.2, tercer_lugar: 1.8 },
  AZUL: { primer_lugar: 3.7, segundo_lugar: 2.2, tercer_lugar: 1.8 },
  VERDE: { primer_lugar: 3.7, segundo_lugar: 2.2, tercer_lugar: 1.8 },
  AMARILLO: { primer_lugar: 6.0, segundo_lugar: 3.3, tercer_lugar: 2.6 },
  MORADO: { primer_lugar: 6.0, segundo_lugar: 3.3, tercer_lugar: 2.6 },
  NARANJO: { primer_lugar: 3.7, segundo_lugar: 2.2, tercer_lugar: 1.8 },
  NARANJA: { primer_lugar: 3.7, segundo_lugar: 2.2, tercer_lugar: 1.8 },
  BLANCO: { primer_lugar: 6.0, segundo_lugar: 3.3, tercer_lugar: 2.6 },
};

export const NO_WINNER_MULTIPLIER = 14.0;

export function getBetMultiplier(buggyName, marketId) {
  if (marketId === 'ningun_auto') {
    return NO_WINNER_MULTIPLIER;
  }
  const norm = (buggyName || '').trim().toUpperCase();
  const carTable = BET_MULTIPLIERS[norm] || BET_MULTIPLIERS['ROJO'];
  return carTable[marketId] || 1.0;
}

/**
 * Formatea número con puntos de miles para Chile (ej: 6000 -> "6.000")
 */
export function formatThousandsCL(num) {
  return Math.round(num || 0).toLocaleString('es-CL');
}

/**
 * Formatea porcentaje con coma decimal a 1 decimal (ej: 16.666 -> "16,7 %")
 */
export function formatPercentCL(num) {
  return `${(num || 0).toFixed(1).replace('.', ',')} %`;
}

/**
 * Genera el Reporte de Mercados Detallado para el sorteo actual según los resultados reales.
 * @param {object} params
 * @param {boolean} params.ningunAutoLlego
 * @param {string} params.ganador - Nombre del auto en 1º lugar
 * @param {string[]} params.podio - Nombres de los autos en podio [1º, 2º, 3º]
 */
export function generateDrawMarketReport({ ningunAutoLlego, ganador, podio = [] }) {
  const isNoWinner = Boolean(ningunAutoLlego || ganador === 'NINGUNO');
  const p1 = (podio[0] || ganador || 'ROJO').toUpperCase();
  const p2 = (podio[1] || 'AZUL').toUpperCase();
  const p3 = (podio[2] || 'VERDE').toUpperCase();

  const TICKET_UNIT = 100;
  const TICKETS_PER_CAR = 1000;
  const TOTAL_CARS = 6;

  // 1. Mercado Primero
  const primeroApost = TOTAL_CARS * TICKETS_PER_CAR; // 6.000
  const primeroRecaudado = primeroApost * TICKET_UNIT; // $600.000
  let primeroGanad = 0;
  let primeroPremios = 0;
  if (!isNoWinner) {
    primeroGanad = TICKETS_PER_CAR; // 1.000
    const m1 = getBetMultiplier(p1, 'primer_lugar');
    primeroPremios = primeroGanad * TICKET_UNIT * m1;
  }
  const primeroHR = (primeroGanad / primeroApost) * 100;
  const primeroRTP = primeroRecaudado > 0 ? (primeroPremios / primeroRecaudado) * 100 : 0;

  // 2. Mercado Segundo (El auto elegido llega en 1º o 2º lugar)
  const segundoApost = TOTAL_CARS * TICKETS_PER_CAR; // 6.000
  const segundoRecaudado = segundoApost * TICKET_UNIT; // $600.000
  let segundoGanad = 0;
  let segundoPremios = 0;
  if (!isNoWinner) {
    segundoGanad = TICKETS_PER_CAR * 2; // 2.000
    const m2_p1 = getBetMultiplier(p1, 'segundo_lugar');
    const m2_p2 = getBetMultiplier(p2, 'segundo_lugar');
    segundoPremios = (TICKETS_PER_CAR * TICKET_UNIT * m2_p1) + (TICKETS_PER_CAR * TICKET_UNIT * m2_p2);
  }
  const segundoHR = (segundoGanad / segundoApost) * 100;
  const segundoRTP = segundoRecaudado > 0 ? (segundoPremios / segundoRecaudado) * 100 : 0;

  // 3. Mercado Tercero (El auto elegido llega en 1º, 2º o 3º lugar)
  const terceroApost = TOTAL_CARS * TICKETS_PER_CAR; // 6.000
  const terceroRecaudado = terceroApost * TICKET_UNIT; // $600.000
  let terceroGanad = 0;
  let terceroPremios = 0;
  if (!isNoWinner) {
    terceroGanad = TICKETS_PER_CAR * 3; // 3.000
    const m3_p1 = getBetMultiplier(p1, 'tercer_lugar');
    const m3_p2 = getBetMultiplier(p2, 'tercer_lugar');
    const m3_p3 = getBetMultiplier(p3, 'tercer_lugar');
    terceroPremios =
      (TICKETS_PER_CAR * TICKET_UNIT * m3_p1) +
      (TICKETS_PER_CAR * TICKET_UNIT * m3_p2) +
      (TICKETS_PER_CAR * TICKET_UNIT * m3_p3);
  }
  const terceroHR = (terceroGanad / terceroApost) * 100;
  const terceroRTP = terceroRecaudado > 0 ? (terceroPremios / terceroRecaudado) * 100 : 0;

  // 4. Mercado TodosPerdedores (Sin Ganador / Nadie gana)
  const todosApost = 1000;
  const todosRecaudado = todosApost * TICKET_UNIT; // $100.000
  let todosGanad = 0;
  let todosPremios = 0;
  if (isNoWinner) {
    todosGanad = todosApost; // 1.000
    todosPremios = todosGanad * TICKET_UNIT * NO_WINNER_MULTIPLIER; // $1.400.000
  }
  const todosHR = (todosGanad / todosApost) * 100;
  const todosRTP = todosRecaudado > 0 ? (todosPremios / todosRecaudado) * 100 : 0;

  // Resumen del sorteo
  const totalApuestas = primeroApost + segundoApost + terceroApost + todosApost; // 19.000
  const totalPremiosTks = primeroGanad + segundoGanad + terceroGanad + todosGanad;
  const totalMontoApostado = primeroRecaudado + segundoRecaudado + terceroRecaudado + todosRecaudado; // 1.900.000
  const totalMontoPremiados = primeroPremios + segundoPremios + terceroPremios + todosPremios;
  const rtpGlobal = totalMontoApostado > 0 ? (totalMontoPremiados / totalMontoApostado) * 100 : 0;
  const hrGlobal = totalApuestas > 0 ? (totalPremiosTks / totalApuestas) * 100 : 0;

  return {
    rows: [
      {
        mercado: 'Primer Lugar',
        badge: '1º Puesto',
        icon: 'trophy',
        accentColor: '#f59e0b',
        tksApost: formatThousandsCL(primeroApost),
        tksGanad: formatThousandsCL(primeroGanad),
        recaudado: `$${formatThousandsCL(primeroRecaudado)}`,
        premios: `$${formatThousandsCL(primeroPremios)}`,
        hr: formatPercentCL(primeroHR),
        rtp: formatPercentCL(primeroRTP),
      },
      {
        mercado: 'Segundo Lugar',
        badge: '1º o 2º Puesto',
        icon: 'trophy',
        accentColor: '#ef4444',
        tksApost: formatThousandsCL(segundoApost),
        tksGanad: formatThousandsCL(segundoGanad),
        recaudado: `$${formatThousandsCL(segundoRecaudado)}`,
        premios: `$${formatThousandsCL(segundoPremios)}`,
        hr: formatPercentCL(segundoHR),
        rtp: formatPercentCL(segundoRTP),
      },
      {
        mercado: 'Tercer Lugar',
        badge: 'Podio (Top 3)',
        icon: 'trophy',
        accentColor: '#f97316',
        tksApost: formatThousandsCL(terceroApost),
        tksGanad: formatThousandsCL(terceroGanad),
        recaudado: `$${formatThousandsCL(terceroRecaudado)}`,
        premios: `$${formatThousandsCL(terceroPremios)}`,
        hr: formatPercentCL(terceroHR),
        rtp: formatPercentCL(terceroRTP),
      },
      {
        mercado: 'Sin Ganador',
        badge: 'Nadie Llega',
        icon: 'shield-slash',
        accentColor: '#0ea5e9',
        tksApost: formatThousandsCL(todosApost),
        tksGanad: formatThousandsCL(todosGanad),
        recaudado: `$${formatThousandsCL(todosRecaudado)}`,
        premios: `$${formatThousandsCL(todosPremios)}`,
        hr: formatPercentCL(todosHR),
        rtp: formatPercentCL(todosRTP),
      },
    ],
    resumen: {
      apuestas: formatThousandsCL(totalApuestas),
      premios: formatThousandsCL(totalPremiosTks),
      montoApostado: formatThousandsCL(totalMontoApostado),
      montoPremiados: formatThousandsCL(totalMontoPremiados),
      rtpGlobal: formatPercentCL(rtpGlobal),
      hrGlobal: formatPercentCL(hrGlobal),
    },
  };
}


