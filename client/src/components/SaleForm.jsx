import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saleSchema } from '../schemas';
import { salesApi } from '../api/sales';
import { assetUrl } from '../utils/assetUrl';
import { toISODate, todayISO } from '../utils/dates';
import { PAYMENT_METHOD_LABELS, formatPrice, productTitle } from '../utils/products';

const ALL_METHODS = Object.keys(PAYMENT_METHOD_LABELS);

// Registers a sale of `product` (taking the units out of stock), or — given a
// `sale` instead — corrects one already recorded. The price starts as the
// product's final price but can be changed (a negotiated price, a combo...).
export default function SaleForm({ product, sale, onSaved }) {
  const editing = Boolean(sale);
  const current = editing ? sale.product : product; // null if the product was deleted
  const [serverError, setServerError] = useState('');

  // Editing can add, on top of the units already sold, whatever is left in
  // stock; a deleted product no longer limits the quantity.
  const maxQuantity = editing ? (current ? sale.quantity + current.stock : Infinity) : product.stock;
  const schema = useMemo(() => saleSchema(maxQuantity), [maxQuantity]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: editing
      ? {
          quantity: String(sale.quantity),
          unitPrice: String(sale.unitPrice),
          soldAt: toISODate(new Date(sale.soldAt)),
          paymentMethod: sale.paymentMethod || '',
          note: sale.note || '',
        }
      : { quantity: '1', unitPrice: String(product.finalPrice), soldAt: todayISO(), paymentMethod: '', note: '' },
  });

  const [quantity, unitPrice] = watch(['quantity', 'unitPrice']);
  const total = Number(quantity) > 0 && Number(unitPrice) > 0 ? Number(quantity) * Number(unitPrice) : 0;

  // The product's accepted methods, plus the one already on the sale if the
  // product stopped accepting it since.
  const accepted = current?.paymentMethods?.length ? current.paymentMethods : ALL_METHODS;
  const methods = sale?.paymentMethod && !accepted.includes(sale.paymentMethod) ? [...accepted, sale.paymentMethod] : accepted;

  const title = editing
    ? productTitle({ name: sale.productName, brand: sale.productBrand, model: sale.productModel })
    : productTitle(product);
  const stockLine = !current
    ? 'Este producto ya no está en el catálogo'
    : editing
      ? `Vendidas en esta venta: ${sale.quantity} · En stock: ${current.stock}`
      : `${product.stock === 1 ? 'Queda 1 unidad' : `Quedan ${product.stock} unidades`} · Precio: ${formatPrice(product.finalPrice)}`;

  async function onValid(data) {
    setServerError('');
    const payload = {
      quantity: Number(data.quantity),
      unitPrice: Number(data.unitPrice),
      soldAt: data.soldAt,
      paymentMethod: data.paymentMethod,
      note: data.note.trim(),
    };
    try {
      if (editing) {
        onSaved(await salesApi.update(sale._id, payload));
      } else {
        const { sale: created, product: updated } = await salesApi.create({ productId: product._id, ...payload });
        onSaved(created, updated);
      }
    } catch (err) {
      err.response?.data?.errors?.forEach((e) => setError(e.path, { message: e.msg }));
      setServerError(err.response?.data?.message || 'No se pudo guardar la venta. Intentá de nuevo.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-3">
        {current?.image && (
          <img
            src={assetUrl(current.image, { width: 120 })}
            crossOrigin="anonymous"
            alt=""
            className="h-14 w-14 shrink-0 object-contain"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-ink/60">{stockLine}</p>
        </div>
      </div>

      <div className="grid !gap-x-4 !gap-y-0 sm:!grid-cols-2 lg:!grid-cols-2">
        <div className="field">
          <label htmlFor="sale-quantity">Cantidad</label>
          <input
            id="sale-quantity"
            type="number"
            inputMode="numeric"
            min="1"
            max={Number.isFinite(maxQuantity) ? maxQuantity : undefined}
            step="1"
            {...register('quantity')}
          />
          {errors.quantity && <p className="error">{errors.quantity.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="sale-price">Precio por unidad ($)</label>
          <input id="sale-price" type="number" inputMode="decimal" min="0" step="0.01" {...register('unitPrice')} />
          {errors.unitPrice && <p className="error">{errors.unitPrice.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="sale-date">Fecha de venta</label>
          <input id="sale-date" type="date" max={todayISO()} {...register('soldAt')} />
          {errors.soldAt && <p className="error">{errors.soldAt.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="sale-payment">Medio de pago (opcional)</label>
          <select id="sale-payment" {...register('paymentMethod')}>
            <option value="">Sin especificar</option>
            {methods.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
          {errors.paymentMethod && <p className="error">{errors.paymentMethod.message}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="sale-note">Nota (opcional)</label>
        <input id="sale-note" placeholder="Ej: nombre del cliente, seña, etc." {...register('note')} />
        {errors.note && <p className="error">{errors.note.message}</p>}
      </div>

      <p className="mb-4 rounded-xl bg-gold/15 px-4 py-3 text-ink">
        Total de la venta: <strong className="font-display text-xl">{formatPrice(total)}</strong>
      </p>

      {serverError && <p className="notice notice-danger mb-3">{serverError}</p>}
      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Registrar venta'}
      </button>
    </form>
  );
}
