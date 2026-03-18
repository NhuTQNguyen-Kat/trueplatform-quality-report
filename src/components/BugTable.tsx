import Link from 'next/link';
import type { Bug } from '@/lib/types';

interface Props {
  bugs: Bug[];
  showTeam?: boolean;
  maxRows?: number;
}

export function BugTable({ bugs, showTeam = true, maxRows }: Props) {
  const display = maxRows ? bugs.slice(0, maxRows) : bugs;

  return (
    <div className="overflow-x-auto rounded-[var(--card-radius)] border border-slate-200/80 bg-white shadow-[var(--card-shadow)]">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Key</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Priority</th>
            {showTeam && (
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Team</th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assignee</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Age</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {display.map((bug) => (
            <tr key={bug.id} className="transition hover:bg-slate-50/80">
              <td className="px-4 py-3 text-sm font-mono">
                <Link href={`/bugs?key=${bug.key}`} className="text-blue-600 hover:underline">
                  {bug.key}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-slate-900 max-w-md truncate" title={bug.title}>
                {bug.title}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-medium ${
                    bug.priority === 'Critical' || bug.priority === 'Blocker'
                      ? 'text-red-600'
                      : bug.priority === 'High'
                      ? 'text-amber-600'
                      : 'text-slate-600'
                  }`}
                >
                  {bug.priority}
                </span>
              </td>
              {showTeam && (
                <td className="px-4 py-3 text-sm text-slate-600">{bug.teamId.replace(/-/g, ' ')}</td>
              )}
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bug.status === 'Blocked'
                      ? 'bg-red-100 text-red-800'
                      : ['Done', 'Closed', 'Resolved'].includes(bug.status)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {bug.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{bug.assignee || '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{bug.ageDays}d</td>
            </tr>
          ))}
        </tbody>
      </table>
      {maxRows && bugs.length > maxRows && (
        <div className="px-4 py-2 bg-slate-50 text-sm text-slate-500">
          Showing {maxRows} of {bugs.length} bugs
        </div>
      )}
    </div>
  );
}
