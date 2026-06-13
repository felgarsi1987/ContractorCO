export function exportarCSV(data, nombre) {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const csv  = [
    keys.join(','),
    ...data.map(row => keys.map(k => {
      const v = row[k] ?? '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${nombre}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function formatCOP(v) {
  return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);
}

export function diasRestantes(fecha) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fin  = new Date(fecha); fin.setHours(0,0,0,0);
  return Math.round((fin-hoy)/(1000*60*60*24));
}
