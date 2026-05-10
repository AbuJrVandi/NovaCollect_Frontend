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
      <span className={`badge ${
        r.status === 'published' ? 'badge-green' :
        r.status === 'archived' ? 'badge-gray' :
        'badge-amber'
      }`}>
        <span className="badge-dot" />
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
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Forms</h1>
          <p className="page-subtitle">Create and manage your data collection forms</p>
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
          <div className="alert-error">
            <svg className="alert-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="alert-error-msg">
              Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer" style={{ padding: 0 }}>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
