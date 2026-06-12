import { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/ui/EmptyState';

export default function Contratistas() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contratistas')
      .then(r => setData(r.data?.data || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div><h2>Contratistas</h2></div>
      </div>
      <div className="card">
        {loading
          ? <div style={{padding:40,textAlign:'center'}}><span className="ms animate-spin">refresh</span></div>
          : data.length === 0
            ? <EmptyState icon="inbox" title="Sin registros" description="No hay datos disponibles." />
            : <p style={{padding:20,color:'var(--secondary-text)'}}>Contratistas — {data.length} registros.</p>
        }
      </div>
    </>
  );
}
