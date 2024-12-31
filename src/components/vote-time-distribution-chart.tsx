"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VoteTimeDistributionChartProps {
  data: {
    hour: number;
    count: number;
  }[];
}

export function VoteTimeDistributionChart({ data }: VoteTimeDistributionChartProps) {
  // Ensure we have all 24 hours represented
  const chartData = Array.from({ length: 24 }, (_, hour) => {
    const hourData = data.find(d => d.hour === hour);
    return {
      hour: hour.toString().padStart(2, '0') + ':00',
      votes: hourData ? Number(hourData.count) : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          allowDecimals={false}
        />
        <Tooltip 
          formatter={(value: number) => [value, 'Votes']}
          labelFormatter={(label: string) => `Time: ${label}`}
        />
        <Bar
          dataKey="votes"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
} 