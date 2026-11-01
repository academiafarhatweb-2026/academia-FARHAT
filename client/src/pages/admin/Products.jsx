import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { productsApi } from '../../api/products';
import Modal from '../../components/Modal';
import ProductForm from '../../components/ProductForm';
import { useConfirm } from '../../hooks/useConfirm';
import { useActionError } from '../../hooks/useActionError';
import { assetUrl } from '../../utils/assetUrl';
import { CONDITION_LABELS, formatPrice, stockStatus } from '../../utils/products';

const STOCK_FILTERS = [
  { value: '', label: 'Todo el stock' },
  { value: 'ok', label: 'Stock normal' },
  { value: 'low', label: 'Stock bajo' },
  { value: 'out', label: 'Sin stock' },
];

const EMPTY_FILTERS = { query: '', category: '', brand: '', stock: '' };

function errorMessage(err, fallback) {
  return err.response?.data?.message || fallback;
}

// Sorted unique non-empty values of one field, for the filter dropdowns.
function distinctValues(products, field) {
  return [...new Set(products.map((p) => p[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function StockAlerts({ lowCount, outCount }) {
  if (lowCount === 0 && outCount === 0) {
    return <div className="notice notice-ok mb-5">Todo el stock está por encima del mínimo.</div>;
  }
  return (
    <div className="notice notice-danger mb-5" role="status">
      <strong>Atención con el stock:</strong>{' '}
      {[
        outCount > 0 && `${outCount} ${outCount === 1 ? 'producto sin stock' : 'productos sin stock'}`,
        lowCount > 0 && `${lowCount} ${lowCount === 1 ? 'producto con stock bajo' : 'productos con stock bajo'}`,
      ]
        .filter(Boolean)
        .join(' y ')}
      .
    </div>
  );
}

function StatusBadges({ product }) {
  const status = stockStatus(product);
  return (
    <div className="flex flex-wrap gap-1">
      {status === 'out' && <span className="badge badge-danger">Sin stock</span>}
      {status === 'low' && <span className="badge badge-expired">Stock bajo</span>}
      {status === 'ok' && <span className="badge badge-active">OK</span>}
      {!product.active && <span className="badge badge-neutral">Inactivo</span>}
    </div>
  );
}

export default function Products() {
  const confirm = useConfirm();
  const { error: actionError, run: runAction } = useActionError();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editing, setEditing] = useState(null); // null | { product?: Product }
  const [pendingStock, setPendingStock] = useState(() => new Set());
  const [dragOverId, setDragOverId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const draggedId = useRef(null);
  // Ref locks, not just state: two clicks fired before the next render would
  // both read the old state and both send a request.
  const stockLocks = useRef(new Set());
  const reorderLock = useRef(false);
  // Row dragging is for mouse users; on touch screens it fights with the
  // table's horizontal scroll, and the ▲▼ buttons do the job instead.
  const [finePointer] = useState(() => window.matchMedia?.('(pointer: fine)').matches ?? true);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setProducts(await productsApi.list());
    } catch (err) {
      setLoadError(errorMessage(err, 'No se pudieron cargar los productos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const statuses = products.map(stockStatus);
    return {
      low: statuses.filter((s) => s === 'low').length,
      out: statuses.filter((s) => s === 'out').length,
    };
  }, [products]);

  const categoryOptions = useMemo(() => distinctValues(products, 'category'), [products]);
  const brandOptions = useMemo(() => distinctValues(products, 'brand'), [products]);

  const filtersActive = Object.values(filters).some(Boolean);

  const visibleProducts = useMemo(() => {
    const query = normalize(filters.query.trim());
    return products.filter((p) => {
      if (query && !normalize(`${p.name} ${p.brand} ${p.model}`).includes(query)) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.brand && p.brand !== filters.brand) return false;
      if (filters.stock && stockStatus(p) !== filters.stock) return false;
      return true;
    });
  }, [products, filters]);

  const nextOrder = products.reduce((max, p) => Math.max(max, p.order), 0) + 1;

  function setFilter(name, value) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  async function handleSave(payload) {
    if (editing.product) {
      await productsApi.update(editing.product._id, payload);
    } else {
      await productsApi.create(payload);
    }
    setEditing(null);
    await load();
  }

  async function handleDelete(product) {
    const ok = await confirm({
      title: 'Eliminar producto',
      message: `Esto elimina "${product.name}" y su foto. No se puede deshacer. Continuar?`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    await runAction(async () => {
      await productsApi.remove(product._id);
      await load(); // the server renumbers the display order after a delete
    }, 'No se pudo eliminar el producto.');
  }

  async function handleStock(product, delta) {
    if (stockLocks.current.has(product._id) || product.stock + delta < 0) return;
    stockLocks.current.add(product._id);
    setPendingStock((set) => new Set(set).add(product._id));
    await runAction(async () => {
      const updated = await productsApi.adjustStock(product._id, delta);
      setProducts((list) => list.map((p) => (p._id === updated._id ? updated : p)));
    }, 'No se pudo actualizar el stock.');
    stockLocks.current.delete(product._id);
    setPendingStock((set) => {
      const next = new Set(set);
      next.delete(product._id);
      return next;
    });
  }

  // Shows the new order immediately, then saves it, restoring the previous
  // order if the server rejects it. One save at a time, so responses can't
  // arrive out of order and leave the table showing an unsaved order.
  async function applyOrder(reordered) {
    if (reorderLock.current) return;
    reorderLock.current = true;
    setReordering(true);
    const previous = products;
    setProducts(reordered.map((p, i) => ({ ...p, order: i + 1 })));
    const saved = await runAction(async () => {
      setProducts(await productsApi.reorder(reordered.map((p) => p._id)));
    }, 'No se pudo guardar el nuevo orden.');
    if (!saved) setProducts(previous);
    reorderLock.current = false;
    setReordering(false);
  }

  function moveProduct(fromId, toId) {
    if (fromId === toId) return;
    const list = [...products];
    const from = list.findIndex((p) => p._id === fromId);
    const to = list.findIndex((p) => p._id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    applyOrder(list);
  }

  function moveBy(product, step) {
    const index = products.findIndex((p) => p._id === product._id);
    const target = products[index + step];
    if (target) moveProduct(product._id, target._id);
  }

  const canReorder = !filtersActive && products.length > 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="mb-0">Control de stock</h1>
        <button className="btn" onClick={() => setEditing({})}>
          Nuevo producto
        </button>
      </div>

      {!loading && !loadError && products.length > 0 && <StockAlerts lowCount={counts.low} outCount={counts.out} />}

      {!loading && !loadError && products.length > 0 && (
        <div className="card mb-5 !p-4 hover:!shadow-sm">
          <div className="grid !gap-3 sm:!grid-cols-2 lg:!grid-cols-4">
            <div className="field !mb-0">
              <label htmlFor="filter-query">Buscar</label>
              <input
                id="filter-query"
                type="search"
                placeholder="Nombre, marca o modelo"
                value={filters.query}
                onChange={(e) => setFilter('query', e.target.value)}
              />
            </div>
            <div className="field !mb-0">
              <label htmlFor="filter-category">Categoría</label>
              <select id="filter-category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
                <option value="">Todas</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="field !mb-0">
              <label htmlFor="filter-brand">Marca</label>
              <select id="filter-brand" value={filters.brand} onChange={(e) => setFilter('brand', e.target.value)}>
                <option value="">Todas</option>
                {brandOptions.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
            <div className="field !mb-0">
              <label htmlFor="filter-stock">Estado de stock</label>
              <select id="filter-stock" value={filters.stock} onChange={(e) => setFilter('stock', e.target.value)}>
                {STOCK_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink/50">
            {filtersActive ? (
              <>
                Mostrando {visibleProducts.length} de {products.length}. Para reordenar, quitá los filtros.{' '}
                <button type="button" className="cursor-pointer font-semibold text-wine underline" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Limpiar filtros
                </button>
              </>
            ) : (
              'Arrastrá las filas (o usá las flechas) para cambiar el orden en que aparecen en la página principal.'
            )}
          </p>
        </div>
      )}

      {actionError && <div className="notice notice-danger mb-4">{actionError}</div>}

      {loading && <p>Cargando...</p>}

      {!loading && loadError && (
        <div className="notice notice-danger">
          {loadError}{' '}
          <button type="button" className="btn secondary ml-2 !py-1" onClick={() => { setLoading(true); load(); }}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !loadError && products.length === 0 && (
        <div className="card text-center hover:!shadow-sm">
          <p className="font-display text-lg font-semibold">Todavía no cargaste productos</p>
          <p className="mt-1 text-sm text-ink/60">Cargá el primero y va a aparecer en el carrusel de la página principal.</p>
          <button className="btn mt-4" onClick={() => setEditing({})}>
            Cargar producto
          </button>
        </div>
      )}

      {!loading && !loadError && products.length > 0 && (
        <div className="table-wrap">
          <table className="!min-w-[880px]">
            <thead>
              <tr>
                <th aria-label="Mover" />
                <th>Orden</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product, index) => {
                const status = stockStatus(product);
                const busy = pendingStock.has(product._id);
                return (
                  <tr
                    key={product._id}
                    className={[status !== 'ok' && 'row-stock-alert', dragOverId === product._id && 'row-drag-over']
                      .filter(Boolean)
                      .join(' ')}
                    draggable={canReorder && finePointer && !reordering}
                    onDragStart={(e) => {
                      draggedId.current = product._id;
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (!canReorder || reordering || !draggedId.current) return;
                      e.preventDefault();
                      setDragOverId(product._id);
                    }}
                    onDragLeave={() => setDragOverId((id) => (id === product._id ? null : id))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverId(null);
                      if (draggedId.current) moveProduct(draggedId.current, product._id);
                      draggedId.current = null;
                    }}
                    onDragEnd={() => {
                      draggedId.current = null;
                      setDragOverId(null);
                    }}
                  >
                    <td className="!px-2">
                      {canReorder && (
                        <div className="flex items-center gap-0.5">
                          {finePointer && (
                            <span className="cursor-grab select-none px-1 text-ink/30" aria-hidden="true" title="Arrastrar">
                              ⋮⋮
                            </span>
                          )}
                          <div className="flex flex-col">
                            <button
                              type="button"
                              className="cursor-pointer px-1 text-xs leading-none text-ink/50 hover:text-ink disabled:opacity-20"
                              onClick={() => moveBy(product, -1)}
                              disabled={index === 0 || reordering}
                              aria-label={`Subir ${product.name}`}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="cursor-pointer px-1 text-xs leading-none text-ink/50 hover:text-ink disabled:opacity-20"
                              onClick={() => moveBy(product, 1)}
                              disabled={index === visibleProducts.length - 1 || reordering}
                              aria-label={`Bajar ${product.name}`}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{product.order}</td>
                    <td className="!font-sans">
                      <div className="flex items-center gap-3">
                        <img
                          src={assetUrl(product.image, { width: 120 })}
                          crossOrigin="anonymous"
                          alt=""
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-lg border border-ink/10 bg-white object-contain"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-ink/50">
                            {[product.brand, product.model].filter(Boolean).join(' · ') || 'Sin marca'}
                            {product.condition === 'used' && ` · ${CONDITION_LABELS.used}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="!font-sans">{product.category}</td>
                    <td>
                      {product.discount > 0 ? (
                        <>
                          <span className="block text-xs text-ink/40 line-through">{formatPrice(product.price)}</span>
                          <span className="font-semibold">{formatPrice(product.finalPrice)}</span>{' '}
                          <span className="text-xs text-wine">-{product.discount}%</span>
                        </>
                      ) : (
                        formatPrice(product.price)
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btn secondary !h-8 !w-8 !p-0"
                          onClick={() => handleStock(product, -1)}
                          disabled={busy || product.stock === 0}
                          aria-label={`Restar 1 al stock de ${product.name}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold">{product.stock}</span>
                        <button
                          type="button"
                          className="btn secondary !h-8 !w-8 !p-0"
                          onClick={() => handleStock(product, 1)}
                          disabled={busy}
                          aria-label={`Sumar 1 al stock de ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-ink/40">mín. {product.minStock}</span>
                    </td>
                    <td>
                      <StatusBadges product={product} />
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button type="button" className="btn secondary !px-3 !py-1.5" onClick={() => setEditing({ product })}>
                          Editar
                        </button>
                        <button type="button" className="btn danger !px-3 !py-1.5" onClick={() => handleDelete(product)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan="8" className="!font-sans text-center text-ink/50">
                    Ningún producto coincide con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.product ? 'Modificar producto' : 'Nuevo producto'} onClose={() => setEditing(null)}>
          <ProductForm product={editing.product} nextOrder={nextOrder} onSave={handleSave} />
        </Modal>
      )}
    </div>
  );
}
