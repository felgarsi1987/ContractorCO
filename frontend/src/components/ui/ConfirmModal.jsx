export default function ConfirmModal({ titulo, mensaje, confirmLabel='Confirmar', danger=false, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth:420 }}>
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="btn-icon" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{mensaje}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-primary"
            style={danger ? { background:'#5B21B6' } : {}}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
