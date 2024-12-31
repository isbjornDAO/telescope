"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DailyTopProject {
  date: Date;
  projectId: string;
  projectName: string;
  voteCount: number;
}

interface Props {
  data: DailyTopProject[];
}

export function DailyTopProjectsChart({ data }: Props) {
  // Process data to get only the top project for each day
  const processedData = Array.from(
    new Set(data.map((v) => v.date.toISOString().split("T")[0]))
  ).map((dateStr) => {
    const dayVotes = data
      .filter((v) => v.date.toISOString().split("T")[0] === dateStr)
      .sort((a, b) => b.voteCount - a.voteCount);

    const topProject = dayVotes[0];
    return {
      date: dateStr,
      projectName: topProject.projectName,
      votes: topProject.voteCount,
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={processedData} margin={{ bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis allowDecimals={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-background border rounded-lg p-2 shadow-sm">
                  <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
                  <p>{payload[0].payload.projectName}</p>
                  <p className="font-medium">{payload[0].value} votes</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey="votes"
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
} 