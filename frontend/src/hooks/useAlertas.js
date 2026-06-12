import { useState, useEffect } from 'react';
import api from '../services/api';

export function useAlertas() {
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    const fetch = () =>
      api.get('/alertas?leida=false&limit=1')
        .then(r => setNoLeidas(r.data.length))
        .catch(() => {});
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, []);

  return { noLeidas };
}
