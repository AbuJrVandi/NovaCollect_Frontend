import { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Card from '../../components/ui/Card';
import { analyticsService } from '../../services/analyticsService';
import useAppStore from '../../store/useAppStore';

const COLORS = ['#2b63f6', '#0f766e', '#ea580c', '#7c3aed', '#db2777', '#0891b2', '#16a34a', '#ca8a04'];

const statGradients = {
  forms: 'from-[#2b63f6] to-[#6f5dff]',
  submissions: 'from-[#059669] to-[#10b981]',
  projects: 'from-[#7c3aed] to-[#a855f7]',
  tasks: 'from-[#ea580c] to-[#f59e0b]',
};

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
}

function formatFullNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function formatDateLabel(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return 'Unknown';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString('en-US', options);
}

function normalizeTrend(points = []) {
  return points.map((point, index) => ({
    key: point.date || point.day || `point-${index + 1}`,
    date: point.date || point.day || `Point ${index + 1}`,
    label: formatDateLabel(point.date || point.day),
    count: Number(point.count ?? point.total ?? point.value ?? 0),
  }));
}

function normalizeTopForms(forms = []) {
  return forms
    .map((form, index) => ({
      name: form.name || form.form_name || `Form ${index + 1}`,
      count: Number(form.count ?? form.total ?? form.value ?? 0),
    }))
    .filter((form) => form.count > 0);
}

function KPICard({ title, value, note, icon, gradient }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{title}</span>
        <div className={`stat-card-icon bg-gradient-to-br ${gradient}`}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
          </svg>
        </div>
      </div>
      <p className="stat-card-value">{value}</p>
      <p className="text-xs text-[#6b7a99] mt-2">{note}</p>
    </div>
  );
}

function EmptyChartState({ title, description }) {
  return (
    <div className="h-full min-h-[300px] flex items-center justify-center">
      <div className="text-center max-w-sm space-y-2">
        <div className="mx-auto w-14 h-14 rounded-[18px] bg-[linear-gradient(135deg,rgba(43,99,246,0.12),rgba(16,185,129,0.12))] flex items-center justify-center text-[#2b63f6]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3v18h18M7 14l3-3 3 2 4-5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#10203f]">{title}</p>
        <p className="text-sm text-[#6b7a99]">{description}</p>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[18px] border border-[rgba(148,163,184,0.18)] bg-white/95 px-4 py-3 shadow-[0_18px_45px_rgba(30,55,106,0.16)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b88a5]">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-5 text-sm">
            <span className="flex items-center gap-2 text-[#51617f]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-[#10203f]">{formatFullNumber(entry.value)}</span>
          </div>
        ))}
      </div>
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
      <div className="page-shell">
        <div className="skel skel-h2" />
        <div className="stat-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skel skel-card" />)}
        </div>
        <div className="grid-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skel skel-chart" />)}
        </div>
      </div>
    );
  }

  const totals = {
    forms: Number(data?.totals?.forms ?? 0),
    submissions: Number(data?.totals?.submissions ?? 0),
    projects: Number(data?.totals?.projects ?? 0),
    tasks: Number(data?.totals?.tasks ?? 0),
  };

  const submissionTrend = normalizeTrend(data?.submission_trend || []);
  const topForms = normalizeTopForms(data?.top_forms || []);

  let totalTrendVolume = 0;
  let peakPoint = null;
  const cumulativeTrend = submissionTrend.map((point) => {
    totalTrendVolume += point.count;
    if (!peakPoint || point.count > peakPoint.count) peakPoint = point;
    return { ...point, cumulative: totalTrendVolume };
  });

  const averageDaily = submissionTrend.length > 0 ? totalTrendVolume / submissionTrend.length : 0;
  const topFormsVolume = topForms.reduce((sum, form) => sum + form.count, 0);
  const topFormLeader = topForms[0] || null;
  const donutData = topForms.map((form, index) => ({
    ...form,
    share: topFormsVolume > 0 ? Math.round((form.count / topFormsVolume) * 100) : 0,
    fill: COLORS[index % COLORS.length],
  }));

  const kpiIcons = {
    forms: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    submissions: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    projects: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    tasks: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  };

  return (
    <div className="page-shell">
      <div className="page-header-row">
        <div>
          <div className="page-kicker">Performance Insights</div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Professional reporting for collection volume, portfolio activity, and form performance.</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="relative rounded-[24px] bg-[linear-gradient(135deg,#0f172a_0%,#17316b_55%,#0f766e_100%)] px-6 py-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.22),transparent_30%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                Operational Snapshot
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">Your workspace is tracking {formatFullNumber(totals.submissions)} total submissions.</h2>
              <p className="max-w-2xl text-sm text-white/75">
                Use the charts below to monitor intake patterns, identify your highest-performing forms, and understand how activity is building over time.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Peak day</p>
                <p className="mt-1 text-lg font-semibold">{peakPoint ? formatDateLabel(peakPoint.date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No data yet'}</p>
                <p className="text-sm text-white/65">{peakPoint ? `${formatFullNumber(peakPoint.count)} submissions recorded` : 'Once activity starts, the highest-volume date will appear here.'}</p>
              </div>
              <div className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Average cadence</p>
                <p className="mt-1 text-lg font-semibold">{submissionTrend.length > 0 ? averageDaily.toFixed(1) : '0.0'}</p>
                <p className="text-sm text-white/65">Average submissions per reporting day.</p>
              </div>
              <div className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Top form</p>
                <p className="mt-1 text-lg font-semibold">{topFormLeader?.name || 'No ranking yet'}</p>
                <p className="text-sm text-white/65">{topFormLeader ? `${formatFullNumber(topFormLeader.count)} submissions captured` : 'Form rankings will appear after responses are collected.'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="stat-grid">
        <KPICard title="Total Forms" value={formatCompactNumber(totals.forms)} note="Published and draft forms in your workspace." icon={kpiIcons.forms} gradient={statGradients.forms} />
        <KPICard title="Total Submissions" value={formatCompactNumber(totals.submissions)} note="All responses recorded across the platform." icon={kpiIcons.submissions} gradient={statGradients.submissions} />
        <KPICard title="Projects" value={formatCompactNumber(totals.projects)} note="Delivery initiatives currently tracked." icon={kpiIcons.projects} gradient={statGradients.projects} />
        <KPICard title="Tasks" value={formatCompactNumber(totals.tasks)} note="Execution items attached to your projects." icon={kpiIcons.tasks} gradient={statGradients.tasks} />
      </div>

      <div className="grid-2">
        <Card title="Submission Volume" subtitle="Daily intake across the latest reporting window.">
          {submissionTrend.length > 0 ? (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionTrend} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="submissionAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2b63f6" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2b63f6" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4ecfb" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7b88a5' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#7b88a5' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Submissions" stroke="#2b63f6" strokeWidth={3} fill="url(#submissionAreaFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState title="No submission trend yet" description="Submissions will appear here once your forms start collecting responses." />
          )}
        </Card>

        <Card title="Top Forms Ranking" subtitle="The forms generating the most responses right now.">
          {topForms.length > 0 ? (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topForms.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 12, left: 24, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4ecfb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#7b88a5' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12, fill: '#50607d' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Responses" radius={[0, 10, 10, 0]}>
                    {topForms.slice(0, 6).map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState title="No form performance data yet" description="As responses come in, this chart will rank your best-performing forms." />
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Cumulative Growth" subtitle="Total submissions building over time.">
          {cumulativeTrend.length > 0 ? (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeTrend} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4ecfb" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7b88a5' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#7b88a5' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="cumulative" name="Cumulative submissions" stroke="#0f766e" strokeWidth={3} dot={{ r: 3, fill: '#0f766e' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState title="No cumulative growth to display" description="This view becomes useful as soon as daily submission data is available." />
          )}
        </Card>

        <Card title="Form Share" subtitle="How responses are distributed across your top forms.">
          {donutData.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] items-center min-h-[320px]">
              <div className="relative h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={74}
                      outerRadius={112}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b88a5]">Tracked</p>
                    <p className="text-3xl font-semibold tracking-[-0.04em] text-[#10203f]">{formatCompactNumber(topFormsVolume)}</p>
                    <p className="text-sm text-[#6b7a99]">responses</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {donutData.slice(0, 6).map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between gap-3 rounded-[16px] border border-[rgba(166,183,219,0.18)] bg-[rgba(248,250,255,0.82)] px-4 py-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#10203f]">{entry.name}</p>
                        <p className="text-xs text-[#6b7a99]">{entry.share}% of top-form volume</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#10203f]">{formatFullNumber(entry.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChartState title="No distribution to display" description="Once multiple forms collect data, this chart will show their response share." />
          )}
        </Card>
      </div>
    </div>
  );
}
