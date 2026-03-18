'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Mock trend data - in production this would come from historical sync data
const MOCK_TREND = [
  { date: 'Mar 12', open: 12, resolved: 3, critical: 2 },
  { date: 'Mar 13', open: 11, resolved: 4, critical: 2 },
  { date: 'Mar 14', open: 10, resolved: 5, critical: 1 },
  { date: 'Mar 15', open: 11, resolved: 4, critical: 1 },
  { date: 'Mar 16', open: 9, resolved: 6, critical: 1 },
  { date: 'Mar 17', open: 8, resolved: 7, critical: 1 },
  { date: 'Mar 18', open: 6, resolved: 8, critical: 1 },
];

interface Props {
  data?: typeof MOCK_TREND;
}

export function TrendChart({ data = MOCK_TREND }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}
          />
          <Legend />
          <Line type="monotone" dataKey="open" stroke="#ef4444" strokeWidth={2} name="Open Bugs" dot />
          <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} name="Resolved" dot />
          <Line type="monotone" dataKey="critical" stroke="#f59e0b" strokeWidth={2} name="Critical" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
