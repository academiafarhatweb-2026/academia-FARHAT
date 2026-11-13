import { useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../utils/assetUrl';
import { CONDITION_LABELS, PAYMENT_METHOD_LABELS, formatPrice, productTitle } from '../utils/products';
import { PaymentMethodIcon } from './paymentIcons';
import ProductPhoto from './ProductPhoto';
import WhatsappButton from './WhatsappButton';

const galleryArrow =
  'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-stage/80 text-2xl leading-none text-ivory transition hover:bg-gold hover:text-ink';

// Products saved before multiple photos existed only have `image`.
function photosOf(product) {
  return product?.images?.length ? product.images : [product?.image].filter(Boolean);
}

// Public product detail with a photo gallery. Closes with the X, a click
// outside or Escape; arrows (also ← → keys) and thumbnails switch photos. On
// phones it opens as a bottom sheet so everything stays within thumb reach.
// Rendered with key={product._id}, so each product starts on its main photo.
export default function ProductDetailModal({ product, whatsappNumber, onClose }) {
  const closeRef = useRef(null);
  const [active, setActive] = useState(0);
  const photos = photosOf(product);
  const count = photos.length;

  // Wraps around: "next" on the last photo goes back to the first one.
  const show = useCallback((index) => setActive(((index % count) + count) % count), [count]);

  useEffect(() => {
    if (!product) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // the page behind shouldn't scroll
    closeRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % count);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [product, onClose, count]);

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

        {/* Like on the cards: the photo fills the frame, or a white-background
            shot is shown whole on white (see ProductPhoto). Fixed height, so
            switching photos doesn't make the page jump; the controls sit on
            dark circles so they read over any photo. */}
        <div className="relative h-[50svh] max-h-[36rem] overflow-hidden bg-stage sm:h-[60vh]">
          <ProductPhoto
            url={photos[active]}
            width={1000}
            alt={photos.length > 1 ? `${product.name} — foto ${active + 1} de ${photos.length}` : product.name}
            className="h-full w-full"
            imgClassName={product.inStock ? '' : 'opacity-60 grayscale'}
          />
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => show(active - 1)} aria-label="Foto anterior" className={galleryArrow + ' left-3'}>
                ‹
              </button>
              <button type="button" onClick={() => show(active + 1)} aria-label="Foto siguiente" className={galleryArrow + ' right-3'}>
                ›
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-stage/80 px-2.5 py-0.5 text-xs font-semibold text-ivory">
                {active + 1} / {photos.length}
              </span>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-6 pt-4 sm:px-8">
            {photos.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={index === active}
                className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition ${
                  index === active ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={assetUrl(url, { width: 160 })} crossOrigin="anonymous" alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

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
