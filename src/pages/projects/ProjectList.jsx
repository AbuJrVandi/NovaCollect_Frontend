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

  const statusStyles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    archived: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]',
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
    { header: 'Status', render: (r) => {
      const style = statusStyles[r.status] || 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]';
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${style}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500' : r.status === 'completed' ? 'bg-blue-500' : 'bg-[#94a3b8]'}`} />
          {(r.status || 'active').charAt(0).toUpperCase() + (r.status || 'active').slice(1)}
        </span>
      );
    }},
    { header: 'Created', render: (r) => (
      <span className="text-xs text-[#64748b]">{new Date(r.created_at).toLocaleDateString()}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Projects</h1>
          <p className="text-sm text-[#64748b] mt-1">Manage your projects and tasks</p>
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
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1.5">Description</label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full rounded-lg border border-[#e2e8f0] px-3.5 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] bg-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-[#cbd5e1]"
              rows={3}
              placeholder="Brief description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
