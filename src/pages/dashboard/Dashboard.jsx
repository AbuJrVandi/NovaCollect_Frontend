import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
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

export default function Dashboard() {
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
  const trendTotal = submissionTrend.reduce((sum, entry) => sum + (entry.count || 0), 0);
  const recentTopForms = topForms.slice(0, 3);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-kicker">Operations Console</div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your NovaCollect workspace</p>
      </div>

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
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card title="Workspace Pulse" subtitle="Signals from your active data collection flow">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-[20px] border border-[rgba(176,191,225,0.18)] bg-[rgba(248,250,255,0.82)] p-4">
                  <div className="skeleton skeleton-line mb-4 w-1/2" />
                  <div className="skeleton h-8 w-16 rounded-[12px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[rgba(176,191,225,0.18)] bg-[rgba(248,250,255,0.86)] p-5">
                <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.14em] text-[#8a98b6]">Submission velocity</p>
                <p className="font-display mt-3 text-4xl text-[#10203f]">{trendTotal}</p>
                <p className="mt-2 text-sm leading-6 text-[#5d6d8f]">Recorded across the latest trend window. This becomes a live health signal as your forms go active.</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(176,191,225,0.18)] bg-[rgba(248,250,255,0.86)] p-5">
                <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.14em] text-[#8a98b6]">Top performing forms</p>
                {recentTopForms.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {recentTopForms.map((form, index) => (
                      <div key={`${form.name || form.form_name}-${index}`} className="flex items-center justify-between gap-3 rounded-[16px] bg-white/80 px-3 py-3">
                        <div>
                          <p className="font-medium text-[#10203f]">{form.name || form.form_name || `Form ${index + 1}`}</p>
                          <p className="text-xs text-[#8a98b6]">Submission volume leader</p>
                        </div>
                        <span className="badge badge-blue">
                          <span className="badge-dot" />
                          {form.count || form.total || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-[#5d6d8f]">Top forms will appear here once submissions start arriving.</p>
                )}
              </div>
            </div>
          )}
        </Card>

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
    </div>
  );
}
