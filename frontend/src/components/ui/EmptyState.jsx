export default function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <span className="ms" style={{ fontSize: 40, color: 'var(--outline)', display: 'block', marginBottom: 12 }}>{icon}</span>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--on-surface)', marginBottom: 6 }}>{title}</div>
      {description && <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 16 }}>{description}</p>}
      {action}
    </div>
  );
}
