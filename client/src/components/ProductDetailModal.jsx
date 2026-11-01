import { useEffect, useRef } from 'react';
import { assetUrl } from '../utils/assetUrl';
import { CONDITION_LABELS, PAYMENT_METHOD_LABELS, formatPrice, productTitle } from '../utils/products';
import { PaymentMethodIcon } from './paymentIcons';
import WhatsappButton from './WhatsappButton';

// Public product detail. Closes with the X, a click outside or Escape; on
// phones it opens as a bottom sheet so everything stays within thumb reach.
export default function ProductDetailModal({ product, whatsappNumber, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!product) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // the page behind shouldn't scroll
    closeRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [product, onClose]);

  if (!product) return null;

  const hasDiscount = product.discount > 0;
  const message = `Hola! Quiero consultar por ${productTitle(product)}${product.inStock ? '' : ' (figura sin stock)'}.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stage/80 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="grain relative max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-gold/30 bg-walnut text-ivory shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stage/80 text-xl text-ivory/80 transition hover:text-gold"
        >
          &times;
        </button>

        {/* Whole photo, as large as the screen allows, on white; the top
            padding keeps the close button from covering any of it. */}
        <div className="flex justify-center bg-white px-6 pb-6 pt-16">
          <img
            src={assetUrl(product.image, { width: 1000 })}
            crossOrigin="anonymous"
            alt={product.name}
            className={`block max-h-[55svh] w-auto max-w-full object-contain sm:max-h-[60vh] ${
              product.inStock ? '' : 'opacity-60 grayscale'
            }`}
          />
        </div>

        <div className="relative z-[2] px-6 py-6 sm:px-8">
          <div className="flex flex-wrap gap-2">
            {!product.inStock && (
              <span className="rounded-full bg-ivory/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-ivory">Sin stock</span>
            )}
            {product.category && (
              <span className="rounded-full border border-ivory/20 px-3 py-0.5 text-xs font-semibold text-ivory/80">{product.category}</span>
            )}
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                product.condition === 'used' ? 'bg-ivory/15 text-ivory' : 'bg-gold/20 text-gold'
              }`}
            >
              {CONDITION_LABELS[product.condition]}
            </span>
          </div>

          {product.brand && (
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold">{product.brand}</p>
          )}
          <h2 id="product-detail-title" className="mt-1 !mb-0 font-display text-3xl font-semibold !text-ivory">
            {product.name}
          </h2>
          {product.model && <p className="mt-1 text-sm text-ivory/60">Modelo {product.model}</p>}

          {product.description && <p className="mt-4 text-ivory/75">{product.description}</p>}

          <div className="mt-6 flex flex-wrap items-end gap-x-4 gap-y-1 border-t border-ivory/10 pt-5">
            <span className={`font-display text-4xl font-bold ${hasDiscount ? 'text-gold' : 'text-ivory'}`}>
              {formatPrice(product.finalPrice)}
            </span>
            {hasDiscount && (
              <>
                <span className="pb-1 text-lg text-ivory/45 line-through">{formatPrice(product.price)}</span>
                <span className="mb-1.5 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-ink">-{product.discount}%</span>
              </>
            )}
          </div>

          {product.promotion && (
            <p className="mt-4 rounded-xl border border-wine/40 bg-wine/30 px-4 py-3 text-sm font-semibold text-ivory">
              🎁 {product.promotion}
            </p>
          )}

          {product.paymentMethods?.length > 0 && (
            <div className="mt-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-ivory/40">Medios de pago</span>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {product.paymentMethods.map((method) => (
                  <li key={method} className="flex items-center gap-2 rounded-lg bg-stage/50 px-3 py-2 text-sm text-ivory/85">
                    <PaymentMethodIcon method={method} className="h-5 w-5 shrink-0 text-gold" />
                    {PAYMENT_METHOD_LABELS[method]}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-7 flex justify-center">
            <WhatsappButton phone={whatsappNumber} message={message} />
          </div>
        </div>
      </div>
    </div>
  );
}
