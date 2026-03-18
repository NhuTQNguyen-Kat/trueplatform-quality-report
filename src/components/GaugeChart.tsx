'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  value: number;
  label?: string;
  closedLabel?: string;
  openLabel?: string;
  closedCount?: number;
  openCount?: number;
}

export function GaugeChart({
  value,
  label = 'COMPLETE',
  closedLabel = 'Closed',
  openLabel = 'Open',
  closedCount = 0,
  openCount = 0,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const data = [
    { name: 'done', value: clamped, color: '#10b981' },
    { name: 'remaining', value: 100 - clamped, color: '#e2e8f0' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
          <span className="text-2xl font-bold text-slate-800">{value}%</span>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
        </div>
      </div>
      <div className="mt-2 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {closedLabel}: {closedCount}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          {openLabel}: {openCount}
        </span>
      </div>
    </div>
  );
}
