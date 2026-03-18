interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'muted';
}

export function StatCard({ label, value, subtext, variant = 'default' }: Props) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        variant === 'muted' ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}
