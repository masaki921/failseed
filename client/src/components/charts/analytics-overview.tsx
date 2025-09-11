import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Entry } from "@shared/schema";
import { Sprout, BookOpen, Target, TrendingUp } from "lucide-react";

interface AnalyticsOverviewProps {
  entries: Entry[];
  className?: string;
}

export function AnalyticsOverview({ entries, className }: AnalyticsOverviewProps) {
  // 統計データを計算
  const totalEntries = entries.length;
  const triedHints = entries.filter(entry => entry.hintStatus === "tried").length;
  const recentEntries = entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return entryDate >= thirtyDaysAgo;
  }).length;
  
  // カテゴリー別の統計
  const categoryStats = entries.reduce((acc, entry) => {
    const category = entry.category || "その他";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostPopularCategory = Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "なし";

  const actionRate = totalEntries > 0 ? Math.round((triedHints / totalEntries) * 100) : 0;

  const statsCards = [
    {
      title: "総記録数",
      value: totalEntries,
      icon: BookOpen,
      description: "これまでの学びの記録",
      color: "text-blue-600"
    },
    {
      title: "実行率",
      value: `${actionRate}%`,
      icon: Target,
      description: "ヒントを実行した割合",
      color: "text-green-600"
    },
    {
      title: "今月の記録",
      value: recentEntries,
      icon: TrendingUp,
      description: "過去30日間の新しい記録",
      color: "text-purple-600"
    },
    {
      title: "人気カテゴリー",
      value: mostPopularCategory,
      icon: Sprout,
      description: "最も記録の多いカテゴリー",
      color: "text-orange-600"
    }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className || ""}`} data-testid="analytics-overview">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white border-leaf/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-ink/70">
                {stat.title}
              </CardTitle>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div 
                className="text-2xl font-bold text-ink"
                data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {typeof stat.value === 'string' && stat.value.length > 8 
                  ? stat.value.slice(0, 8) + '...' 
                  : stat.value}
              </div>
              <p className="text-xs text-ink/60 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}