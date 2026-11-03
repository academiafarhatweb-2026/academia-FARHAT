import { useCallback, useEffect, useMemo, useState } from 'react';
import { salesApi } from '../../api/sales';
import Modal from '../../components/Modal';
import SaleForm from '../../components/SaleForm';
import { useConfirm } from '../../hooks/useConfirm';
import { useActionError } from '../../hooks/useActionError';
import { formatDate, monthRange, todayISO } from '../../utils/dates';
import { PAYMENT_METHOD_LABELS, formatPrice, productTitle } from '../../utils/products';

const QUICK_RANGES = [
  { label: 'Hoy', range: () => ({ from: todayISO(), to: todayISO() }) },
  { label: 'Este mes', range: () => monthRange(0) },
  { label: 'Mes anterior', range: () => monthRange(-1) },
];

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function SummaryCard({ label, value, className = '' }) {
  return (
    <div className={`card min-w-0 !p-3 hover:!shadow-sm sm:!p-4 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">{value}</p>
    </div>
  );
}

// Record of every sale made from the stock table, filterable by date.
export default function Sales() {
  const confirm = useConfirm();
  const { error: actionError, run: runAction } = useActionError();
  const [range, setRange] = useState(() => monthRange(0));
  const [query, setQuery] = useState('');
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingSale, setEditingSale] = useState(null);
  const [savedSale, setSavedSale] = useState(null);

  const rangeError = range.from && range.to && range.from > range.to ? 'La fecha "desde" no puede ser posterior a "hasta".' : '';

  const load = useCallback(async () => {
    if (rangeError) return;
    setLoading(true);
    setLoadError('');
    try {
      setSales(await salesApi.list({ from: range.from || undefined, to: range.to || undefined }));
    } catch (err) {
      setLoadError(err.response?.data?.message || 'No se pudieron cargar las ventas.');
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, rangeError]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleSales = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return sales;
    return sales.filter((s) =>
      normalize(`${s.productName} ${s.productBrand} ${s.productModel} ${s.productCategory} ${s.note}`).includes(q)
    );
  }, [sales, query]);

  const summary = useMemo(
    () => ({
      count: visibleSales.length,
      units: visibleSales.reduce((sum, s) => sum + s.quantity, 0),
      total: visibleSales.reduce((sum, s) => sum + s.total, 0),
    }),
    [visibleSales]
  );

  // The edit may move it out of the selected dates or change the totals:
  // reload rather than patch the list in place.
  function handleSaved(updated) {
    setEditingSale(null);
    setSavedSale(updated);
    load();
  }

  async function handleCancel(sale) {
    setSavedSale(null);
    const ok = await confirm({
      title: 'Anular venta',
      message: `Esto borra la venta de ${sale.quantity} × ${sale.productName} del ${formatDate(sale.soldAt)} y devuelve ${
        sale.quantity === 1 ? 'la unidad' : `las ${sale.quantity} unidades`
      } al stock. Continuar?`,
      confirmLabel: 'Anular venta',
      danger: true,
    });
    if (!ok) return;
    await runAction(async () => {
      await salesApi.remove(sale._id);
      await load();
    }, 'No se pudo anular la venta.');
  }

  return (
    <div>
      <h1>Ventas</h1>

      <div className="card mb-5 !p-4 hover:!shadow-sm">
        <div className="grid !gap-3 sm:!grid-cols-3 lg:!grid-cols-3">
          <div className="field !mb-0">
            <label htmlFor="sales-from">Desde</label>
            <input id="sales-from" type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
          </div>
          <div className="field !mb-0">
            <label htmlFor="sales-to">Hasta</label>
            <input id="sales-to" type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
          </div>
          <div className="field !mb-0">
            <label htmlFor="sales-query">Buscar</label>
            <input id="sales-query" type="search" placeholder="Producto, marca o nota" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_RANGES.map(({ label, range: getRange }) => (
            <button key={label} type="button" className="btn secondary !px-3 !py-1 !text-xs" onClick={() => setRange(getRange())}>
              {label}
            </button>
          ))}
        </div>
        {rangeError && <p className="mt-2 text-sm font-medium text-wine">{rangeError}</p>}
      </div>

      {actionError && <div className="notice notice-danger mb-4">{actionError}</div>}
      {savedSale && (
        <div className="notice notice-ok mb-4" role="status">
          Venta actualizada: {savedSale.quantity} × {savedSale.productName} por {formatPrice(savedSale.total)}.
        </div>
      )}

      {loading && <p>Cargando...</p>}

      {!loading && loadError && (
        <div className="notice notice-danger">
          {loadError}{' '}
          <button type="button" className="btn secondary ml-2 !py-1" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* Compact on phones so the list stays in view; the total gets the
              full width there, so even a large amount is never cut off. */}
          <div className="mb-5 grid !grid-cols-2 !gap-2 sm:!grid-cols-3 sm:!gap-3">
            <SummaryCard label="Total vendido" value={formatPrice(summary.total)} className="col-span-2 sm:col-span-1" />
            <SummaryCard label="Unidades" value={summary.units} />
            <SummaryCard label="Ventas" value={summary.count} />
          </div>

          {visibleSales.length === 0 ? (
            <div className="card text-center hover:!shadow-sm">
              <p className="font-display text-lg font-semibold">No hay ventas en este período</p>
              <p className="mt-1 text-sm text-ink/60">Las ventas se registran desde la pestaña Productos, con el botón "Vender".</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="!min-w-[940px]">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio unit.</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Nota</th>
                    <th aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {visibleSales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{formatDate(sale.soldAt)}</td>
                      <td className="!font-sans">
                        <p className="font-semibold">{sale.productName}</p>
                        <p className="text-xs text-ink/50">
                          {[productTitle({ brand: sale.productBrand, model: sale.productModel }), sale.productCategory]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </td>
                      <td>{sale.quantity}</td>
                      <td>{formatPrice(sale.unitPrice)}</td>
                      <td className="font-semibold">{formatPrice(sale.total)}</td>
                      <td className="!font-sans">{PAYMENT_METHOD_LABELS[sale.paymentMethod] || '—'}</td>
                      <td className="max-w-[12rem] !font-sans text-sm text-ink/70">{sale.note || '—'}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <button type="button" className="btn secondary !px-3 !py-1.5" onClick={() => setEditingSale(sale)}>
                            Editar
                          </button>
                          <button type="button" className="btn danger !px-3 !py-1.5" onClick={() => handleCancel(sale)}>
                            Anular
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2" className="!font-sans font-semibold">
                      Total del período
                    </td>
                    <td className="font-semibold">{summary.units}</td>
                    <td />
                    <td className="font-semibold">{formatPrice(summary.total)}</td>
                    <td colSpan="3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {editingSale && (
        <Modal title="Editar venta" onClose={() => setEditingSale(null)}>
          <SaleForm sale={editingSale} onSaved={handleSaved} />
        </Modal>
      )}
    </div>
  );
}
