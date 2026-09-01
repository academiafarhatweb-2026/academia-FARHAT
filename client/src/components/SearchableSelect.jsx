import { useEffect, useRef, useState } from 'react';

// A text input that filters a dropdown list as you type — for selects with
// too many options to scroll through comfortably (e.g. picking one enrollment
// out of dozens). Keeps the same value/onChange shape as a native <select>.
export default function SearchableSelect({ id, options, value, onChange, placeholder = 'Buscar...' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="searchable-select" ref={containerRef}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        className="w-full"
        placeholder={placeholder}
        value={open ? query : selected?.label || ''}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery('');
          setOpen(true);
        }}
      />
      {open && (
        <div className="searchable-select-options">
          {filtered.map((o) => (
            <div
              key={o.value}
              className="searchable-select-option"
              onMouseDown={() => {
                onChange(o.value);
                setOpen(false);
                setQuery('');
              }}
            >
              {o.label}
            </div>
          ))}
          {filtered.length === 0 && <div className="searchable-select-empty">Sin resultados.</div>}
        </div>
      )}
    </div>
  );
}
