import React from 'react';
import styles from './PositionFlag.module.css';

/**
 * PositionFlag: distintivo de bandera ondeante para destacar el 1º, 2º y 3º lugar en carrera.
 * - 1º: Oro  • 2º: Plata  • 3º: Bronce
 * Para cualquier otra posición no se renderiza nada.
 */
const PALETTE = {
  1: { main: '#facc15', dark: '#b45309', light: '#fef9c3', text: '#3b2300', label: '1º' },
  2: { main: '#e2e8f0', dark: '#64748b', light: '#ffffff', text: '#1e293b', label: '2º' },
  3: { main: '#f0a35e', dark: '#9a4a12', light: '#fde2c4', text: '#3a1a04', label: '3º' },
};

export default function PositionFlag({ position, size = 'md', className = '', title }) {
  const colors = PALETTE[position];
  if (!colors) return null;

  const gradId = `posFlagGrad${position}`;

  return (
    <span
      className={`${styles.flagWrap} ${styles[`size_${size}`] || ''} ${styles[`pos_${position}`] || ''} ${className}`}
      title={title || `${colors.label} lugar`}
      aria-label={`${colors.label} lugar`}
      role="img"
    >
      <svg className={styles.flagSvg} viewBox="0 0 40 44" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="45%" stopColor={colors.main} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
        </defs>
        {/* Mástil */}
        <rect x="3" y="2" width="3" height="40" rx="1.5" fill="#1f2937" />
        <circle cx="4.5" cy="2.6" r="2.4" fill={colors.main} stroke="#1f2937" strokeWidth="0.8" />
        {/* Paño ondeante */}
        <path
          className={styles.flagCloth}
          d="M6 5 C 14 2, 22 9, 37 5 L 37 25 C 22 29, 14 22, 6 25 Z"
          fill={`url(#${gradId})`}
          stroke={colors.dark}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <text
          x="21.5"
          y="19.5"
          textAnchor="middle"
          fontSize="12"
          fontWeight="900"
          fontFamily="Montserrat, system-ui, sans-serif"
          fill={colors.text}
        >
          {colors.label}
        </text>
      </svg>
    </span>
  );
}
