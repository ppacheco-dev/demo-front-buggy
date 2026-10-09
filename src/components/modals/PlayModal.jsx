import React from 'react';
import styles from '../GameContainer.module.css';

export default function PlayModal({ isOpen, onClose, selection, onViewLiveRace, onGoToHome }) {
  if (!isOpen) return null;

  const marketName = selection?.market?.name || 'PRIMER LUGAR';
  const buggyName = selection?.buggy
    ? `Buggy ${selection.buggy.name}`
    : (selection?.market?.id === 'ningun_auto' ? 'Ningún auto' : 'Buggy Amarillo');
  const marketColor = selection?.market?.accentColor || '#f59e0b';
  const buggyColor = selection?.buggy?.color || '#facc15';
  const buggySymbol = selection?.buggy?.symbol || '⚡';

  const nextRaceNumber = selection?.targetRaceNumber || selection?.raceInfo?.nextRaceNumber || ((selection?.raceInfo?.currentRaceNumber || 184) + 1);
  const nextRaceTime = selection?.targetRaceTime || selection?.raceInfo?.nextRaceTime || '15:15';
  const ticketPrice = selection?.monto || '$2.500';
  // Ticket ID único y permanente para esta jugada
  const ticketId = selection?.ticketId || selection?.id || 'BG-583921';

  const handleWatchRace = () => {
    onClose?.();
    onViewLiveRace?.();
  };

  const handleGoHome = () => {
    onClose?.();
    onGoToHome?.();
  };

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
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className={styles.infoModalCard}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '92vh',
          overflowY: 'auto',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          height: 'auto',
          textAlign: 'center',
          gap: '14px',
          padding: '22px 18px',
          background: 'linear-gradient(160deg, #131e36 0%, #0a1222 100%)',
          border: '2px solid rgba(245, 158, 11, 0.6)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(245, 158, 11, 0.25)',
          position: 'relative',
        }}
      >
        {/* Botón cerrar X */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            fontSize: '1rem',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
          aria-label="Cerrar voucher"
        >
          <i className="ph ph-x" aria-hidden="true" />
        </button>

        {/* Encabezado del Voucher */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.45)',
              marginBottom: '2px',
            }}
          >
            <i className="ph ph-ticket" style={{ fontSize: '28px', color: '#000' }} />
          </div>

          <span style={{ fontSize: '0.74rem', letterSpacing: '0.18em', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
            VOUCHER DE PARTICIPACIÓN OFICIAL
          </span>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.03em' }}>
            ¡SELECCIÓN CONFIRMADA!
          </h2>
          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
            Ticket ID: #{ticketId} • Válido para transmisión oficial
          </span>
        </div>

        {/* Detalles del Voucher */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left',
          }}
        >
          {/* Fila 1: Carrera & Precio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                Carrera Elegida (Próxima)
              </div>
              <div style={{ fontSize: '1.05rem', color: '#facc15', fontWeight: 900, marginTop: '2px' }}>
                Carrera #{nextRaceNumber}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>
                Hora: {nextRaceTime} hrs
              </div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ fontSize: '0.68rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                Precio Pagado
              </div>
              <div style={{ fontSize: '1.35rem', color: '#fff', fontWeight: 900, marginTop: '2px' }}>
                {ticketPrice}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Pago Confirmado
              </div>
            </div>
          </div>

          {/* Fila 2: Mercado & Vehículo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                Mercado
              </div>
              <div style={{ fontSize: '0.95rem', color: marketColor, fontWeight: 900, marginTop: '2px' }}>
                {marketName}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.08em' }}>
                Vehículo Elegido
              </div>
              <div style={{ fontSize: '0.95rem', color: buggyColor, fontWeight: 900, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{buggySymbol}</span>
                <span>{buggyName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Dónde ver la carrera */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1.5px solid rgba(14, 165, 233, 0.4)',
            borderRadius: '12px',
            padding: '12px 14px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#0ea5e9',
              display: 'grid',
              placeItems: 'center',
              color: '#000',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            <i className="ph ph-television-simple" aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ¿Dónde ver la carrera?
            </div>
            <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.45, marginTop: '2px' }}>
              En la <strong>Pantalla de Inicio</strong> al cumplirse la hora (<strong>{nextRaceTime} hrs</strong>), aparecerá el botón <strong>"VER CARRERA"</strong> para seguir la transmisión en vivo en directo.
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
          <button
            type="button"
            onClick={handleWatchRace}
            style={{
              width: '100%',
              padding: '13px 20px',
              border: 'none',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              fontWeight: 900,
              fontSize: '0.92rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 120ms ease, filter 120ms ease',
            }}
          >
            <i className="ph ph-broadcast" style={{ fontSize: '1.2rem' }} />
            <span>VER CARRERA EN DIRECTO AHORA</span>
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            style={{
              width: '100%',
              padding: '11px 20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#e2e8f0',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 120ms ease',
            }}
          >
            VOLVER AL INICIO A ESPERAR LA CARRERA
          </button>
        </div>
      </div>
    </div>
  );
}
