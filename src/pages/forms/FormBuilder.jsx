import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import FieldEditor from '../../components/forms/FieldEditor';
import { formService } from '../../services/formService';
import { createField, createSection } from '../../components/forms/fieldTypes';
import useAppStore from '../../store/useAppStore';

let clientIdCounter = 0;
function nextId() {
  clientIdCounter += 1;
  return `_cid_${Date.now()}_${clientIdCounter}`;
}

function assignClientIds(sections) {
  return sections.map((s) => ({
    ...s,
    _clientId: nextId(),
    fields: (s.fields || []).map((f) => ({ ...f, _clientId: nextId() })),
  }));
}

function stripClientIds(sections) {
  return sections.map(({ _clientId, fields, ...s }) => ({
    ...s,
    fields: (fields || []).map(({ _clientId: _, ...f }) => f),
  }));
}

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);

  const [formData, setFormData] = useState({ name: '', description: '', status: 'draft' });
  const [sections, setSections] = useState(() => assignClientIds([createSection('Section 1', 0)]));
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      formService.get(id)
        .then((form) => {
          setFormData({ name: form.name, description: form.description || '', status: form.status || 'draft' });
          if (form.sections?.length) {
            setSections(assignClientIds(form.sections));
          }
        })
        .catch(() => addToast({ type: 'error', message: 'Failed to load form' }));
    }
  }, [id]);

  const updateFormField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addSection = () => {
    setSections((prev) => [...prev, ...assignClientIds([createSection('Untitled Section', prev.length)])]);
  };

  const updateSection = (clientId, updates) => {
    setSections((prev) => prev.map((s) => (s._clientId === clientId ? { ...s, ...updates } : s)));
  };

  const removeSection = (clientId) => {
    setSections((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s._clientId !== clientId);
    });
  };

  const moveSection = (clientId, dir) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s._clientId === clientId);
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, sort_order: i }));
    });
  };

  const addField = (sectionClientId, type) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s._clientId !== sectionClientId) return s;
        const field = createField(type, (s.fields || []).length);
        return { ...s, fields: [...(s.fields || []), { ...field, _clientId: nextId() }] };
      })
    );
  };

  const updateField = (sectionClientId, fieldClientId, updated) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s._clientId !== sectionClientId) return s;
        return { ...s, fields: (s.fields || []).map((f) => (f._clientId === fieldClientId ? updated : f)) };
      })
    );
  };

  const removeField = (sectionClientId, fieldClientId) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s._clientId !== sectionClientId) return s;
        const fields = (s.fields || []).filter((f) => f._clientId !== fieldClientId);
        return { ...s, fields: fields.length === 0 ? [createField('text', 0)] : fields };
      })
    );
  };

  const moveField = (sectionClientId, fieldClientId, dir) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s._clientId !== sectionClientId) return s;
        const fields = [...(s.fields || [])];
        const idx = fields.findIndex((f) => f._clientId === fieldClientId);
        const target = idx + dir;
        if (target < 0 || target >= fields.length) return s;
        [fields[idx], fields[target]] = [fields[target], fields[idx]];
        return { ...s, fields: fields.map((f, i) => ({ ...f, sort_order: i })) };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      addToast({ type: 'error', message: 'Form name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, sections: stripClientIds(sections) };
      if (isEditing) {
        await formService.update(id, payload);
        addToast({ type: 'success', message: 'Form updated successfully' });
      } else {
        await formService.create(payload);
        addToast({ type: 'success', message: 'Form created successfully' });
      }
      navigate('/forms');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save form';
      addToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (preview) {
    return (
      <div className="page-shell">
        <div className="page-header-row">
          <div>
            <div className="page-kicker">Preview Mode</div>
            <h1 className="page-title">Preview: {formData.name || 'Untitled Form'}</h1>
            <p className="page-subtitle">This is how your form will appear to users</p>
          </div>
          <Button variant="secondary" onClick={() => setPreview(false)}>Back to Editor</Button>
        </div>
        {sections.map((section) => (
          <Card key={section._clientId} title={section.title} subtitle={section.description || undefined}>
            <div className="space-y-5">
              {section.fields?.map((field) => (
                <div key={field._clientId} className="animate-fade-in">
                  <label className="input-label">
                    {field.label || 'Untitled Field'}
                    {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <div className="input-field" style={{ background: '#f8fafc', color: '#94a3b8' }}>
                      Select...
                    </div>
                  ) : field.type === 'checkbox' || field.type === 'radio' ? (
                    <div className="space-y-2">
                      {(field.options || []).map((opt, j) => (
                        <label key={j} className="flex items-center gap-2.5 text-sm text-[#475569] cursor-pointer">
                          <div className={`w-4 h-4 border-2 border-[#cbd5e1] ${field.type === 'radio' ? 'rounded-full' : 'rounded-md'}`} />
                          {typeof opt === 'object' ? opt.label : opt}
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <div className="input-field" style={{ background: '#f8fafc', minHeight: '80px' }} />
                  ) : (
                    <div className="input-field" style={{ background: '#f8fafc', color: '#94a3b8' }} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
        {sections.length === 0 && (
          <Card>
            <p className="empty-state-desc py-8 text-center">No sections in this form</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Form Builder</div>
          <h1 className="page-title">{isEditing ? 'Edit Form' : 'Create Form'}</h1>
          <p className="page-subtitle">Design your data collection form with sections and fields</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" onClick={() => setPreview(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </Button>
          <Button variant="secondary" onClick={() => navigate('/forms')}>Cancel</Button>
          <Button loading={saving} onClick={handleSubmit}>
            {isEditing ? 'Update Form' : 'Create Form'}
          </Button>
        </div>
      </div>

      <div className="builder-grid">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Form Details" subtitle="Define the name, purpose, and publishing state for this form.">
            <div className="space-y-5">
              <Input
                label="Form Name"
                value={formData.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="e.g. Customer Feedback Form"
              />
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Brief description of this form"
                />
              </div>
            </div>
          </Card>

          {sections.map((section, si) => (
            <Card key={section._clientId} title={`Section ${si + 1}`} subtitle="Group related fields together for a cleaner collection flow.">
              <div className="space-y-4 mb-4">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section._clientId, { title: e.target.value })}
                  className="text-lg font-bold text-[#0f172a] bg-transparent border-b-2 border-transparent hover:border-[#e2e8f0] focus:border-primary-500 focus:outline-none px-0 py-0.5 w-full"
                  placeholder="Section title"
                />
                <input
                  type="text"
                  value={section.description || ''}
                  onChange={(e) => updateSection(section._clientId, { description: e.target.value })}
                  className="text-sm text-[#64748b] bg-transparent border-b border-transparent hover:border-[#e2e8f0] focus:border-primary-500 focus:outline-none px-0 py-0.5 w-full"
                  placeholder="Optional section description"
                />
              </div>
              <div className="space-y-3">
                {(section.fields || []).map((field, fi) => (
                  <div key={field._clientId} className="animate-fade-in" style={{ animationDelay: `${fi * 30}ms` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5 ml-auto">
                        <button
                          onClick={() => moveField(section._clientId, field._clientId, -1)}
                          disabled={fi === 0}
                          className="p-1 rounded text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveField(section._clientId, field._clientId, 1)}
                          disabled={fi === (section.fields || []).length - 1}
                          className="p-1 rounded text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <FieldEditor
                      field={field}
                      onChange={(updated) => updateField(section._clientId, field._clientId, updated)}
                      onDelete={() => removeField(section._clientId, field._clientId)}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#64748b]">Add field to this section:</span>
                    <div className="flex flex-wrap gap-1">
                      {['text', 'number', 'email', 'date', 'textarea', 'dropdown', 'checkbox', 'radio', 'file', 'gps', 'signature'].map((type) => (
                        <button
                          key={type}
                          onClick={() => addField(section._clientId, type)}
                          className="px-2 py-1 text-xs font-medium text-[#475569] bg-[#f1f5f9] hover:bg-primary-50 hover:text-primary-700 rounded-md transition-all"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeSection(section._clientId)}
                    disabled={sections.length <= 1}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Remove section
                  </button>
                </div>
              </div>
            </Card>
          ))}

          <Button variant="secondary" onClick={addSection} className="w-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Section
          </Button>
        </div>

        <div className="space-y-6">
          <div className="tips-card">
            <div className="tips-card-content">
              <svg className="tips-card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="tips-card-title">Tips</p>
                <ul className="tips-card-list">
                  <li>Use sections to group related fields together</li>
                  <li>Each section can have its own description</li>
                  <li>Technical field IDs are generated automatically</li>
                  <li>Use preview mode to see the final form</li>
                </ul>
              </div>
            </div>
          </div>

          <Card title="Sections" subtitle={`${sections.length} section${sections.length !== 1 ? 's' : ''}`}>
            <div className="space-y-1 -mx-2">
              {sections.map((section, i) => (
                <div key={section._clientId} className="section-nav-item">
                  <span className="section-nav-num">{i + 1}</span>
                  <span className="section-nav-title">{section.title || 'Untitled'}</span>
                  <span className="section-nav-count">{(section.fields || []).length} fields</span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => moveSection(section._clientId, -1)}
                      disabled={i === 0}
                      className="p-1 rounded text-[#94a3b8] hover:text-[#475569] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveSection(section._clientId, 1)}
                      disabled={i === sections.length - 1}
                      className="p-1 rounded text-[#94a3b8] hover:text-[#475569] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
