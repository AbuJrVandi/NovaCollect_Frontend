export const fieldTypes = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'file', label: 'File Upload' },
  { value: 'gps', label: 'GPS Location' },
  { value: 'signature', label: 'Signature' },
];

let keyCounter = 0;

export function generateKey(prefix = 'field') {
  keyCounter += 1;
  return `${prefix}_${Date.now()}_${keyCounter}`;
}

export function createField(type = 'text', sortOrder = 0) {
  return {
    key: generateKey(),
    label: '',
    type,
    is_required: false,
    validation_rules: [],
    options: type === 'dropdown' || type === 'checkbox' || type === 'radio' ? ['Option 1'] : null,
    conditional_logic: null,
    default_value: null,
    help_text: '',
    sort_order: sortOrder,
    meta: type === 'file' ? { accept: '.pdf,.jpg,.png' } : null,
  };
}

export function createSection(title = 'Untitled Section', sortOrder = 0) {
  return {
    id: `section_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    description: '',
    sort_order: sortOrder,
    settings: null,
    fields: [createField('text', 0)],
  };
}
