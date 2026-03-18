'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BugTable } from '@/components/BugTable';
import type { ReportData } from '@/lib/types';

function BugsContent() {
  const searchParams = useSearchParams();
  const filterKey = searchParams.get('key');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'open' | 'all'>('open');

  useEffect(() => {
    fetch('/api/report')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-amber-800">No data available.</p>
      </div>
    );
  }

  const doneStatuses = ['Done', 'Closed', 'Resolved'];
  const excludedStatuses = ['Will not implement'];
  let bugs =
    viewFilter === 'open'
      ? data.bugs.filter(
          (b) => !doneStatuses.includes(b.status) && !excludedStatuses.includes(b.status)
        )
      : data.bugs;
  if (filterKey) {
    bugs = bugs.filter((b) => b.key.toLowerCase().includes(filterKey.toLowerCase()));
  }
  if (teamFilter) {
    bugs = bugs.filter((b) => b.teamId === teamFilter);
  }
  if (statusFilter) {
    bugs = bugs.filter((b) => b.status === statusFilter);
  }
  if (priorityFilter) {
    bugs = bugs.filter((b) => b.priority === priorityFilter);
  }

  const statuses = Array.from(new Set(data.bugs.map((b) => b.status))).sort();
  const priorities = Array.from(new Set(data.bugs.map((b) => b.priority))).sort();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Bugs</h1>

      {/* Must-Fix Section */}
      {data.mustFixBugs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Must-Fix Before Release</h2>
          <BugTable bugs={data.mustFixBugs} showTeam />
        </div>
      )}

      {/* Top Critical */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Critical Bugs</h2>
        <BugTable bugs={data.top10Bugs} showTeam maxRows={10} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2">
          <span className="text-sm text-slate-600">View</span>
          <select
            value={viewFilter}
            onChange={(e) => setViewFilter(e.target.value as 'open' | 'all')}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="open">Open defects</option>
            <option value="all">All bugs</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Team</span>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {data.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Priority</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* All Bugs Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {viewFilter === 'open' ? 'Open Defects' : 'All Bugs'} ({bugs.length})
        </h2>
        <BugTable bugs={bugs} showTeam />
      </div>
    </div>
  );
}

export default function BugsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><p className="text-slate-500">Loading...</p></div>}>
      <BugsContent />
    </Suspense>
  );
}
