import { useRef, useState } from 'react';
import { uploadFiles } from '../api/uploads';
import { assetUrl } from '../utils/assetUrl';

export default function ImageUploader({ value = [], onChange, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const urls = await uploadFiles(files);
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeImage(index) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="field">
      {label && <label>{label}</label>}

      {value.length > 0 && (
        <div className="grid mb-16">
          {value.map((url, i) => (
            <div key={i} className="relative">
              <img src={assetUrl(url)} alt="" className="aspect-4/3 w-full rounded-xl object-cover" />
              <button
                type="button"
                className="btn danger absolute right-2 top-2 px-2 py-1 text-xs"
                onClick={() => removeImage(i)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        disabled={uploading}
        className="hidden"
      />
      <button
        type="button"
        className="btn secondary"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Subiendo...' : 'Elegir imagenes'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
