import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { projectService } from '../../services/projectService';
import useAppStore from '../../store/useAppStore';

const statusConfig = {
  todo: { label: 'To Do', dotColor: 'bg-[#94a3b8]' },
  in_progress: { label: 'In Progress', dotColor: 'bg-blue-500' },
  review: { label: 'Review', dotColor: 'bg-purple-500' },
  done: { label: 'Done', dotColor: 'bg-emerald-500' },
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
          <div className="skel skel-h2" />
          <div className="skel skel-text w-64" />
        </div>
        <div className="kanban-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skel skel-card h-64" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-state" style={{ paddingTop: '5rem' }}>
        <div className="empty-state-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="empty-state-title">Project not found</p>
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
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description || 'No description'}</p>
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

      <div className="kanban-grid">
        {Object.entries(statusGroups).map(([status, items]) => {
          const config = statusConfig[status] || statusConfig.todo;
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-col-header-inner">
                  <span className={`kanban-col-dot ${config.dotColor}`} />
                  <h3 className="kanban-col-title">{config.label}</h3>
                </div>
                <span className="kanban-col-count">{items.length}</span>
              </div>
              <div className="kanban-col-body">
                {items.length > 0 ? (
                  items.map((task) => (
                    <div key={task.uuid} className="kanban-task-card">
                      <div className="kanban-task-top">
                        <div className="flex-1 min-w-0">
                          <p className="kanban-task-title">{task.title}</p>
                          {task.description && (
                            <p className="kanban-task-desc">{task.description}</p>
                          )}
                        </div>
                        <select
                          value={task.status || 'todo'}
                          onChange={(e) => handleStatusChange(task.uuid, e.target.value)}
                          className="kanban-task-select"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                      {task.assigned_to && (
                        <div className="kanban-task-assignee">
                          <div className="kanban-task-avatar">
                            <span>
                              {(task.assigned_to.name || task.assigned_to).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="kanban-task-name">{task.assigned_to.name || task.assigned_to}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="kanban-empty">
                    <div className="kanban-empty-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="kanban-empty-text">No tasks</p>
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
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Optional description"
            />
          </div>
          <div className="modal-footer" style={{ padding: 0 }}>
            <Button variant="secondary" type="button" onClick={() => setTaskModal(false)}>Cancel</Button>
            <Button type="submit" loading={creatingTask}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
