import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface Badge {
  label: string;
  value: string;
  status: 'pass' | 'warn' | 'fail';
}

interface Props {
  badges: Badge[];
  onScoringClick?: () => void;
}

export function ThresholdBadges({ badges, onScoringClick }: Props) {
  const icons = {
    pass: <CheckCircle2 className="h-3.5 w-3.5" />,
    warn: <AlertTriangle className="h-3.5 w-3.5" />,
    fail: <XCircle className="h-3.5 w-3.5" />,
  };

  const styles = {
    pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    fail: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((b) => (
        <span
          key={b.label}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${styles[b.status]}`}
        >
          {icons[b.status]}
          {b.label}: {b.value}
        </span>
      ))}
      {onScoringClick && (
        <button
          type="button"
          onClick={onScoringClick}
          className="text-xs text-blue-600 hover:underline"
        >
          How scoring works
        </button>
      )}
    </div>
  );
}
