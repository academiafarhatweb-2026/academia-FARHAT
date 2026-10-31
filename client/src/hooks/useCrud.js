import { useCallback, useEffect, useState } from 'react';

// Shared list/create/update/remove state for the admin catalog pages.
export function useCrud(api) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.list());
    } catch {
      // keep the previous list; the spinner must not stay on forever
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function create(data) {
    await api.create(data);
    await reload();
  }

  async function update(id, data) {
    await api.update(id, data);
    await reload();
  }

  async function remove(id) {
    await api.remove(id);
    await reload();
  }

  return { items, loading, reload, create, update, remove };
}
