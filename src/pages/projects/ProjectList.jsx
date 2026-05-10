import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { projectService } from '../../services/projectService';
import useAppStore from '../../store/useAppStore';

export default function ProjectList() {
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    projectService.list()
      .then(({ data }) => setProjects(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load projects' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProject.name) return;
    setCreating(true);
    try {
      await projectService.create(newProject);
      addToast({ type: 'success', message: 'Project created' });
      setCreateModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create project' });
    } finally {
      setCreating(false);
    }
  };

  const badgeClass = (status) => {
    switch (status) {
      case 'active': return 'badge-green';
      case 'completed': return 'badge-blue';
      case 'archived': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  const columns = [
    { header: 'Name', render: (r) => (
      <span className="font-semibold text-[#0f172a]">{r.name}</span>
    )},
    { header: 'Description', render: (r) => (
      <span className="text-[#64748b] truncate max-w-xs block">{r.description || '—'}</span>
    )},
    { header: 'Tasks', render: (r) => (
      <span className="text-[#475569]">{r.tasks?.length ?? 0}</span>
    )},
    { header: 'Status', render: (r) => (
      <span className={`badge ${badgeClass(r.status)}`}>
        <span className="badge-dot" />
        {(r.status || 'active').charAt(0).toUpperCase() + (r.status || 'active').slice(1)}
      </span>
    )},
    { header: 'Created', render: (r) => (
      <span className="text-xs text-[#64748b]">{new Date(r.created_at).toLocaleDateString()}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your projects and tasks</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={projects} loading={loading} onRowClick={(r) => navigate(`/projects/${r.uuid}`)} />
      </Card>

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Project">
        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Project name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="e.g. Q1 Data Collection"
          />
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Brief description"
            />
          </div>
          <div className="modal-footer" style={{ padding: 0 }}>
            <Button variant="secondary" type="button" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
