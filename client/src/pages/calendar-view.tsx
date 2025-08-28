import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Sprout } from "lucide-react";

interface GrowthEntry {
  id: string;
  originalMessage: string;
  growth: string;
  hint: string;
  createdAt: string;
}

// Simple date utilities
const formatDate = (date: Date, formatStr: string) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  if (formatStr === 'yyyy年 MMMM') {
    return `${year}年 ${monthNames[month]}`;
  }
  if (formatStr === 'd') {
    return day.toString();
  }
  if (formatStr === 'yyyy-MM-dd') {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return date.toISOString();
};

const isSameMonth = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const getCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days: Date[] = [];
  const current = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: entries = [], isLoading } = useQuery<GrowthEntry[]>({
    queryKey: ["/api/grows"],
  });

  // Get calendar days for the current month
  const days = getCalendarDays(currentDate);

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const entryDate = new Date(entry.createdAt);
    const dateKey = formatDate(entryDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sage flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-leaf/20 border-t-leaf rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink/60">読み込み中...</p>
        </div>
      </div>
    );
  }

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
              <Link href="/growth">
                <Button 
                  variant="outline"
                  className="text-ink border-leaf/20 hover:bg-soil/20 rounded-2xl"
                >
                  記録一覧
                </Button>
              </Link>
              <Button className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl">
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
            {formatDate(currentDate, 'yyyy年 MMMM')}
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
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {days.map((day) => {
                const dateKey = formatDate(day, 'yyyy-MM-dd');
                const dayEntries = entriesByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square sm:h-[120px] p-2 border rounded-lg relative overflow-hidden ${
                      isCurrentMonth
                        ? isDayToday
                          ? 'bg-leaf/10 border-leaf/30'
                          : dayEntries.length > 0
                          ? 'bg-leaf/5 border-leaf/20 hover:bg-leaf/10'
                          : 'bg-white border-leaf/10 hover:bg-leaf/5'
                        : 'bg-gray-50 border-gray-200'
                    } ${dayEntries.length > 0 ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`text-xs sm:text-sm font-medium ${
                      isCurrentMonth
                        ? isDayToday
                          ? 'text-ink'
                          : 'text-ink/70'
                        : 'text-gray-400'
                    }`}>
                      {formatDate(day, 'd')}
                    </div>

                    {/* エントリ表示 */}
                    <div className="mt-1 space-y-0.5 sm:space-y-1">
                      {dayEntries.slice(0, 3).map((entry, index) => (
                        <div
                          key={entry.id}
                          className="text-sm font-medium p-1 bg-leaf/20 text-leaf rounded cursor-pointer hover:bg-leaf/30 transition-colors mb-1 block"
                          title={entry.originalMessage}
                          onClick={() => window.location.href = `/growth#${entry.id}`}
                        >
                          <div className="h-10 overflow-hidden leading-tight text-xs">
                            {entry.originalMessage.length > 25 
                              ? entry.originalMessage.slice(0, 25) + "..." 
                              : entry.originalMessage}
                          </div>
                        </div>
                      ))}
                      {dayEntries.length > 3 && (
                        <div className="text-xs text-ink/60 font-medium mt-0.5">
                          +{dayEntries.length - 3}件
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}