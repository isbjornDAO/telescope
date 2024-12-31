"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VotesChartProps {
  data: {
    votedDate: Date;
    _count: number;
  }[];
}

export function VotesChart({ data }: VotesChartProps) {
  // Create an array of the last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  // Create a map of dates to vote counts from the data
  const votesMap = new Map(
    data.map((item) => {
      const date = new Date(item.votedDate);
      date.setHours(0, 0, 0, 0);
      return [date.toISOString().split('T')[0], item._count];
    })
  );

  // Create the chart data with all days, filling in zeros for days with no votes
  const chartData = last30Days.map((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      }),
      votes: votesMap.get(dateStr) || 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
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
          dataKey="date"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          allowDecimals={false}
          domain={[0, 'auto']}
        />
        <Tooltip 
          formatter={(value: number) => [value, 'Votes']}
          labelFormatter={(label: string) => `Date: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="votes"
          stroke="#2563eb"
          strokeWidth={2}
          dot={true}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 