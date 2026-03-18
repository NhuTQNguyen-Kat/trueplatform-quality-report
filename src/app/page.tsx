'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  RefreshCw,
  Target,
  ChevronDown,
  MessageCircle,
  Bell,
  User,
  Settings,
  Clock,
} from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { GaugeChart } from '@/components/GaugeChart';
import { StatusPieChart } from '@/components/StatusPieChart';
import { ThresholdBadges } from '@/components/ThresholdBadges';
import { TeamHealthCard } from '@/components/TeamHealthCard';
import { BugTable } from '@/components/BugTable';
import Link from 'next/link';
import type { ReportData } from '@/lib/types';

const DONE_STATUSES = ['Done', 'Closed', 'Resolved'];

function getStatusBreakdown(data: ReportData) {
  const bugs = data.bugs;
  const statusCounts: Record<string, number> = {};
  for (const b of bugs) {
    const s = b.status;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const colors: Record<string, string> = {
    Closed: '#10b981',
    Done: '#10b981',
    Resolved: '#10b981',
    Open: '#3b82f6',
    'In Progress': '#f59e0b',
    'Selected for Development': '#8b5cf6',
    'To Do': '#94a3b8',
    Blocked: '#ef4444',
    'Ready For Test': '#06b6d4',
  };
  return Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, color: colors[name] || '#94a3b8' }));
}

function getTypeBreakdown(data: ReportData) {
  const items = [
    { name: 'Bug', value: data.bugs.length, color: '#ef4444' },
    { name: 'Story', value: data.stories.length, color: '#10b981' },
    { name: 'Epic', value: data.epics.length, color: '#8b5cf6' },
  ].filter((i) => i.value > 0);
  return items;
}

export default function DashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [appConfig, setAppConfig] = useState<{ targetReleaseDate?: string; jiraBaseUrl?: string }>({});
  const [showScoring, setShowScoring] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const loadData = () => {
    fetch('/api/report')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    fetch('/api/config/app')
      .then((r) => r.json())
      .then(setAppConfig)
      .catch(() => {});
  }, []);

  const handleSync = () => {
    setSyncing(true);
    fetch('/api/sync', { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) loadData();
      })
      .finally(() => setSyncing(false));
  };

  const targetDate = appConfig.targetReleaseDate || '2026-04-07';
  const daysToLaunch = Math.ceil(
    (new Date(targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
  const showDaysToLaunch = daysToLaunch > 0;
  const formatLastSync = (lastSync: string) => {
    const sec = Math.floor((Date.now() - new Date(lastSync).getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          <p className="mt-3 text-slate-500">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
        <p className="text-amber-800">No data available. Run a sync first.</p>
        <Link href="/settings" className="mt-2 inline-block font-medium text-amber-700 hover:underline">
          Go to Settings →
        </Link>
      </div>
    );
  }

  const { summary, overallReadiness, teams, top10Bugs, mustFixBugs, topBugsByTeam } = data;
  const completion = summary.completionPercent ?? 0;
  const doneIssues = summary.doneIssues ?? summary.closedBugs;
  const totalIssues = summary.totalIssues ?? summary.totalBugs;
  const openCount = totalIssues - doneIssues;

  const thresholdBadges: { label: string; value: string; status: 'pass' | 'warn' | 'fail' }[] = [
    {
      label: 'Critical Bugs (Highest)',
      value: String(summary.criticalBugs),
      status: summary.criticalBugs === 0 ? 'pass' : 'fail',
    },
    {
      label: 'Blocked Items',
      value: String(summary.blockedIssues),
      status: summary.blockedIssues === 0 ? 'pass' : 'fail',
    },
    {
      label: 'Fix Rate %',
      value: String(summary.fixRatePercent ?? 0) + '%',
      status: (summary.fixRatePercent ?? 0) >= 80 ? 'pass' : 'warn',
    },
    {
      label: 'High Priority Open',
      value: String(summary.highBugs),
      status: summary.highBugs === 0 ? 'pass' : summary.highBugs > 5 ? 'fail' : 'warn',
    },
    {
      label: 'Completion %',
      value: String(completion) + '%',
      status: completion >= 90 ? 'pass' : completion >= 70 ? 'warn' : 'fail',
    },
  ];

  const statusData = getStatusBreakdown(data);
  const typeData = getTypeBreakdown(data);

  const readinessLabel =
    overallReadiness === 'READY'
      ? 'GO'
      : overallReadiness === 'AT_RISK'
        ? 'CONDITIONAL GO'
        : 'NO GO';

  const readinessColor =
    overallReadiness === 'READY'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : overallReadiness === 'AT_RISK'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-red-100 text-red-800 border-red-200';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Top bar — slogan + user */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-3.5 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Quality drives launch confidence — every metric matters.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Chat"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {mustFixBugs.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {Math.min(mustFixBugs.length, 9)}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">User</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Header + Sync controls */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Shield className="h-7 w-7 text-slate-600" />
              Quality Status
            </h1>
            <p className="mt-1 text-slate-600">
              TruePlatform Release Readiness — Target: April 7, 2026
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                {formatLastSync(data.lastSync)}
              </span>
              {showDaysToLaunch && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                  <Target className="h-4 w-4" />
                  {daysToLaunch} days to launch
                </span>
              )}
              {data.isDemoMode && (
                <span className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
                  Demo Mode
                </span>
              )}
            </div>
          </div>

          {/* Sync actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-600 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:border-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Fetch Live
            </button>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <a
              href={`${appConfig.jiraBaseUrl || 'https://katalon.atlassian.net'}/jira/software`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Open in Jira
            </a>
          </div>
        </div>
      </div>

      {/* DOD Verdict + Overall Grade */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            DOD Verdict (Definition of Done)
          </p>
          <p
            className={`mt-2 inline-block rounded-lg border px-4 py-2 text-lg font-bold ${readinessColor}`}
          >
            {readinessLabel}
          </p>
          {data.dodCriteria && data.dodCriteria.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.dodCriteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className={c.passed ? 'text-slate-600' : 'text-red-600 font-medium'}>
                    {c.passed ? '✓' : '✗'} {c.label}
                  </span>
                  {!c.passed && c.value && (
                    <span className="text-slate-500">
                      {c.value}
                      {c.threshold && <span className="text-slate-400"> (need {c.threshold})</span>}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
          <GaugeChart
            value={completion}
            closedCount={doneIssues}
            openCount={openCount}
          />
        </div>
        <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Last sync
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {new Date(data.lastSync).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Threshold badges */}
      <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white px-5 py-4 shadow-[var(--card-shadow)]">
        <ThresholdBadges badges={thresholdBadges} onScoringClick={() => setShowScoring(true)} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KPICard
          label="Total Releases"
          value={data.releases.length}
          subtext={`${data.releases.filter((r) => r.readinessStatus === 'READY').length} released · ${data.releases.filter((r) => r.readinessStatus !== 'READY').length} unreleased`}
        />
        <KPICard
          label="Completion"
          value={`${completion}%`}
          subtext={`${summary.storiesIncludedInCompletion ?? 0} stories (done/in testing) + ${summary.closedBugs} bugs closed / ${totalIssues} total`}
          accent="amber"
        />
        <KPICard
          label="Open Bugs"
          value={summary.openBugs}
          subtext={`${summary.highBugs} high prio · filtered by ${teams.length} teams`}
          accent="red"
        />
        <KPICard
          label="Blocked"
          value={summary.blockedIssues}
          subtext={`${teams.reduce((a, t) => a + t.storiesInProgress, 0)} in progress`}
          accent={summary.blockedIssues > 0 ? 'red' : 'neutral'}
        />
        <KPICard label="Closed Bugs" value={summary.closedBugs} accent="green" />
        <KPICard label="High Priority" value={summary.highBugs} accent="amber" />
      </div>

      {/* Team Health Matrix */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Agent / Team Health</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.map((team) => (
            <TeamHealthCard
              key={team.id}
              team={team}
              topBugs={topBugsByTeam[team.id]?.slice(0, 3) || []}
              jiraBaseUrl={appConfig.jiraBaseUrl}
            />
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-5 shadow-[var(--card-shadow)]">
          <h3 className="mb-4 text-center text-sm font-semibold text-slate-700">Overall Progress</h3>
          <GaugeChart
            value={completion}
            closedCount={doneIssues}
            openCount={openCount}
          />
        </div>
        {statusData.length > 0 && (
          <StatusPieChart data={statusData} title="By Status" />
        )}
        {typeData.length > 0 && (
          <StatusPieChart data={typeData} title="By Type" />
        )}
      </div>

      {/* Must-Fix Bugs */}
      {mustFixBugs.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Must-Fix Before Release</h2>
          <BugTable bugs={mustFixBugs} showTeam maxRows={10} />
        </div>
      )}

      {/* Top 10 Critical Bugs */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Top 10 Critical Bugs</h2>
        <BugTable bugs={top10Bugs} showTeam maxRows={10} />
        <Link
          href="/bugs"
          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          View all bugs →
        </Link>
      </div>

      {/* Scoring modal placeholder - could link to Settings */}
      {showScoring && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowScoring(false)}
        >
          <div
            className="max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-slate-900">How DOD Verdict works</h3>
            <p className="mt-2 text-sm text-slate-600">
              <strong>NO GO</strong> if: Blocker exists, Critical bugs open, or Must-fix unresolved.
              <br />
              <strong>CONDITIONAL GO</strong> if: High priority &gt; 5, Teams at risk &gt; 0, or Completion &lt; 70%.
              <br />
              <strong>GO</strong> when all 6 criteria pass.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Edit <code className="rounded bg-slate-100 px-1">config/benchmarks.json</code> to customize thresholds.
            </p>
            <Link
              href="/settings"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Open Settings →
            </Link>
            <button
              type="button"
              onClick={() => setShowScoring(false)}
              className="ml-4 text-sm text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
