export default function StatusTag({ value }) {
  const map = {
    vigente:    { cls: 'tag-ok',      dot: 'var(--success)', label: 'Vigente'    },
    proximo:    { cls: 'tag-warning', dot: 'var(--warning)', label: 'Por Vencer' },
    vencido:    { cls: 'tag-danger',  dot: 'var(--danger)',  label: 'Vencido'    },
    en_ejecucion:{ cls:'tag-ok',      dot: 'var(--success)', label: 'En Ejecución'},
    liquidado:  { cls: 'tag-gray',    dot: 'var(--outline)', label: 'Liquidado'  },
    borrador:   { cls: 'tag-gray',    dot: 'var(--outline)', label: 'Borrador'   },
    activo:     { cls: 'tag-ok',      dot: 'var(--success)', label: 'Activo'     },
    suspendido: { cls: 'tag-warning', dot: 'var(--warning)', label: 'Suspendido' },
    inhabilitado:{ cls:'tag-danger',  dot: 'var(--danger)',  label: 'Inhabilitado'},
  };
  const s = map[value] || { cls: 'tag-gray', dot: 'var(--outline)', label: value };
  return (
    <span className={`tag ${s.cls}`}>
      <span className="tag-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}
