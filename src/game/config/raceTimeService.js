/**
 * Servicio de sincronización de carreras cada 5 minutos.
 * Calcula en tiempo real la carrera en curso (actual) y la próxima carrera programada.
 */

export const TICKET_PRICE = '$2.000';

export function getRaceSchedule(now = new Date()) {
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();

  // El ciclo de carreras es cada 5 minutos exactos (00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55)
  const slotMinutes = Math.floor(currentMinutes / 5) * 5;
  const elapsedInSlot = (currentMinutes % 5) * 60 + currentSeconds;
  const remainingSeconds = 300 - elapsedInSlot;

  // 1. CARRERA ACTUAL (la que se está transmitiendo en este intervalo de 5 minutos)
  // Ej: A las 16:12, la carrera en curso comenzó a las 16:10.
  const currentHoursStr = String(currentHours).padStart(2, '0');
  const currentSlotMinsStr = String(slotMinutes).padStart(2, '0');
  const currentRaceTime = `${currentHoursStr}:${currentSlotMinsStr}`;
  const currentRaceNumber = Math.floor((currentHours * 60 + slotMinutes) / 5) + 1;

  // 2. PRÓXIMA CARRERA (la que se correrá cuando la cuenta regresiva llegue a 00:00)
  // Ej: A las 16:12, la próxima carrera será a las 16:15.
  const nextRaceDate = new Date(now.getTime() + remainingSeconds * 1000);
  const nextHours = String(nextRaceDate.getHours()).padStart(2, '0');
  const nextMins = String(nextRaceDate.getMinutes()).padStart(2, '0');
  const nextRaceTime = `${nextHours}:${nextMins}`;
  const nextRaceNumber = currentRaceNumber + 1;

  const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  return {
    currentRaceTime,
    currentRaceNumber,
    nextRaceTime,
    nextRaceNumber,
    raceNumber: currentRaceNumber, // Para retrocompatibilidad
    todayStr,
    remainingSeconds,
    elapsedInSlot,
    price: TICKET_PRICE,
  };
}

export function formatSecondsToCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `00:${mm}:${ss}`;
}
