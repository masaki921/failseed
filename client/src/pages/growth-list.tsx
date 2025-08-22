import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { type Entry, type UpdateHint } from "@shared/schema";
import GrowthEntry from "../components/growth-entry";
import { Sprout, MessageCircle, Calendar, Home } from "lucide-react";

export default function GrowthList() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<Entry[]>({
    queryKey: ['/api/grows'],
  });

  const updateHintMutation = useMutation({
    mutationFn: async ({ id, hintStatus }: { id: string; hintStatus: UpdateHint["hintStatus"] }) => {
      const response = await apiRequest("PATCH", `/api/entry/${id}/hint`, { hintStatus });
      return response.json() as Promise<Entry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grows'] });
    }
  });

  const handleHintAction = (entryId: string, action: 'tried' | 'skipped') => {
    updateHintMutation.mutate({ id: entryId, hintStatus: action });
  };

  // URLハッシュで特定の記録にスクロール
  useEffect(() => {
    if (entries.length > 0) {
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
  }, [entries]);

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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-leaf/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
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
            <Link href="/calendar">
              <Button 
                variant="outline"
                className="text-ink border-leaf/20 hover:bg-soil/20 rounded-xl"
              >
                カレンダー
              </Button>
            </Link>
            <Button className="bg-leaf text-white hover:bg-leaf/90 rounded-xl">
              記録一覧
            </Button>
          </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card className="rounded-3xl shadow-sm border-leaf/5 mb-6">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-ink mb-2">あなたの振り返り記録</h2>
                <p className="text-ink/70">あなたが育てた気づきと学びたちです</p>
              </div>
              <div className="bg-soil/30 px-4 py-2 rounded-xl">
                <span className="text-ink font-medium">{entries.length}</span>
                <span className="text-ink/70 ml-1">個の成長</span>
              </div>
            </div>

            {entries.length > 0 ? (
              <div className="space-y-4">
                {(entries as Entry[]).map((entry) => (
                  <div key={entry.id} id={entry.id}>
                    <GrowthEntry 
                      entry={entry} 
                      onHintAction={handleHintAction}
                      isUpdating={updateHintMutation.isPending}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-soil/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-10 h-10 text-leaf/60" />
                </div>
                <h3 className="text-xl font-medium text-ink mb-2">まだ成長の記録がありません</h3>
                <p className="text-ink/60 mb-6">対話を通じて、最初の成長を記録してみませんか？</p>
                <Link href="/">
                  <Button 
                    className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    対話する
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
