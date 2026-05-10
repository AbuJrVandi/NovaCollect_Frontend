import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { projectService } from '../../services/projectService';
import useAppStore from '../../store/useAppStore';

const statusConfig = {
  todo: { label: 'To Do', gradient: 'from-[#f1f5f9] to-[#e2e8f0]', textColor: 'text-[#64748b]', dotColor: 'bg-[#94a3b8]' },
  in_progress: { label: 'In Progress', gradient: 'from-blue-50 to-indigo-50', textColor: 'text-blue-700', dotColor: 'bg-blue-500', border: 'border-blue-200' },
  review: { label: 'Review', gradient: 'from-purple-50 to-violet-50', textColor: 'text-purple-700', dotColor: 'bg-purple-500', border: 'border-purple-200' },
  done: { label: 'Done', gradient: 'from-emerald-50 to-green-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500', border: 'border-emerald-200' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useAppStore((s) => s.addToast);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    projectService.get(id)
      .then((data) => setProject(data))
      .catch(() => addToast({ type: 'error', message: 'Failed to load project' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (taskUuid, newStatus) => {
    try {
      await projectService.updateTask(taskUuid, { status: newStatus });
      setProject((prev) => ({
        ...prev,
        tasks: (prev.tasks || []).map((t) => t.uuid === taskUuid ? { ...t, status: newStatus } : t),
      }));
      addToast({ type: 'success', message: 'Task updated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to update task' });
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    setCreatingTask(true);
    try {
      await projectService.createTask(id, newTask);
      addToast({ type: 'success', message: 'Task created' });
      setTaskModal(false);
      setNewTask({ title: '', description: '' });
      const updated = await projectService.get(id);
      setProject(updated);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to create task' });
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <div className="h-7 bg-[#f1f5f9] rounded w-48 animate-pulse" />
          <div className="h-4 bg-[#f1f5f9] rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-white rounded-xl border border-[#e2e8f0] animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[#64748b]">Project not found</p>
        <Button variant="secondary" onClick={() => navigate('/projects')} className="mt-4">Back to Projects</Button>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const statusGroups = {
    todo: tasks.filter((t) => t.status === 'todo' || !t.status),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">{project.name}</h1>
          <p className="text-sm text-[#64748b] mt-1">{project.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setTaskModal(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </Button>
          <Button variant="secondary" onClick={() => navigate('/projects')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {Object.entries(statusGroups).map(([status, items]) => {
          const config = statusConfig[status] || statusConfig.todo;
          return (
            <div key={status} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
              <div className={`px-5 py-3.5 border-b border-[#e2e8f0] bg-gradient-to-r ${config.gradient} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                    <h3 className="text-sm font-semibold text-[#0f172a]">{config.label}</h3>
                  </div>
                  <span className="text-xs font-medium text-[#64748b] bg-white/80 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
              </div>
              <div className="p-4 space-y-2.5 min-h-[120px]">
                {items.length > 0 ? (
                  items.map((task) => (
                    <div key={task.uuid} className="p-3.5 rounded-xl border border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:shadow-sm transition-all duration-150 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a]">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-[#64748b] mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <select
                          value={task.status || 'todo'}
                          onChange={(e) => handleStatusChange(task.uuid, e.target.value)}
                          className="text-xs border border-[#e2e8f0] rounded-lg px-2 py-1 bg-white text-[#475569] hover:border-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                      {task.assigned_to && (
                        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#e2e8f0]">
                          <div className="w-5 h-5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-white">
                              {(task.assigned_to.name || task.assigned_to).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-[#64748b]">{task.assigned_to.name || task.assigned_to}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-10 h-10 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-xs text-[#94a3b8]">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title="Add Task">
        <form onSubmit={handleCreateTask} className="space-y-5">
          <Input
            label="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="e.g. Collect data from region A"
          />
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1.5">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full rounded-lg border border-[#e2e8f0] px-3.5 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] bg-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              rows={3}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setTaskModal(false)}>Cancel</Button>
            <Button type="submit" loading={creatingTask}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
