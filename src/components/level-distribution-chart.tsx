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

interface LevelDistributionChartProps {
  data: {
    level: number;
    _count: {
      _all: number;
    };
  }[];
}

export function LevelDistributionChart({ data }: LevelDistributionChartProps) {
  const chartData = data.map((item) => ({
    level: `Level ${item.level}`,
    users: item._count._all,
  }));

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
          dataKey="level"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          allowDecimals={false}
        />
        <Tooltip 
          formatter={(value: number) => [value, 'Users']}
          labelFormatter={(label: string) => label}
        />
        <Bar
          dataKey="users"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
} 