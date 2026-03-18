'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HealthBadge } from '@/components/HealthBadge';
import { StatCard } from '@/components/StatCard';
import { TeamProgressBar } from '@/components/TeamProgressBar';
import type { ReportData } from '@/lib/types';

export default function TeamsPage() {
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
        <p className="text-amber-800">No data available. Run a sync first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 transition">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">{team.name}</h2>
                <HealthBadge status={team.healthStatus} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatCard label="Open Bugs" value={team.openBugs} variant="muted" />
                <StatCard label="Critical" value={team.criticalBugs} variant="muted" />
                <StatCard label="Must-Fix" value={team.mustFixBugs} variant="muted" />
                <StatCard
                  label="Completion"
                  value={`${team.completionPercent}%`}
                  subtext={(team.totalStories ?? 0) > 0 ? `${team.storiesIncludedInCompletion ?? 0}/${team.totalStories} stories` : undefined}
                  variant="muted"
                />
              </div>
              {team.storyProgress && (team.totalStories ?? 0) > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-medium text-slate-500">Story progress</p>
                  <TeamProgressBar breakdown={team.storyProgress} total={team.totalStories} showLegend />
                </div>
              )}
              {team.healthReasons.length > 0 && (
                <p className="text-sm text-slate-600">{team.healthReasons.join(' • ')}</p>
              )}
              {team.recommendedFocus.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Focus: {team.recommendedFocus.join(', ')}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
