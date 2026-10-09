/**
 * Servicio de persistencia y resolución de jugadas/apuestas del cliente.
 * Almacena en localStorage las jugadas realizadas y calcula su resultado
 * oficial (Ganada, Perdida, En curso, Pendiente) contrastando con las carreras.
 */

import { getStoredRaces } from './raceStorageService';

const USER_BETS_KEY = 'buggy_user_bets_v1';

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

  // Si no hay jugadas previas, generamos un ejemplo realista inicial
  const sample = createInitialSampleBet();
  saveUserBets([sample]);
  return [sample];
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
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newBet = {
    id: selection.ticketId || `BG-${Math.floor(100000 + Math.random() * 900000)}`,
    fechahora: `${dateStr} ${timeStr}`,
    fecha: dateStr,
    hora: timeStr,
    monto: '$2.500',
    montoNum: 2500,
    targetRaceNumber: selection.targetRaceNumber || selection.raceInfo?.nextRaceNumber || 100,
    targetRaceTime: selection.targetRaceTime || selection.raceInfo?.nextRaceTime || '08:20',
    targetRaceDate: selection.targetRaceDate || dateStr,
    market: selection.market || { id: 'primer_lugar', name: 'Primer Lugar', accentColor: '#f59e0b' },
    buggy: selection.buggy || { name: 'VERDE', color: '#22c55e', symbol: '🦎' },
    ticketId: selection.ticketId || `BG-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: now.toISOString(),
  };

  // Prevenir duplicados del mismo ticket
  const filtered = bets.filter((b) => b.id !== newBet.id);
  filtered.unshift(newBet);
  saveUserBets(filtered);
  return newBet;
}

/**
 * Calcula el estado actual de una jugada contra las carreras registradas.
 * @returns {{ estado: 'GANADA' | 'PERDIDA' | 'EN_CURSO' | 'PENDIENTE', detalle: string, race: object|null }}
 */
export function getBetStatus(bet) {
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
      detalle: 'Carrera transmitiéndose en vivo',
      race: race || null,
    };
  }

  // 3. Carrera finalizada: evaluar según el mercado
  if (race) {
    const marketId = bet.market?.id || 'primer_lugar';
    const buggyName = bet.buggy?.name?.toUpperCase() || '';
    const isCatastrophe = Boolean(race.ningunAutoLlego || race.ganador === 'NINGUNO');

    if (marketId === 'ningun_auto') {
      if (isCatastrophe) {
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          detalle: '¡Ningún auto llegó a la meta! Acierto total.',
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        detalle: `Llegaron autos a la meta (Ganó ${race.ganador})`,
        race,
      };
    }

    if (isCatastrophe) {
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        detalle: 'Todos los buggies fueron destruidos por obstáculos',
        race,
      };
    }

    if (marketId === 'primer_lugar') {
      const winner = race.ganador?.toUpperCase();
      if (winner === buggyName) {
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          detalle: `¡Buggy ${buggyName} ganó en 1º lugar!`,
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        detalle: `Ganador oficial: ${winner}`,
        race,
      };
    }

    if (marketId === 'segundo_lugar') {
      const second = race.podio?.[1]?.toUpperCase();
      if (second === buggyName) {
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          detalle: `¡Buggy ${buggyName} llegó en 2º lugar!`,
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        detalle: `2º lugar oficial: ${second || 'N/D'}`,
        race,
      };
    }

    if (marketId === 'tercer_lugar') {
      const third = race.podio?.[2]?.toUpperCase();
      if (third === buggyName) {
        return {
          estado: 'GANADA',
          label: 'Ganada',
          badgeClass: 'statusWon',
          detalle: `¡Buggy ${buggyName} llegó en 3º lugar!`,
          race,
        };
      }
      return {
        estado: 'PERDIDA',
        label: 'Perdida',
        badgeClass: 'statusLost',
        detalle: `3º lugar oficial: ${third || 'N/D'}`,
        race,
      };
    }
  }

  return {
    estado: 'PENDIENTE',
    label: 'Pendiente',
    badgeClass: 'statusPending',
    detalle: `Carrera #${bet.targetRaceNumber}`,
    race: race || null,
  };
}

function createInitialSampleBet() {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  const currentSlotMins = Math.floor(now.getMinutes() / 5) * 5;
  const currentSlotHours = now.getHours();
  const currentSlotNum = Math.floor((currentSlotHours * 60 + currentSlotMins) / 5) + 1;

  // Una jugada en la carrera pasada reciente
  const pastNum = Math.max(1, currentSlotNum - 1);
  const pastTime = new Date(now.getTime() - 5 * 60 * 1000);
  const pastTimeStr = `${String(pastTime.getHours()).padStart(2, '0')}:${String(Math.floor(pastTime.getMinutes() / 5) * 5).padStart(2, '0')}`;

  return {
    id: 'BG-849201',
    ticketId: 'BG-849201',
    fechahora: `${dateStr} ${pastTimeStr}`,
    fecha: dateStr,
    hora: pastTimeStr,
    monto: '$2.500',
    montoNum: 2500,
    targetRaceNumber: pastNum,
    targetRaceTime: pastTimeStr,
    targetRaceDate: dateStr,
    market: { id: 'primer_lugar', name: 'Primer Lugar', accentColor: '#f59e0b' },
    buggy: { name: 'AMARILLO', color: '#facc15', symbol: '⚡' },
    createdAt: pastTime.toISOString(),
  };
}
