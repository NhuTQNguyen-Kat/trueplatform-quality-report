interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
  className?: string;
}

const accentStyles = {
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
  neutral: 'text-slate-700',
};

export function KPICard({ label, value, subtext, accent = 'neutral', className = '' }: Props) {
  return (
    <div
      className={`rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-5 shadow-[var(--card-shadow)] ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentStyles[accent]}`}>{value}</p>
      {subtext && <p className="mt-1 text-sm text-slate-500">{subtext}</p>}
    </div>
  );
}
