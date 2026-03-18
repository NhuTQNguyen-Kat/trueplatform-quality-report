'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Item {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: Item[];
  title?: string;
}

const DEFAULT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#e2e8f0'];

export function StatusPieChart({ data, title = 'By Status' }: Props) {
  const items = data.map((d, i) => ({
    ...d,
    color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <div className="rounded-[var(--card-radius)] border border-slate-200/80 bg-white p-5 shadow-[var(--card-shadow)]">
      <h3 className="mb-4 text-center text-sm font-semibold text-slate-700">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {items.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="white" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, '']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              formatter={(value, entry) => (
                <span className="text-xs text-slate-600">
                  {value}: {entry.payload?.value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
