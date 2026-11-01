import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '../schemas';
import { productsApi, uploadProductImage } from '../api/products';
import { assetUrl } from '../utils/assetUrl';
import {
  CONDITION_LABELS,
  PAYMENT_METHOD_LABELS,
  PRODUCT_IMAGE_TYPES,
  finalPrice,
  formatPrice,
} from '../utils/products';

function toFormValues(product, nextOrder) {
  if (!product) {
    return {
      name: '',
      brand: '',
      model: '',
      category: '',
      condition: 'new',
      description: '',
      price: '',
      discount: '',
      promotion: '',
      paymentMethods: ['cash', 'transfer'],
      stock: '0',
      minStock: '1',
      order: String(nextOrder),
      active: true,
      image: '',
      imageFile: null,
    };
  }
  return {
    name: product.name,
    brand: product.brand || '',
    model: product.model || '',
    category: product.category || '',
    condition: product.condition,
    description: product.description || '',
    price: String(product.price),
    discount: product.discount ? String(product.discount) : '',
    promotion: product.promotion || '',
    paymentMethods: product.paymentMethods || [],
    stock: String(product.stock),
    minStock: String(product.minStock),
    order: String(product.order),
    active: product.active,
    image: product.image || '',
    imageFile: null,
  };
}

function toPayload(data, imageUrl) {
  return {
    name: data.name.trim(),
    brand: data.brand.trim(),
    model: data.model.trim(),
    category: data.category.trim(),
    condition: data.condition,
    description: data.description.trim(),
    price: Number(data.price),
    discount: data.discount === '' ? 0 : Number(data.discount),
    promotion: data.promotion.trim(),
    paymentMethods: data.paymentMethods,
    stock: Number(data.stock),
    minStock: Number(data.minStock),
    order: Number(data.order),
    active: data.active,
    image: imageUrl,
  };
}

// Create/edit form for a stock product. Uploads the picked photo first (the
// server optimizes it), then saves the product with the resulting URL.
export default function ProductForm({ product, nextOrder, onSave }) {
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState('');
  const [serverError, setServerError] = useState('');
  const fileInputRef = useRef(null);
  const uploadedRef = useRef({ file: null, url: '' });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: toFormValues(product, nextOrder) });

  const [price, discount, image, imageFile] = watch(['price', 'discount', 'image', 'imageFile']);
  const showPrice = Number(price) > 0;
  const showFinalPrice = showPrice && Number(discount) > 0 && Number(discount) <= 100;

  // Suggestions are a convenience: without them the field still works.
  useEffect(() => {
    productsApi
      .categorySuggestions()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // The preview is a local object URL: shown instantly, freed when replaced.
  useEffect(() => {
    if (!imageFile) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    setValue('imageFile', file, { shouldValidate: true, shouldDirty: true });
  }

  function clearPickedFile() {
    setValue('imageFile', null, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function onValid(data) {
    setServerError('');

    let imageUrl = data.image;
    if (data.imageFile) {
      // A retry after a failed save reuses the photo already uploaded instead
      // of sending (and storing) the same file again.
      if (uploadedRef.current.file !== data.imageFile) {
        try {
          uploadedRef.current = { file: data.imageFile, url: await uploadProductImage(data.imageFile) };
        } catch (err) {
          setError('imageFile', { message: err.response?.data?.message || 'No se pudo subir la foto. Intentá de nuevo.' });
          return;
        }
      }
      imageUrl = uploadedRef.current.url;
    }

    try {
      await onSave(toPayload(data, imageUrl));
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      // Server-side validation mirrors the form: put each message under its field.
      fieldErrors?.forEach((e) => setError(e.path === 'image' ? 'imageFile' : e.path, { message: e.msg }));
      setServerError(err.response?.data?.message || 'No se pudo guardar el producto. Intentá de nuevo.');
    }
  }

  const currentPhoto = preview || (image ? assetUrl(image, { width: 600 }) : '');

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate>
      <div className="field">
        <label htmlFor="product-photo">Foto</label>
        {currentPhoto && (
          // Same look as on the site: the whole photo, on white, nothing over it.
          <div className="mb-2">
            <div className="flex justify-center rounded-xl border border-ink/10 bg-white p-3">
              <img
                src={currentPhoto}
                crossOrigin={preview ? undefined : 'anonymous'}
                alt="Vista previa"
                className="block max-h-80 w-auto max-w-full object-contain"
              />
            </div>
            {imageFile && <p className="mt-1 text-xs font-semibold text-gold-dark">Foto nueva, sin guardar todavía</p>}
          </div>
        )}
        <input
          ref={fileInputRef}
          id="product-photo"
          type="file"
          accept={PRODUCT_IMAGE_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex-row">
          <button type="button" className="btn secondary" onClick={() => fileInputRef.current?.click()}>
            {currentPhoto ? 'Cambiar foto' : 'Elegir foto'}
          </button>
          {imageFile && (
            <button type="button" className="btn secondary" onClick={clearPickedFile}>
              Descartar
            </button>
          )}
        </div>
        <p className="text-xs text-ink/50">JPG, PNG o WEBP, hasta 2 MB.</p>
        {errors.imageFile && <p className="error">{errors.imageFile.message}</p>}
      </div>

      <div className="field">
        <label htmlFor="product-name">Nombre</label>
        <input id="product-name" {...register('name')} />
        {errors.name && <p className="error">{errors.name.message}</p>}
      </div>

      <div className="grid !gap-x-4 !gap-y-0 sm:!grid-cols-2 lg:!grid-cols-2">
        <div className="field">
          <label htmlFor="product-brand">Marca (opcional)</label>
          <input id="product-brand" {...register('brand')} />
          {errors.brand && <p className="error">{errors.brand.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="product-model">Modelo (opcional)</label>
          <input id="product-model" {...register('model')} />
          {errors.model && <p className="error">{errors.model.message}</p>}
        </div>

        <div className="field">
          <label htmlFor="product-category">Categoría</label>
          {/* Free text with suggestions: a new name becomes a new category on save */}
          <input
            id="product-category"
            list="product-category-suggestions"
            autoComplete="off"
            placeholder="Escribila o elegí una"
            {...register('category')}
          />
          <datalist id="product-category-suggestions">
            {categories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {errors.category && <p className="error">{errors.category.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="product-condition">Estado</label>
          <select id="product-condition" {...register('condition')}>
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.condition && <p className="error">{errors.condition.message}</p>}
        </div>
      </div>


      <div className="field">
        <label htmlFor="product-description">Descripción corta (opcional)</label>
        <textarea id="product-description" rows={3} {...register('description')} />
        {errors.description && <p className="error">{errors.description.message}</p>}
      </div>

      <div className="grid !gap-x-4 !gap-y-0 sm:!grid-cols-2 lg:!grid-cols-2">
        <div className="field">
          <label htmlFor="product-price">Precio ($)</label>
          <input
            id="product-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="Sin puntos: 450000"
            {...register('price')}
          />
          {errors.price && <p className="error">{errors.price.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="product-discount">Descuento % (opcional)</label>
          <input id="product-discount" type="number" inputMode="numeric" min="0" max="100" step="1" {...register('discount')} />
          {errors.discount && <p className="error">{errors.discount.message}</p>}
        </div>
      </div>
      {/* Always echo the price as the Home will show it: typing "450.000" the
          Argentine way into a number field means 450, and this makes it obvious. */}
      {showPrice && (
        <p className="-mt-1 mb-3.5 text-sm text-ink/70">
          {showFinalPrice ? (
            <>
              Precio final: <strong className="text-ink">{formatPrice(finalPrice(price, discount))}</strong>{' '}
              <span className="text-ink/40 line-through">{formatPrice(price)}</span>
            </>
          ) : (
            <>
              Se va a mostrar como: <strong className="text-ink">{formatPrice(price)}</strong>
            </>
          )}
        </p>
      )}

      <div className="field">
        <label htmlFor="product-promotion">Promoción (opcional)</label>
        <input id="product-promotion" placeholder="Ej: Llevá la funda de regalo" {...register('promotion')} />
        {errors.promotion && <p className="error">{errors.promotion.message}</p>}
      </div>

      <fieldset className="field">
        <legend className="mb-1 text-sm font-semibold text-ink/60">Medios de pago aceptados</legend>
        <div className="grid !gap-2 sm:!grid-cols-2 lg:!grid-cols-3">
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 !font-normal !text-ink">
              <input type="checkbox" value={value} {...register('paymentMethods')} />
              {label}
            </label>
          ))}
        </div>
        {errors.paymentMethods && <p className="error">{errors.paymentMethods.message}</p>}
      </fieldset>

      <div className="grid !gap-x-4 !gap-y-0 sm:!grid-cols-3 lg:!grid-cols-3">
        <div className="field">
          <label htmlFor="product-stock">Stock actual</label>
          <input id="product-stock" type="number" inputMode="numeric" min="0" step="1" {...register('stock')} />
          {errors.stock && <p className="error">{errors.stock.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="product-min-stock">Stock mínimo</label>
          <input id="product-min-stock" type="number" inputMode="numeric" min="0" step="1" {...register('minStock')} />
          {errors.minStock && <p className="error">{errors.minStock.message}</p>}
        </div>
        <div className="field">
          {/* Short label so it stays on one line and the three inputs line up */}
          <label htmlFor="product-order">Orden de aparición</label>
          <input id="product-order" type="number" inputMode="numeric" min="1" step="1" {...register('order')} />
          {errors.order ? (
            <p className="error">{errors.order.message}</p>
          ) : (
            <p className="text-xs text-ink/50">1 = primero en la página principal</p>
          )}
        </div>
      </div>

      <div className="field">
        <label className="flex cursor-pointer items-center gap-2 !font-normal !text-ink">
          <input type="checkbox" {...register('active')} /> Activo (se muestra en la página principal)
        </label>
      </div>

      {serverError && <p className="error mb-3">{serverError}</p>}
      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
