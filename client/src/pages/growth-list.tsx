import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { type Entry, type UpdateHint } from "@shared/schema";
import GrowthEntry from "../components/growth-entry";
import { Sprout, MessageCircle, List, Calendar, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

export default function GrowthList() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // URLパラメータからゲストモードを判定
  const isGuestMode = new URLSearchParams(window.location.search).get('guest') === 'true';
  const [guestEntries, setGuestEntries] = useState<Entry[]>([]);

  // 認証されていない場合はログインページにリダイレクト（ゲストモード以外）
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuestMode) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, isGuestMode, setLocation]);

  // ゲストモードでセッションから記録を取得
  useEffect(() => {
    if (isGuestMode) {
      fetch('/api/guest/entries')
        .then(res => res.json())
        .then(data => {
          console.log('Fetched guest entries:', data);
          setGuestEntries(data);
        })
        .catch(err => console.error('Failed to fetch guest entries:', err));
    }
  }, [isGuestMode]);

  // URLハッシュで記録IDが指定されている場合は再取得（学び生成後のリダイレクト用）
  useEffect(() => {
    if (isGuestMode && window.location.hash) {
      // ハッシュがある場合は学び生成後の可能性があるので再取得
      setTimeout(() => {
        fetch('/api/guest/entries')
          .then(res => res.json())
          .then(data => {
            console.log('Refreshed guest entries:', data);
            setGuestEntries(data);
          })
          .catch(err => console.error('Failed to refresh guest entries:', err));
      }, 500); // 少し遅延させてセッション保存を待つ
    }
  }, [isGuestMode]);

  const { data: entries = [], isLoading: isEntriesLoading } = useQuery<Entry[]>({
    queryKey: ['/api/grows'],
    enabled: !isGuestMode, // ゲストモードではAPIクエリを無効化
  });

  // 表示用のエントリーリスト（ゲストモードかどうかで切り替え）
  const displayEntries = isGuestMode ? guestEntries : entries;

  const updateHintMutation = useMutation({
    mutationFn: async ({ id, hintStatus }: { id: string; hintStatus: UpdateHint["hintStatus"] }) => {
      const response = await apiRequest("PATCH", `/api/entry/${id}/hint`, { hintStatus });
      return response.json() as Promise<Entry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grows'] });
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/entry/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grows'] });
    }
  });

  const handleHintAction = (entryId: string, action: 'tried' | 'skipped') => {
    updateHintMutation.mutate({ id: entryId, hintStatus: action });
  };

  const handleDeleteEntry = (entryId: string) => {
    deleteEntryMutation.mutate(entryId);
  };

  // URLハッシュで特定の記録にスクロール
  useEffect(() => {
    if (displayEntries.length > 0) {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // ハイライト効果を追加
          element.classList.add('ring-2', 'ring-leaf', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-leaf', 'ring-opacity-50');
          }, 3000);
        }
      }
    }
  }, [displayEntries]);

  // カレンダー用のナビゲーション関数
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

  // カレンダー用のデータ処理
  const days = getCalendarDays(currentDate);
  const entriesByDate = displayEntries.reduce((acc, entry) => {
    const entryDate = new Date(entry.createdAt);
    const dateKey = formatDate(entryDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);

  // コンテンツのレンダリング関数
  const renderContent = () => {
    if (displayEntries.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-soil/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-10 h-10 text-leaf/60" />
          </div>
          <h3 className="text-xl font-medium text-ink mb-2">まだ成長の記録がありません</h3>
          <p className="text-ink/60 mb-6">対話を通じて、最初の成長を記録してみませんか？</p>
          <Link href={isGuestMode ? "/?guest=true" : "/"}>
            <Button 
              className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              対話する
            </Button>
          </Link>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="space-y-4">
          {(displayEntries as Entry[]).map((entry) => (
            <div key={entry.id} id={entry.id}>
              <GrowthEntry 
                entry={entry} 
                onHintAction={isGuestMode ? () => {} : handleHintAction}
                onDelete={isGuestMode ? undefined : handleDeleteEntry}
                isUpdating={updateHintMutation.isPending}
                isDeleting={deleteEntryMutation.isPending}
                isGuest={isGuestMode}
              />
            </div>
          ))}
        </div>
      );
    }

    // カレンダービュー
    return (
      <div>
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Button
            variant="outline"
            onClick={() => navigateMonth('prev')}
            className="border-leaf/30 hover:bg-leaf/10 rounded-2xl px-2 md:px-3"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h2 className="text-lg md:text-2xl font-bold text-ink">
            {formatDate(currentDate, 'yyyy年 MMMM')}
          </h2>
          
          <Button
            variant="outline"
            onClick={() => navigateMonth('next')}
            className="border-leaf/30 hover:bg-leaf/10 rounded-2xl px-2 md:px-3"
            size="sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* カレンダーグリッド */}
        <Card className="bg-white border-leaf/20 shadow-lg rounded-3xl">
          <CardContent className="p-3 md:p-6">
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
                const dateKey = formatDate(day, 'yyyy-MM-dd');
                const dayEntries = entriesByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[80px] md:min-h-[120px] p-1 md:p-2 border rounded-lg relative ${
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
                      {formatDate(day, 'd')}
                    </div>

                    {/* エントリ表示 */}
                    <div className="mt-1 space-y-1">
                      {dayEntries.slice(0, 3).map((entry, index) => (
                        <div
                          key={entry.id}
                          className="text-xs p-1 bg-leaf/20 text-leaf rounded truncate cursor-pointer hover:bg-leaf/30 transition-colors break-all"
                          title={entry.text}
                          onClick={() => {
                            setViewMode('list');
                            setTimeout(() => {
                              const element = document.getElementById(entry.id);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                element.classList.add('ring-2', 'ring-leaf', 'ring-opacity-50');
                                setTimeout(() => {
                                  element.classList.remove('ring-2', 'ring-leaf', 'ring-opacity-50');
                                }, 3000);
                              }
                            }, 100);
                          }}
                        >
                          {entry.text.length > 8
                            ? entry.text.slice(0, 8) + "..."
                            : entry.text}
                        </div>
                      ))}
                      {dayEntries.length > 3 && (
                        <div className="text-xs text-ink/60 font-medium">
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
    );
  };

  // ローディング中（ゲストモードでは認証チェックをスキップ）
  if (isLoading || (!isGuestMode && isEntriesLoading)) {
    return (
      <div className="min-h-screen bg-sage flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-leaf/20 border-t-leaf rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink/60">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合はリダイレクト処理中なので何も表示しない（ゲストモードは除く）
  if (!isAuthenticated && !isGuestMode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-sage">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-leaf/10 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
          <Link href={isGuestMode ? "/?guest=true" : "/"}>
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center">
                <Sprout className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-ink">FailSeed</h1>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <Button className="bg-leaf text-white hover:bg-leaf/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm px-2 sm:px-3" size="sm">
              <span className="hidden sm:inline">記録一覧</span>
              <span className="sm:hidden">記録</span>
            </Button>
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                className="text-ink/70 hover:text-ink hover:bg-soil/20 rounded-xl sm:rounded-2xl text-xs sm:text-sm px-1 sm:px-2"
                size="sm"
                onClick={() => logout()}
                disabled={false}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline ml-1">ログアウト</span>
              </Button>
            )}
          </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4 md:px-4 md:py-6">
        <Card className="rounded-2xl sm:rounded-3xl shadow-sm border-leaf/5 mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 sm:mb-6">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-ink mb-1 md:mb-2 break-words">あなたの振り返り記録</h2>
                <p className="text-xs sm:text-sm md:text-base text-ink/70 break-words">あなたが育てた気づきと学びたちです</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
                <div className="bg-soil/30 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-center sm:text-left">
                  <span className="text-sm sm:text-base text-ink font-medium">{displayEntries.length}</span>
                  <span className="text-xs sm:text-sm text-ink/70 ml-1">個の成長</span>
                </div>
                <div className="flex items-center bg-white/50 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-leaf/10">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-md sm:rounded-lg px-1.5 sm:px-2 md:px-3 flex-1 ${viewMode === 'list' ? 'bg-leaf text-white hover:bg-leaf/90' : 'text-ink/70 hover:text-ink hover:bg-leaf/10'}`}
                  >
                    <List className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                    <span className="text-xs sm:text-sm">リスト</span>
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className={`rounded-md sm:rounded-lg px-1.5 sm:px-2 md:px-3 flex-1 ${viewMode === 'calendar' ? 'bg-leaf text-white hover:bg-leaf/90' : 'text-ink/70 hover:text-ink hover:bg-leaf/10'}`}
                  >
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                    <span className="text-xs sm:text-sm">カレンダー</span>
                  </Button>
                </div>
              </div>
            </div>

            {renderContent()}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
