import React from 'react';
import { getStoredRaces } from '../../game/config/raceStorageService';
import { findBuggyByName } from '../../game/config/selectionData';
import styles from './RaceHistoryModal.module.css';

export default function RaceHistoryModal({ isOpen, onClose, onSelectRaceToWatch }) {
  if (!isOpen) return null;

  const races = getStoredRaces();

  const handleWatch = (race) => {
    onClose?.();
    onSelectRaceToWatch?.(race);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconCircle}>
              <i className="ph ph-clock-counter-clockwise" aria-hidden="true" />
            </div>
            <div>
              <span className={styles.eyebrow}>CIRCUITO DUNAS DEL PACÍFICO</span>
              <h2 className={styles.title}>Historial de Carreras</h2>
            </div>
          </div>

          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar historial">
            <i className="ph ph-x" aria-hidden="true" />
          </button>
        </header>

        {/* Barra de Estadísticas / Resumen */}
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Registradas:</span>
            <span className={styles.statValue}>{races.length} Carreras</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Frecuencia:</span>
            <span className={styles.statValue}>Cada 5 minutos</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Circuito:</span>
            <span className={styles.statValue}>8 Tramos con Obstáculos</span>
          </div>
        </div>

        {/* Tabla / Lista Ordenada de Carreras */}
        <div className={styles.racesList}>
          {races.map((race) => {
            const isCatastrophe = Boolean(race.ningunAutoLlego || race.ganador === 'NINGUNO');
            const winnerBuggy = isCatastrophe ? null : findBuggyByName(race.ganador);

            return (
              <div key={race.id || `${race.numero}_${race.hora}`} className={styles.raceRowCard}>
                {/* 1. Identificación */}
                <div className={styles.raceIdCol}>
                  <span className={styles.raceBadge}>#{race.numero}</span>
                  <div className={styles.raceDateTimeWrap}>
                    <span className={styles.raceHour}>{race.hora} hrs</span>
                    <span className={styles.raceDate}>{race.fecha}</span>
                  </div>
                </div>

                {/* 2. Resultado / Ganador */}
                <div className={styles.resultCol}>
                  <span className={styles.colLabel}>RESULTADO OFICIAL:</span>
                  {isCatastrophe ? (
                    <div className={styles.catastropheBadge}>
                      <i className="ph ph-warning-octagon" aria-hidden="true" />
                      <span>NINGÚN AUTO LLEGÓ A LA META</span>
                    </div>
                  ) : (
                    <div className={styles.winnerPill} style={{ '--accent-color': winnerBuggy?.color || '#facc15' }}>
                      <img src={winnerBuggy?.image} alt={winnerBuggy?.name} className={styles.winnerThumb} />
                      <span className={styles.winnerText}>
                        {winnerBuggy?.symbol} {winnerBuggy?.name}
                      </span>
                      <span className={styles.firstPlaceTag}>1º LUGAR</span>
                    </div>
                  )}

                  {/* Podio 2º y 3º si hubo sobrevivientes */}
                  {!isCatastrophe && race.podio && race.podio.length > 1 && (
                    <div className={styles.podiumStrip}>
                      {race.podio.slice(1, 3).map((name, i) => {
                        const b = findBuggyByName(name);
                        return (
                          <span key={name} className={styles.podiumMiniTag}>
                            {i + 2}º <strong style={{ color: b?.color }}>{b?.name}</strong>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {isCatastrophe && (
                    <span className={styles.catastropheNote}>
                      Eliminados por rocas, hoyos o meteoritos
                    </span>
                  )}
                </div>

                {/* 3. Acción */}
                <div className={styles.actionCol}>
                  <button
                    type="button"
                    className={styles.watchRaceBtn}
                    onClick={() => handleWatch(race)}
                    title="Revivir la carrera completa en directo"
                  >
                    <i className="ph ph-play-fill" aria-hidden="true" />
                    <span>Ver Carrera</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
