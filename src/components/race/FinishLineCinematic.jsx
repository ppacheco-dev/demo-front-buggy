import React, { useEffect } from 'react';
import styles from './FinishLineCinematic.module.css';

const CINEMATIC_MS = 4200;

/**
 * Vista en diagonal (45°) de la llegada a la meta.
 * Plano de la pista rotado en perspectiva isométrica; los buggies cruzan la línea
 * de meta en orden de llegada. Al terminar (o al tocar la pantalla) llama a onDone.
 */
export default function FinishLineCinematic({ rankedCars = [], winnerName, onDone }) {
  useEffect(() => {
    const id = setTimeout(() => onDone?.(), CINEMATIC_MS);
    return () => clearTimeout(id);
  }, [onDone]);

  const finishers = rankedCars.slice(0, 6);
  const lanes = Math.max(finishers.length, 1);

  return (
    <div className={styles.overlay} onClick={onDone} role="presentation">
      <div className={styles.sky} />

      <div className={styles.scene}>
        <div className={styles.plane}>
          {/* Líneas de carril */}
          {Array.from({ length: lanes + 1 }).map((_, i) => (
            <span
              key={`lane-${i}`}
              className={styles.laneLine}
              style={{ top: `${(i / lanes) * 100}%` }}
            />
          ))}

          {/* Línea de meta a cuadros */}
          <div className={styles.finishLine}>
            <span className={styles.finishFlag}>META</span>
          </div>

          {/* Buggies cruzando la meta */}
          {finishers.map((car, i) => (
            <div
              key={car.name || car.buggy.name}
              className={styles.carSlot}
              style={{
                top: `${((i + 0.5) / lanes) * 100}%`,
                '--end-left': `${90 - i * 4}%`,
                '--delay': `${i * 0.08}s`,
                zIndex: 20 - i,
              }}
            >
              <div className={styles.carBillboard}>
                <img src={car.buggy.image} alt={car.buggy.name} className={styles.carImg} />
                <span
                  className={styles.carTag}
                  style={{ background: car.buggy.color }}
                >
                  {i + 1}º
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.confetti} aria-hidden="true">
        {Array.from({ length: 26 }).map((_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${1.4 + (i % 7) * 0.12}s`,
              background: ['#facc15', '#38bdf8', '#f97316', '#22c55e', '#ef4444', '#a855f7'][i % 6],
            }}
          />
        ))}
      </div>

      <div className={styles.caption}>
        <span className={styles.captionTop}>¡LLEGADA A META!</span>
        {winnerName && <span className={styles.captionWinner}>Buggy {winnerName} cruza primero</span>}
      </div>
    </div>
  );
}
