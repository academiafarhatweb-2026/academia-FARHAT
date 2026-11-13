import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../utils/assetUrl';
import { MAX_PRODUCT_IMAGES, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from '../utils/products';

let nextKey = 0;
const newKey = () => `photo-${(nextKey += 1)}`;

function rejectionReason(file) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) return 'no es JPG, PNG o WEBP';
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) return 'pesa más de 2 MB';
  return null;
}

function TileButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md bg-white/90 px-1.5 text-xs font-bold text-ink shadow-sm hover:bg-gold disabled:cursor-default disabled:opacity-30 disabled:hover:bg-white/90"
    >
      {children}
    </button>
  );
}

// Product photo list for the form. Each item is either a saved photo
// ({ key, url }) or one just picked ({ key, file, preview }); the first item is
// the main photo. Files are only uploaded when the product is saved.
export default function ProductPhotos({ photos, onChange, error }) {
  const inputRef = useRef(null);
  const draggedIndex = useRef(null);
  const [rejected, setRejected] = useState('');
  const [dragOver, setDragOver] = useState(null);
  const [finePointer] = useState(() => window.matchMedia?.('(pointer: fine)').matches ?? true);

  // Local previews are object URLs: free them when the form goes away.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => photosRef.current.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)),
    []
  );

  function addFiles(fileList) {
    const room = MAX_PRODUCT_IMAGES - photos.length;
    const problems = [];
    const accepted = [];
    for (const file of Array.from(fileList)) {
      const reason = rejectionReason(file);
      if (reason) problems.push(`"${file.name}" ${reason}`);
      else if (accepted.length >= room) problems.push(`"${file.name}" no entra (máximo ${MAX_PRODUCT_IMAGES} fotos)`);
      else accepted.push({ key: newKey(), file, preview: URL.createObjectURL(file) });
    }
    setRejected(problems.length ? `No se agregaron: ${problems.join('; ')}.` : '');
    if (accepted.length) onChange([...photos, ...accepted]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(from, to) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function remove(index) {
    const item = photos[index];
    if (item.preview) URL.revokeObjectURL(item.preview);
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="field">
      <label htmlFor="product-photos-input">
        Fotos ({photos.length} de {MAX_PRODUCT_IMAGES})
      </label>

      <div className="grid !grid-cols-3 !gap-2 sm:!grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.key}
            draggable={finePointer && photos.length > 1}
            onDragStart={() => (draggedIndex.current = index)}
            onDragOver={(e) => {
              if (draggedIndex.current === null) return;
              e.preventDefault();
              setDragOver(index);
            }}
            onDragLeave={() => setDragOver((i) => (i === index ? null : i))}
            onDrop={(e) => {
              e.preventDefault();
              move(draggedIndex.current, index);
              draggedIndex.current = null;
              setDragOver(null);
            }}
            onDragEnd={() => {
              draggedIndex.current = null;
              setDragOver(null);
            }}
            className={`group relative aspect-square overflow-hidden rounded-lg border bg-ink/5 ${
              index === 0 ? 'border-gold ring-2 ring-gold' : 'border-ink/15'
            } ${dragOver === index ? 'outline-2 outline-dashed outline-gold' : ''} ${finePointer ? 'cursor-grab' : ''}`}
          >
            <img
              src={photo.preview || assetUrl(photo.url, { width: 300 })}
              crossOrigin={photo.preview ? undefined : 'anonymous'}
              alt={index === 0 ? 'Foto principal' : `Foto ${index + 1}`}
              className="h-full w-full object-cover"
              draggable={false}
            />
            {index === 0 ? (
              <span className="absolute left-1 top-1 rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-bold text-ink shadow">
                Principal
              </span>
            ) : (
              photo.file && (
                <span className="absolute left-1 top-1 rounded-full bg-ink/70 px-1.5 py-0.5 text-[0.6rem] font-semibold text-ivory">
                  Nueva
                </span>
              )
            )}
            <div className="absolute right-1 top-1">
              <TileButton label="Quitar foto" onClick={() => remove(index)}>
                ✕
              </TileButton>
            </div>
            {/* At most three buttons, so they fit even on a phone-sized tile */}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-ink/40 p-1">
              <TileButton label="Mover a la izquierda" onClick={() => move(index, index - 1)} disabled={index === 0}>
                ◀
              </TileButton>
              {index > 0 && (
                <TileButton label="Usar como foto principal" onClick={() => move(index, 0)}>
                  ★
                </TileButton>
              )}
              <TileButton label="Mover a la derecha" onClick={() => move(index, index + 1)} disabled={index === photos.length - 1}>
                ▶
              </TileButton>
            </div>
          </div>
        ))}

        {photos.length < MAX_PRODUCT_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink/20 text-sm font-semibold text-ink/60 transition hover:border-gold hover:text-ink"
          >
            <span className="text-2xl leading-none">+</span>
            {photos.length ? 'Agregar' : 'Agregar fotos'}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id="product-photos-input"
        type="file"
        multiple
        accept={PRODUCT_IMAGE_TYPES.join(',')}
        onChange={(e) => addFiles(e.target.files)}
        className="hidden"
      />
      <p className="text-xs text-ink/50">
        JPG, PNG o WEBP de hasta 2 MB. La primera es la principal: tocá ★ para elegirla, y ordenalas con las flechas
        {finePointer ? ' o arrastrándolas' : ''}.
      </p>
      {rejected && <p className="error">{rejected}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
