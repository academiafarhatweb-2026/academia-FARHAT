import { useEffect, useState } from 'react';
import { assetUrl } from '../utils/assetUrl';

// Decision per photo URL ('cover' | 'contain'), so each photo is analysed once
// per visit: the card and the detail modal show the same photos.
const fitByUrl = new Map();

// A product shot on a white background (catalog style) has a mostly white
// border. Those are shown whole on white; any other photo (taken with a phone,
// with a wall or a hand behind) fills the frame instead.
function hasWhiteBackground(img) {
  const size = img.naturalWidth && img.naturalHeight ? 40 : 0;
  if (!size) return false;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let light = 0;
  let total = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x !== 0 && y !== 0 && x !== size - 1 && y !== size - 1) continue; // border only
      const i = (y * size + x) * 4;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      // Near-white and neutral (not a light-colored wall or sky)
      if (Math.min(r, g, b) >= 225 && Math.max(r, g, b) - Math.min(r, g, b) < 30) light += 1;
      total += 1;
    }
  }
  // Not 100%: a stray line along one edge shouldn't flip the decision.
  return light / total >= 0.65;
}

// Looks at a tiny 40px copy first, so the real photo is shown the right way
// from the start (no switching after it appears, no second download).
function useFit(url) {
  const [fits, setFits] = useState({});
  const fit = fits[url] ?? fitByUrl.get(url);

  useEffect(() => {
    if (!url || fitByUrl.has(url)) return undefined;
    let cancelled = false;
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    const decide = (result) => {
      fitByUrl.set(url, result);
      if (!cancelled) setFits((current) => ({ ...current, [url]: result }));
    };
    probe.onload = () => {
      try {
        decide(hasWhiteBackground(probe) ? 'contain' : 'cover');
      } catch {
        decide('cover'); // unreadable pixels (no CORS on that host): fill the frame
      }
    };
    probe.onerror = () => decide('cover');
    probe.src = assetUrl(url, { width: 40 });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return fit;
}

// Product photo that fills its box — unless it's a white-background catalog
// shot: then it's shown whole on white, with its edges trimmed a little so
// stray lines along the border don't show. `className` sizes the box; extra
// props (alt, loading...) go to the <img>.
export default function ProductPhoto({ url, width, alt, className = '', imgClassName = '', ...imgProps }) {
  const fit = useFit(url);
  const whole = fit === 'contain';

  return (
    <div className={`${className} ${whole ? 'bg-white' : 'bg-stage'}`}>
      {fit && (
        <img
          src={assetUrl(url, { width, trimEdges: whole })}
          crossOrigin="anonymous"
          alt={alt}
          className={`h-full w-full ${whole ? 'object-contain p-[4%]' : 'object-cover'} ${imgClassName}`}
          {...imgProps}
        />
      )}
    </div>
  );
}
