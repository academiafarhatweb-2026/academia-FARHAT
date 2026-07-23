import { useEffect, useState } from 'react';
import { homeApi } from '../../api/home';
import { instrumentsApi } from '../../api/catalog';
import ImageUploader from '../../components/ImageUploader';

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
    setSaved(false);
    await homeApi.update(form);
    setSaved(true);
  }

  async function handleSaveInstrument(instrumentId) {
    setSavedInstrumentId(null);
    await instrumentsApi.update(instrumentId, drafts[instrumentId]);
    setSavedInstrumentId(instrumentId);
    reloadInstruments();
  }

  return (
    <div>
      <h1>Editar pagina principal</h1>

      <form className="card-form" onSubmit={handleSubmit}>
        <ImageUploader label="Imagenes principales (portada)" value={form.heroImages} onChange={(v) => setField('heroImages', v)} />

        <div className="field">
          <label htmlFor="address">Direccion</label>
          <input id="address" value={form.address} onChange={(e) => setField('address', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefono</label>
          <input id="phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="whatsappNumber">Numero de WhatsApp (con codigo de pais, sin +)</label>
          <input id="whatsappNumber" value={form.whatsappNumber} onChange={(e) => setField('whatsappNumber', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="instagram">Instagram (link completo)</label>
          <input id="instagram" value={form.instagram} onChange={(e) => setField('instagram', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="facebook">Facebook (link completo)</label>
          <input id="facebook" value={form.facebook} onChange={(e) => setField('facebook', e.target.value)} />
        </div>

        <button className="btn" type="submit">Guardar</button>
        {saved && <span style={{ marginLeft: 8 }}>Guardado.</span>}
      </form>

      <h2>Instrumentos en el Home</h2>
      <p className="mb-4 text-sm text-ink/60">
        Por cada instrumento: si se muestra en el Home, su descripcion y sus fotos propias.
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
                <label htmlFor={`desc-${instrument._id}`}>Descripcion</label>
                <textarea
                  id={`desc-${instrument._id}`}
                  value={draft.description}
                  onChange={(e) => setDraftField(instrument._id, 'description', e.target.value)}
                />
              </div>

              <ImageUploader
                label="Fotos"
                value={draft.images}
                onChange={(v) => setDraftField(instrument._id, 'images', v)}
              />

              <button type="button" className="btn secondary" onClick={() => handleSaveInstrument(instrument._id)}>
                Guardar {instrument.name}
              </button>
              {savedInstrumentId === instrument._id && <span className="ml-2">Guardado.</span>}
            </div>
          );
        })}
        {instruments.length === 0 && <p>No hay instrumentos cargados todavia.</p>}
      </div>
    </div>
  );
}
