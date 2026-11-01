import { useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../utils/assetUrl';
import { formatPrice } from '../utils/products';

function ArrowIcon({ direction, className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d={direction === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductCard({ product, onSelect }) {
  const hasDiscount = product.discount > 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-ivory/10 bg-walnut text-left transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl hover:shadow-stage/50 focus-visible:border-gold"
    >
      {/* The whole photo is always visible: contained (never cropped or zoomed),
          on white so product shots with a white background blend in, and with
          nothing laid over it — the badges live below. overflow-hidden only
          stops tall photos from stretching the square (they still fit whole). */}
      <div className="aspect-square w-full overflow-hidden bg-white">
        <img
          src={assetUrl(product.image, { width: 500 })}
          crossOrigin="anonymous"
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-contain p-3 ${product.inStock ? '' : 'opacity-50 grayscale'}`}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Always rendered (even empty) so titles line up across cards */}
        <div className="mb-2 flex min-h-[1.375rem] flex-wrap gap-1.5">
          {!product.inStock && (
            <span className="rounded-full bg-ivory/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ivory">Sin stock</span>
          )}
          {hasDiscount && <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-ink">-{product.discount}%</span>}
          {product.promotion && (
            <span className="max-w-full truncate rounded-full bg-wine px-2.5 py-0.5 text-xs font-semibold text-ivory">
              {product.promotion}
            </span>
          )}
          {product.condition === 'used' && (
            <span className="rounded-full border border-ivory/25 px-2.5 py-0.5 text-xs font-semibold text-ivory/80">Usado</span>
          )}
        </div>
        {product.brand && (
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{product.brand}</span>
        )}
        <h3 className="mt-1 line-clamp-2 font-display text-lg font-semibold leading-snug text-ivory">{product.name}</h3>
        <div className="mt-auto pt-3">
          {hasDiscount && <span className="block text-sm text-ivory/45 line-through">{formatPrice(product.price)}</span>}
          <span className={`font-display text-2xl font-bold ${hasDiscount ? 'text-gold' : 'text-ivory'}`}>
            {formatPrice(product.finalPrice)}
          </span>
        </div>
      </div>
    </button>
  );
}

// Native horizontal scroll with snap points: touch swipe works out of the box
// (and smoothly) on phones; the arrows just scroll one "page" of cards.
export default function ProductCarousel({ products, onSelect }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({
      atStart: track.scrollLeft <= 4,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateEdges, products]);

  function scrollPage(direction) {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  }

  const arrowClass =
    'absolute top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gold/40 bg-stage/90 text-gold shadow-lg shadow-stage/50 transition hover:bg-gold hover:text-ink sm:h-11 sm:w-11';

  return (
    <div className="relative">
      {!edges.atStart && (
        <button type="button" className={`${arrowClass} left-1 sm:-left-3 lg:-left-5`} onClick={() => scrollPage(-1)} aria-label="Ver productos anteriores">
          <ArrowIcon direction="prev" className="h-5 w-5" />
        </button>
      )}

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        aria-label="Productos"
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <li
            key={product._id}
            className="shrink-0 basis-[78%] snap-start sm:basis-[calc((100%-1.25rem)/2)] lg:basis-[calc((100%-3.75rem)/4)]"
          >
            <ProductCard product={product} onSelect={onSelect} />
          </li>
        ))}
      </ul>

      {!edges.atEnd && (
        <button type="button" className={`${arrowClass} right-1 sm:-right-3 lg:-right-5`} onClick={() => scrollPage(1)} aria-label="Ver más productos">
          <ArrowIcon direction="next" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
