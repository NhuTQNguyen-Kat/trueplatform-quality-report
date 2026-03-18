'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReportData } from '@/lib/types';

export default function EpicsPage() {
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

  const getTeamName = (teamId: string) => data.teams.find((t) => t.id === teamId)?.name ?? teamId;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Epics</h1>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Epic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Team</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stories</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Open Bugs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.epics.map((epic) => (
              <tr key={epic.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-mono">{epic.key}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{epic.title}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{getTeamName(epic.teamId)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded overflow-hidden">
                      <div
                        className={`h-full ${
                          epic.progressPercent >= 90
                            ? 'bg-green-500'
                            : epic.progressPercent >= 70
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${epic.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-sm">{epic.progressPercent}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {epic.doneStories}/{epic.totalStories}
                </td>
                <td className="px-4 py-3 text-sm">
                  {epic.openBugs > 0 ? (
                    <span className="text-amber-600 font-medium">{epic.openBugs}</span>
                  ) : (
                    epic.openBugs
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
