import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { type Entry } from "@shared/schema";

interface HintStatusBarChartProps {
  entries: Entry[];
  className?: string;
}

// ヒントステータスの日本語表示とカラー設定
const HINT_STATUS_CONFIG = {
  none: { label: "未対応", color: "#6B7280" },      // gray
  tried: { label: "実行済み", color: "#10B981" },   // green
  skipped: { label: "スキップ", color: "#F59E0B" }, // amber
};

export function HintStatusBarChart({ entries, className }: HintStatusBarChartProps) {
  // ヒントステータス別にエントリを集計
  const hintStatusData = Object.entries(HINT_STATUS_CONFIG).map(([statusKey, config]) => {
    const count = entries.filter(entry => entry.hintStatus === statusKey).length;
    const percentage = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
    
    return {
      statusKey,
      status: config.label,
      count,
      percentage,
      fill: config.color,
    };
  }).filter(item => item.count > 0); // 0件のものは除外

  // チャート設定
  const chartConfig: ChartConfig = Object.entries(HINT_STATUS_CONFIG).reduce((config, [key, item]) => {
    config[key] = {
      label: item.label,
      color: item.color,
    };
    return config;
  }, {} as ChartConfig);

  if (entries.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-ink/60 ${className || ""}`}>
        表示する学びの記録がありません
      </div>
    );
  }

  return (
    <div className={className} data-testid="chart-hint-status-bar">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <BarChart data={hintStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="status" 
            tick={{ fontSize: 12 }}
            className="text-ink/70"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-ink/70"
          />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
            className="transition-all duration-200 hover:opacity-80"
          >
            {hintStatusData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill}
              />
            ))}
          </Bar>
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value, name, item) => [
                  `${value}件 (${item.payload.percentage}%)`,
                  item.payload.status
                ]}
              />
            }
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}