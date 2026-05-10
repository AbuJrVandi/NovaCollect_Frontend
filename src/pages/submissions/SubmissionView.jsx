import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { submissionService } from '../../services/submissionService';
import useAppStore from '../../store/useAppStore';

function getOptionLabel(options, value) {
  if (!options || !value) return value;
  for (const opt of options) {
    if ((typeof opt === 'object' ? opt.value : opt) === value) {
      return typeof opt === 'object' ? opt.label : opt;
    }
  }
  return value;
}

export default function SubmissionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionService.get(id)
      .then((data) => setSubmission(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load submission' }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 bg-[#f1f5f9] rounded w-48 animate-pulse" />
            <div className="h-4 bg-[#f1f5f9] rounded w-64 animate-pulse" />
          </div>
        </div>
        <div className="h-64 bg-white rounded-xl border border-[#e2e8f0] animate-pulse" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[#64748b]">Submission not found</p>
        <Button variant="secondary" onClick={() => navigate('/submissions')} className="mt-4">Back to Submissions</Button>
      </div>
    );
  }

  const payload = submission.payload || {};
  const files = submission.files || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Submission #{submission.uuid?.slice(0, 8)}
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Form: <span className="font-medium text-[#0f172a]">{submission.form?.name || 'Unknown'}</span>
            <span className="mx-2">·</span>
            Submitted: {new Date(submission.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
            submission.status === 'submitted'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : submission.status === 'draft'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]'
          }`}>
            {(submission.status || 'submitted').charAt(0).toUpperCase() + (submission.status || 'submitted').slice(1)}
          </span>
          <Button variant="secondary" onClick={() => navigate('/submissions')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
        </div>
      </div>

      <Card title="Submission Data">
        {Object.keys(payload).length > 0 ? (
          <div className="divide-y divide-[#e2e8f0] -mx-6">
            {Object.entries(payload).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-4 px-6 py-4 hover:bg-[#f8fafc] transition-colors">
                <dt className="text-sm font-medium text-[#64748b] break-all">{key}</dt>
                <dd className="text-sm text-[#0f172a] col-span-2">
                  {Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {value.map((v, j) => (
                        <span key={j} className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#f1f5f9] text-xs font-medium text-[#475569]">{v}</span>
                      ))}
                    </div>
                  ) : typeof value === 'object' && value !== null ? (
                    <span className="text-[#0f172a]">{JSON.stringify(value)}</span>
                  ) : String(value)}
                </dd>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-[#94a3b8]">No submission data</p>
          </div>
        )}
      </Card>

      {files.length > 0 && (
        <Card title="Files">
          <div className="space-y-2 -mx-6">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3 border-b border-[#e2e8f0] last:border-0">
                <span className="text-sm text-[#475569]">{file.name || file.original_name || `File ${i + 1}`}</span>
                <a
                  href={file.url || file.file_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(submission.device_metadata || submission.latitude || submission.longitude) && (
        <Card title="Metadata">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {submission.latitude && submission.longitude && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">GPS Coordinates</span>
                <p className="text-sm text-[#0f172a] font-mono">{submission.latitude}, {submission.longitude}</p>
              </div>
            )}
            {submission.external_id && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">External ID</span>
                <p className="text-sm text-[#0f172a] font-mono">{submission.external_id}</p>
              </div>
            )}
            {submission.device_metadata && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Device Metadata</span>
                <pre className="text-sm text-[#475569] whitespace-pre-wrap">{JSON.stringify(submission.device_metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
