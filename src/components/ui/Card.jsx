export default function Card({ children, className = '', title, subtitle, action, hover }) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#e2e8f0] shadow-sm transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-[#cbd5e1]' : ''
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={title || action ? 'p-6' : 'p-6'}>{children}</div>
    </div>
  );
}
