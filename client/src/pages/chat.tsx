import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { type AIStep1Response, type AIStep2Response, type Step1Input, type Step2Input } from "@shared/schema";
import ChatMessage from "../components/chat-message";
import LoadingIndicator from "../components/loading-indicator";
import { Sprout, ArrowRight, FileText } from "lucide-react";

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  isStep1?: boolean;
  isStep2?: boolean;
}

interface SafetyError {
  error: string;
  message: string;
  resources?: string[];
}

export default function ChatScreen() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 'complete'>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [eventText, setEventText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [safetyError, setSafetyError] = useState<SafetyError | null>(null);

  const step1Mutation = useMutation({
    mutationFn: async (data: Step1Input) => {
      const response = await apiRequest("POST", "/api/entry/step1", data);
      return response.json() as Promise<AIStep1Response>;
    },
    onSuccess: (data) => {
      setSafetyError(null);
      setCurrentEntryId(data.entryId);
      
      // Add AI response message
      const aiContent = data.question 
        ? `**受けとめ**: ${data.comfort}\n\n**質問**: ${data.question}`
        : `**受けとめ**: ${data.comfort}`;
      
      setMessages(prev => [...prev, { type: 'ai', content: aiContent, isStep1: true }]);
      setCurrentStep(2);
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

  const step2Mutation = useMutation({
    mutationFn: async (data: Step2Input) => {
      const response = await apiRequest("POST", "/api/entry/step2", data);
      return response.json() as Promise<AIStep2Response>;
    },
    onSuccess: (data) => {
      setSafetyError(null);
      
      // Add AI response message
      const aiContent = `**受けとめ**: ${data.comfort}\n\n**育った部分**:\n${data.growth}${data.hint ? `\n\n**芽を伸ばすヒント**: ${data.hint}` : ''}`;
      
      setMessages(prev => [...prev, { type: 'ai', content: aiContent, isStep2: true }]);
      setCurrentStep('complete');
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

  const handleStep1Submit = () => {
    if (!eventText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: eventText }]);
    
    // Submit to API
    step1Mutation.mutate({ text: eventText });
    
    // Clear input
    setEventText("");
  };

  const handleStep2Submit = () => {
    if (!currentEntryId) return;

    // Add user message if there's detail text
    if (detailText.trim()) {
      setMessages(prev => [...prev, { type: 'user', content: detailText }]);
    }
    
    // Submit to API
    step2Mutation.mutate({ 
      entryId: currentEntryId, 
      detailText: detailText.trim() || undefined 
    });
    
    // Clear input
    setDetailText("");
  };

  const startNewConversation = () => {
    setCurrentStep(1);
    setMessages([]);
    setEventText("");
    setDetailText("");
    setCurrentEntryId(null);
    setSafetyError(null);
  };

  const isLoading = step1Mutation.isPending || step2Mutation.isPending;

  return (
    <div className="min-h-screen bg-sage">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-leaf/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-leaf rounded-full flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink">FailSeed</h1>
          </div>
          
          <nav className="flex items-center space-x-6">
            <Button className="bg-leaf text-white hover:bg-leaf/90 rounded-xl">
              対話
            </Button>
            <Button 
              variant="outline" 
              className="text-ink border-leaf/20 hover:bg-soil/20 rounded-xl"
              onClick={() => setLocation('/growth')}
            >
              成長記録
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Card */}
        {messages.length === 0 && (
          <Card className="rounded-3xl shadow-sm border-leaf/5 mb-6">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-ink mb-3">今日はどんな一日でしたか？</h2>
              <p className="text-ink/70 text-lg leading-relaxed">
                どんな小さな出来事でも大丈夫です。<br />
                一緒に成長の芽を見つけてみましょう。
              </p>
            </CardContent>
          </Card>
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

        {/* Input Section */}
        <Card className="rounded-3xl shadow-sm border-leaf/5">
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div>
                <label className="block text-ink font-medium mb-3">出来事を教えてください</label>
                <Textarea
                  value={eventText}
                  onChange={(e) => setEventText(e.target.value)}
                  className="w-full p-4 border-leaf/20 rounded-2xl focus:ring-leaf/30 focus:border-leaf/40 resize-none bg-sage/30 text-ink placeholder:text-ink/50"
                  rows={4}
                  placeholder="今日起きたことを、短くても構いませんので教えてください..."
                  disabled={isLoading}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleStep1Submit}
                    disabled={!eventText.trim() || isLoading}
                    className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
                  >
                    送信する
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <label className="block text-ink font-medium mb-3">もう少し詳しく教えてください</label>
                <Textarea
                  value={detailText}
                  onChange={(e) => setDetailText(e.target.value)}
                  className="w-full p-4 border-leaf/20 rounded-2xl focus:ring-leaf/30 focus:border-leaf/40 resize-none bg-sage/30 text-ink placeholder:text-ink/50"
                  rows={3}
                  placeholder="追加で教えていただけることがあれば..."
                  disabled={isLoading}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleStep2Submit}
                    disabled={isLoading}
                    className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
                  >
                    送信する
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="text-center">
                <div className="bg-soil/30 rounded-2xl p-6 mb-4">
                  <FileText className="w-12 h-12 text-leaf mx-auto mb-3" />
                  <p className="text-ink font-medium">成長の記録が保存されました</p>
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
      </main>
    </div>
  );
}
