import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  Lightbulb, 
  Target, 
  Sprout, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight
} from "lucide-react";

const onboardingSteps = [
  {
    id: 1,
    title: "FailSeedへようこそ",
    subtitle: "あなたの体験を成長の種に変えるアプリです",
    content: (
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-6">
          <Sprout className="w-12 h-12 text-white" />
        </div>
        <p className="text-lg text-ink/80 mb-6 leading-relaxed">
          温かいAIパートナーとの対話を通じて、
          <br className="hidden sm:block" />
          うまくいかなかった体験を学びに変換します。
        </p>
        <div className="bg-sage/30 p-4 rounded-2xl">
          <div className="flex items-center justify-center space-x-2 text-ink/70">
            <MessageCircle className="w-5 h-5" />
            <span>対話</span>
            <span>→</span>
            <Lightbulb className="w-5 h-5" />
            <span>学び</span>
            <span>→</span>
            <Target className="w-5 h-5" />
            <span>成長</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "AIパートナーとの対話",
    subtitle: "温かいAIパートナーがあなたの体験を聞きます",
    content: (
      <div className="text-center">
        <div className="w-20 h-20 bg-leaf/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-leaf" />
        </div>
        <p className="text-lg text-ink/80 mb-6 leading-relaxed">
          AIパートナーは、あなたの体験を批判することなく、
          <br className="hidden sm:block" />
          温かく受け止めながら自然な対話を行います。
        </p>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-leaf/10 text-left">
            <p className="text-sm text-ink/70 mb-2">AI:</p>
            <p className="text-ink">「お疲れさまでした。どんな体験でしたか？」</p>
          </div>
          <div className="bg-leaf/10 p-4 rounded-2xl text-right">
            <p className="text-sm text-ink/70 mb-2">あなた:</p>
            <p className="text-ink">「プレゼンテーションがうまくいかなくて...」</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "学びの発見",
    subtitle: "AIが対話から価値ある気づきを抽出します",
    content: (
      <div className="text-center">
        <div className="w-20 h-20 bg-leaf/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lightbulb className="w-10 h-10 text-leaf" />
        </div>
        <p className="text-lg text-ink/80 mb-6 leading-relaxed">
          対話を通じて体験の背景や原因が見えてきたら、
          <br className="hidden sm:block" />
          AIが学びを抽出してくれます。
        </p>
        <div className="bg-leaf/10 p-6 rounded-2xl">
          <div className="text-left space-y-3">
            <div>
              <h4 className="font-medium text-ink mb-2">📝 今回の学び</h4>
              <p className="text-sm text-ink/80">
                準備に時間をかけすぎて、リハーサルの時間が足りませんでした。
                次回は全体のスケジュール管理を改善しましょう。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-ink mb-2">💡 具体的なヒント</h4>
              <p className="text-sm text-ink/80">
                プレゼン準備は「資料作成」と「発表練習」に分けて、
                両方に十分な時間を確保することをお勧めします。
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "成長の記録",
    subtitle: "あなたの学びを蓄積して継続的な成長をサポート",
    content: (
      <div className="text-center">
        <div className="w-20 h-20 bg-leaf/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-leaf" />
        </div>
        <p className="text-lg text-ink/80 mb-6 leading-relaxed">
          抽出された学びは記録として保存され、
          <br className="hidden sm:block" />
          いつでも振り返ることができます。
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-leaf/10">
            <h4 className="font-medium text-ink mb-2">📊 記録一覧</h4>
            <p className="text-sm text-ink/70">
              リスト形式やカレンダー形式で
              過去の学びを閲覧できます
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-leaf/10">
            <h4 className="font-medium text-ink mb-2">🎯 継続的成長</h4>
            <p className="text-sm text-ink/70">
              蓄積された学びから
              成長パターンを発見できます
            </p>
          </div>
        </div>
      </div>
    )
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = () => {
    // オンボーディング完了をローカルストレージに記録
    localStorage.setItem('failseed_onboarding_completed', 'true');
    setLocation('/');
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-sage flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink">FailSeed</h1>
          </div>
          
          {/* プログレスバー */}
          <div className="flex items-center justify-center space-x-2 mb-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-leaf' : 'bg-leaf/20'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-ink/60">
            {currentStep + 1} / {onboardingSteps.length}
          </p>
        </div>

        {/* メインコンテンツ */}
        <Card className="bg-white/80 backdrop-blur-sm border-leaf/10 shadow-lg rounded-3xl">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-ink mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-lg text-ink/70">
                {currentStepData.subtitle}
              </p>
            </div>

            <div className="mb-8">
              {currentStepData.content}
            </div>

            {/* ナビゲーションボタン */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="border-leaf/30 hover:bg-leaf/10 rounded-2xl"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                前へ
              </Button>

              {currentStep === onboardingSteps.length - 1 ? (
                <Button
                  onClick={handleStart}
                  className="bg-leaf hover:bg-leaf/90 text-white px-8 py-3 rounded-2xl shadow-sm"
                  size="lg"
                >
                  <span className="mr-2">はじめる</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-leaf hover:bg-leaf/90 text-white rounded-2xl"
                >
                  <span className="mr-2">次へ</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* スキップボタン */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={handleStart}
            className="text-ink/60 hover:text-ink hover:bg-leaf/10 rounded-2xl"
          >
            スキップして始める
          </Button>
        </div>
      </div>
    </div>
  );
}