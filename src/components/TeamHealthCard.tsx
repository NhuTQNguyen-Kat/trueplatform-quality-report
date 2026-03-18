import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { TeamProgressBar } from '@/components/TeamProgressBar';
import type { Team } from '@/lib/types';

const statusColors = {
  green: 'bg-emerald-50 border-emerald-200',
  amber: 'bg-amber-50 border-amber-200',
  red: 'bg-red-50 border-red-200',
};

const statusDots = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

interface Props {
  team: Team;
  topBugs?: { key: string }[];
  jiraBaseUrl?: string;
}

export function TeamHealthCard({ team, topBugs = [], jiraBaseUrl = 'https://katalon.atlassian.net' }: Props) {
  const color = statusColors[team.healthStatus];
  const dot = statusDots[team.healthStatus];

  return (
    <Link href={`/teams/${team.id}`}>
      <div
        className={`rounded-[var(--card-radius)] border p-4 shadow-[var(--card-shadow)] transition hover:shadow-md ${color}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
            <h3 className="font-semibold text-slate-800">{team.name}</h3>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-slate-600">
          <span>Open: {team.openBugs}</span>
          <span>High: {team.highBugs}</span>
          <span>Completion: {team.completionPercent}%</span>
        </div>
        {team.storyProgress && team.totalStories > 0 && (
          <div className="mt-2">
            <TeamProgressBar
              breakdown={team.storyProgress}
              total={team.totalStories}
              showLegend={false}
            />
          </div>
        )}
        {topBugs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topBugs.slice(0, 3).map((b) => (
              <a
                key={b.key}
                href={`${jiraBaseUrl}/browse/${b.key}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded bg-white/80 px-2 py-0.5 text-xs font-mono text-slate-600 hover:bg-white hover:text-blue-600"
              >
                {b.key}
              </a>
            ))}
          </div>
        )}
        {team.healthReasons.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{team.healthReasons.slice(0, 2).join(' • ')}</p>
        )}
      </div>
    </Link>
  );
}
