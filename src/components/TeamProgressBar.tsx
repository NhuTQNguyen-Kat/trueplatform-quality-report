import type { TeamProgressBreakdown } from '@/lib/types';

interface Props {
  breakdown: TeamProgressBreakdown;
  total: number;
  showLegend?: boolean;
  height?: 'sm' | 'md';
}

const colors = {
  done: 'bg-emerald-500',
  inTesting: 'bg-blue-500',
  inProgress: 'bg-amber-500',
  toDo: 'bg-slate-200',
};

export function TeamProgressBar({
  breakdown,
  total,
  showLegend = true,
  height = 'sm',
}: Props) {
  if (total === 0) {
    return (
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-slate-100" />
        {showLegend && (
          <p className="text-xs text-slate-500">No stories</p>
        )}
      </div>
    );
  }

  const segments = [
    { key: 'done' as const, count: breakdown.done, label: 'Done' },
    { key: 'inTesting' as const, count: breakdown.inTesting, label: 'In Testing' },
    { key: 'inProgress' as const, count: breakdown.inProgress, label: 'In Progress' },
    { key: 'toDo' as const, count: breakdown.toDo, label: 'To Do' },
  ].filter((s) => s.count > 0);

  const barHeight = height === 'sm' ? 'h-2' : 'h-3';

  return (
    <div className="space-y-1.5">
      <div className={`flex w-full overflow-hidden rounded-full ${barHeight} bg-slate-100`}>
        {segments.map(({ key, count }) => (
          <div
            key={key}
            className={`${colors[key]} transition-all`}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${key}: ${count}`}
          />
        ))}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600">
          {segments.map(({ key, count, label }) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${colors[key]}`} />
              {label}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
