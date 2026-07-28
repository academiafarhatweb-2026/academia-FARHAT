import { useEffect, useState } from 'react';
import { homeApi } from '../../api/home';
import { instrumentsApi } from '../../api/catalog';
import ImageUploader from '../../components/ImageUploader';
import { PHONE_PATTERN, PHONE_TITLE, PHONE_MAXLENGTH, WHATSAPP_PATTERN, WHATSAPP_TITLE, WHATSAPP_MAXLENGTH } from '../../utils/validation';

const emptyForm = {
  heroImages: [],
  address: '',
  phone: '',
  whatsappNumber: '',
  instagram: '',
  facebook: '',
};

export default function HomeEditor() {
  const [instruments, setInstruments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);
  const [savedInstrumentId, setSavedInstrumentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingInstrumentId, setSavingInstrumentId] = useState(null);

  useEffect(() => {
    reloadInstruments();
    homeApi.get().then((content) => {
      setForm({
        heroImages: content.heroImages || [],
        address: content.address || '',
        phone: content.phone || '',
        whatsappNumber: content.whatsappNumber || '',
        instagram: content.instagram || '',
        facebook: content.facebook || '',
      });
    });
  }, []);

  function reloadInstruments() {
    instrumentsApi.list().then((list) => {
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

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setDraftField(instrumentId, field, value) {
    setDrafts((d) => ({ ...d, [instrumentId]: { ...d[instrumentId], [field]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await homeApi.update(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveInstrument(instrumentId) {
    if (savingInstrumentId) return;
    setSavedInstrumentId(null);
    setSavingInstrumentId(instrumentId);
    try {
      await instrumentsApi.update(instrumentId, drafts[instrumentId]);
      setSavedInstrumentId(instrumentId);
      reloadInstruments();
    } finally {
      setSavingInstrumentId(null);
    }
  }

  return (
    <div>
      <h1>Editar página principal</h1>

      <form className="card-form" onSubmit={handleSubmit}>
        <ImageUploader label="Imágenes principales (portada)" value={form.heroImages} onChange={(v) => setField('heroImages', v)} />

        <div className="field">
          <label htmlFor="address">Dirección</label>
          <input id="address" value={form.address} onChange={(e) => setField('address', e.target.value)} maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            maxLength={PHONE_MAXLENGTH}
            pattern={PHONE_PATTERN}
            title={PHONE_TITLE}
          />
        </div>
        <div className="field">
          <label htmlFor="whatsappNumber">Número de WhatsApp (con código de país, sin +)</label>
          <input
            id="whatsappNumber"
            type="tel"
            value={form.whatsappNumber}
            onChange={(e) => setField('whatsappNumber', e.target.value)}
            maxLength={WHATSAPP_MAXLENGTH}
            pattern={WHATSAPP_PATTERN}
            title={WHATSAPP_TITLE}
          />
        </div>
        <div className="field">
          <label htmlFor="instagram">Instagram (link completo)</label>
          <input id="instagram" type="url" value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} maxLength={200} />
        </div>
        <div className="field">
          <label htmlFor="facebook">Facebook (link completo)</label>
          <input id="facebook" type="url" value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} maxLength={200} />
        </div>

        <button className="btn" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        {saved && <span style={{ marginLeft: 8 }}>Guardado.</span>}
      </form>

      <h2>Instrumentos en el Home</h2>
      <p className="mb-4 text-sm text-ink/60">
        Por cada instrumento: si se muestra en el Home, su descripción y sus fotos propias.
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
            </div>
          );
        })}
        {instruments.length === 0 && <p>No hay instrumentos cargados todavía.</p>}
      </div>
    </div>
  );
}
