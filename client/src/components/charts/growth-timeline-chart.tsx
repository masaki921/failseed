import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { type Entry } from "@shared/schema";

interface GrowthTimelineChartProps {
  entries: Entry[];
  className?: string;
}

export function GrowthTimelineChart({ entries, className }: GrowthTimelineChartProps) {
  // 時系列データを作成（月別集計）
  const timelineData = entries
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .reduce((acc, entry) => {
      const date = new Date(entry.createdAt);
      const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      const dateKey = date.toISOString().split('T')[0];
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          entries: 0,
          cumulative: 0,
          date: dateKey
        };
      }
      
      acc[monthKey].entries += 1;
      return acc;
    }, {} as Record<string, { month: string; entries: number; cumulative: number; date: string }>);

  // 累積数を計算
  const chartData = Object.values(timelineData).map((item, index, arr) => {
    const cumulative = arr.slice(0, index + 1).reduce((sum, prev) => sum + prev.entries, 0);
    return {
      ...item,
      cumulative
    };
  });

  // チャート設定
  const chartConfig: ChartConfig = {
    entries: {
      label: "月間記録数",
      color: "#10B981", // green
    },
    cumulative: {
      label: "累積記録数",
      color: "#3B82F6", // blue
    },
  };

  if (entries.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-ink/60 ${className || ""}`}>
        表示する学びの記録がありません
      </div>
    );
  }

  return (
    <div className={className} data-testid="chart-growth-timeline">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            className="text-ink/70"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-ink/70"
          />
          <Line 
            type="monotone" 
            dataKey="entries" 
            stroke="var(--color-entries)"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="cumulative" 
            stroke="var(--color-cumulative)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value, name) => [
                  `${value}件`,
                  name === "entries" ? "月間記録数" : "累積記録数"
                ]}
              />
            }
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}