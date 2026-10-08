/**
 * Servicio de almacenamiento y persistencia de carreras en formato JSON.
 * Incorpora tramos con obstáculos (rocas, hoyos, meteoritos, dunas, etc.)
 * y soporte para carreras donde ningún auto logra llegar a la meta.
 */

export const OBSTACLES_CONFIG = [
  { tipo: 'ROCAS', nombre: 'Campo de Rocas Gigantes', icono: '🪨', visual: 'rock' },
  { tipo: 'HOYOS', nombre: 'Cráter de Arena Movediza', icono: '🕳️', visual: 'hole' },
  { tipo: 'METEORITOS', nombre: 'Lluvia de Meteoritos', icono: '☄️', visual: 'meteor' },
  { tipo: 'DUNAS', nombre: 'Cresta de Duna Cortada', icono: '🏜️', visual: 'dune' },
  { tipo: 'GRIETAS', nombre: 'Fisuras Sísmicas en Arena', icono: '⚡', visual: 'fissure' },
  { tipo: 'ROCAS', nombre: 'Avalancha de Piedras', icono: '🪨', visual: 'rock' },
  { tipo: 'METEORITOS', nombre: 'Impacto de Meteorito Gigante', icono: '☄️', visual: 'meteor' },
  { tipo: 'HOYOS', nombre: 'Gran Foso Antes de Meta', icono: '🕳️', visual: 'hole' },
];

// JSON de referencia provisto por el usuario con obstáculos enriquecidos
export const REFERENCE_RACE_TRAMOS = [
  {
    TramoActual: 1,
    EsUltimoTramo: false,
    TipoObstaculo: 'ROCAS',
    NombreObstaculo: 'Campo de Rocas Gigantes',
    IconoObstaculo: '🪨',
    EstadosAutos: [
      { Nombre: "AMARILLO", X: 230, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "NARANJO", X: 220, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "VERDE", X: 210, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "ROJO", X: 200, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "AZUL", X: 190, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "MORADO", X: 180, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" }
    ]
  },
  {
    TramoActual: 2,
    EsUltimoTramo: false,
    TipoObstaculo: 'HOYOS',
    NombreObstaculo: 'Cráter de Arena Movediza',
    IconoObstaculo: '🕳️',
    EstadosAutos: [
      { Nombre: "AMARILLO", X: 360, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "NARANJO", X: 350, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "VERDE", X: 340, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "ROJO", X: 330, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "AZUL", X: 320, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "MORADO", X: 310, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" }
    ]
  },
  {
    TramoActual: 3,
    EsUltimoTramo: false,
    TipoObstaculo: 'METEORITOS',
    NombreObstaculo: 'Lluvia de Meteoritos',
    IconoObstaculo: '☄️',
    EstadosAutos: [
      { Nombre: "VERDE", X: 490, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "AMARILLO", X: 480, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "NARANJO", X: 470, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "ROJO", X: 460, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "AZUL", X: 450, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "MORADO", X: 440, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" }
    ]
  },
  {
    TramoActual: 4,
    EsUltimoTramo: false,
    TipoObstaculo: 'DUNAS',
    NombreObstaculo: 'Cresta de Duna Cortada',
    IconoObstaculo: '🏜️',
    EstadosAutos: [
      { Nombre: "AMARILLO", X: 620, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "VERDE", X: 610, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "ROJO", X: 600, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "AZUL", X: 590, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "MORADO", X: 580, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "NARANJO", X: 570, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" }
    ]
  },
  {
    TramoActual: 5,
    EsUltimoTramo: false,
    TipoObstaculo: 'GRIETAS',
    NombreObstaculo: 'Fisuras Sísmicas en Arena',
    IconoObstaculo: '⚡',
    EstadosAutos: [
      { Nombre: "VERDE", X: 750, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "AMARILLO", X: 740, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "ROJO", X: 730, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "AZUL", X: 720, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "MORADO", X: 710, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" },
      { Nombre: "NARANJO", X: 700, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "EN_CARRERA" }
    ]
  },
  {
    TramoActual: 6,
    EsUltimoTramo: false,
    TipoObstaculo: 'ROCAS',
    NombreObstaculo: 'Avalancha de Piedras',
    IconoObstaculo: '🪨',
    EstadosAutos: [
      { Nombre: "AMARILLO", X: 880, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "VERDE", X: 870, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "ROJO", X: 860, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "AZUL", X: 850, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "MORADO", X: 840, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "NARANJO", X: 830, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" }
    ]
  },
  {
    TramoActual: 7,
    EsUltimoTramo: false,
    TipoObstaculo: 'METEORITOS',
    NombreObstaculo: 'Impacto de Meteorito Gigante',
    IconoObstaculo: '☄️',
    EstadosAutos: [
      { Nombre: "AMARILLO", X: 1010, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "VERDE", X: 1000, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "ROJO", X: 860, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "AZUL", X: 850, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "MORADO", X: 840, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "NARANJO", X: 830, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" }
    ]
  },
  {
    TramoActual: 8,
    EsUltimoTramo: true,
    TipoObstaculo: 'HOYOS',
    NombreObstaculo: 'Gran Foso Antes de Meta',
    IconoObstaculo: '🕳️',
    EstadosAutos: [
      { Nombre: "AMARILLO", X: 1140, PasoTramo: true, ResultadoObstaculo: "EXITO", Estado: "EN_CARRERA" },
      { Nombre: "VERDE", X: 1000, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "ROJO", X: 860, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "AZUL", X: 850, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "MORADO", X: 840, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" },
      { Nombre: "NARANJO", X: 830, PasoTramo: false, ResultadoObstaculo: "FALLO", Estado: "ELIMINADO" }
    ]
  }
];

const CAR_NAMES = ["AMARILLO", "NARANJO", "VERDE", "ROJO", "AZUL", "MORADO"];

// Generador pseudoaleatorio determinista
function seededRandom(seed) {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

/**
 * Genera de forma determinista una carrera de 8 tramos con obstáculos.
 * Permite que a veces (aprox 20% de probabilidad determinista) NINGÚN auto logre llegar a la meta.
 */
export function generateDeterministicRace(seedValue) {
  // Hashing determinista no lineal que rompe la correlación con múltiplos de 5 minutos
  const hash = Math.abs(Math.floor(Math.sin(seedValue * 9301 + 49297) * 233280));
  // Solo ~8-10% de probabilidad de catástrofe donde ningún auto llega a la meta (1 de cada 10 a 12 carreras)
  const isCatastrophic = (hash % 11 === 0);

  const tramos = [];
  const carPositions = {};
  const carStatus = {}; // 'EN_CARRERA' | 'ELIMINADO'
  const carFailures = {};

  CAR_NAMES.forEach((name, i) => {
    carPositions[name] = 80 + i * 15;
    carStatus[name] = 'EN_CARRERA';
    carFailures[name] = 0;
  });

  for (let tramo = 1; tramo <= 8; tramo++) {
    const isLast = tramo === 8;
    const baseTargetX = 100 + tramo * 130;
    const obstacle = OBSTACLES_CONFIG[tramo - 1] || OBSTACLES_CONFIG[0];

    const estados = CAR_NAMES.map((name, idx) => {
      // Si el auto ya quedó eliminado por un obstáculo previo, se mantiene detenido
      if (carStatus[name] === 'ELIMINADO') {
        return {
          Nombre: name,
          X: Math.round(carPositions[name]),
          PasoTramo: false,
          ResultadoObstaculo: "FALLO",
          Estado: "ELIMINADO",
          ObstaculoFallo: obstacle.nombre,
        };
      }

      const rVal = seededRandom(seedValue * 120 + tramo * 31 + idx * 11);

      let paso = false;
      if (isCatastrophic) {
        // En carrera catastrófica, los autos van fallando hasta que todos quedan eliminados en tramo 7 u 8
        if (tramo <= 4) {
          paso = rVal > 0.35;
        } else if (tramo <= 6) {
          paso = rVal > 0.65;
        } else {
          paso = false; // Ningún auto sobrevive al obstáculo final
        }
      } else {
        // En carrera NORMAL (90% de las carreras): la mayoría de los autos esquiva los obstáculos
        paso = rVal > 0.22;
      }

      if (paso) {
        const advance = 120 + Math.floor(seededRandom(seedValue * 50 + tramo * 7 + idx) * 35) + 15;
        carPositions[name] = Math.max(carPositions[name] + advance, baseTargetX - 60 + idx * 8);
        return {
          Nombre: name,
          X: Math.round(carPositions[name]),
          PasoTramo: true,
          ResultadoObstaculo: "EXITO",
          Estado: "EN_CARRERA",
        };
      } else {
        carFailures[name] += 1;
        // En carrera normal, solo queda eliminado si acumula 3 fallos o en tramo 8 con mala suerte
        const isFatal = isCatastrophic
          ? (carFailures[name] >= 2 || tramo >= 7)
          : (carFailures[name] >= 3 || (tramo === 8 && rVal < 0.12));

        if (isFatal) {
          carStatus[name] = 'ELIMINADO';
        }

        // Avance antes de detenerse
        const crashAdvance = 25 + Math.floor(seededRandom(seedValue * 20 + tramo * 5 + idx) * 35);
        carPositions[name] += crashAdvance;

        return {
          Nombre: name,
          X: Math.round(carPositions[name]),
          PasoTramo: false,
          ResultadoObstaculo: "FALLO",
          Estado: isFatal ? "ELIMINADO" : "EN_CARRERA",
          ObstaculoFallo: isFatal ? obstacle.nombre : null,
        };
      }
    });

    // En carrera normal (no catastrófica), garantizar que al menos 3 autos completan el podio
    if (!isCatastrophic && isLast) {
      const aliveCount = estados.filter((e) => e.PasoTramo && e.Estado === 'EN_CARRERA').length;
      if (aliveCount < 3) {
        for (let k = 0; k < Math.min(3, estados.length); k++) {
          estados[k].PasoTramo = true;
          estados[k].ResultadoObstaculo = "EXITO";
          estados[k].Estado = "EN_CARRERA";
          estados[k].X = Math.max(estados[k].X, 1140 - k * 25);
        }
      }
    }

    // Ordenar de mayor a menor X (líderes primero)
    estados.sort((a, b) => b.X - a.X);

    tramos.push({
      TramoActual: tramo,
      EsUltimoTramo: isLast,
      TipoObstaculo: obstacle.tipo,
      NombreObstaculo: obstacle.nombre,
      IconoObstaculo: obstacle.icono,
      EstadosAutos: estados,
    });
  }

  // Evaluar si algún auto llegó a la meta (tramo 8 con X >= 1100 y Estado === 'EN_CARRERA')
  const finalCars = tramos[tramos.length - 1].EstadosAutos;
  const carsAtFinish = finalCars.filter((c) => c.PasoTramo && c.Estado === 'EN_CARRERA' && c.X >= 1100);
  const ningunAutoLlego = carsAtFinish.length === 0;

  const ganador = ningunAutoLlego ? 'NINGUNO' : (carsAtFinish[0]?.Nombre || finalCars[0].Nombre);
  const podio = ningunAutoLlego ? [] : carsAtFinish.slice(0, 3).map((c) => c.Nombre);

  return {
    tramos,
    ningunAutoLlego,
    ganador,
    podio,
  };
}

const STORAGE_KEY = 'buggy_races_history_v5';

/**
 * Obtiene todas las carreras guardadas en localStorage (solo carreras presentes o pasadas)
 */
export function getStoredRaces() {
  const now = new Date();
  const currentSlotMins = Math.floor(now.getMinutes() / 5) * 5;
  const currentSlotHours = now.getHours();
  const currentSlotNum = Math.floor((currentSlotHours * 60 + currentSlotMins) / 5) + 1;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter((r) => Number(r.numero) <= currentSlotNum);
        if (valid.length > 0) {
          return valid;
        }
      }
    }
  } catch (e) {
    console.warn('[RaceStorage] Error reading races from localStorage:', e);
  }

  const initial = initializeSampleHistory();
  saveAllRaces(initial);
  return initial;
}

function saveAllRaces(races) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(races));
  } catch (e) {
    console.warn('[RaceStorage] Error saving races to localStorage:', e);
  }
}

/**
 * Inicializa un historial inicial con carreras previas demostrando tanto ganadores como catástrofes
 */
function initializeSampleHistory() {
  const now = new Date();
  const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const currentSlotMins = Math.floor(now.getMinutes() / 5) * 5;
  const currentSlotHours = now.getHours();
  const currentSlotNum = Math.floor((currentSlotHours * 60 + currentSlotMins) / 5) + 1;

  // Carrera actual consistente
  const currentRace = {
    id: `carrera_${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}_${currentSlotNum}`,
    numero: currentSlotNum,
    fecha: todayStr,
    hora: `${String(currentSlotHours).padStart(2, '0')}:${String(currentSlotMins).padStart(2, '0')}`,
    circuito: 'Circuito Dunas del Pacífico',
    ningunAutoLlego: false,
    ganador: 'AMARILLO',
    podio: ['AMARILLO', 'ROJO', 'AZUL'],
    tramos: REFERENCE_RACE_TRAMOS,
    createdAt: now.toISOString(),
  };

  const history = [currentRace];

  // Generar carreras pasadas inmediatas
  for (let i = 1; i <= 4; i++) {
    const pastTime = new Date(now.getTime() - i * 5 * 60 * 1000);
    const pastHours = pastTime.getHours();
    const pastMins = Math.floor(pastTime.getMinutes() / 5) * 5;
    const pastNum = Math.max(1, currentSlotNum - i);
    // Hacemos que la carrera de hace 2 turnos (i = 2) haya sido una carrera catastrófica sin sobrevivientes
    const seed = (i === 2) ? 1005 : (pastNum * 77 + pastHours * 13 + pastMins);
    const result = generateDeterministicRace(seed);

    history.push({
      id: `carrera_${pastTime.getFullYear()}${pastTime.getMonth() + 1}${pastTime.getDate()}_${pastNum}`,
      numero: pastNum,
      fecha: todayStr,
      hora: `${String(pastHours).padStart(2, '0')}:${String(pastMins).padStart(2, '0')}`,
      circuito: 'Circuito Dunas del Pacífico',
      ningunAutoLlego: result.ningunAutoLlego,
      ganador: result.ganador,
      podio: result.podio,
      tramos: result.tramos,
      createdAt: pastTime.toISOString(),
    });
  }

  return history;
}

/**
 * Obtiene o crea la carrera persistente para un número de carrera, fecha y hora específicos.
 */
export function getOrCreateRace(numero, fecha, hora) {
  const races = getStoredRaces();
  const existing = races.find((r) => r.numero === Number(numero) && r.hora === hora);

  if (existing) {
    return existing;
  }

  // Generar carrera determinista basada en el número y hora
  const [hh, mm] = (hora || '16:10').split(':').map(Number);
  const seed = (Number(numero) || 195) * 100 + (hh || 16) * 60 + (mm || 10);
  const generated = (numero === 185 || numero === 183)
    ? {
        tramos: REFERENCE_RACE_TRAMOS,
        ningunAutoLlego: false,
        ganador: 'AMARILLO',
        podio: ['AMARILLO', 'ROJO', 'AZUL'],
      }
    : generateDeterministicRace(seed);

  const newRace = {
    id: `carrera_${fecha.replace(/\//g, '')}_${numero}`,
    numero: Number(numero),
    fecha,
    hora,
    circuito: 'Circuito Dunas del Pacífico',
    ningunAutoLlego: generated.ningunAutoLlego,
    ganador: generated.ganador,
    podio: generated.podio,
    tramos: generated.tramos,
    createdAt: new Date().toISOString(),
  };

  races.unshift(newRace);
  saveAllRaces(races);
  return newRace;
}
