import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Entry } from "@shared/schema";
import { Lightbulb } from "lucide-react";

interface GrowthEntryProps {
  entry: Entry;
  onHintAction: (entryId: string, action: 'tried' | 'skipped') => void;
  isUpdating: boolean;
}

export default function GrowthEntry({ entry, onHintAction, isUpdating }: GrowthEntryProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHintStatusBadge = (status: string) => {
    switch (status) {
      case 'tried':
        return <Badge className="bg-blossom/20 text-blossom border-blossom/30">実践済み 🌸</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="border-ink/20 text-ink">見送り</Badge>;
      default:
        return <Badge className="bg-sunlight/20 text-sunlight border-sunlight/40">未実践 🌱</Badge>;
    }
  };

  return (
    <Card className="bg-white/70 rounded-2xl border-sprout/15 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 gradient-growth rounded-full"></div>
            <span className="text-ink/60 text-sm">{formatDate(entry.createdAt)}</span>
          </div>
          <div className="hint-status">
            {getHintStatusBadge(entry.hintStatus)}
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-ink font-medium mb-2 flex items-center">
            <span className="mr-2">🌿</span>
            育った部分
          </h3>
          <p className="text-ink/80 leading-relaxed whitespace-pre-line">
            {entry.aiGrowth}
          </p>
        </div>

        {entry.aiHint && (
          <Card className="bg-earth/10 border border-earth/20 rounded-xl">
            <CardContent className="p-4">
              {entry.hintStatus === 'tried' ? (
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-blossom rounded-sm flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-sage" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-ink font-medium">体験から得た学び: </span>
                    <span className="text-ink/80">{entry.aiHint}</span>
                  </div>
                </div>
              ) : entry.hintStatus === 'skipped' ? (
                <div className="text-ink/60">
                  <span className="font-medium">見送り: </span>
                  <span>{entry.aiHint}</span>
                </div>
              ) : (
                <>
                  <h4 className="text-ink font-medium mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 text-sunlight mr-2" />
                    学びを実践してみる
                  </h4>
                  <p className="text-ink/70 mb-3">{entry.aiHint}</p>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-blossom/10 text-blossom border-blossom/20 hover:bg-blossom/20"
                      onClick={() => onHintAction(entry.id, 'tried')}
                      disabled={isUpdating}
                    >
                      やってみた 🌸
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-ink/5 text-ink border-ink/20 hover:bg-ink/10"
                      onClick={() => onHintAction(entry.id, 'skipped')}
                      disabled={isUpdating}
                    >
                      見送る
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
