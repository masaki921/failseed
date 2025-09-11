import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { type Entry, LEARNING_CATEGORIES } from "@shared/schema";

interface CategoryPieChartProps {
  entries: Entry[];
  className?: string;
}

// カテゴリー別の色設定
const CATEGORY_COLORS = {
  "技術・スキル": "#8B5CF6",      // purple
  "人間関係": "#EC4899",           // pink
  "目標・計画": "#3B82F6",         // blue
  "失敗・挫折": "#EF4444",         // red
  "成功・達成": "#10B981",         // green
  "健康・メンタル": "#F59E0B",     // amber
  "仕事・キャリア": "#6366F1",     // indigo
  "学習・成長": "#06B6D4",         // cyan
  "創造・アイデア": "#F97316",     // orange
  "その他": "#6B7280",             // gray
};

export function CategoryPieChart({ entries, className }: CategoryPieChartProps) {
  // カテゴリー別にエントリを集計
  const categoryData = LEARNING_CATEGORIES.reduce((acc, category) => {
    const count = entries.filter(entry => (entry.category || "その他") === category).length;
    if (count > 0) {
      acc.push({
        category,
        count,
        percentage: Math.round((count / entries.length) * 100),
      });
    }
    return acc;
  }, [] as Array<{ category: string; count: number; percentage: number }>);

  // チャート設定
  const chartConfig: ChartConfig = categoryData.reduce((config, item) => {
    config[item.category] = {
      label: item.category,
      color: CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS],
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
    <div className={className} data-testid="chart-category-pie">
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={30}
            paddingAngle={2}
            dataKey="count"
            nameKey="category"
          >
            {categoryData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]}
              />
            ))}
          </Pie>
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value, name, item) => [
                  `${value}件 (${item.payload.percentage}%)`,
                  name as string
                ]}
              />
            }
          />
          <ChartLegend 
            content={<ChartLegendContent />}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}