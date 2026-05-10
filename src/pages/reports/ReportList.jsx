import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { exportService } from '../../services/exportService';
import useAppStore from '../../store/useAppStore';

export default function ReportList() {
  const addToast = useAppStore((s) => s.addToast);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportModal, setExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({ type: 'submissions', format: 'csv', filters: { form_uuid: '', status: '' } });
  const [exporting, setExporting] = useState(false);

  const fetchExports = () => {
    setLoading(true);
    exportService.list()
      .then(({ data }) => setExports(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load exports' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchExports(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filters = {};
      if (exportConfig.filters.form_uuid) filters.form_uuid = exportConfig.filters.form_uuid;
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

  const statusStyles = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    queued: 'bg-blue-50 text-blue-700 border-blue-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
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
    { header: 'Status', render: (r) => {
      const style = statusStyles[r.status] || 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]';
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${style}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'completed' ? 'bg-emerald-500' : r.status === 'processing' ? 'bg-amber-500' : 'bg-[#94a3b8]'}`} />
          {(r.status || 'queued').charAt(0).toUpperCase() + (r.status || 'queued').slice(1)}
        </span>
      );
    }},
    { header: 'Created', render: (r) => (
      <span className="text-xs text-[#64748b]">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</span>
    )},
    { header: '', render: (r) => r.file_path && r.status === 'completed' ? (
      <a href={r.file_path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download
      </a>
    ) : <span className="text-[#94a3b8] text-xs">{r.status === 'failed' ? r.error_message || 'Failed' : '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Reports & Exports</h1>
          <p className="text-sm text-[#64748b] mt-1">Generate and download data exports</p>
        </div>
        <Button onClick={() => setExportModal(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          New Export
        </Button>
      </div>

      <Card title="Export History" subtitle="Previously requested exports">
        <Table columns={columns} data={exports} loading={loading} />
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
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1.5">Form UUID (optional)</label>
            <input
              type="text"
              value={exportConfig.filters.form_uuid}
              onChange={(e) => setExportConfig({ ...exportConfig, filters: { ...exportConfig.filters, form_uuid: e.target.value } })}
              className="w-full rounded-lg border border-[#e2e8f0] px-3.5 py-2.5 text-sm text-[#0f172a] bg-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="Filter by form UUID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1.5">Status filter (optional)</label>
            <input
              type="text"
              value={exportConfig.filters.status}
              onChange={(e) => setExportConfig({ ...exportConfig, filters: { ...exportConfig.filters, status: e.target.value } })}
              className="w-full rounded-lg border border-[#e2e8f0] px-3.5 py-2.5 text-sm text-[#0f172a] bg-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="e.g. submitted"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setExportModal(false)}>Cancel</Button>
            <Button onClick={handleExport} loading={exporting}>Queue Export</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
