import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FieldRenderer from '../../components/forms/FieldRenderer';
import { formService } from '../../services/formService';
import { createField, createSection, generateKey } from '../../components/forms/fieldTypes';
import useAppStore from '../../store/useAppStore';

const QUESTION_LIBRARY = [
  { type: 'text', label: 'Short text', shortLabel: 'Text', description: 'Single-line response', icon: 'T' },
  { type: 'textarea', label: 'Long text', shortLabel: 'Long', description: 'Paragraph response', icon: 'P' },
  { type: 'number', label: 'Number', shortLabel: 'Number', description: 'Numeric input', icon: '#' },
  { type: 'date', label: 'Date', shortLabel: 'Date', description: 'Calendar date', icon: 'D' },
  { type: 'radio', label: 'Select one', shortLabel: 'One', description: 'Choose one option', icon: '1' },
  { type: 'checkbox', label: 'Select many', shortLabel: 'Many', description: 'Choose multiple options', icon: 'M' },
  { type: 'dropdown', label: 'Dropdown', shortLabel: 'List', description: 'Compact select list', icon: 'V' },
  { type: 'email', label: 'Email', shortLabel: 'Email', description: 'Email response', icon: '@' },
  { type: 'file', label: 'File / image', shortLabel: 'File', description: 'Upload a file', icon: 'F' },
  { type: 'gps', label: 'GPS location', shortLabel: 'GPS', description: 'Capture coordinates', icon: 'G' },
  { type: 'signature', label: 'Signature', shortLabel: 'Sign', description: 'Signature field', icon: 'S' },
];

const LIBRARY_BLOCKS = [
  {
    id: 'identity',
    title: 'Respondent identity',
    description: 'Useful for registration or household surveys.',
    fields: [
      { type: 'text', label: 'Full name', is_required: true, placeholder: 'Enter full name' },
      { type: 'text', label: 'Phone number', placeholder: '+234...' },
      { type: 'radio', label: 'Gender', options: ['Male', 'Female', 'Prefer not to say'] },
      { type: 'number', label: 'Age', placeholder: 'Enter age' },
    ],
  },
  {
    id: 'location',
    title: 'Location & evidence',
    description: 'Capture where the data came from with supporting evidence.',
    fields: [
      { type: 'text', label: 'Site / community name', is_required: true },
      { type: 'gps', label: 'GPS coordinates' },
      { type: 'file', label: 'Photo evidence' },
    ],
  },
  {
    id: 'observation',
    title: 'Observation summary',
    description: 'Great for monitoring and evaluation workflows.',
    fields: [
      { type: 'textarea', label: 'Observation notes', is_required: true, placeholder: 'Enter your observations' },
      { type: 'checkbox', label: 'Priority actions', options: ['Escalate', 'Monitor', 'Close'] },
      { type: 'signature', label: 'Enumerator signature' },
    ],
  },
];

const LOGIC_OPERATORS = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: 'answered', label: 'Has any answer' },
];

let clientIdCounter = 0;

function nextId() {
  clientIdCounter += 1;
  return `_cid_${Date.now()}_${clientIdCounter}`;
}

function isChoiceType(type) {
  return ['dropdown', 'checkbox', 'radio'].includes(type);
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
    placeholder: seed.placeholder || '',
    default_value: seed.default_value ?? '',
    is_required: Boolean(seed.is_required),
    validation_rules: Array.isArray(seed.validation_rules) ? seed.validation_rules : [],
    conditional_logic: seed.conditional_logic || null,
    meta: type === 'file' ? { ...(base.meta || {}), ...(seed.meta || {}) } : seed.meta || null,
  };

  if (isChoiceType(type)) {
    merged.options = normalizeOptions(seed.options ?? base.options ?? ['Option 1']);
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
      placeholder: field.placeholder || null,
      sort_order: fieldIndex,
      meta: field.type === 'file' ? { ...(field.meta || {}) } : field.meta || null,
    })),
  }));
}

function getQuestionMeta(type) {
  return QUESTION_LIBRARY.find((question) => question.type === type) || QUESTION_LIBRARY[0];
}

function getQuestionLabel(field, fallbackIndex) {
  return field?.label?.trim() || `Question ${fallbackIndex + 1}`;
}

function getQuestionReferenceList(sections, excludeFieldId) {
  const references = [];

  sections.forEach((section) => {
    (section.fields || []).forEach((field, index) => {
      if (field._clientId === excludeFieldId) return;
      references.push({
        key: field.key,
        label: `${section.title || 'Group'} · ${getQuestionLabel(field, index)}`,
      });
    });
  });

  return references;
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

function getDefaultPreviewValue(field) {
  if (field.type === 'checkbox') {
    return Array.isArray(field.default_value) ? field.default_value : [];
  }

  if (field.type === 'file') return null;

  return field.default_value ?? '';
}

function getPreviewDefaults(sections) {
  const values = {};

  sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      values[field.key] = getDefaultPreviewValue(field);
    });
  });

  return values;
}

function isAnswered(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function matchesConditionalLogic(field, values) {
  const logic = field.conditional_logic;
  if (!logic?.questionKey || !logic?.operator) return true;

  const sourceValue = values[logic.questionKey];
  const compareValue = logic.value;

  switch (logic.operator) {
    case '=':
      return Array.isArray(sourceValue) ? sourceValue.includes(compareValue) : String(sourceValue ?? '') === String(compareValue ?? '');
    case '!=':
      return Array.isArray(sourceValue) ? !sourceValue.includes(compareValue) : String(sourceValue ?? '') !== String(compareValue ?? '');
    case 'contains':
      return Array.isArray(sourceValue)
        ? sourceValue.includes(compareValue)
        : String(sourceValue ?? '').toLowerCase().includes(String(compareValue ?? '').toLowerCase());
    case '>':
      return Number(sourceValue) > Number(compareValue);
    case '<':
      return Number(sourceValue) < Number(compareValue);
    case 'answered':
      return isAnswered(sourceValue);
    default:
      return true;
  }
}

function validatePreview(sections, values) {
  const errors = {};

  sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      if (!matchesConditionalLogic(field, values)) return;

      const value = values[field.key];
      const optionValues = normalizeOptions(field.options || []).map((option) => option.value);

      if (field.is_required && !isAnswered(value)) {
        errors[field.key] = 'This question is required.';
        return;
      }

      if (!isAnswered(value)) return;

      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        errors[field.key] = 'Enter a valid email address.';
      } else if (field.type === 'number' && Number.isNaN(Number(value))) {
        errors[field.key] = 'Enter a valid number.';
      } else if (field.type === 'dropdown' || field.type === 'radio') {
        if (optionValues.length > 0 && !optionValues.includes(value)) {
          errors[field.key] = 'Choose one of the available options.';
        }
      } else if (field.type === 'checkbox') {
        if (!Array.isArray(value)) {
          errors[field.key] = 'Select one or more options.';
        } else if (value.some((item) => !optionValues.includes(item))) {
          errors[field.key] = 'One or more selected options are invalid.';
        }
      }
    });
  });

  return errors;
}

function getVisibleFieldCount(sections, values) {
  let count = 0;

  sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      if (matchesConditionalLogic(field, values)) count += 1;
    });
  });

  return count;
}

function getAnsweredVisibleFieldCount(sections, values) {
  let count = 0;

  sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      if (matchesConditionalLogic(field, values) && isAnswered(values[field.key])) count += 1;
    });
  });

  return count;
}

function getFieldPreviewText(field) {
  if (field.type === 'dropdown') return field.placeholder || 'Dropdown list';
  if (field.type === 'radio') return `${field.options?.length || 0} single-select options`;
  if (field.type === 'checkbox') return `${field.options?.length || 0} multi-select options`;
  if (field.type === 'file') return field.meta?.accept ? `Accepts ${field.meta.accept}` : 'File upload';
  if (field.type === 'gps') return 'Capture location on device';
  if (field.type === 'signature') return 'Type or draw a signature';
  if (field.type === 'textarea') return field.placeholder || 'Paragraph answer';
  return field.placeholder || 'Response field';
}

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useAppStore((state) => state.addToast);

  const [formData, setFormData] = useState({ name: '', description: '', status: 'draft' });
  const [sections, setSections] = useState(() => assignClientIds([buildSection('Question group 1', 0)]));
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [previewValues, setPreviewValues] = useState({});
  const [previewErrors, setPreviewErrors] = useState({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (!isEditing) return;

    formService.get(id)
      .then((form) => {
        setFormData({
          name: form.name,
          description: form.description || '',
          status: form.status || 'draft',
        });
        if (form.sections?.length) {
          setSections(assignClientIds(form.sections));
        }
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load form' }));
  }, [id]);

  useEffect(() => {
    const allFields = sections.flatMap((section) => section.fields || []);
    if (allFields.length === 0) {
      if (selectedFieldId !== null) setSelectedFieldId(null);
      return;
    }

    if (!allFields.some((field) => field._clientId === selectedFieldId)) {
      setSelectedFieldId(allFields[0]._clientId);
    }
  }, [sections, selectedFieldId]);

  const selectedContext = findFieldContext(sections, selectedFieldId);
  const selectedSection = selectedContext?.section || null;
  const selectedField = selectedContext?.field || null;
  const questionReferences = getQuestionReferenceList(sections, selectedFieldId);
  const totalQuestions = sections.reduce((count, section) => count + (section.fields?.length || 0), 0);
  const visibleQuestions = getVisibleFieldCount(sections, previewValues);
  const answeredVisibleQuestions = getAnsweredVisibleFieldCount(sections, previewValues);

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

      return {
        ...section,
        fields: [...existing, ...additions].map((field, index) => ({ ...field, sort_order: index })),
      };
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
    const targetSection = sections.find((section) => section._clientId === sectionId);
    if ((targetSection?.fields || []).length <= 1) {
      addToast({ type: 'error', message: 'Each question group must contain at least one question.' });
      return;
    }

    setSections((prev) => prev.map((section) => {
      if (section._clientId !== sectionId) return section;

      const nextFields = (section.fields || [])
        .filter((field) => field._clientId !== fieldId)
        .map((field, index) => ({ ...field, sort_order: index }));

      return { ...section, fields: nextFields };
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

  const openPreview = () => {
    setPreviewValues(getPreviewDefaults(sections));
    setPreviewErrors({});
    setPreviewSubmitted(false);
    setPreview(true);
  };

  const resetPreview = () => {
    setPreviewValues(getPreviewDefaults(sections));
    setPreviewErrors({});
    setPreviewSubmitted(false);
  };

  const handlePreviewChange = (key, value) => {
    setPreviewValues((prev) => ({ ...prev, [key]: value }));
    setPreviewErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handlePreviewSubmit = (event) => {
    event.preventDefault();
    const errors = validatePreview(sections, previewValues);
    setPreviewErrors(errors);

    if (Object.keys(errors).length > 0) {
      addToast({ type: 'error', message: 'Preview validation failed. Review the highlighted questions.' });
      return;
    }

    setPreviewSubmitted(true);
    addToast({ type: 'success', message: 'Preview completed successfully.' });
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
    } catch (error) {
      addToast({ type: 'error', message: error.response?.data?.message || 'Failed to save form' });
    } finally {
      setSaving(false);
    }
  };

  if (preview) {
    return (
      <div className="page-shell space-y-6">
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#10203f_0%,#1d4ed8_50%,#0f766e_100%)] p-6 text-white shadow-[0_28px_80px_rgba(19,41,86,0.24)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                Live Preview
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em]">{formData.name || 'Untitled form'}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/75">
                  Fill this preview exactly like an end user would. Required validation, skip logic, defaults, placeholders, and choice fields are all active here.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={resetPreview}>Reset answers</Button>
              <Button variant="secondary" onClick={() => setPreview(false)}>Back to builder</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handlePreviewSubmit} className="space-y-6">
            <Card className="overflow-hidden">
              <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(248,251,255,0.96),rgba(255,255,255,0.94))] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#10203f]">Collection progress</p>
                    <p className="mt-1 text-sm text-[#6b7a99]">
                      {answeredVisibleQuestions} of {visibleQuestions || totalQuestions} visible questions answered
                    </p>
                  </div>
                  <div className="w-full sm:w-64">
                    <div className="h-2 rounded-full bg-[rgba(166,183,219,0.18)]">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,#2b63f6,#0f766e)] transition-all"
                        style={{ width: `${visibleQuestions > 0 ? (answeredVisibleQuestions / visibleQuestions) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {sections.map((section, sectionIndex) => {
              const visibleFields = (section.fields || []).filter((field) => matchesConditionalLogic(field, previewValues));
              if (visibleFields.length === 0) return null;

              return (
                <Card
                  key={section._clientId}
                  title={section.title || `Question group ${sectionIndex + 1}`}
                  subtitle={section.description || `Section ${sectionIndex + 1}`}
                >
                  <div className="space-y-5">
                    {visibleFields.map((field, fieldIndex) => (
                      <div key={field._clientId} className="rounded-[20px] border border-[rgba(166,183,219,0.16)] bg-[rgba(248,250,255,0.72)] p-4">
                        <FieldRenderer
                          field={field}
                          value={previewValues[field.key]}
                          onChange={handlePreviewChange}
                          error={previewErrors[field.key]}
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2b63f6]">
                            {getQuestionMeta(field.type).label}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b88a5]">
                            Question {fieldIndex + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}

            <div className="flex items-center gap-3">
              <Button type="submit">Submit preview</Button>
              <p className="text-sm text-[#6b7a99]">This preview validates locally and does not create a real submission.</p>
            </div>
          </form>

          <div className="space-y-6 xl:sticky xl:top-5 xl:self-start">
            <Card title="Preview Summary" subtitle="A live view of the current preview session.">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.82)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b88a5]">Visible</p>
                    <p className="mt-2 text-2xl font-semibold text-[#10203f]">{visibleQuestions}</p>
                  </div>
                  <div className="rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.82)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b88a5]">Answered</p>
                    <p className="mt-2 text-2xl font-semibold text-[#10203f]">{answeredVisibleQuestions}</p>
                  </div>
                </div>

                <div className="rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.82)] p-4">
                  <p className="text-sm font-semibold text-[#10203f]">Preview status</p>
                  <p className="mt-2 text-sm text-[#6b7a99]">
                    {previewSubmitted
                      ? 'Preview completed successfully.'
                      : 'Fill the questions and submit to test validation, defaults, and conditional visibility.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Conditional Visibility" subtitle="Questions with skip logic appear only when their conditions are met.">
              <div className="space-y-3">
                {sections.flatMap((section) => section.fields || []).filter((field) => field.conditional_logic?.questionKey).length > 0 ? (
                  sections.flatMap((section) => section.fields || [])
                    .filter((field) => field.conditional_logic?.questionKey)
                    .map((field) => (
                      <div key={field._clientId} className="rounded-[16px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.82)] p-3">
                        <p className="text-sm font-semibold text-[#10203f]">{field.label || 'Untitled question'}</p>
                        <p className="mt-1 text-xs text-[#6b7a99]">
                          Shows when <span className="font-semibold">{field.conditional_logic.questionKey}</span> {field.conditional_logic.operator} {field.conditional_logic.value || 'has any answer'}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-[#6b7a99]">No skip logic configured yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-[rgba(157,175,214,0.24)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(242,247,255,0.95))] shadow-[0_24px_70px_rgba(30,55,106,0.1)]">
        <div className="relative px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(43,99,246,0.1),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.08),transparent_28%)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-[rgba(43,99,246,0.14)] bg-[rgba(43,99,246,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2b63f6]">
                Form Studio
              </div>
              <div className="space-y-2">
                <input
                  value={formData.name}
                  onChange={(event) => updateFormField('name', event.target.value)}
                  className="w-full bg-transparent text-3xl font-semibold tracking-[-0.04em] text-[#10203f] outline-none placeholder:text-[#97a5c0]"
                  placeholder="Untitled form"
                />
                <textarea
                  value={formData.description}
                  onChange={(event) => updateFormField('description', event.target.value)}
                  className="w-full resize-none border-0 bg-transparent p-0 text-sm text-[#5d6d8f] outline-none placeholder:text-[#97a5c0]"
                  rows={2}
                  placeholder="Describe what this form is collecting and who should use it."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#10203f] shadow-[0_10px_24px_rgba(36,63,118,0.06)]">
                  {totalQuestions} questions
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#10203f] shadow-[0_10px_24px_rgba(36,63,118,0.06)]">
                  {sections.length} group{sections.length === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#10203f] shadow-[0_10px_24px_rgba(36,63,118,0.06)]">
                  {formData.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={openPreview}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live preview
              </Button>
              <Button variant="secondary" onClick={() => navigate('/forms')}>Cancel</Button>
              <Button loading={saving} onClick={handleSubmit}>
                {isEditing ? 'Save form' : 'Create form'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className="space-y-6 xl:sticky xl:top-5 xl:self-start">
          <Card title="Question Types" subtitle="Add new questions quickly.">
            <div className="grid gap-2">
              {QUESTION_LIBRARY.map((question) => (
                <button
                  key={question.type}
                  onClick={() => addField(selectedSection?._clientId || sections[0]._clientId, question.type)}
                  className="flex items-center gap-3 rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.92)] px-3 py-3 text-left transition-all hover:border-[rgba(43,99,246,0.24)] hover:bg-white"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(43,99,246,0.12),rgba(15,118,110,0.12))] text-sm font-bold text-[#2b63f6]">
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

          <Card title="Reusable Blocks" subtitle="Start faster with prebuilt question sets.">
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
                    Add block
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Question Groups" subtitle="Organize the flow into clean sections.">
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
                  <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-xs font-bold text-[#2b63f6] shadow-[0_8px_18px_rgba(36,63,118,0.08)]">
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
                Add group
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <Card
              key={section._clientId}
              className="overflow-hidden"
              title={section.title || `Question group ${sectionIndex + 1}`}
              subtitle="Design the questions in this section."
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
                <div className="rounded-[22px] border border-[rgba(166,183,219,0.16)] bg-[linear-gradient(180deg,rgba(248,250,255,0.94),rgba(255,255,255,0.88))] p-4">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(event) => updateSection(section._clientId, { title: event.target.value })}
                    className="w-full bg-transparent text-xl font-semibold text-[#10203f] outline-none placeholder:text-[#90a0bd]"
                    placeholder="Question group title"
                  />
                  <textarea
                    value={section.description || ''}
                    onChange={(event) => updateSection(section._clientId, { description: event.target.value })}
                    className="mt-2 w-full resize-none border-0 bg-transparent p-0 text-sm text-[#64748b] outline-none placeholder:text-[#9aa6c0]"
                    rows={2}
                    placeholder="Optional group description or instructions."
                  />
                </div>

                {(section.fields || []).map((field, fieldIndex) => {
                  const questionMeta = getQuestionMeta(field.type);
                  const isSelected = field._clientId === selectedFieldId;
                  const options = normalizeOptions(field.options || []);

                  return (
                    <div
                      key={field._clientId}
                      onClick={() => setSelectedFieldId(field._clientId)}
                      className={`rounded-[24px] border p-5 transition-all ${
                        isSelected
                          ? 'border-[rgba(43,99,246,0.28)] bg-white shadow-[0_18px_40px_rgba(43,99,246,0.08)]'
                          : 'border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.9)] hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-[rgba(43,99,246,0.08)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2b63f6]">
                              {questionMeta.label}
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
                            onChange={(event) => updateField(section._clientId, field._clientId, { label: event.target.value })}
                            className="w-full bg-transparent text-lg font-semibold text-[#10203f] outline-none placeholder:text-[#90a0bd]"
                            placeholder="Type your question"
                          />

                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                            <div className="rounded-[18px] border border-dashed border-[rgba(166,183,219,0.24)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b88a5]">Preview hint</p>
                              <p className="mt-2 text-sm text-[#51617f]">{getFieldPreviewText(field)}</p>
                            </div>
                            <div className="rounded-[18px] border border-dashed border-[rgba(166,183,219,0.24)] bg-[rgba(255,255,255,0.72)] px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b88a5]">Help text</p>
                              <p className="mt-2 text-sm text-[#51617f]">{field.help_text || 'No helper text yet.'}</p>
                            </div>
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
                                    onChange={(event) => updateOption(section._clientId, field._clientId, optionIndex, event.target.value)}
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
          <Card title="Form Setup" subtitle="High-level settings for this form.">
            <div className="space-y-4">
              <div>
                <label className="input-label">Collection status</label>
                <select
                  value={formData.status}
                  onChange={(event) => updateFormField('status', event.target.value)}
                  className="input-field"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] p-4 text-sm text-[#6b7a99]">
                Field keys, options, logic, placeholders, defaults, and file metadata are all stored through the API and synced to the backend schema.
              </div>
            </div>
          </Card>

          <Card title="Selected Group" subtitle={selectedSection ? 'The group that contains the active question.' : 'Select a question to see its group.'}>
            {selectedSection ? (
              <div className="space-y-3">
                <div className="rounded-[18px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] p-4">
                  <p className="text-sm font-semibold text-[#10203f]">{selectedSection.title || 'Untitled group'}</p>
                  <p className="mt-1 text-sm text-[#6b7a99]">{selectedSection.description || 'No group description yet.'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6b7a99]">Select a question card in the middle column.</p>
            )}
          </Card>

          <Card title="Question Settings" subtitle={selectedField ? 'Edit how the selected question behaves.' : 'Select a question to edit its settings.'}>
            {selectedField && selectedSection ? (
              <div className="space-y-4">
                <div>
                  <label className="input-label">Question type</label>
                  <div className="rounded-[16px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.86)] px-4 py-3">
                    <p className="text-sm font-semibold text-[#10203f]">{getQuestionMeta(selectedField.type).label}</p>
                    <p className="mt-1 text-xs text-[#6b7a99]">Type is locked to keep the question structure predictable.</p>
                  </div>
                </div>

                <div>
                  <label className="input-label">Question label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, { label: event.target.value })}
                    className="input-field"
                    placeholder="Question label"
                  />
                </div>

                <div>
                  <label className="input-label">Help text</label>
                  <textarea
                    value={selectedField.help_text || ''}
                    onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, { help_text: event.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Instruction shown under the question"
                  />
                </div>

                <div>
                  <label className="input-label">Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, { placeholder: event.target.value })}
                    className="input-field"
                    placeholder="Text shown inside the input before it is answered"
                  />
                </div>

                <div>
                  <label className="input-label">Default answer</label>
                  <input
                    type="text"
                    value={selectedField.default_value || ''}
                    onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, { default_value: event.target.value })}
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
                      onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, {
                        meta: { ...(selectedField.meta || {}), accept: event.target.value },
                      })}
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
                    onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, { is_required: event.target.checked })}
                    className="h-4 w-4 rounded border-[#cbd5e1] text-primary-600 focus:ring-primary-500/30"
                  />
                </label>
              </div>
            ) : (
              <p className="text-sm text-[#6b7a99]">Select a question to edit its settings.</p>
            )}
          </Card>

          <Card title="Skip Logic" subtitle="Show this question only when another answer matches your condition.">
            {selectedField && selectedSection ? (
              <div className="space-y-4">
                <div>
                  <label className="input-label">Controlling question</label>
                  <select
                    value={selectedField.conditional_logic?.questionKey || ''}
                    onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, {
                      conditional_logic: event.target.value
                        ? {
                            questionKey: event.target.value,
                            operator: selectedField.conditional_logic?.operator || '=',
                            value: selectedField.conditional_logic?.value || '',
                          }
                        : null,
                    })}
                    className="input-field"
                  >
                    <option value="">Always show this question</option>
                    {questionReferences.map((reference) => (
                      <option key={reference.key} value={reference.key}>{reference.label}</option>
                    ))}
                  </select>
                </div>

                {selectedField.conditional_logic?.questionKey && (
                  <>
                    <div>
                      <label className="input-label">Operator</label>
                      <select
                        value={selectedField.conditional_logic?.operator || '='}
                        onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, {
                          conditional_logic: {
                            ...selectedField.conditional_logic,
                            operator: event.target.value,
                            value: event.target.value === 'answered' ? '' : (selectedField.conditional_logic?.value || ''),
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
                        <label className="input-label">Expected value</label>
                        <input
                          type="text"
                          value={selectedField.conditional_logic?.value || ''}
                          onChange={(event) => updateField(selectedSection._clientId, selectedField._clientId, {
                            conditional_logic: {
                              ...selectedField.conditional_logic,
                              value: event.target.value,
                            },
                          })}
                          className="input-field"
                          placeholder="Value that should trigger this question"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#6b7a99]">Select a question to configure skip logic.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
