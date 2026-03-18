'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [benchmarks, setBenchmarks] = useState<Record<string, unknown> | null>(null);
  const [teamMapping, setTeamMapping] = useState<Record<string, unknown> | null>(null);
  const [releaseMapping, setReleaseMapping] = useState<Record<string, unknown> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetch('/api/config/benchmarks')
      .then((r) => r.json())
      .then(setBenchmarks)
      .catch(() => {});
    fetch('/api/config/teams')
      .then((r) => r.json())
      .then(setTeamMapping)
      .catch(() => {});
    fetch('/api/config/releases')
      .then((r) => r.json())
      .then(setReleaseMapping)
      .catch(() => {});
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setSyncResult(null);
    fetch('/api/sync', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => setSyncResult({ success: data.success, message: data.message }))
      .catch(() => setSyncResult({ success: false, message: 'Sync failed' }))
      .finally(() => setSyncing(false));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings & Benchmark</h1>

      {/* Data Sync */}
      <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
        <h2 className="text-lg font-semibold text-slate-900">Data Sync</h2>
        <p className="mt-2 text-sm text-slate-600">
          Fetch latest data from Jira. You can also sync from the Dashboard.
        </p>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="mt-4 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync from Jira'}
        </button>
        {syncResult && (
          <p className={`mt-2 text-sm ${syncResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
            {syncResult.success ? '✓ ' : '✗ '}
            {syncResult.message}
          </p>
        )}
      </div>

      {/* Jira Config */}
      <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Jira Configuration</h2>
        <p className="text-sm text-slate-600 mb-4">
          Configure via environment variables. See <code className="bg-slate-100 px-1 rounded">.env.example</code>.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li><code>JIRA_BASE_URL</code> – Your Jira Cloud URL</li>
          <li><code>JIRA_EMAIL</code> – Jira account email</li>
          <li><code>JIRA_API_TOKEN</code> – API token from id.atlassian.com</li>
          <li><code>JIRA_PROJECT_KEYS</code> – Comma-separated project keys</li>
          <li><code>JIRA_JQL_BASE</code> – Optional base JQL filter</li>
        </ul>
      </div>

      {/* Benchmark Config */}
      <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Benchmark Rules</h2>
        <p className="text-sm text-slate-600 mb-4">
          Edit <code className="bg-slate-100 px-1 rounded">config/benchmarks.json</code> to change thresholds.
        </p>
        {benchmarks && (
          <pre className="text-xs bg-slate-50 p-4 rounded overflow-x-auto max-h-64 overflow-y-auto">
            {JSON.stringify(benchmarks, null, 2)}
          </pre>
        )}
      </div>

      {/* Team Mapping */}
      <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Team Mapping</h2>
        <p className="text-sm text-slate-600 mb-4">
          Edit <code className="bg-slate-100 px-1 rounded">config/team-mapping.json</code> to map projects/components to teams.
        </p>
        {teamMapping && (
          <pre className="text-xs bg-slate-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(teamMapping, null, 2)}
          </pre>
        )}
      </div>

      {/* Release Mapping */}
      <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-6 shadow-[var(--card-shadow)]">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Release Mapping</h2>
        <p className="text-sm text-slate-600 mb-4">
          Edit <code className="bg-slate-100 px-1 rounded">config/release-mapping.json</code> to map fix versions to release names.
        </p>
        {releaseMapping && (
          <pre className="text-xs bg-slate-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(releaseMapping, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
