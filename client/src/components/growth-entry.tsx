import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type Entry } from "@shared/schema";
import { Lightbulb, Trash2 } from "lucide-react";

interface GrowthEntryProps {
  entry: Entry;
  onHintAction: (entryId: string, action: 'tried' | 'skipped') => void;
  onDelete?: (entryId: string) => void;
  isUpdating: boolean;
  isDeleting?: boolean;
  isGuest?: boolean;
}

export default function GrowthEntry({ entry, onHintAction, onDelete, isUpdating, isDeleting = false, isGuest = false }: GrowthEntryProps) {
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
        return <Badge className="bg-leaf/20 text-leaf border-leaf/30">実践済み</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="border-ink/20 text-ink">見送り</Badge>;
      default:
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">未実践</Badge>;
    }
  };

  return (
    <Card className="bg-sage/20 rounded-xl sm:rounded-2xl border-leaf/10">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-leaf rounded-full flex-shrink-0"></div>
            <span className="text-ink/60 text-xs sm:text-sm truncate">{formatDate(entry.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="hint-status">
              {getHintStatusBadge(entry.hintStatus)}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600/70 hover:text-red-600 hover:bg-red-50 rounded-lg px-1 sm:px-2 h-7 sm:h-8"
                  disabled={isDeleting}
                  data-testid={`button-delete-${entry.id}`}
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl sm:rounded-3xl mx-4 sm:mx-0 max-w-sm sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm sm:text-base">記録を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm">
                    この記録を削除すると、復元することはできません。本当に削除してもよろしいですか？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <AlertDialogCancel className="rounded-xl sm:rounded-2xl text-xs sm:text-sm">キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete?.(entry.id)}
                    className="bg-red-600 hover:bg-red-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm"
                    data-testid={`button-confirm-delete-${entry.id}`}
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <div className="mb-3 sm:mb-4">
          <h3 className="text-ink font-medium mb-1 sm:mb-2 text-sm sm:text-base">育った部分</h3>
          <p className="text-ink/80 leading-relaxed whitespace-pre-line text-sm sm:text-base">
            {entry.aiGrowth}
          </p>
        </div>

        {entry.aiHint && (
          <Card className="bg-soil/20 border-0">
            <CardContent className="p-3 sm:p-4">
              {entry.hintStatus === 'tried' ? (
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-leaf rounded-sm flex items-center justify-center mt-0.5 flex-shrink-0">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-ink font-medium text-sm sm:text-base">体験から得た学び: </span>
                    <span className="text-ink/80 text-sm sm:text-base">{entry.aiHint}</span>
                  </div>
                </div>
              ) : entry.hintStatus === 'skipped' ? (
                <div className="text-ink/60 text-sm sm:text-base">
                  <span className="font-medium">見送り: </span>
                  <span>{entry.aiHint}</span>
                </div>
              ) : (
                <>
                  <h4 className="text-ink font-medium mb-2 flex items-center text-sm sm:text-base">
                    <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-leaf mr-1 sm:mr-2 flex-shrink-0" />
                    学びを実践してみる
                  </h4>
                  <p className="text-ink/70 mb-3 text-sm sm:text-base">{entry.aiHint}</p>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-leaf/10 text-leaf border-leaf/20 hover:bg-leaf/20 text-xs sm:text-sm w-full sm:w-auto"
                      onClick={() => onHintAction(entry.id, 'tried')}
                      disabled={isUpdating}
                    >
                      やってみた
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-ink/10 text-ink border-ink/20 hover:bg-ink/20 text-xs sm:text-sm w-full sm:w-auto"
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
