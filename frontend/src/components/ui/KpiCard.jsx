export default function KpiCard({ icon, iconColor, iconBg, label, value, sub, trend, trendOk }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon" style={{ background: iconBg }}>
          <span className="ms" style={{ color: iconColor, fontSize: 20 }}>{icon}</span>
        </div>
        {trend && (
          <span className="text-caption" style={{ color: trendOk === false ? 'var(--danger)' : trendOk ? 'var(--success)' : 'var(--secondary-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            {trendOk && <span className="ms" style={{ fontSize: 13 }}>trending_up</span>}
            {trend}
          </span>
        )}
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
