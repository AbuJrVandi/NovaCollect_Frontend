import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { formService } from '../../services/formService';
import useAppStore from '../../store/useAppStore';

export default function FormList() {
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchForms = () => {
    setLoading(true);
    formService.list()
      .then(({ data }) => setForms(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load forms' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchForms(); }, []);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await formService.delete(deleteModal.uuid);
      addToast({ type: 'success', message: 'Form deleted successfully' });
      setDeleteModal(null);
      fetchForms();
    } catch {
      addToast({ type: 'error', message: 'Failed to delete form' });
    }
  };

  const columns = [
    { header: 'Name', render: (r) => (
      <span className="font-medium text-[#0f172a]">{r.name}</span>
    )},
    { header: 'Sections', render: (r) => (
      <span className="text-[#64748b]">{r.sections?.length ?? 0}</span>
    )},
    { header: 'Version', render: (r) => (
      <span className="text-[#64748b]">v{r.current_version ?? 1}</span>
    )},
    { header: 'Status', render: (r) => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
        r.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
        r.status === 'archived' ? 'bg-[#f1f5f9] text-[#64748b]' :
        'bg-amber-50 text-amber-700'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          r.status === 'published' ? 'bg-emerald-500' :
          r.status === 'archived' ? 'bg-[#94a3b8]' :
          'bg-amber-500'
        }`} />
        {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Draft'}
      </span>
    )},
    { header: 'Created', render: (r) => (
      <span className="text-xs text-[#64748b]">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
    )},
    { header: '', render: (r) => (
      <div className="flex items-center gap-2 justify-end">
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/forms/${r.uuid}/edit`); }}>
          Edit
        </Button>
        <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); setDeleteModal(r); }}>
          Delete
        </Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Forms</h1>
          <p className="text-sm text-[#64748b] mt-1">Create and manage your data collection forms</p>
        </div>
        <Button onClick={() => navigate('/forms/new')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Form
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={forms} loading={loading} onRowClick={(r) => navigate(`/forms/${r.uuid}/edit`)} />
      </Card>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete form" size="sm">
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-700">
              Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
