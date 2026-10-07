import React from 'react';
import styles from '../GameContainer.module.css';

export default function PlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className={styles.infoModalBackdrop || styles.soundConsentBackdrop}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 7500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(10, 14, 24, 0.78)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={styles.infoModalCard}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          height: 'auto',
          textAlign: 'center',
          gap: '20px',
          padding: '28px',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.15)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
              marginBottom: '6px',
            }}
          >
            <i className="ph ph-flag-checkered" style={{ fontSize: '32px', color: '#000' }} />
          </div>
          <span style={{ fontSize: '0.8rem', letterSpacing: '0.15em', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
            DEMO FRONT BUGGY
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
            ¡MOTOR LISTO!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            Has presionado el botón <strong style={{ color: '#fbbf24' }}>JUGAR</strong>. En la próxima entrega aquí se cargará la selección de vehículos y la pista de carreras playera.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            textAlign: 'left',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Vehículo</div>
            <div style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 600 }}>Buggy 07 (Amarillo)</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Pista</div>
            <div style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 600 }}>Playa Costa Brava</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px 24px',
            border: 'none',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
            transition: 'transform 120ms ease, filter 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          ENTENDIDO
        </button>
      </div>
    </div>
  );
}
