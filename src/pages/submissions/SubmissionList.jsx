import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { submissionService } from '../../services/submissionService';
import useAppStore from '../../store/useAppStore';

export default function SubmissionList() {
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionService.list()
      .then(({ data }) => setSubmissions(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load submissions' }))
      .finally(() => setLoading(false));
  }, []);

  const statusStyles = {
    submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200',
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const columns = [
    { header: 'UUID', render: (r) => (
      <span className="font-mono text-xs font-medium text-[#64748b]">{r.uuid?.slice(0, 8)}...</span>
    )},
    { header: 'Form', render: (r) => (
      <span className="font-medium text-[#0f172a]">{r.form?.name || '—'}</span>
    )},
    { header: 'Submitted By', render: (r) => (
      <span className="text-[#475569]">{r.user?.name || '—'}</span>
    )},
    { header: 'Status', render: (r) => {
      const style = statusStyles[r.status] || 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]';
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${style}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'submitted' ? 'bg-emerald-500' : r.status === 'draft' ? 'bg-amber-500' : 'bg-[#94a3b8]'}`} />
          {(r.status || 'submitted').charAt(0).toUpperCase() + (r.status || 'submitted').slice(1)}
        </span>
      );
    }},
    { header: 'Date', render: (r) => (
      <span className="text-xs text-[#64748b]">{new Date(r.created_at).toLocaleString()}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Submissions</h1>
        <p className="text-sm text-[#64748b] mt-1">View and manage form submissions</p>
      </div>

      <Card>
        <Table
          columns={columns}
          data={submissions}
          loading={loading}
          onRowClick={(r) => navigate(`/submissions/${r.uuid}`)}
        />
      </Card>
    </div>
  );
}
