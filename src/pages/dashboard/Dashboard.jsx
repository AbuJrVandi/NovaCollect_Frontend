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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#64748b] mt-1">Overview of your NovaCollect workspace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <Link key={card.label} to={card.link} className="block group">
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm hover:shadow-lg hover:border-[#cbd5e1] transition-all duration-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[#64748b] group-hover:text-[#0f172a] transition-colors">{card.label}</span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-200`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={card.icon} />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0f172a] tracking-tight">
                {loading ? (
                  <span className="inline-block w-12 h-8 bg-[#f1f5f9] rounded animate-pulse" />
                ) : (
                  card.value ?? '—'
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity" subtitle="Latest actions in your workspace">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#e2e8f0] animate-pulse" />
                  <div className="flex-1 h-4 bg-[#f1f5f9] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-12 h-12 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-[#94a3b8]">Activity data will appear here</p>
            </div>
          )}
        </Card>

        <Card title="Quick Actions" subtitle="Common tasks">
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/forms/new', label: 'New Form', icon: 'M12 4v16m8-8H4', desc: 'Create a new form' },
              { to: '/submissions', label: 'Submissions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'View submissions' },
              { to: '/projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', desc: 'Manage projects' },
              { to: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'View analytics' },
            ].map(({ to, label, icon, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col gap-1.5 p-4 rounded-xl border border-[#e2e8f0] hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 group-hover:scale-110 transition-all duration-200">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#0f172a] group-hover:text-primary-700 transition-colors">{label}</span>
                <span className="text-xs text-[#94a3b8]">{desc}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
