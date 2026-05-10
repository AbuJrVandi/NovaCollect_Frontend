import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { exportService } from '../../services/exportService';
import { formService } from '../../services/formService';
import useAppStore from '../../store/useAppStore';

export default function ReportList() {
  const addToast = useAppStore((s) => s.addToast);
  const [exports, setExports] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportModal, setExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({ type: 'submissions', format: 'csv', filters: { formId: '', status: '' } });
  const [exporting, setExporting] = useState(false);

  const fetchExports = () => {
    setLoading(true);
    exportService.list()
      .then(({ data }) => setExports(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load exports' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExports();
    formService.list({ per_page: 100 })
      .then(({ data }) => setForms(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load forms for export filters' }));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = {};
      if (exportConfig.filters.formId) filters.formId = exportConfig.filters.formId;
      if (exportConfig.filters.status) filters.status = exportConfig.filters.status;
      await exportService.create({
        type: exportConfig.type,
        format: exportConfig.format,
        filters: Object.keys(filters).length > 0 ? filters : null,
      });
      addToast({ type: 'success', message: 'Export queued successfully' });
      setExportModal(false);
      fetchExports();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to queue export' });
    } finally {
      setExporting(false);
    }
  };

  const badgeClass = (status) => {
    switch (status) {
      case 'completed': return 'badge-green';
      case 'processing': return 'badge-amber';
      case 'queued': return 'badge-blue';
      case 'failed': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const formatLabels = {
    csv: 'CSV',
    xlsx: 'Excel',
    pdf: 'PDF',
  };

  const columns = [
    { header: 'Type', render: (r) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#f1f5f9] text-xs font-medium text-[#64748b] uppercase">{r.type || '—'}</span>
    )},
    { header: 'Format', render: (r) => (
      <span className="text-sm font-medium text-[#0f172a]">{formatLabels[r.format] || r.format?.toUpperCase() || '—'}</span>
    )},
    { header: 'Status', render: (r) => (
      <span className={`badge ${badgeClass(r.status)}`}>
        <span className="badge-dot" />
        {(r.status || 'queued').charAt(0).toUpperCase() + (r.status || 'queued').slice(1)}
      </span>
    )},
    { header: 'Created', render: (r) => (
      <span className="text-xs text-[#64748b]">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span>
    )},
    { header: '', render: (r) => r.file_path && r.status === 'completed' ? (
      <a href={r.file_path} target="_blank" rel="noopener noreferrer" className="file-link">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download
      </a>
    ) : <span className="text-[#94a3b8] text-xs">{r.status === 'failed' ? r.error_message || 'Failed' : '—'}</span> },
  ];

  return (
    <div className="page-shell">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Exports and Delivery</div>
          <h1 className="page-title">Reports & Exports</h1>
          <p className="page-subtitle">Generate and download data exports</p>
        </div>
        <div className="page-actions">
          <Button onClick={() => setExportModal(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            New Export
          </Button>
        </div>
      </div>

      <Card title="Export History" subtitle="Monitor pending, processing, completed, and failed export jobs." bodyNoPadding>
        <Table
          columns={columns}
          data={exports}
          loading={loading}
          emptyTitle="No export requests yet"
          emptyDescription="Queue an export to generate downloadable datasets for submissions, audits, or stakeholder reporting."
        />
      </Card>

      <Modal isOpen={exportModal} onClose={() => setExportModal(false)} title="New Export">
        <div className="space-y-5">
          <Select
            label="Export Format"
            value={exportConfig.format}
            onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
            options={[
              { value: 'csv', label: 'CSV (.csv)' },
              { value: 'xlsx', label: 'Excel (.xlsx)' },
              { value: 'pdf', label: 'PDF (.pdf)' },
            ]}
          />
          <Select
            label="Form (optional)"
            value={exportConfig.filters.formId}
            onChange={(e) => setExportConfig({ ...exportConfig, filters: { ...exportConfig.filters, formId: e.target.value } })}
            placeholder="All forms"
            options={forms.map((form) => ({
              value: form.uuid,
              label: form.name || 'Untitled form',
            }))}
          />
          <Select
            label="Status filter (optional)"
            value={exportConfig.filters.status}
            onChange={(e) => setExportConfig({ ...exportConfig, filters: { ...exportConfig.filters, status: e.target.value } })}
            placeholder="All statuses"
            options={[
              { value: 'submitted', label: 'Submitted' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending', label: 'Pending' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <div className="modal-footer" style={{ padding: 0 }}>
            <Button variant="secondary" onClick={() => setExportModal(false)}>Cancel</Button>
            <Button onClick={handleExport} loading={exporting}>Queue Export</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
