import clsx from 'clsx';

type Status = 'green' | 'amber' | 'red' | 'READY' | 'AT_RISK' | 'NOT_READY';

const styles: Record<Status, string> = {
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  READY: 'bg-green-100 text-green-800 border-green-200',
  AT_RISK: 'bg-amber-100 text-amber-800 border-amber-200',
  NOT_READY: 'bg-red-100 text-red-800 border-red-200',
};

interface Props {
  status: Status;
  label?: string;
  className?: string;
}

export function HealthBadge({ status, label, className }: Props) {
  const display = label ?? status;
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        styles[status] ?? 'bg-slate-100 text-slate-800',
        className
      )}
    >
      {display}
    </span>
  );
}
