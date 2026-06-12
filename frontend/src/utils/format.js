export const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

export const diasRestantes = (fechaFin) => {
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const fin  = new Date(fechaFin); fin.setHours(0,0,0,0);
  return Math.round((fin - hoy) / (1000 * 60 * 60 * 24));
};

export const clasesDias = (dias) => {
  if (dias < 0)  return 'c-danger';
  if (dias <= 30) return 'c-warning';
  return 'c-success';
};
