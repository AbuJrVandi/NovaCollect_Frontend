import { fieldTypes } from './fieldTypes';

function optionsToStrings(options) {
  if (!options) return [];
  return options.map((o) => (typeof o === 'object' ? o.label : o));
}

function stringsToOptions(strings) {
  return strings.map((s) => ({ label: s, value: s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }));
}

export default function FieldEditor({ field, onChange, onDelete }) {
  const handleChange = (key, value) => {
    onChange({ ...field, [key]: value });
  };

  return (
    <div className="rounded-[22px] border border-[rgba(166,183,219,0.2)] bg-[rgba(248,250,255,0.9)] p-5 space-y-4 transition-all duration-150 hover:border-[rgba(121,147,203,0.28)] hover:shadow-[0_12px_30px_rgba(36,63,118,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="input-label">Field Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => handleChange('label', e.target.value)}
                className="input-field"
                placeholder="Field label"
              />
            </div>
            <div>
              <label className="input-label">Field Type</label>
              <select
                value={field.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="input-field"
              >
                {fieldTypes.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="flex-1">
              <label className="input-label">Help text</label>
              <input
                type="text"
                value={field.help_text || ''}
                onChange={(e) => handleChange('help_text', e.target.value)}
                className="input-field"
                placeholder="Optional help text"
              />
            </div>
            <div>
              <label className="input-label">Default value</label>
              <input
                type="text"
                value={field.default_value || ''}
                onChange={(e) => handleChange('default_value', e.target.value)}
                className="input-field"
                placeholder="Default"
              />
            </div>
          </div>

          {(field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox') && (
            <div>
              <label className="input-label">Options (one per line)</label>
              <textarea
                value={optionsToStrings(field.options || []).join('\n')}
                onChange={(e) => handleChange('options', stringsToOptions(e.target.value.split('\n').filter(Boolean)))}
                className="input-field"
                rows={3}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          {field.type === 'file' && (
            <div>
              <label className="input-label">Accepted file types</label>
              <input
                type="text"
                value={field.meta?.accept || ''}
                onChange={(e) => handleChange('meta', { ...(field.meta || {}), accept: e.target.value })}
                className="input-field"
                placeholder=".pdf,.jpg,.png"
              />
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 flex-shrink-0 pt-7">
          <label className="relative flex items-center gap-2 text-xs text-[#5d6d8f] cursor-pointer group whitespace-nowrap">
            <input
              type="checkbox"
              checked={field.is_required || false}
              onChange={(e) => handleChange('is_required', e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#cbd5e1] text-primary-600 focus:ring-primary-500/30"
            />
            <span className="group-hover:text-[#0f172a] transition-colors">Required</span>
          </label>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-all duration-150"
            title="Remove field"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
