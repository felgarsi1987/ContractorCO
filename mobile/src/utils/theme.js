export const colors = {
  navy:'#0d1f3c', navyMid:'#1a3460', navyLight:'#1e3a5f',
  blue:'#1d4ed8', blueLight:'#3b82f6', bluePale:'#dbeafe',
  success:'#16a34a', successBg:'#f0fdf4',
  warning:'#c2410c', warningBg:'#fff7ed',
  danger:'#dc2626', dangerBg:'#fef2f2',
  white:'#ffffff', gray50:'#f8fafc', gray100:'#f1f5f9',
  gray200:'#e2e8f0', gray300:'#cbd5e1', gray400:'#94a3b8',
  gray500:'#64748b', gray700:'#334155', gray900:'#0f172a',
  bg:'#f0f4f8', card:'#ffffff', border:'#e2e8f0',
};
export const spacing = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32 };
export const radius  = { sm:6, md:10, lg:14, xl:20, full:999 };
export const font    = { xs:11, sm:12, base:13, md:14, lg:16, xl:18, xxl:22, xxxl:28 };
export const shadow  = {
  sm: { shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:.06, shadowRadius:3, elevation:2 },
  md: { shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:.08, shadowRadius:8, elevation:4 },
};
export const formatCOP = (v) =>
  new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(v||0);