'use client';

import { useEffect, useState } from 'react';

interface SyncStatus {
  lastSync: string | null;
  status: string;
  isDemoMode: boolean;
  message?: string;
  dataQualityWarnings: string[];
  unmatchedIssues: number;
}

export default function SyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message?: string } | null>(null);

  const loadStatus = () => {
    fetch('/api/sync/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setSyncResult(null);
    fetch('/api/sync', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        setSyncResult({ success: data.success, message: data.message });
        loadStatus();
      })
      .catch(() => setSyncResult({ success: false, message: 'Sync failed' }))
      .finally(() => setSyncing(false));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Data Sync</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sync Status</h2>
        {status ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Last sync:</span>{' '}
              {status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}
            </p>
            <p>
              <span className="text-slate-500">Status:</span>{' '}
              <span
                className={
                  status.status === 'success'
                    ? 'text-green-600'
                    : status.status === 'error'
                    ? 'text-red-600'
                    : 'text-slate-600'
                }
              >
                {status.status}
              </span>
            </p>
            {status.isDemoMode && (
              <p className="text-amber-600 font-medium">Demo mode – using sample data (Jira not configured)</p>
            )}
            {status.message && <p className="text-slate-600">{status.message}</p>}
            {status.dataQualityWarnings.length > 0 && (
              <div className="mt-2 p-2 bg-amber-50 rounded">
                <p className="font-medium text-amber-800">Data quality warnings:</p>
                <ul className="list-disc list-inside text-amber-700">
                  {status.dataQualityWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500">Loading...</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sync Now</h2>
        <p className="text-sm text-slate-600 mb-4">
          {status?.isDemoMode
            ? 'Jira is not configured. Clicking sync will refresh demo data.'
            : 'Fetch latest data from Jira.'}
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Syncing...' : 'Sync from Jira'}
        </button>
        {syncResult && (
          <p
            className={`mt-2 text-sm ${syncResult.success ? 'text-green-600' : 'text-red-600'}`}
          >
            {syncResult.success ? '✓ ' : '✗ '}
            {syncResult.message}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Setup</h2>
        <p className="text-sm text-slate-600">
          To connect to Jira, set these environment variables and restart the app:
        </p>
        <ul className="mt-2 text-sm text-slate-600 list-disc list-inside space-y-1">
          <li><code>JIRA_BASE_URL</code></li>
          <li><code>JIRA_EMAIL</code></li>
          <li><code>JIRA_API_TOKEN</code></li>
          <li><code>JIRA_PROJECT_KEYS</code></li>
        </ul>
      </div>
    </div>
  );
}
