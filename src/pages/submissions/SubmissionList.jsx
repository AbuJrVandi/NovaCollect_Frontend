import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import { submissionService } from '../../services/submissionService';
import useAppStore from '../../store/useAppStore';

function formatSubmissionLabel(submission) {
  if (submission.external_id) return submission.external_id;
  if (submission.created_at) {
    return `Submitted ${new Date(submission.created_at).toLocaleDateString()}`;
  }
  return 'Submission record';
}

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

  const badgeClass = (status) => {
    switch (status) {
      case 'submitted': return 'badge-green';
      case 'draft': return 'badge-amber';
      case 'pending': return 'badge-blue';
      case 'rejected': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const columns = [
    { header: 'Submission', render: (r) => (
      <div className="space-y-1">
        <span className="block font-semibold text-[#0f172a]">{formatSubmissionLabel(r)}</span>
        <span className="block text-xs text-[#64748b]">{r.form?.name || 'Unassigned form'}</span>
      </div>
    )},
    { header: 'Submitted By', render: (r) => (
      <span className="text-[#475569]">{r.user?.name || '—'}</span>
    )},
    { header: 'Status', render: (r) => (
      <span className={`badge ${badgeClass(r.status)}`}>
        <span className="badge-dot" />
        {(r.status || 'submitted').charAt(0).toUpperCase() + (r.status || 'submitted').slice(1)}
      </span>
    )},
    { header: 'Date', render: (r) => (
      <span className="text-xs text-[#64748b]">{new Date(r.created_at).toLocaleString()}</span>
    )},
  ];

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-kicker">Response Tracking</div>
        <h1 className="page-title">Submissions</h1>
        <p className="page-subtitle">View and manage form submissions</p>
      </div>

      <Card
        title="Submission Inbox"
        subtitle="Review all responses collected from your active forms."
        bodyNoPadding
      >
        <Table
          columns={columns}
          data={submissions}
          loading={loading}
          onRowClick={(r) => navigate(`/submissions/${r.uuid}`)}
          emptyTitle="No submissions yet"
          emptyDescription="Once users start responding to your forms, each submission will appear here with status, submitter, and time details."
          keyField="uuid"
        />
      </Card>
    </div>
  );
}
