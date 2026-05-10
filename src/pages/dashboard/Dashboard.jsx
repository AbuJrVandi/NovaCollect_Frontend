import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { analyticsService } from '../../services/analyticsService';

const statIcons = {
  forms: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  submissions: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  projects: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  tasks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
};

const statGradients = {
  forms: 'from-indigo-500 to-indigo-600',
  submissions: 'from-emerald-500 to-emerald-600',
  projects: 'from-purple-500 to-purple-600',
  tasks: 'from-orange-500 to-orange-600',
};

const statKeys = {
  forms: ['forms', 'total_forms', 'active_forms', 'published_forms'],
  submissions: ['submissions', 'total_submissions', 'submissions_today'],
  projects: ['projects', 'total_projects', 'active_projects'],
  tasks: ['tasks', 'total_tasks', 'tasks_completed', 'completion_rate'],
};

function extractValue(obj, keys) {
  if (!obj) return null;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return null;
}

function formatTrendLabel(value, index) {
  if (!value) return `D${index + 1}`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 3);
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.dashboardStats(),
      analyticsService.get(),
    ])
      .then(([statsData, analyticsData]) => {
        setStats(statsData);
        setAnalytics(analyticsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totals = analytics?.totals ?? stats?.totals ?? {};

  const statCards = [
    { label: 'Total Forms', value: extractValue(totals, statKeys.forms), icon: statIcons.forms, gradient: statGradients.forms, link: '/forms' },
    { label: 'Submissions', value: extractValue(totals, statKeys.submissions), icon: statIcons.submissions, gradient: statGradients.submissions, link: '/submissions' },
    { label: 'Projects', value: extractValue(totals, statKeys.projects), icon: statIcons.projects, gradient: statGradients.projects, link: '/projects' },
    { label: 'Tasks', value: extractValue(totals, statKeys.tasks), icon: statIcons.tasks, gradient: statGradients.tasks, link: '/projects' },
  ];

  const submissionTrend = analytics?.submission_trend ?? stats?.submission_trend ?? [];
  const topForms = analytics?.top_forms ?? stats?.top_forms ?? [];
  const latestTrend = submissionTrend.slice(-7);
  const trendTotal = submissionTrend.reduce((sum, entry) => sum + (entry.count || 0), 0);
  const trendPeak = Math.max(...submissionTrend.map((entry) => entry.count || 0), 1);
  const activeDays = submissionTrend.filter((entry) => (entry.count || 0) > 0).length;
  const averagePerActiveDay = activeDays > 0 ? Math.round(trendTotal / activeDays) : 0;
  const recentTopForms = topForms.slice(0, 3);
  const topForm = topForms[0];
  const totalForms = extractValue(totals, statKeys.forms) ?? 0;
  const totalSubmissions = extractValue(totals, statKeys.submissions) ?? 0;
  const totalProjects = extractValue(totals, statKeys.projects) ?? 0;
  const totalTasks = extractValue(totals, statKeys.tasks) ?? 0;

  const heroStats = [
    { label: 'Forms in workspace', value: totalForms, tone: 'blue' },
    { label: 'Responses collected', value: totalSubmissions, tone: 'green' },
    { label: 'Projects in flight', value: totalProjects, tone: 'purple' },
  ];

  const operationalSignals = [
    {
      title: 'Submission momentum',
      value: `${trendTotal}`,
      detail: activeDays > 0 ? `${averagePerActiveDay}/day on active days` : 'Waiting for field activity',
    },
    {
      title: 'Top form',
      value: topForm?.name || topForm?.form_name || 'No leader yet',
      detail: topForm ? `${topForm.count || topForm.total || 0} submissions` : 'No submission ranking available',
    },
    {
      title: 'Task load',
      value: `${totalTasks}`,
      detail: totalProjects > 0 ? `${Math.round(totalTasks / totalProjects)} avg tasks per project` : 'No active projects yet',
    },
  ];

  const priorities = [
    {
      title: 'Launch a collection workflow',
      detail: totalForms > 0 ? 'You have form structures in place. Review and publish the strongest candidate.' : 'Build your first production-ready form and define its sections clearly.',
      to: '/forms/new',
      cta: totalForms > 0 ? 'Create another form' : 'Create first form',
    },
    {
      title: 'Monitor incoming field data',
      detail: totalSubmissions > 0 ? `You already have ${totalSubmissions} submissions. Review their quality and status.` : 'No responses yet. Once data starts coming in, this becomes your validation queue.',
      to: '/submissions',
      cta: 'Open submissions',
    },
    {
      title: 'Coordinate delivery teams',
      detail: totalProjects > 0 ? `${totalProjects} projects and ${totalTasks} tracked tasks are available for execution management.` : 'Stand up a project board so operational work does not live outside the platform.',
      to: '/projects',
      cta: 'Manage projects',
    },
  ];

  return (
    <div className="page-shell">
      <section className="dashboard-hero-grid">
        <div className="dashboard-hero-card">
          <div className="dashboard-hero-kicker">Operations Console</div>
          <h1 className="dashboard-hero-title">Field intelligence at a glance.</h1>
          <p className="dashboard-hero-subtitle">
            A live command center for forms, submissions, and project execution across your NovaCollect workspace.
          </p>

          <div className="dashboard-hero-actions">
            <Button size="lg" onClick={() => navigate('/forms/new')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create form
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/analytics')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View analytics
            </Button>
          </div>

          <div className="dashboard-hero-metrics">
            {heroStats.map((item) => (
              <div key={item.label} className={`hero-metric hero-metric-${item.tone}`}>
                <span>{item.label}</span>
                <strong>{loading ? '...' : item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-hero-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-kicker">Live collection signal</p>
              <h2 className="dashboard-panel-title">Submission rhythm</h2>
            </div>
            <span className="badge badge-blue">
              <span className="badge-dot" />
              {loading ? 'Loading' : `${trendTotal} total`}
            </span>
          </div>

          {loading ? (
            <div className="dashboard-mini-chart">
              {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <div key={bar} className="dashboard-mini-bar-wrap">
                  <div className="dashboard-mini-bar dashboard-mini-bar-loading" />
                  <span className="dashboard-mini-label">--</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="dashboard-mini-chart">
                {(latestTrend.length > 0 ? latestTrend : [{ count: 0, date: 'Today' }]).map((entry, index) => {
                  const normalized = Math.max(((entry.count || 0) / trendPeak) * 100, 12);
                  return (
                    <div key={`${entry.date || index}`} className="dashboard-mini-bar-wrap">
                      <span className="dashboard-mini-value">{entry.count || 0}</span>
                      <div className="dashboard-mini-track">
                        <div className="dashboard-mini-bar" style={{ height: `${normalized}%` }} />
                      </div>
                      <span className="dashboard-mini-label">{formatTrendLabel(entry.date, index)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="dashboard-mini-caption">
                {activeDays > 0
                  ? `${averagePerActiveDay} average submissions per active day across the current trend window.`
                  : 'No activity yet. This panel will visualize momentum once field data starts arriving.'}
              </p>
            </>
          )}
        </div>
      </section>

      <div className="stat-grid">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} className="stat-card">
            <div className="stat-card-top">
              <span className="stat-card-label">{card.label}</span>
              <div className={`stat-card-icon bg-gradient-to-br ${card.gradient}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={card.icon} />
                </svg>
              </div>
            </div>
            <p className="stat-card-value">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-[#f1f5f9] rounded animate-pulse" />
              ) : (
                card.value ?? '—'
              )}
            </p>
            <p className="stat-card-change">
              {card.label === 'Total Forms' && 'Manage templates and publishing state'}
              {card.label === 'Submissions' && 'Track response volume and validation'}
              {card.label === 'Projects' && 'Coordinate execution across teams'}
              {card.label === 'Tasks' && 'Monitor operational workload'}
            </p>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid dashboard-grid-wide">
        <Card title="Operational Signals" subtitle="Key insights generated from your current forms, submissions, and task load.">
          <div className="dashboard-signal-list">
            {operationalSignals.map((signal) => (
              <div key={signal.title} className="dashboard-signal-item">
                <div>
                  <p className="dashboard-signal-title">{signal.title}</p>
                  <p className="dashboard-signal-detail">{signal.detail}</p>
                </div>
                <strong className="dashboard-signal-value">{loading ? '...' : signal.value}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Priority Queue" subtitle="Recommended next actions to keep the workspace moving.">
          <div className="dashboard-priority-list">
            {priorities.map((item) => (
              <Link key={item.title} to={item.to} className="dashboard-priority-item">
                <div className="dashboard-priority-copy">
                  <p className="dashboard-priority-title">{item.title}</p>
                  <p className="dashboard-priority-detail">{item.detail}</p>
                </div>
                <span className="dashboard-priority-cta">{item.cta}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Quick Actions" subtitle="Jump straight into the most common workflows">
        <div className="quick-grid">
          {[
            { to: '/forms/new', label: 'New Form', icon: 'M12 4v16m8-8H4', desc: 'Create a new form' },
            { to: '/submissions', label: 'Submissions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'View submissions' },
            { to: '/projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', desc: 'Manage projects' },
            { to: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'View analytics' },
          ].map(({ to, label, icon, desc }) => (
            <Link key={to} to={to} className="quick-item">
              <div className="quick-item-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                </svg>
              </div>
              <span className="quick-item-label">{label}</span>
              <span className="quick-item-desc">{desc}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
