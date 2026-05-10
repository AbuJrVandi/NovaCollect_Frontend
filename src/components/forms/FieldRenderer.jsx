export default function FieldRenderer({ field, value, onChange, error }) {
  const handleChange = (val) => {
    onChange?.(field.key, val);
  };

  const baseClass = `w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0f172a] bg-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
    error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
  }`;

  const getOptionValue = (opt) => (typeof opt === 'object' ? opt.value : opt);
  const getOptionLabel = (opt) => (typeof opt === 'object' ? opt.label : opt);

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseClass}
            placeholder={field.placeholder || field.help_text}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseClass}
            placeholder={field.placeholder || field.help_text}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseClass}
            placeholder={field.placeholder || field.help_text}
            rows={4}
          />
        );

      case 'dropdown':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseClass}
          >
            <option value="">{field.placeholder || field.help_text || 'Select...'}</option>
            {(field.options || []).map((opt, i) => (
              <option key={i} value={getOptionValue(opt)}>{getOptionLabel(opt)}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="space-y-2.5">
            {(field.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  value={getOptionValue(opt)}
                  checked={(value || []).includes(getOptionValue(opt))}
                  onChange={(e) => {
                    const optVal = getOptionValue(opt);
                    const newVal = value ? [...value] : [];
                    if (e.target.checked) newVal.push(optVal);
                    else newVal.splice(newVal.indexOf(optVal), 1);
                    handleChange(newVal);
                  }}
                  className="w-4 h-4 rounded border-[#cbd5e1] text-primary-600 focus:ring-primary-500/30"
                />
                <span className="text-sm text-[#475569] group-hover:text-[#0f172a] transition-colors">{getOptionLabel(opt)}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2.5">
            {(field.options || []).map((opt, i) => (
              <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name={`field-${field.key}`}
                  value={getOptionValue(opt)}
                  checked={value === getOptionValue(opt)}
                  onChange={(e) => handleChange(e.target.value)}
                  className="w-4 h-4 border-[#cbd5e1] text-primary-600 focus:ring-primary-500/30"
                />
                <span className="text-sm text-[#475569] group-hover:text-[#0f172a] transition-colors">{getOptionLabel(opt)}</span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] cursor-pointer transition-all text-sm text-[#475569] hover:border-[#cbd5e1]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose file
              <input
                type="file"
                accept={field.meta?.accept || '*'}
                onChange={(e) => handleChange(e.target.files[0])}
                className="hidden"
              />
            </label>
            {value && <span className="text-sm text-[#64748b]">{value.name || value}</span>}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseClass}
          />
        );

      case 'gps':
        return <GPSField field={field} value={value} onChange={handleChange} />;

      case 'signature':
        return <SignatureField field={field} value={value} onChange={handleChange} />;

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseClass}
            placeholder={field.help_text}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#475569]">
        {field.label || 'Untitled Field'}
        {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {renderField()}
      {field.help_text && !['dropdown', 'text', 'email', 'number', 'date'].includes(field.type) && (
        <p className="text-xs text-[#64748b] mt-1">{field.help_text}</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function GPSField({ field, value, onChange }) {
  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => alert('Unable to retrieve location')
    );
  };

  return (
    <div className="flex items-center gap-3">
        <input
          type="text"
          value={value || ''}
          readOnly
          className="w-full px-3.5 py-2.5 text-sm border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b]"
          placeholder={field?.placeholder || 'Click capture to get location'}
        />
      <button
        type="button"
        onClick={getLocation}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 hover:text-primary-800 transition-all duration-150 border border-primary-200 hover:border-primary-300 active:scale-[0.97]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Capture
      </button>
    </div>
  );
}

function SignatureField({ field, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-[#e2e8f0] rounded-lg text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          placeholder={field?.placeholder || 'Type your signature or use a signature pad'}
        />
      </div>
    );
}
