import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import StatusTag from '../components/ui/StatusTag';
import { formatCOP, diasRestantes, clasesDias } from '../utils/format';
import ModalNuevoContrato from '../components/modules/ModalNuevoContrato';

const TABS = [
  { label: 'Todos',       value: '',              count: null },
  { label: 'Vigentes',    value: 'vigente',       count: null },
  { label: 'Por Vencer',  value: 'proximo',       count: null },
  { label: 'Vencidos',    value: 'vencido',       count: null, danger: true },
  { label: 'Liquidados',  value: 'liquidado',     count: null },
];

const TIPOS = ['', 'prestacion_servicios', 'obra', 'suministro', 'consultoria', 'interadministrativo'];
const TIPO_LABELS = { '': 'Todos los tipos', prestacion_servicios: 'Prest. Servicios', obra: 'Obra', suministro: 'Suministro', consultoria: 'Consultoría', interadministrativo: 'Interadministrativo' };

export default function Contratos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contratos, setContratos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const semaforo = searchParams.get('semaforo') || '';
  const buscar   = searchParams.get('buscar')   || '';
  const tipo     = searchParams.get('tipo')     || '';

  const fetchContratos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (semaforo) params.set('semaforo', semaforo);
      if (buscar)   params.set('buscar',   buscar);
      if (tipo)     params.set('tipo_contrato', tipo);
      const { data } = await api.get(`/contratos?${params}`);
      setContratos(data.data || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, semaforo, buscar, tipo]);

  useEffect(() => { fetchContratos(); }, [fetchContratos]);

  const setFilter = (key, val) => {
    const sp = new URLSearchParams(searchParams);
    val ? sp.set(key, val) : sp.delete(key);
    setSearchParams(sp);
    setPage(1);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Gestión de Contratos</h2>
          <p>Administración del ciclo de vida contractual.</p>
        </div>
        <div className="hdr-actions">
          <button className="btn btn-secondary">
            <span className="ms ms-sm">download</span>Exportar
          </button>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <span className="ms ms-sm">add</span>Nuevo Contrato
          </button>
        </div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="tabs">
          {TABS.map(tab => (
            <div
              key={tab.value}
              className={`tab ${semaforo === tab.value ? 'active' : ''} ${tab.danger ? 'tab-danger' : ''}`}
              onClick={() => setFilter('semaforo', tab.value)}
            >
              {tab.label} {total > 0 && semaforo === tab.value ? `(${total})` : ''}
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box" style={{ flex: 1, maxWidth: 300 }}>
            <span className="ms">search</span>
            <input
              className="input"
              placeholder="Número, contratista, objeto..."
              defaultValue={buscar}
              onKeyDown={e => e.key === 'Enter' && setFilter('buscar', e.target.value)}
            />
          </div>
          <select className="select" value={tipo} onChange={e => setFilter('tipo', e.target.value)}>
            {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
          </select>
          <button className="btn btn-secondary"><span className="ms ms-sm">filter_list</span>Filtrar</button>
          <span className="spacer" />
          <span className="text-caption c-secondary">{total} contratos</span>
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--outline)' }}>
            <span className="ms animate-spin">refresh</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Contrato</th>
                  <th>Contratista</th>
                  <th>Tipo</th>
                  <th>Objeto</th>
                  <th>Valor</th>
                  <th>Fecha Fin</th>
                  <th>Días</th>
                  <th>Estado</th>
                  <th>Docs</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map(c => {
                  const dias = diasRestantes(c.fecha_fin);
                  return (
                    <tr key={c.id} onClick={() => navigate(`/contratos/${c.id}`)}>
                      <td className="td-primary">{c.numero_contrato}</td>
                      <td>{c.contratista_nombre}</td>
                      <td><span className="tag tag-gray" style={{ borderRadius: 4 }}>{TIPO_LABELS[c.tipo_contrato] || c.tipo_contrato}</span></td>
                      <td className="td-secondary td-truncate">{c.objeto}</td>
                      <td className="td-secondary">{formatCOP(c.valor_actual)}</td>
                      <td className="td-secondary">{new Date(c.fecha_fin).toLocaleDateString('es-CO')}</td>
                      <td className={clasesDias(dias)} style={{ fontWeight: 600 }}>{dias}d</td>
                      <td><StatusTag value={c.semaforo} /></td>
                      <td className="td-secondary">
                        <span style={{ color: c.docs_vencidos > 0 ? 'var(--danger)' : 'inherit' }}>
                          {c.total_documentos}
                          {c.docs_vencidos > 0 && <span style={{ fontSize: 10, marginLeft: 4 }}>({c.docs_vencidos}✗)</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {contratos.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--outline)' }}>
                    No se encontraron contratos con los filtros aplicados.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {total > 15 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-caption c-secondary">
              Mostrando {Math.min((page-1)*15+1, total)}–{Math.min(page*15, total)} de {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>
                <span className="ms ms-sm">chevron_left</span>
              </button>
              <button className="btn btn-secondary btn-sm" disabled={page * 15 >= total} onClick={() => setPage(p => p+1)}>
                <span className="ms ms-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && <ModalNuevoContrato onClose={() => setModalOpen(false)} onCreated={fetchContratos} />}
    </>
  );
}
