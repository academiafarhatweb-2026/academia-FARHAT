export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="mb-0">{title}</h2>
          <button type="button" className="btn secondary" onClick={onClose}>
            Salir
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
