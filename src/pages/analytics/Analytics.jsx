import { useState, useEffect } from 'react';
import {
  LineChart, BarChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import Card from '../../components/ui/Card';
import { analyticsService } from '../../services/analyticsService';
import useAppStore from '../../store/useAppStore';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const statGradients = {
  forms: 'from-indigo-500 to-indigo-600',
  submissions: 'from-emerald-500 to-emerald-600',
  projects: 'from-purple-500 to-purple-600',
  tasks: 'from-orange-500 to-orange-600',
};

function KPICard({ title, value, change, icon, gradient }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#64748b]">{title}</span>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-3xl font-bold text-[#0f172a] tracking-tight">{value}</p>
      {change !== undefined && change !== null && (
        <p className={`text-sm mt-1.5 flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          <span>{change >= 0 ? '↑' : '↓'}</span>
          <span className="font-medium">{Math.abs(change)}%</span>
          <span className="text-[#94a3b8] font-normal">vs last period</span>
        </p>
      )}
    </div>
  );
}

export default function Analytics() {
  const addToast = useAppStore((s) => s.addToast);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.get()
      .then((result) => setData(result))
      .catch(() => addToast({ type: 'error', message: 'Failed to load analytics' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 bg-[#f1f5f9] rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-white rounded-xl border border-[#e2e8f0] animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => <div key={i} className="h-80 bg-white rounded-xl border border-[#e2e8f0] animate-pulse" />)}
        </div>
      </div>
    );
  }

  const totals = data?.totals || {};
  const submissionTrend = data?.submission_trend || [];
  const topForms = data?.top_forms || [];

  const kpiIcons = {
    forms: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    submissions: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    projects: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    tasks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-lg p-3">
          <p className="text-xs font-medium text-[#64748b] mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="text-sm font-semibold text-[#0f172a]" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">Analytics</h1>
        <p className="text-sm text-[#64748b] mt-1">Insights into your data collection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="Total Forms" value={totals.forms ?? '—'} icon={kpiIcons.forms} gradient={statGradients.forms} />
        <KPICard title="Total Submissions" value={totals.submissions ?? '—'} icon={kpiIcons.submissions} gradient={statGradients.submissions} />
        <KPICard title="Projects" value={totals.projects ?? '—'} icon={kpiIcons.projects} gradient={statGradients.projects} />
        <KPICard title="Tasks" value={totals.tasks ?? '—'} icon={kpiIcons.tasks} gradient={statGradients.tasks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Submissions Over Time" subtitle="Daily submission volume (last 14 days)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={submissionTrend.length > 0 ? submissionTrend : []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorSubmissions)" strokeWidth={2} name="Submissions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top Forms" subtitle="Forms with most submissions">
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topForms.length > 0 ? topForms : [{ name: 'No data', count: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {topForms.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Submission Trend" subtitle="Count by date">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={submissionTrend.length > 0 ? submissionTrend : []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top Forms" subtitle="Highest submission counts">
          {topForms.length > 0 ? (
            <div className="space-y-1 -my-2">
              {topForms.slice(0, 10).map((form, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#e2e8f0] last:border-0 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-50 to-indigo-50 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-600">{i + 1}</span>
                  </div>
                  <span className="text-sm text-[#475569] flex-1">{form.name || form.form_name || 'Unknown Form'}</span>
                  <span className="text-sm font-semibold text-[#0f172a]">{form.count || form.total || 0}</span>
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
              <p className="text-sm text-[#94a3b8]">No data available</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
