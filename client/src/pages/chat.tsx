import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { 
  type AIConversationResponse, 
  type AIFinalizationResponse, 
  type StartConversationInput, 
  type ContinueConversationInput 
} from "@shared/schema";
import ChatMessage from "../components/chat-message";
import LoadingIndicator from "../components/loading-indicator";
import { Sprout, ArrowRight, FileText, Home } from "lucide-react";

interface Message {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface SafetyError {
  error: string;
  message: string;
  resources?: string[];
}

export default function ChatScreen() {
  const [location, setLocation] = useLocation();
  // URLパラメータから初期テキストとゲストモードを取得
  const urlParams = new URLSearchParams(window.location.search);
  const initialTextFromUrl = urlParams.get('initialText') || '';
  const isGuestMode = urlParams.get('guest') === 'true';
  const [conversationState, setConversationState] = useState<'initial' | 'ongoing' | 'finalizing' | 'complete'>('initial');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [safetyError, setSafetyError] = useState<SafetyError | null>(null);
  const [conversationTurn, setConversationTurn] = useState(0);

  // 初期テキストの設定
  useEffect(() => {
    if (initialTextFromUrl && inputText === "") {
      setInputText(initialTextFromUrl);
      // URLをクリーンアップ（ゲストモードパラメータは保持）
      const cleanUrl = isGuestMode ? '/chat?guest=true' : '/chat';
      window.history.replaceState(null, '', cleanUrl);
    }
  }, [initialTextFromUrl, inputText, isGuestMode]);

  const startConversationMutation = useMutation({
    mutationFn: async (data: StartConversationInput) => {
      const endpoint = isGuestMode ? "/api/guest/conversation/start" : "/api/conversation/start";
      const response = await apiRequest("POST", endpoint, data);
      return response.json() as Promise<AIConversationResponse>;
    },
    onSuccess: (data) => {
      setSafetyError(null);
      setCurrentEntryId(data.entryId);
      
      // Add user message
      setMessages(prev => [...prev, 
        { type: 'user', content: inputText, timestamp: new Date().toISOString() }
      ]);
      
      // Add AI response message
      setMessages(prev => [...prev, 
        { type: 'ai', content: data.message, timestamp: new Date().toISOString() }
      ]);
      
      setConversationState('ongoing');
      setConversationTurn(1);
      setInputText("");
    },
    onError: (error: any) => {
      if (error.message.includes('safety_concern')) {
        try {
          const errorData = JSON.parse(error.message.split('400: ')[1]);
          setSafetyError(errorData);
        } catch {
          setSafetyError({
            error: 'safety_concern',
            message: '心配な内容が含まれています。専門の相談窓口にご相談ください。'
          });
        }
      }
    }
  });

  const continueConversationMutation = useMutation({
    mutationFn: async (data: ContinueConversationInput) => {
      const endpoint = isGuestMode ? "/api/guest/conversation/continue" : "/api/conversation/continue";
      const response = await apiRequest("POST", endpoint, data);
      return response.json() as Promise<AIConversationResponse>;
    },
    onSuccess: (data) => {
      setSafetyError(null);
      
      // Add user message
      setMessages(prev => [...prev, 
        { type: 'user', content: inputText, timestamp: new Date().toISOString() }
      ]);
      
      // Add AI response message
      setMessages(prev => [...prev, 
        { type: 'ai', content: data.message, timestamp: new Date().toISOString() }
      ]);
      
      setConversationTurn(prev => prev + 1);
      setInputText("");
    },
    onError: (error: any) => {
      if (error.message.includes('safety_concern')) {
        try {
          const errorData = JSON.parse(error.message.split('400: ')[1]);
          setSafetyError(errorData);
        } catch {
          setSafetyError({
            error: 'safety_concern',
            message: '心配な内容が含まれています。専門の相談窓口にご相談ください。'
          });
        }
      }
    }
  });

  const finalizeConversationMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const endpoint = isGuestMode ? "/api/guest/conversation/finalize" : "/api/conversation/finalize";
      const response = await apiRequest("POST", endpoint, { entryId });
      return response.json() as Promise<AIFinalizationResponse>;
    },
    onSuccess: (data) => {
      setSafetyError(null);
      
      // Add finalization message
      const finalContent = `**体験から得た学び**:\n${data.growth}${data.hint ? `\n\n**今後に活かせること**: ${data.hint}` : ''}`;
      
      setMessages(prev => [...prev, 
        { type: 'ai', content: finalContent, timestamp: new Date().toISOString() }
      ]);
      
      setConversationState('complete');
      
      // 2秒後に記録一覧ページに遷移
      console.log('学び生成完了 - ゲストモード:', isGuestMode);
      setTimeout(() => {
        const targetPath = isGuestMode ? "/growth?guest=true" : "/growth";
        const entryId = data.entryId;
        const fullPath = `${targetPath}#${entryId}`;
        console.log('記録一覧に遷移:', fullPath);
        setLocation(fullPath);
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Finalize error:", error);
    }
  });

  const handleStartConversation = () => {
    if (!inputText.trim()) return;
    startConversationMutation.mutate({ text: inputText });
  };

  const handleContinueConversation = () => {
    if (!inputText.trim() || !currentEntryId) return;
    continueConversationMutation.mutate({ 
      entryId: currentEntryId, 
      message: inputText 
    });
  };

  const handleFinalize = () => {
    if (!currentEntryId) return;
    setConversationState('finalizing');
    finalizeConversationMutation.mutate(currentEntryId);
  };

  const startNewConversation = () => {
    setConversationState('initial');
    setMessages([]);
    setInputText("");
    setCurrentEntryId(null);
    setSafetyError(null);
    setConversationTurn(0);
  };

  const isLoading = startConversationMutation.isPending || 
                   continueConversationMutation.isPending || 
                   finalizeConversationMutation.isPending;

  return (
    <div className="min-h-screen bg-sage">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-leaf/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-leaf rounded-full flex items-center justify-center">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-ink">FailSeed</h1>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-6">
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
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Card */}
        {messages.length === 0 && (
          <>
            {/* Start Conversation Card */}
            <Card className="rounded-3xl shadow-sm border-leaf/5 mb-6">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sprout className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-ink mb-4 text-center">体験を聞かせてください</h2>
                <p className="text-center text-ink/70 mb-6 leading-relaxed">
                  どんな小さなことでも大丈夫です。AIが温かく受け止めます。
                </p>
                
                {/* Chat Input */}
                <div>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full p-4 border-leaf/20 rounded-2xl focus:ring-leaf/30 focus:border-leaf/40 resize-none bg-sage/30 text-ink placeholder:text-ink/50"
                    rows={4}
                    placeholder="今日はどんなことがありましたか？"
                    disabled={isLoading}
                  />
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleStartConversation}
                      disabled={!inputText.trim() || isLoading}
                      className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
                    >
                      {isLoading ? <LoadingIndicator /> : <ArrowRight className="w-4 h-4 mr-2" />}
                      {isLoading ? "送信中..." : "話し始める"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Safety Error Alert */}
        {safetyError && (
          <Alert className="mb-6 border-destructive/20 bg-destructive/10">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{safetyError.message}</p>
                {safetyError.resources && (
                  <div className="text-sm">
                    <p className="font-medium">相談先:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {safetyError.resources.map((resource, index) => (
                        <li key={index}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="space-y-4 mb-6">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && <LoadingIndicator />}
          </div>
        )}

        {/* Input Section - Only for ongoing conversations */}
        {conversationState !== 'initial' && (
          <Card className="rounded-3xl shadow-sm border-leaf/5">
            <CardContent className="p-6">
              {conversationState === 'ongoing' && (
              <div>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full p-4 border-leaf/20 rounded-2xl focus:ring-leaf/30 focus:border-leaf/40 resize-none bg-sage/30 text-ink placeholder:text-ink/50"
                  rows={3}
                  placeholder="続けてお聞かせください..."
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center mt-4">
                  {conversationTurn >= 2 && (
                    <Button
                      onClick={handleFinalize}
                      variant="outline"
                      className="border-leaf/20 text-leaf hover:bg-leaf/10 rounded-2xl"
                      disabled={isLoading}
                    >
                      学びに変換する
                    </Button>
                  )}
                  <div className="flex space-x-3 ml-auto">
                    <Button
                      onClick={handleContinueConversation}
                      disabled={!inputText.trim() || isLoading}
                      className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
                    >
                      続ける
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {conversationState === 'finalizing' && (
              <div className="text-center">
                <div className="bg-soil/30 rounded-2xl p-6 mb-4">
                  <Sprout className="w-12 h-12 text-leaf mx-auto mb-3 animate-pulse" />
                  <p className="text-ink font-medium">お話から学びを抽出しています...</p>
                </div>
              </div>
            )}

            {conversationState === 'complete' && (
              <div className="text-center">
                <div className="bg-soil/30 rounded-2xl p-6 mb-4">
                  <FileText className="w-12 h-12 text-leaf mx-auto mb-3" />
                  <p className="text-ink font-medium">体験から学びを記録しました</p>
                </div>
                <Button
                  onClick={startNewConversation}
                  variant="outline"
                  className="border-leaf/20 text-ink hover:bg-soil/20 rounded-2xl"
                >
                  新しい対話を始める
                </Button>
              </div>
            )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
