export default function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className="input-group w-full">
      {label && <label className="input-label">{label}</label>}
      <select
        className={`input-field ${error ? 'error' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="" className="text-[#94a3b8]">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
