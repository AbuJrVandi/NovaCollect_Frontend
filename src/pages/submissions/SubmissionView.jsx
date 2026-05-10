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
            <div className="skel skel-h2" />
            <div className="skel skel-text w-64" />
          </div>
        </div>
        <div className="skel skel-card h-64" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="empty-state" style={{ paddingTop: '5rem' }}>
        <div className="empty-state-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="empty-state-title">Submission not found</p>
        <Button variant="secondary" onClick={() => navigate('/submissions')} className="mt-4">Back to Submissions</Button>
      </div>
    );
  }

  const payload = submission.payload || {};
  const files = submission.files || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">
            Submission #{submission.uuid?.slice(0, 8)}
          </h1>
          <p className="page-subtitle">
            Form: <span className="font-medium text-[#0f172a]">{submission.form?.name || 'Unknown'}</span>
            <span className="mx-2">·</span>
            Submitted: {new Date(submission.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${
            submission.status === 'submitted' ? 'badge-green' :
            submission.status === 'draft' ? 'badge-amber' :
            'badge-gray'
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
          <div>
            {Object.entries(payload).map(([key, value]) => (
              <div key={key} className="submission-field">
                <dt className="submission-field-key">{key}</dt>
                <dd className="submission-field-value">
                  {Array.isArray(value) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {value.map((v, j) => (
                        <span key={j} className="submission-tag">{v}</span>
                      ))}
                    </div>
                  ) : typeof value === 'object' && value !== null ? (
                    <span>{JSON.stringify(value)}</span>
                  ) : String(value)}
                </dd>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <p className="empty-state-desc">No submission data</p>
          </div>
        )}
      </Card>

      {files.length > 0 && (
        <Card title="Files">
          <div className="file-list">
            {files.map((file, i) => (
              <div key={i} className="file-item">
                <span className="file-name">{file.name || file.original_name || `File ${i + 1}`}</span>
                <a
                  href={file.url || file.file_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
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
          <div className="metadata-grid">
            {submission.latitude && submission.longitude && (
              <div className="metadata-group">
                <span className="metadata-label">GPS Coordinates</span>
                <p className="metadata-value">{submission.latitude}, {submission.longitude}</p>
              </div>
            )}
            {submission.external_id && (
              <div className="metadata-group">
                <span className="metadata-label">External ID</span>
                <p className="metadata-value">{submission.external_id}</p>
              </div>
            )}
            {submission.device_metadata && (
              <div className="metadata-group sm:col-span-2">
                <span className="metadata-label">Device Metadata</span>
                <pre className="text-sm text-[#475569] whitespace-pre-wrap">{JSON.stringify(submission.device_metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
