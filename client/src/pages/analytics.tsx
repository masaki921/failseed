import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Entry } from "@shared/schema";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { HintStatusBarChart } from "@/components/charts/hint-status-bar-chart";
import { GrowthTimelineChart } from "@/components/charts/growth-timeline-chart";
import { AnalyticsOverview } from "@/components/charts/analytics-overview";
import { BarChart3, PieChart, TrendingUp, Home, List, ArrowLeft } from "lucide-react";

export default function Analytics() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
  const fetchGuestEntries = async () => {
    if (!isGuestMode) return;
    
    try {
      const response = await fetch('/api/guest/entries');
      const data = await response.json();
      setGuestEntries(data);
    } catch (err) {
      console.error('ゲストエントリー取得エラー:', err);
    }
  };

  useEffect(() => {
    fetchGuestEntries();
  }, [isGuestMode]);

  const { data: entries = [], isLoading: isEntriesLoading } = useQuery<Entry[]>({
    queryKey: ['/api/grows'],
    enabled: !isGuestMode, // ゲストモードではAPIクエリを無効化
  });

  // 表示用のエントリーリスト（ゲストモードかどうかで切り替え）
  const displayEntries = isGuestMode ? guestEntries : entries;

  if (isLoading || (!isGuestMode && isEntriesLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sage">
        <div className="text-ink/60">読み込み中...</div>
      </div>
    );
  }

  const renderContent = () => {
    if (displayEntries.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-soil/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-leaf/60" />
          </div>
          <h3 className="text-xl font-medium text-ink mb-2">まだ学習データがありません</h3>
          <p className="text-ink/60 mb-6">対話を通じて学習記録を作成すると、ここに分析結果が表示されます</p>
          <Link href={isGuestMode ? "/?guest=true" : "/"}>
            <Button 
              className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
              data-testid="button-start-conversation"
            >
              対話を始める
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 概要統計 */}
        <AnalyticsOverview entries={displayEntries} />
        
        {/* チャートタブ */}
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white rounded-xl border border-leaf/20">
            <TabsTrigger 
              value="categories" 
              className="rounded-lg data-[state=active]:bg-leaf data-[state=active]:text-white"
              data-testid="tab-categories"
            >
              <PieChart className="w-4 h-4 mr-2" />
              カテゴリー分析
            </TabsTrigger>
            <TabsTrigger 
              value="hint-status" 
              className="rounded-lg data-[state=active]:bg-leaf data-[state=active]:text-white"
              data-testid="tab-hint-status"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              実践状況
            </TabsTrigger>
            <TabsTrigger 
              value="timeline" 
              className="rounded-lg data-[state=active]:bg-leaf data-[state=active]:text-white"
              data-testid="tab-timeline"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              成長推移
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="mt-6">
            <Card className="bg-white border-leaf/20 rounded-xl">
              <CardHeader>
                <CardTitle className="text-ink flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-leaf" />
                  学習カテゴリー別分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryPieChart entries={displayEntries} />
                <p className="text-sm text-ink/60 mt-4">
                  AIが自動的に学習内容を分析してカテゴリー分類しています。各分野での学習バランスを確認できます。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hint-status" className="mt-6">
            <Card className="bg-white border-leaf/20 rounded-xl">
              <CardHeader>
                <CardTitle className="text-ink flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-leaf" />
                  学びの実践状況
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HintStatusBarChart entries={displayEntries} />
                <p className="text-sm text-ink/60 mt-4">
                  AIが提案した学びを実際に実践しているかの状況です。実践率を高めることで、より効果的な成長につながります。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-6">
            <Card className="bg-white border-leaf/20 rounded-xl">
              <CardHeader>
                <CardTitle className="text-ink flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-leaf" />
                  月別成長推移
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GrowthTimelineChart entries={displayEntries} />
                <p className="text-sm text-ink/60 mt-4">
                  毎月の学習記録数と累積の成長を可視化しています。継続的な学習の効果を確認できます。
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sage">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
              学習分析ダッシュボード
            </h1>
            <p className="text-ink/60 text-sm sm:text-base">
              AIが自動分類した学習データを可視化して、成長パターンを把握できます
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={isGuestMode ? "/growth?guest=true" : "/growth"}>
              <Button 
                variant="outline" 
                className="border-leaf/30 text-leaf hover:bg-leaf/10 rounded-2xl"
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                記録一覧
              </Button>
            </Link>
            <Link href={isGuestMode ? "/?guest=true" : "/"}>
              <Button 
                variant="outline" 
                className="border-leaf/30 text-leaf hover:bg-leaf/10 rounded-2xl"
                data-testid="button-home"
              >
                <Home className="w-4 h-4 mr-2" />
                ホーム
              </Button>
            </Link>
          </div>
        </div>

        {/* メインコンテンツ */}
        {renderContent()}
      </div>
    </div>
  );
}