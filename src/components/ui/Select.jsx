export default function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#475569] mb-1.5">{label}</label>
      )}
      <select
        className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0f172a] bg-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
          error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="" className="text-[#94a3b8]">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
