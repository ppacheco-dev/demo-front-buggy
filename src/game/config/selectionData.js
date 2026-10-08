/**
 * Datos configurables para la pantalla de selección de mercados y buggies.
 * Puedes reemplazar fácilmente los textos, imágenes, cuotas y colores desde aquí.
 */

export const MARKETS = [
  {
    id: 'primer_lugar',
    name: 'PRIMER LUGAR',
    description: 'Elige el buggy que crees que llegará primero.',
    icon: '/assets/images/markets/trophy_1.webp',
    accentColor: '#f59e0b',
    borderGlow: 'rgba(245, 158, 11, 0.75)',
    badge: '1',
    requiresBuggy: true,
  },
  {
    id: 'segundo_lugar',
    name: 'SEGUNDO LUGAR',
    description: 'Elige el buggy que crees que llegará segundo.',
    icon: '/assets/images/markets/trophy_2.webp',
    accentColor: '#ef4444',
    borderGlow: 'rgba(239, 68, 68, 0.75)',
    badge: '2',
    requiresBuggy: true,
  },
  {
    id: 'tercer_lugar',
    name: 'TERCER LUGAR',
    description: 'Elige el buggy que crees que llegará tercero.',
    icon: '/assets/images/markets/trophy_3.webp',
    accentColor: '#f97316',
    borderGlow: 'rgba(249, 115, 22, 0.75)',
    badge: '3',
    requiresBuggy: true,
  },
  {
    id: 'ningun_auto',
    name: 'NINGÚN AUTO LLEGA A LA META',
    description: 'Elige esta opción si crees que ningún buggy llegará a la meta.',
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

