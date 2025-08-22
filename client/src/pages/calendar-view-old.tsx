import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface GrowthEntry {
  id: string;
  originalMessage: string;
  growth: string;
  hint: string;
  createdAt: string;
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: entries = [], isLoading } = useQuery<GrowthEntry[]>({
    queryKey: ["/api/grows"],
  });

  // 現在の月の日付を取得
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 日付ごとのエントリをグループ化
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = format(parseISO(entry.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, GrowthEntry[]>);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-sage">
      {/* ヘッダー */}
      <div className="border-b border-leaf/10 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-ink">FailSeed</h1>
              </div>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="text-ink border-leaf/20 hover:bg-soil/20 rounded-xl"
                >
                  ホーム
                </Button>
              </Link>
              <Link href="/growth">
                <Button 
                  variant="outline"
                  className="text-ink border-leaf/20 hover:bg-soil/20 rounded-xl"
                >
                  記録一覧
                </Button>
              </Link>
              <Button className="bg-leaf text-white hover:bg-leaf/90 rounded-xl">
                カレンダー
              </Button>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigateMonth('prev')}
            className="border-leaf/30 hover:bg-leaf/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h2 className="text-2xl font-bold text-ink">
            {format(currentDate, 'yyyy年 MMMM', { locale: ja })}
          </h2>
          
          <Button
            variant="outline"
            onClick={() => navigateMonth('next')}
            className="border-leaf/30 hover:bg-leaf/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* カレンダーグリッド */}
        <Card className="bg-white border-leaf/20 shadow-lg rounded-3xl">
          <CardContent className="p-6">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium p-2 ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-ink'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* カレンダー日付 */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEntries = entriesByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] p-2 border rounded-lg relative ${
                      isCurrentMonth
                        ? isDayToday
                          ? 'bg-leaf/10 border-leaf/30'
                          : dayEntries.length > 0
                          ? 'bg-leaf/5 border-leaf/20 hover:bg-leaf/10'
                          : 'bg-white border-leaf/10 hover:bg-leaf/5'
                        : 'bg-gray-50 border-gray-200'
                    } ${dayEntries.length > 0 ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`text-sm font-medium ${
                      isCurrentMonth
                        ? isDayToday
                          ? 'text-ink'
                          : 'text-ink/70'
                        : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </div>

                    {/* エントリ表示 */}
                    <div className="mt-1 space-y-1">
                      {dayEntries.slice(0, 3).map((entry, index) => (
                        <div
                          key={entry.id}
                          className="text-xs p-1 bg-leaf/20 text-leaf rounded truncate cursor-pointer hover:bg-leaf/30 transition-colors"
                          title={entry.originalMessage}
                          onClick={() => window.location.href = `/growth#${entry.id}`}
                        >
                          {entry.originalMessage.length > 12 
                            ? entry.originalMessage.slice(0, 12) + "..." 
                            : entry.originalMessage}
                        </div>
                      ))}
                      {dayEntries.length > 3 && (
                        <div className="text-xs text-ink/60 font-medium">
                          +{dayEntries.length - 3}件
                        </div>
                      )}
                    </div>

                    {/* エントリ数バッジ */}
                    {dayEntries.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1.5 py-0.5"
                      >
                        {dayEntries.length}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 統計情報 */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="bg-white border-sage-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-sage-800">{entries.length}</div>
              <div className="text-sm text-sage-600">総成長記録</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-sage-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(entriesByDate).length}
              </div>
              <div className="text-sm text-sage-600">記録した日数</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-sage-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {format(currentDate, 'MMMM', { locale: ja })}
              </div>
              <div className="text-sm text-sage-600">表示中の月</div>
            </CardContent>
          </Card>
        </div>

        {/* 今月のエントリがある場合の詳細表示 */}
        {Object.keys(entriesByDate).length > 0 && (
          <Card className="mt-8 bg-white border-sage-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-sage-800 mb-4">今月の成長記録</h3>
              <div className="space-y-4">
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="border-l-4 border-sage-400 pl-4">
                    <div className="text-sm text-sage-600 mb-1">
                      {format(parseISO(entry.createdAt), 'MM月dd日 (E)', { locale: ja })}
                    </div>
                    <div className="font-medium text-sage-800 mb-1">{entry.growth}</div>
                    <div className="text-sm text-sage-600">{entry.hint}</div>
                  </div>
                ))}
                {entries.length > 5 && (
                  <Link href="/growth">
                    <Button variant="outline" className="w-full mt-4">
                      すべての記録を見る ({entries.length}件)
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}