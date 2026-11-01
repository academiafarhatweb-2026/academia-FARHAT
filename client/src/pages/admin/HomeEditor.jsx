import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { homeApi } from '../../api/home';
import { instrumentsApi } from '../../api/catalog';
import ImageUploader from '../../components/ImageUploader';
import { homeContentSchema } from '../../schemas';

const emptyValues = { address: '', phone: '', whatsappNumber: '', instagram: '', facebook: '' };

export default function HomeEditor() {
  const [instruments, setInstruments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [heroImages, setHeroImages] = useState([]);
  const [saved, setSaved] = useState(false);
  const [savedInstrumentId, setSavedInstrumentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingInstrumentId, setSavingInstrumentId] = useState(null);
  // The form only appears once the saved content has loaded: saving the empty
  // placeholder values would wipe the real Home (photos, address, links).
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error
  const [saveError, setSaveError] = useState('');
  const [instrumentError, setInstrumentError] = useState({ id: null, message: '' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(homeContentSchema), defaultValues: emptyValues });

  const loadContent = useCallback(() => {
    setLoadState('loading');
    homeApi
      .get({ fresh: true })
      .then((content) => {
        setHeroImages(content.heroImages || []);
        reset({
          address: content.address || '',
          phone: content.phone || '',
          whatsappNumber: content.whatsappNumber || '',
          instagram: content.instagram || '',
          facebook: content.facebook || '',
        });
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [reset]);

  useEffect(() => {
    reloadInstruments();
    loadContent();
  }, [loadContent]);

  function reloadInstruments() {
    instrumentsApi.list().catch(() => []).then((list) => {
      setInstruments(list);
      setDrafts((prev) => {
        const next = { ...prev };
        list.forEach((i) => {
          if (!next[i._id]) {
            next[i._id] = { isPublic: i.isPublic, description: i.description || '', images: i.images || [] };
          }
        });
        return next;
      });
    });
  }

  function setDraftField(instrumentId, field, value) {
    setDrafts((d) => ({ ...d, [instrumentId]: { ...d[instrumentId], [field]: value } }));
  }

  async function onValid(data) {
    if (saving || loadState !== 'ready') return;
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      await homeApi.update({
        heroImages,
        address: data.address.trim(),
        phone: data.phone.trim(),
        whatsappNumber: data.whatsappNumber.trim(),
        instagram: data.instagram.trim(),
        facebook: data.facebook.trim(),
      });
      setSaved(true);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'No se pudieron guardar los cambios. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveInstrument(instrumentId) {
    if (savingInstrumentId) return;
    setSavedInstrumentId(null);
    setInstrumentError({ id: null, message: '' });
    setSavingInstrumentId(instrumentId);
    try {
      await instrumentsApi.update(instrumentId, drafts[instrumentId]);
      setSavedInstrumentId(instrumentId);
      reloadInstruments();
    } catch (err) {
      setInstrumentError({ id: instrumentId, message: err.response?.data?.message || 'No se pudo guardar.' });
    } finally {
      setSavingInstrumentId(null);
    }
  }

  return (
    <div>
      <h1>Editar página principal</h1>

      {loadState === 'loading' && <p className="mb-6">Cargando...</p>}
      {loadState === 'error' && (
        <div className="notice notice-danger mb-6">
          No se pudo cargar el contenido de la página principal.{' '}
          <button type="button" className="btn secondary ml-2 !py-1" onClick={loadContent}>
            Reintentar
          </button>
        </div>
      )}

      <form className={`card-form ${loadState === 'ready' ? '' : 'hidden'}`} onSubmit={handleSubmit(onValid)} noValidate>
        <ImageUploader label="Imágenes principales (portada)" value={heroImages} onChange={setHeroImages} />

        <div className="field">
          <label htmlFor="address">Dirección</label>
          <input id="address" {...register('address')} />
          {errors.address && <p className="error">{errors.address.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input id="phone" type="tel" {...register('phone')} />
          {errors.phone && <p className="error">{errors.phone.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="whatsappNumber">Número de WhatsApp (con código de país, sin +)</label>
          <input id="whatsappNumber" type="tel" {...register('whatsappNumber')} />
          {errors.whatsappNumber && <p className="error">{errors.whatsappNumber.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="instagram">Instagram (link completo)</label>
          <input id="instagram" type="url" {...register('instagram')} />
          {errors.instagram && <p className="error">{errors.instagram.message}</p>}
        </div>
        <div className="field">
          <label htmlFor="facebook">Facebook (link completo)</label>
          <input id="facebook" type="url" {...register('facebook')} />
          {errors.facebook && <p className="error">{errors.facebook.message}</p>}
        </div>

        {saveError && <p className="notice notice-danger mb-3">{saveError}</p>}
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        {saved && <span style={{ marginLeft: 8 }}>Guardado.</span>}
      </form>

      <h2>Instrumentos en la página principal</h2>
      <p className="mb-4 text-sm text-ink/60">
        Por cada instrumento: si se muestra en la página principal, su descripción y sus fotos propias.
      </p>

      <div className="grid">
        {instruments.map((instrument) => {
          const draft = drafts[instrument._id] || { isPublic: instrument.isPublic, description: '', images: [] };
          return (
            <div key={instrument._id} className="card">
              <div className="flex-row justify-between">
                <h3 className="mb-0">{instrument.name}</h3>
                <label className="flex-row">
                  <input
                    type="checkbox"
                    checked={draft.isPublic}
                    onChange={(e) => setDraftField(instrument._id, 'isPublic', e.target.checked)}
                  />
                  Mostrar
                </label>
              </div>

              <div className="field">
                <label htmlFor={`desc-${instrument._id}`}>Descripción</label>
                <textarea
                  id={`desc-${instrument._id}`}
                  value={draft.description}
                  onChange={(e) => setDraftField(instrument._id, 'description', e.target.value)}
                  maxLength={500}
                />
              </div>

              <ImageUploader
                label="Fotos"
                value={draft.images}
                onChange={(v) => setDraftField(instrument._id, 'images', v)}
              />

              <button
                type="button"
                className="btn secondary"
                onClick={() => handleSaveInstrument(instrument._id)}
                disabled={savingInstrumentId === instrument._id}
              >
                {savingInstrumentId === instrument._id ? 'Guardando...' : `Guardar ${instrument.name}`}
              </button>
              {savedInstrumentId === instrument._id && <span className="ml-2">Guardado.</span>}
              {instrumentError.id === instrument._id && (
                <p className="mt-2 text-sm font-medium text-wine">{instrumentError.message}</p>
              )}
            </div>
          );
        })}
        {instruments.length === 0 && <p>No hay instrumentos cargados todavía.</p>}
      </div>
    </div>
  );
}
