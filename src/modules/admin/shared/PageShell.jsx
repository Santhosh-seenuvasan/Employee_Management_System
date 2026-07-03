export default function PageShell({ title, subtitle, children, actions }) {
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="page-header-content">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
