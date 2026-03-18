'use client';

import { useEffect, useState } from 'react';
import { HealthBadge } from '@/components/HealthBadge';
import { StatCard } from '@/components/StatCard';
import { BugTable } from '@/components/BugTable';
import type { ReportData } from '@/lib/types';

export default function ReleasesPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Releases</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.releases.map((release) => {
          const mustFix = data.mustFixBugs.filter((b) => b.releaseId === release.id);

          return (
            <div
              key={release.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{release.name}</h2>
                <HealthBadge status={release.readinessStatus} />
              </div>
              {release.targetDate && (
                <p className="text-sm text-slate-500 mb-4">Target: {release.targetDate}</p>
              )}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatCard label="Open Bugs" value={release.openBugs} variant="muted" />
                <StatCard label="Blockers" value={release.blockerCount} variant="muted" />
                <StatCard label="Must-Fix" value={release.mustFixCount} variant="muted" />
                <StatCard label="Teams at Risk" value={release.teamsAtRisk} variant="muted" />
              </div>
              {mustFix.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Release Blockers</h3>
                  <BugTable bugs={mustFix} showTeam maxRows={5} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
