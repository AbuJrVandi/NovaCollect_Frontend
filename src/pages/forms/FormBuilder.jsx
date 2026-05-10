import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formService } from '../../services/formService';
import { createField, createSection, generateKey } from '../../components/forms/fieldTypes';
import useAppStore from '../../store/useAppStore';

const QUESTION_LIBRARY = [
  { type: 'text', label: 'Text question', shortLabel: 'Text', description: 'Single-line response', icon: 'T' },
  { type: 'textarea', label: 'Long text', shortLabel: 'Long text', description: 'Paragraph response', icon: 'P' },
  { type: 'number', label: 'Number', shortLabel: 'Number', description: 'Numeric response', icon: '#' },
  { type: 'date', label: 'Date', shortLabel: 'Date', description: 'Calendar input', icon: 'D' },
  { type: 'radio', label: 'Select one', shortLabel: 'Select one', description: 'Pick one choice', icon: '1' },
  { type: 'checkbox', label: 'Select many', shortLabel: 'Select many', description: 'Pick multiple choices', icon: 'M' },
  { type: 'dropdown', label: 'Dropdown', shortLabel: 'Dropdown', description: 'Compact choice list', icon: 'V' },
  { type: 'email', label: 'Email', shortLabel: 'Email', description: 'Email address', icon: '@' },
  { type: 'file', label: 'File / image', shortLabel: 'File', description: 'Attachment upload', icon: 'F' },
  { type: 'gps', label: 'GPS', shortLabel: 'GPS', description: 'Capture location', icon: 'G' },
  { type: 'signature', label: 'Signature', shortLabel: 'Signature', description: 'Sign on device', icon: 'S' },
];

const LOGIC_OPERATORS = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Does not equal' },
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: 'contains', label: 'Contains' },
  { value: 'answered', label: 'Has any answer' },
];

const LIBRARY_BLOCKS = [
  {
    id: 'identity',
    title: 'Respondent identity',
    description: 'Name, phone, gender, and age in one reusable block.',
    fields: [
      { type: 'text', label: 'Respondent full name', is_required: true },
      { type: 'text', label: 'Phone number' },
      { type: 'radio', label: 'Gender', options: ['Male', 'Female', 'Prefer not to say'] },
      { type: 'number', label: 'Age' },
    ],
  },
  {
    id: 'location',
    title: 'Location capture',
    description: 'Useful for field surveys that need place and GPS context.',
    fields: [
      { type: 'text', label: 'Village / site name', is_required: true },
      { type: 'gps', label: 'Capture GPS location' },
      { type: 'file', label: 'Site photo' },
    ],
  },
  {
    id: 'observation',
    title: 'Observation notes',
    description: 'Quick block for enumerator notes and evidence.',
    fields: [
      { type: 'textarea', label: 'Observation notes', is_required: true },
      { type: 'file', label: 'Supporting photo or document' },
      { type: 'signature', label: 'Enumerator signature' },
    ],
  },
];

let clientIdCounter = 0;

function nextId() {
  clientIdCounter += 1;
  return `_cid_${Date.now()}_${clientIdCounter}`;
}

function isChoiceType(type) {
  return type === 'dropdown' || type === 'checkbox' || type === 'radio';
}

function makeOptionValue(label, index) {
  const normalized = String(label || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .trim();

  return normalized || `option_${index + 1}`;
}

function normalizeOptions(options = []) {
  return options.map((option, index) => {
    if (typeof option === 'object' && option !== null) {
      const label = option.label || option.value || `Option ${index + 1}`;
      return {
        label,
        value: option.value || makeOptionValue(label, index),
      };
    }

    const label = option || `Option ${index + 1}`;
    return {
      label,
      value: makeOptionValue(label, index),
    };
  });
}

function buildField(type = 'text', sortOrder = 0, seed = {}) {
  const base = createField(type, sortOrder);
  const merged = {
    ...base,
    ...seed,
    type,
    sort_order: sortOrder,
    key: seed.key || generateKey('field'),
    label: seed.label || '',
    help_text: seed.help_text || '',
    default_value: seed.default_value || '',
    is_required: Boolean(seed.is_required),
    validation_rules: Array.isArray(seed.validation_rules) ? seed.validation_rules : [],
    conditional_logic: seed.conditional_logic || null,
    meta: type === 'file' ? { ...(base.meta || {}), ...(seed.meta || {}) } : seed.meta || null,
  };

  if (isChoiceType(type)) {
    const incomingOptions = seed.options ?? base.options ?? ['Option 1'];
    merged.options = normalizeOptions(incomingOptions);
  } else {
    merged.options = null;
  }

  return merged;
}

function buildSection(title = 'Question group', sortOrder = 0, fields = [buildField('text', 0)]) {
  const base = createSection(title, sortOrder);
  return {
    ...base,
    title,
    sort_order: sortOrder,
    description: base.description || '',
    fields,
  };
}

function assignClientIds(sections) {
  return sections.map((section, sectionIndex) => ({
    ...section,
    _clientId: nextId(),
    sort_order: section.sort_order ?? sectionIndex,
    fields: (section.fields || []).map((field, fieldIndex) => ({
      ...buildField(field.type || 'text', field.sort_order ?? fieldIndex, field),
      _clientId: nextId(),
    })),
  }));
}

function sanitizeConditionalLogic(logic) {
  if (!logic?.questionKey || !logic?.operator) return null;

  return {
    questionKey: logic.questionKey,
    operator: logic.operator,
    value: logic.operator === 'answered' ? '' : (logic.value || ''),
  };
}

function stripClientIds(sections) {
  return sections.map(({ _clientId, fields = [], ...section }, sectionIndex) => ({
    ...section,
    sort_order: sectionIndex,
    fields: fields.map(({ _clientId: fieldClientId, ...field }, fieldIndex) => ({
      key: field.key || generateKey('field'),
      label: field.label || '',
      type: field.type || 'text',
      is_required: Boolean(field.is_required),
      validation_rules: Array.isArray(field.validation_rules) ? field.validation_rules : [],
      options: isChoiceType(field.type) ? normalizeOptions(field.options || []) : null,
      conditional_logic: sanitizeConditionalLogic(field.conditional_logic),
      default_value: field.default_value || null,
      help_text: field.help_text || '',
      sort_order: fieldIndex,
      meta: field.type === 'file' ? { ...(field.meta || {}) } : field.meta || null,
    })),
  }));
}

function getQuestionMeta(type) {
  return QUESTION_LIBRARY.find((question) => question.type === type) || QUESTION_LIBRARY[0];
}

function getQuestionLabel(field, fallbackIndex) {
  if (field?.label?.trim()) return field.label.trim();
  return `Question ${fallbackIndex + 1}`;
}

function getFieldPreview(field) {
  if (field.type === 'dropdown') return 'Select from list';
  if (field.type === 'radio') return `${field.options?.length || 0} single-choice option${field.options?.length === 1 ? '' : 's'}`;
  if (field.type === 'checkbox') return `${field.options?.length || 0} multi-select option${field.options?.length === 1 ? '' : 's'}`;
  if (field.type === 'file') return field.meta?.accept ? `Accepts ${field.meta.accept}` : 'File upload';
  if (field.type === 'gps') return 'Captures coordinates on device';
  if (field.type === 'signature') return 'Signature pad';
  if (field.type === 'date') return 'Calendar date';
  if (field.type === 'number') return 'Numeric input';
  if (field.type === 'email') return 'Email input';
  if (field.type === 'textarea') return 'Paragraph response';
  return 'Short response';
}

function findFieldContext(sections, fieldId) {
  for (const section of sections) {
    for (const field of section.fields || []) {
      if (field._clientId === fieldId) {
        return { section, field };
      }
    }
  }

  return null;
}

function buildQuestionReferenceList(sections, excludeFieldId) {
  const result = [];

  sections.forEach((section) => {
    (section.fields || []).forEach((field, index) => {
      if (field._clientId === excludeFieldId) return;
      result.push({
        key: field.key,
        label: `${section.title || 'Group'} · ${getQuestionLabel(field, index)}`,
      });
    });
  });

  return result;
}

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);

  const [formData, setFormData] = useState({ name: '', description: '', status: 'draft' });
  const [sections, setSections] = useState(() => assignClientIds([buildSection('Question group 1', 0)]));
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(null);

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

  useEffect(() => {
    const allFields = sections.flatMap((section) => section.fields || []);
    if (allFields.length === 0) {
      if (selectedFieldId !== null) setSelectedFieldId(null);
      return;
    }

    const selectedExists = allFields.some((field) => field._clientId === selectedFieldId);
    if (!selectedExists) {
      setSelectedFieldId(allFields[0]._clientId);
    }
  }, [sections, selectedFieldId]);

  const selectedContext = findFieldContext(sections, selectedFieldId);
  const selectedSection = selectedContext?.section || null;
  const selectedField = selectedContext?.field || null;
  const questionReferences = buildQuestionReferenceList(sections, selectedFieldId);

  const updateFormField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSection = (sectionId, updates) => {
    setSections((prev) => prev.map((section) => (
      section._clientId === sectionId ? { ...section, ...updates } : section
    )));
  };

  const addSection = () => {
    const newField = { ...buildField('text', 0), _clientId: nextId() };
    const newSection = {
      ...buildSection(`Question group ${sections.length + 1}`, sections.length, [newField]),
      _clientId: nextId(),
    };

    setSections((prev) => [...prev, newSection]);
    setSelectedFieldId(newField._clientId);
  };

  const moveSection = (sectionId, direction) => {
    setSections((prev) => {
      const index = prev.findIndex((section) => section._clientId === sectionId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((section, sortOrder) => ({ ...section, sort_order: sortOrder }));
    });
  };

  const removeSection = (sectionId) => {
    setSections((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((section) => section._clientId !== sectionId);
    });
  };

  const addField = (sectionId, type, afterFieldId = null, seed = {}) => {
    const newField = { ...buildField(type, 0, seed), _clientId: nextId() };

    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      const fields = [...(section.fields || [])];
      const insertIndex = afterFieldId
        ? Math.max(fields.findIndex((field) => field._clientId === afterFieldId) + 1, 0)
        : fields.length;

      fields.splice(insertIndex, 0, newField);
      return {
        ...section,
        fields: fields.map((field, index) => ({ ...field, sort_order: index })),
      };
    }));

    setSelectedFieldId(newField._clientId);
  };

  const addLibraryBlock = (block, sectionId) => {
    let lastInsertedId = null;

    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      const existing = [...(section.fields || [])];
      const additions = block.fields.map((field, index) => {
        const item = {
          ...buildField(field.type, existing.length + index, field),
          _clientId: nextId(),
        };
        lastInsertedId = item._clientId;
        return item;
      });

      const merged = [...existing, ...additions].map((field, index) => ({ ...field, sort_order: index }));
      return { ...section, fields: merged };
    }));

    if (lastInsertedId) setSelectedFieldId(lastInsertedId);
  };

  const updateField = (sectionId, fieldId, updates) => {
    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;
      return {
        ...section,
        fields: (section.fields || []).map((field) => (
          field._clientId === fieldId ? { ...field, ...updates } : field
        )),
      };
    }));
  };

  const removeField = (sectionId, fieldId) => {
    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;
      return {
        ...section,
        fields: (section.fields || [])
          .filter((field) => field._clientId !== fieldId)
          .map((field, index) => ({ ...field, sort_order: index })),
      };
    }));
  };

  const duplicateField = (sectionId, field) => {
    const copy = {
      ...buildField(field.type, field.sort_order + 1, {
        ...field,
        key: generateKey('field'),
        label: field.label ? `${field.label} copy` : '',
      }),
      _clientId: nextId(),
    };

    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      const fields = [...(section.fields || [])];
      const index = fields.findIndex((item) => item._clientId === field._clientId);
      fields.splice(index + 1, 0, copy);
      return {
        ...section,
        fields: fields.map((item, sortOrder) => ({ ...item, sort_order: sortOrder })),
      };
    }));

    setSelectedFieldId(copy._clientId);
  };

  const moveField = (sectionId, fieldId, direction) => {
    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      const fields = [...(section.fields || [])];
      const index = fields.findIndex((field) => field._clientId === fieldId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= fields.length) return section;

      [fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]];
      return {
        ...section,
        fields: fields.map((field, sortOrder) => ({ ...field, sort_order: sortOrder })),
      };
    }));
  };

  const updateOption = (sectionId, fieldId, optionIndex, value) => {
    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      return {
        ...section,
        fields: (section.fields || []).map((field) => {
          if (field._clientId !== fieldId) return field;

          const options = normalizeOptions(field.options || []);
          options[optionIndex] = {
            label: value,
            value: makeOptionValue(value, optionIndex),
          };

          return { ...field, options };
        }),
      };
    }));
  };

  const addOption = (sectionId, fieldId) => {
    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      return {
        ...section,
        fields: (section.fields || []).map((field) => {
          if (field._clientId !== fieldId) return field;

          const options = normalizeOptions(field.options || []);
          const nextLabel = `Option ${options.length + 1}`;
          return {
            ...field,
            options: [...options, { label: nextLabel, value: makeOptionValue(nextLabel, options.length) }],
          };
        }),
      };
    }));
  };

  const removeOption = (sectionId, fieldId, optionIndex) => {
    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      return {
        ...section,
        fields: (section.fields || []).map((field) => {
          if (field._clientId !== fieldId) return field;
          const options = normalizeOptions(field.options || []).filter((_, index) => index !== optionIndex);
          return {
            ...field,
            options: options.length > 0 ? options : [{ label: 'Option 1', value: 'option_1' }],
          };
        }),
      };
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
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
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to save form' });
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
              {(section.fields || []).map((field, index) => (
                <div key={field._clientId} className="animate-fade-in">
                  <label className="input-label">
                    {getQuestionLabel(field, index)}
                    {field.is_required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {field.help_text && <p className="mb-2 text-sm text-[#64748b]">{field.help_text}</p>}
                  {field.type === 'dropdown' ? (
                    <div className="input-field" style={{ background: '#f8fafc', color: '#94a3b8' }}>Select...</div>
                  ) : field.type === 'checkbox' || field.type === 'radio' ? (
                    <div className="space-y-2">
                      {(field.options || []).map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center gap-2.5 text-sm text-[#475569]">
                          <div className={`w-4 h-4 border-2 border-[#cbd5e1] ${field.type === 'radio' ? 'rounded-full' : 'rounded-md'}`} />
                          {typeof option === 'object' ? option.label : option}
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <div className="input-field" style={{ background: '#f8fafc', minHeight: '84px' }} />
                  ) : (
                    <div className="input-field" style={{ background: '#f8fafc', color: '#94a3b8' }} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="rounded-[28px] border border-[rgba(157,175,214,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.92))] p-5 shadow-[0_18px_45px_rgba(30,55,106,0.08)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="page-kicker">Formbuilder</div>
            <div className="space-y-2">
              <input
                value={formData.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                className="w-full bg-transparent text-3xl font-semibold tracking-[-0.04em] text-[#10203f] outline-none"
                placeholder="Untitled form"
              />
              <textarea
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                className="w-full resize-none border-0 bg-transparent p-0 text-sm text-[#5d6d8f] outline-none placeholder:text-[#97a5c0]"
                rows={2}
                placeholder="Describe the purpose of this form, just like a KoboToolbox project overview."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[rgba(43,99,246,0.16)] bg-[rgba(43,99,246,0.08)] px-3 py-1 text-xs font-semibold text-[#2b63f6]">
                {sections.reduce((count, section) => count + (section.fields?.length || 0), 0)} questions
              </span>
              <span className="inline-flex items-center rounded-full border border-[rgba(15,118,110,0.16)] bg-[rgba(15,118,110,0.08)] px-3 py-1 text-xs font-semibold text-[#0f766e]">
                {sections.length} group{sections.length === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center rounded-full border border-[rgba(245,158,11,0.16)] bg-[rgba(245,158,11,0.1)] px-3 py-1 text-xs font-semibold text-[#b45309]">
                {formData.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPreview(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview form
            </Button>
            <Button variant="secondary" onClick={() => navigate('/forms')}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit}>
              {isEditing ? 'Save changes' : 'Create form'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="space-y-6 xl:sticky xl:top-5 xl:self-start">
          <Card title="Question Types" subtitle="Add questions like KoboToolbox’s left-side builder.">
            <div className="grid gap-2">
              {QUESTION_LIBRARY.map((question) => (
                <button
                  key={question.type}
                  onClick={() => addField(selectedSection?._clientId || sections[0]._clientId, question.type)}
                  className="flex items-center gap-3 rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.9)] px-3 py-3 text-left transition-all hover:border-[rgba(43,99,246,0.26)] hover:bg-white"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(43,99,246,0.12),rgba(111,93,255,0.12))] text-sm font-bold text-[#2b63f6]">
                    {question.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#10203f]">{question.label}</span>
                    <span className="block text-xs text-[#6b7a99]">{question.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Question Library" subtitle="Reusable blocks inspired by KoboToolbox’s library.">
            <div className="space-y-3">
              {LIBRARY_BLOCKS.map((block) => (
                <div key={block.id} className="rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] p-4">
                  <p className="text-sm font-semibold text-[#10203f]">{block.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#6b7a99]">{block.description}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 w-full"
                    onClick={() => addLibraryBlock(block, selectedSection?._clientId || sections[0]._clientId)}
                  >
                    Add block to form
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Question Groups" subtitle="Use groups to organize sections of the questionnaire.">
            <div className="space-y-2">
              {sections.map((section, sectionIndex) => (
                <button
                  key={section._clientId}
                  onClick={() => setSelectedFieldId(section.fields?.[0]?._clientId || null)}
                  className={`flex w-full items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-all ${
                    selectedSection?._clientId === section._clientId
                      ? 'border-[rgba(43,99,246,0.26)] bg-[rgba(43,99,246,0.08)]'
                      : 'border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] hover:bg-white'
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-xs font-bold text-[#2b63f6] shadow-[0_6px_16px_rgba(36,63,118,0.08)]">
                    {sectionIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#10203f]">{section.title || `Question group ${sectionIndex + 1}`}</span>
                    <span className="block text-xs text-[#6b7a99]">{section.fields?.length || 0} question{section.fields?.length === 1 ? '' : 's'}</span>
                  </span>
                </button>
              ))}
              <Button variant="secondary" className="w-full" onClick={addSection}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add question group
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <Card
              key={section._clientId}
              className="overflow-hidden"
              title={`Question group ${sectionIndex + 1}`}
              subtitle="Questions can be arranged, duplicated, and configured like KoboToolbox groups."
              action={(
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveSection(section._clientId, -1)}
                    disabled={sectionIndex === 0}
                    className="rounded-[12px] p-2 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#475569] disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveSection(section._clientId, 1)}
                    disabled={sectionIndex === sections.length - 1}
                    className="rounded-[12px] p-2 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#475569] disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeSection(section._clientId)}
                    disabled={sections.length <= 1}
                    className="rounded-[12px] p-2 text-[#f87171] transition-colors hover:bg-red-50 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            >
              <div className="space-y-4">
                <div className="rounded-[20px] border border-[rgba(166,183,219,0.16)] bg-[rgba(248,250,255,0.9)] p-4">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section._clientId, { title: e.target.value })}
                    className="w-full bg-transparent text-xl font-semibold text-[#10203f] outline-none"
                    placeholder="Question group title"
                  />
                  <textarea
                    value={section.description || ''}
                    onChange={(e) => updateSection(section._clientId, { description: e.target.value })}
                    className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm text-[#64748b] outline-none placeholder:text-[#9aa6c0]"
                    rows={2}
                    placeholder="Optional group description or instructions for the enumerator."
                  />
                </div>

                {(section.fields || []).map((field, fieldIndex) => {
                  const questionMeta = getQuestionMeta(field.type);
                  const isSelected = field._clientId === selectedFieldId;
                  const options = normalizeOptions(field.options || []);

                  return (
                    <div
                      key={field._clientId}
                      className={`rounded-[24px] border p-5 transition-all ${
                        isSelected
                          ? 'border-[rgba(43,99,246,0.28)] bg-white shadow-[0_20px_44px_rgba(43,99,246,0.08)]'
                          : 'border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.9)] hover:bg-white'
                      }`}
                      onClick={() => setSelectedFieldId(field._clientId)}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,rgba(43,99,246,0.12),rgba(111,93,255,0.12))] text-sm font-bold text-[#2b63f6]">
                            {questionMeta.icon}
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-[rgba(43,99,246,0.08)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2b63f6]">
                                {questionMeta.shortLabel}
                              </span>
                              {field.is_required && (
                                <span className="inline-flex items-center rounded-full bg-[rgba(239,68,68,0.08)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#dc2626]">
                                  Required
                                </span>
                              )}
                              {field.conditional_logic?.questionKey && (
                                <span className="inline-flex items-center rounded-full bg-[rgba(15,118,110,0.08)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0f766e]">
                                  Skip logic
                                </span>
                              )}
                            </div>

                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(section._clientId, field._clientId, { label: e.target.value })}
                              className="w-full bg-transparent text-lg font-semibold text-[#10203f] outline-none placeholder:text-[#90a0bd]"
                              placeholder="Type your question"
                            />

                            <input
                              type="text"
                              value={field.help_text || ''}
                              onChange={(e) => updateField(section._clientId, field._clientId, { help_text: e.target.value })}
                              className="w-full rounded-[14px] border border-[rgba(166,183,219,0.18)] bg-white px-3 py-2 text-sm text-[#51617f] outline-none transition-colors focus:border-[rgba(43,99,246,0.32)]"
                              placeholder="Question hint or guidance for the enumerator"
                            />

                            <div className="rounded-[18px] border border-dashed border-[rgba(166,183,219,0.26)] bg-[rgba(255,255,255,0.68)] px-4 py-3 text-sm text-[#6b7a99]">
                              {getFieldPreview(field)}
                            </div>

                            {isChoiceType(field.type) && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b88a5]">Choices</p>
                                {options.map((option, optionIndex) => (
                                  <div key={`${field._clientId}_option_${optionIndex}`} className="flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[rgba(166,183,219,0.18)] bg-white text-xs font-bold text-[#2b63f6]">
                                      {optionIndex + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={option.label}
                                      onChange={(e) => updateOption(section._clientId, field._clientId, optionIndex, e.target.value)}
                                      className="input-field"
                                      placeholder={`Choice ${optionIndex + 1}`}
                                    />
                                    <button
                                      onClick={() => removeOption(section._clientId, field._clientId, optionIndex)}
                                      className="rounded-[12px] p-2 text-[#94a3b8] transition-colors hover:bg-red-50 hover:text-[#ef4444]"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                <Button size="sm" variant="secondary" onClick={() => addOption(section._clientId, field._clientId)}>
                                  Add choice
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveField(section._clientId, field._clientId, -1)}
                            disabled={fieldIndex === 0}
                            className="rounded-[12px] p-2 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#475569] disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveField(section._clientId, field._clientId, 1)}
                            disabled={fieldIndex === (section.fields?.length || 0) - 1}
                            className="rounded-[12px] p-2 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#475569] disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => duplicateField(section._clientId, field)}
                            className="rounded-[12px] p-2 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#475569]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeField(section._clientId, field._clientId)}
                            className="rounded-[12px] p-2 text-[#f87171] transition-colors hover:bg-red-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[rgba(166,183,219,0.16)] pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b88a5]">Add question below</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {QUESTION_LIBRARY.slice(0, 6).map((question) => (
                            <button
                              key={`${field._clientId}_${question.type}`}
                              onClick={() => addField(section._clientId, question.type, field._clientId)}
                              className="rounded-full border border-[rgba(166,183,219,0.2)] bg-white px-3 py-1.5 text-xs font-semibold text-[#51617f] transition-all hover:border-[rgba(43,99,246,0.28)] hover:text-[#2b63f6]"
                            >
                              + {question.shortLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(section.fields || []).length === 0 && (
                  <div className="rounded-[22px] border border-dashed border-[rgba(166,183,219,0.28)] bg-[rgba(248,250,255,0.72)] p-6 text-center">
                    <p className="text-sm font-medium text-[#51617f]">This group is empty.</p>
                    <p className="mt-1 text-sm text-[#7b88a5]">Add the first question from the library or quick question buttons.</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {QUESTION_LIBRARY.slice(0, 8).map((question) => (
                    <button
                      key={`${section._clientId}_${question.type}_footer`}
                      onClick={() => addField(section._clientId, question.type)}
                      className="rounded-full border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.9)] px-3 py-2 text-xs font-semibold text-[#51617f] transition-all hover:border-[rgba(43,99,246,0.28)] hover:bg-white hover:text-[#2b63f6]"
                    >
                      + {question.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6 xl:sticky xl:top-5 xl:self-start">
          <Card title="Form Setup" subtitle="Project-level settings similar to KoboToolbox’s form overview.">
            <div className="space-y-4">
              <div>
                <label className="input-label">Collection status</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormField('status', e.target.value)}
                  className="input-field"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] p-4 text-sm text-[#6b7a99]">
                Question IDs and backend keys are generated automatically and stay out of the authoring UI.
              </div>
            </div>
          </Card>

          <Card title="Question Settings" subtitle={selectedField ? 'Adjust the selected question just like Kobo’s right-side settings panel.' : 'Select a question to edit its settings.'}>
            {selectedField && selectedSection ? (
              <div className="space-y-4">
                <div>
                  <label className="input-label">Question type</label>
                  <div className="rounded-[16px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] px-4 py-3">
                    <p className="text-sm font-semibold text-[#10203f]">{getQuestionMeta(selectedField.type).label}</p>
                    <p className="mt-1 text-xs text-[#6b7a99]">Question type is chosen when the question is added, matching KoboToolbox’s builder flow.</p>
                  </div>
                </div>

                <div>
                  <label className="input-label">Question label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, { label: e.target.value })}
                    className="input-field"
                    placeholder="Question label"
                  />
                </div>

                <div>
                  <label className="input-label">Question hint</label>
                  <textarea
                    value={selectedField.help_text || ''}
                    onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, { help_text: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Short guidance shown under the question"
                  />
                </div>

                <div>
                  <label className="input-label">Default answer</label>
                  <input
                    type="text"
                    value={selectedField.default_value || ''}
                    onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, { default_value: e.target.value })}
                    className="input-field"
                    placeholder="Optional default answer"
                  />
                </div>

                {selectedField.type === 'file' && (
                  <div>
                    <label className="input-label">Accepted file types</label>
                    <input
                      type="text"
                      value={selectedField.meta?.accept || ''}
                      onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, { meta: { ...(selectedField.meta || {}), accept: e.target.value } })}
                      className="input-field"
                      placeholder=".jpg,.png,.pdf"
                    />
                  </div>
                )}

                <label className="flex items-center justify-between rounded-[16px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#10203f]">Required response</p>
                    <p className="text-xs text-[#6b7a99]">Respondents must answer before submitting.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.is_required || false}
                    onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, { is_required: e.target.checked })}
                    className="h-4 w-4 rounded border-[#cbd5e1] text-primary-600 focus:ring-primary-500/30"
                  />
                </label>
              </div>
            ) : (
              <p className="text-sm text-[#6b7a99]">Select a question card in the middle column to configure it.</p>
            )}
          </Card>

          <Card title="Skip Logic" subtitle="Show this question only when another answer matches your condition.">
            {selectedField && selectedSection ? (
              <div className="space-y-4">
                <div>
                  <label className="input-label">Controlling question</label>
                  <select
                    value={selectedField.conditional_logic?.questionKey || ''}
                    onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, {
                      conditional_logic: {
                        questionKey: e.target.value,
                        operator: selectedField.conditional_logic?.operator || '=',
                        value: selectedField.conditional_logic?.value || '',
                      },
                    })}
                    className="input-field"
                  >
                    <option value="">Always show this question</option>
                    {questionReferences.map((question) => (
                      <option key={question.key} value={question.key}>{question.label}</option>
                    ))}
                  </select>
                </div>

                {selectedField.conditional_logic?.questionKey && (
                  <>
                    <div>
                      <label className="input-label">Operator</label>
                      <select
                        value={selectedField.conditional_logic?.operator || '='}
                        onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, {
                          conditional_logic: {
                            ...selectedField.conditional_logic,
                            operator: e.target.value,
                            value: e.target.value === 'answered' ? '' : (selectedField.conditional_logic?.value || ''),
                          },
                        })}
                        className="input-field"
                      >
                        {LOGIC_OPERATORS.map((operator) => (
                          <option key={operator.value} value={operator.value}>{operator.label}</option>
                        ))}
                      </select>
                    </div>

                    {selectedField.conditional_logic?.operator !== 'answered' && (
                      <div>
                        <label className="input-label">Value</label>
                        <input
                          type="text"
                          value={selectedField.conditional_logic?.value || ''}
                          onChange={(e) => updateField(selectedSection._clientId, selectedField._clientId, {
                            conditional_logic: {
                              ...selectedField.conditional_logic,
                              value: e.target.value,
                            },
                          })}
                          className="input-field"
                          placeholder="Enter the answer that should trigger this question"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6b7a99]">Skip logic becomes available after you select a question.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
