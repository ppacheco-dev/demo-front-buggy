/**
 * Servicio de persistencia y resolución de jugadas/apuestas del cliente.
 * Almacena en localStorage las jugadas realizadas y calcula su resultado
 * oficial (Ganada, Perdida, En curso, Pendiente) contrastando con las carreras.
 */

import { getStoredRaces } from './raceStorageService';

const USER_BETS_KEY = 'buggy_user_bets_v2';

export function getUserBets() {
  try {
    const raw = localStorage.getItem(USER_BETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[UserBets] Error reading bets from storage:', e);
  }

  // Si no hay jugadas previas, generamos el historial inicial fiel a la referencia
  const samples = createInitialSampleBets();
  saveUserBets(samples);
  return samples;
}

export function saveUserBets(bets) {
  try {
    localStorage.setItem(USER_BETS_KEY, JSON.stringify(bets));
  } catch (e) {
    console.warn('[UserBets] Error saving bets:', e);
  }
}

export function recordUserBet(selection) {
  const bets = getUserBets();
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Formato de Ticket numérico limpio estilo referencia (ej: 5798148)
  const rawTicketId = selection.ticketId || String(Math.floor(5798100 + Math.random() * 8900));
  const cleanTicket = String(rawTicketId).replace(/^BG-?/i, '');

  const newBet = {
    id: cleanTicket,
    ticketId: cleanTicket,
    fechahora: `${dateStr}, ${timeStr}`,
    fecha: dateStr,
    hora: timeStr,
    precio: '$2.000',
    monto: '$2.000',
    montoNum: 2000,
    targetRaceNumber: selection.targetRaceNumber || selection.raceInfo?.nextRaceNumber || 100,
    targetRaceTime: selection.targetRaceTime || selection.raceInfo?.nextRaceTime || '08:45',
    targetRaceDate: selection.targetRaceDate || dateStr,
    market: selection.market || { id: 'primer_lugar', name: 'Primer Lugar', accentColor: '#f59e0b' },
    buggy: selection.buggy || { name: 'AMARILLO', color: '#facc15', symbol: '⚡' },
    createdAt: now.toISOString(),
  };

  const filtered = bets.filter((b) => b.id !== newBet.id);
  filtered.unshift(newBet);
  saveUserBets(filtered);
  return newBet;
}

/**
 * Calcula el estado actual de una jugada contra las carreras registradas.
 * @returns {{ estado: 'GANADA' | 'PERDIDA' | 'EN_CURSO' | 'PENDIENTE', premio: string, premioNum: number, detalle: string, race: object|null }}
 */
export function getBetStatus(bet) {
  // Si la apuesta ya tiene un resultado estático predeterminado (por ejemplo, muestras de referencia)
  if (bet.mockStatus) {
    return {
      estado: bet.mockStatus,
      label: bet.mockStatus === 'GANADA' ? 'Ganada' : 'Perdida',
      badgeClass: bet.mockStatus === 'GANADA' ? 'statusWon' : 'statusLost',
      premio: bet.mockPremio || (bet.mockStatus === 'GANADA' ? '$4.000' : '$0'),
      premioNum: bet.mockStatus === 'GANADA' ? 4000 : 0,
      detalle: bet.mockStatus === 'GANADA' ? '¡Premio ganado!' : 'No premiada',
      race: null,
    };
  }

  const races = getStoredRaces();
  const now = new Date();
  const currentSlotMins = Math.floor(now.getMinutes() / 5) * 5;
  const currentSlotHours = now.getHours();
  const currentSlotNum = Math.floor((currentSlotHours * 60 + currentSlotMins) / 5) + 1;

  // Buscar la carrera correspondiente
  const race = races.find(
    (r) => Number(r.numero) === Number(bet.targetRaceNumber) && r.fecha === bet.targetRaceDate
  ) || races.find((r) => Number(r.numero) === Number(bet.targetRaceNumber));

  // 1. Si la carrera aún no ocurre (número futuro)
  if (Number(bet.targetRaceNumber) > currentSlotNum) {
    return {
      estado: 'PENDIENTE',
      label: 'Pendiente',
      badgeClass: 'statusPending',
      premio: '$0',
      premioNum: 0,
      detalle: `Inicia a las ${bet.targetRaceTime} hrs`,
      race: race || null,
    };
  }

  // 2. Si la carrera es la actual que se está corriendo en este slot
  if (Number(bet.targetRaceNumber) === currentSlotNum && !race?.ganador) {
    return {
      estado: 'EN_CURSO',
      label: 'En Carrera',
      badgeClass: 'statusRunning',
      premio: '$0',
      premioNum: 0,
      detalle: 'Carrera transmitiéndose en vivo',
      race: race || null,
    };
  }

  // 3. Carrera finalizada: evaluar según el mercado
  if (race) {
    const marketId = bet.market?.id || 'primer_lugar';
    const buggyName = bet.buggy?.name?.toUpperCase() || '';
    const isCatastrophe = Boolean(race.ningunAutoLlego || race.ganador === 'NINGUNO');
    const montoBase = bet.montoNum || 2000;

    if (marketId === 'ningun_auto') {
      if (isCatastrophe) {
        const premioNum = montoBase * 10;
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          premio: `$${premioNum.toLocaleString('es-CL')}`,
          premioNum,
          detalle: '¡Ningún auto llegó a la meta! Acierto total.',
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        premio: '$0',
        premioNum: 0,
        detalle: `Llegaron autos a la meta (Ganó ${race.ganador})`,
        race,
      };
    }

    if (isCatastrophe) {
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        premio: '$0',
        premioNum: 0,
        detalle: 'Todos los buggies fueron destruidos por obstáculos',
        race,
      };
    }

    if (marketId === 'primer_lugar') {
      const winner = race.ganador?.toUpperCase();
      if (winner === buggyName) {
        const premioNum = montoBase * 2;
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          premio: `$${premioNum.toLocaleString('es-CL')}`,
          premioNum,
          detalle: `¡Buggy ${buggyName} ganó en 1º lugar!`,
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        premio: '$0',
        premioNum: 0,
        detalle: `Ganador oficial: ${winner}`,
        race,
      };
    }

    if (marketId === 'segundo_lugar') {
      const second = race.podio?.[1]?.toUpperCase();
      if (second === buggyName) {
        const premioNum = Math.round(montoBase * 1.8);
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          premio: `$${premioNum.toLocaleString('es-CL')}`,
          premioNum,
          detalle: `¡Buggy ${buggyName} llegó en 2º lugar!`,
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        premio: '$0',
        premioNum: 0,
        detalle: `2º lugar oficial: ${second || 'N/D'}`,
        race,
      };
    }

    if (marketId === 'tercer_lugar') {
      const third = race.podio?.[2]?.toUpperCase();
      if (third === buggyName) {
        const premioNum = Math.round(montoBase * 1.5);
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          premio: `$${premioNum.toLocaleString('es-CL')}`,
          premioNum,
          detalle: `¡Buggy ${buggyName} llegó en 3º lugar!`,
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        premio: '$0',
        premioNum: 0,
        detalle: `3º lugar oficial: ${third || 'N/D'}`,
        race,
      };
    }
  }

  return {
    estado: 'PENDIENTE',
    label: 'Pendiente',
    badgeClass: 'statusPending',
    premio: '$0',
    premioNum: 0,
    detalle: `Carrera #${bet.targetRaceNumber}`,
    race: race || null,
  };
}

/**
 * Genera el historial de ejemplo inicial idéntico a la imagen de referencia:
 * - 09-10-2026, 08:41 | 5798147 | $2.000 | $4.000 (Premio verde)
 * - 09-10-2026, 08:41 | 5798146 | $200   | $0
 * - 09-10-2026, 08:41 | 5798145 | $200   | $0
 * - 09-10-2026, 08:41 | 5798144 | $200   | $0
 */
function createInitialSampleBets() {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return [
    {
      id: '5798147',
      ticketId: '5798147',
      fechahora: `${dateStr}, ${timeStr}`,
      fecha: dateStr,
      hora: timeStr,
      precio: '$2.000',
      monto: '$2.000',
      montoNum: 2000,
      targetRaceNumber: 104,
      targetRaceTime: '08:40',
      targetRaceDate: dateStr,
      market: { id: 'primer_lugar', name: 'Primer Lugar', accentColor: '#f59e0b' },
      buggy: { name: 'AMARILLO', color: '#facc15', symbol: '⚡' },
      mockStatus: 'GANADA',
      mockPremio: '$4.000',
      createdAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: '5798146',
      ticketId: '5798146',
      fechahora: `${dateStr}, ${timeStr}`,
      fecha: dateStr,
      hora: timeStr,
      precio: '$200',
      monto: '$200',
      montoNum: 200,
      targetRaceNumber: 103,
      targetRaceTime: '08:35',
      targetRaceDate: dateStr,
      market: { id: 'primer_lugar', name: 'Primer Lugar', accentColor: '#f59e0b' },
      buggy: { name: 'AZUL', color: '#38bdf8', symbol: '🌊' },
      mockStatus: 'PERDIDA',
      mockPremio: '$0',
      createdAt: new Date(now.getTime() - 7 * 60 * 1000).toISOString(),
    },
    {
      id: '5798145',
      ticketId: '5798145',
      fechahora: `${dateStr}, ${timeStr}`,
      fecha: dateStr,
      hora: timeStr,
      precio: '$200',
      monto: '$200',
      montoNum: 200,
      targetRaceNumber: 102,
      targetRaceTime: '08:30',
      targetRaceDate: dateStr,
      market: { id: 'segundo_lugar', name: 'Segundo Lugar', accentColor: '#38bdf8' },
      buggy: { name: 'ROJO', color: '#ef4444', symbol: '🔥' },
      mockStatus: 'PERDIDA',
      mockPremio: '$0',
      createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: '5798144',
      ticketId: '5798144',
      fechahora: `${dateStr}, ${timeStr}`,
      fecha: dateStr,
      hora: timeStr,
      precio: '$200',
      monto: '$200',
      montoNum: 200,
      targetRaceNumber: 101,
      targetRaceTime: '08:25',
      targetRaceDate: dateStr,
      market: { id: 'primer_lugar', name: 'Primer Lugar', accentColor: '#f59e0b' },
      buggy: { name: 'VERDE', color: '#22c55e', symbol: '🦎' },
      mockStatus: 'PERDIDA',
      mockPremio: '$0',
      createdAt: new Date(now.getTime() - 17 * 60 * 1000).toISOString(),
    },
  ];
}
