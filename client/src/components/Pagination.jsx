export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="no-print flex-row mt-4" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <button type="button" className="btn secondary" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Anterior
      </button>
      <span className="text-sm text-ink/60" style={{ minWidth: 110, textAlign: 'center' }}>
        Página {page} de {totalPages}
      </span>
      <button type="button" className="btn secondary" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Siguiente
      </button>
    </div>
  );
}
