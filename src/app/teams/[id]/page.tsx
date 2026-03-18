'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HealthBadge } from '@/components/HealthBadge';
import { BugTable } from '@/components/BugTable';
import { StatCard } from '@/components/StatCard';
import { TeamProgressBar } from '@/components/TeamProgressBar';
import type { ReportData } from '@/lib/types';

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;
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

  const team = data?.teams.find((t) => t.id === id);
  const topBugs = data?.topBugsByTeam?.[id] ?? [];
  const teamBugs = data?.bugs.filter((b) => b.teamId === id) ?? [];
  const teamEpics = data?.epics.filter((e) => e.teamId === id) ?? [];

  if (!team) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-amber-800">Team not found.</p>
        <Link href="/teams" className="mt-2 inline-block text-amber-700 font-medium hover:underline">
          ← Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
      <div className="flex items-center gap-2">
        <HealthBadge status={team.healthStatus} />
        <Link href="/teams" className="text-sm text-slate-500 hover:underline">
          ← All teams
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Open Bugs" value={team.openBugs} />
        <StatCard label="Critical" value={team.criticalBugs} />
        <StatCard label="High" value={team.highBugs} />
        <StatCard label="Blocked" value={team.blockedBugs} />
        <StatCard label="Must-Fix" value={team.mustFixBugs} />
        <StatCard
          label="Completion"
          value={`${team.completionPercent}%`}
          subtext={(team.totalStories ?? 0) > 0 ? `${team.storiesIncludedInCompletion ?? 0}/${team.totalStories} stories` : undefined}
        />
      </div>

      {team.storyProgress && (team.totalStories ?? 0) > 0 && (
        <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-5 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Overall progress</h3>
          <TeamProgressBar breakdown={team.storyProgress} total={team.totalStories} showLegend height="md" />
        </div>
      )}

      {team.healthReasons.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-medium text-slate-900 mb-2">Health Summary</h3>
          <ul className="list-disc list-inside text-sm text-slate-600">
            {team.healthReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top 5 Bugs to Focus On</h2>
        <BugTable bugs={topBugs} showTeam={false} />
      </div>

      {teamEpics.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Epic Progress</h2>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Epic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Open Bugs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {teamEpics.map((epic) => (
                  <tr key={epic.id}>
                    <td className="px-4 py-3 text-sm font-mono">{epic.key}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${epic.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-sm">{epic.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{epic.openBugs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">All Bugs</h2>
        <BugTable bugs={teamBugs} showTeam={false} />
      </div>
    </div>
  );
}
