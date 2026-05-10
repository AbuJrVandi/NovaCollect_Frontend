export default function Card({ children, className = '', title, subtitle, action, hover }) {
  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
