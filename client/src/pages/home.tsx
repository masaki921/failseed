import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Calendar, Lightbulb, Target } from "lucide-react";

// 偉人の名言データ
const inspirationalQuotes = [
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    translation: "成功は決定的ではなく、失敗は致命的ではない。続ける勇気こそが重要なのです。",
    author: "Winston Churchill",
    isJapanese: false
  },
  {
    text: "失敗から学ぶことができれば、それは失敗ではない。",
    author: "野口英世",
    isJapanese: true
  },
  {
    text: "The only real mistake is the one from which we learn nothing.",
    translation: "唯一の真の間違いは、そこから何も学ばないことです。",
    author: "Henry Ford",
    isJapanese: false
  },
  {
    text: "転んだら起きればいい。7回転んだら8回起きればいい。",
    author: "松下幸之助",
    isJapanese: true
  },
  {
    text: "I have not failed. I've just found 10,000 ways that won't work.",
    translation: "私は失敗していない。うまくいかない1万通りの方法を発見しただけだ。",
    author: "Thomas Edison",
    isJapanese: false
  }
];

// ランダムな名言を取得
const getRandomQuote = () => {
  return inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)];
};

export default function Home() {
  const [text, setText] = useState("");
  const randomQuote = getRandomQuote();

  return (
    <div className="min-h-screen bg-sage">
      {/* ヘッダー */}
      <div className="border-b border-leaf/10 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-leaf rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-ink">FailSeed</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/growth">
                <Button variant="ghost" className="text-ink hover:text-ink/80">
                  <Calendar className="w-4 h-4 mr-2" />
                  記録を見る
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* コンセプト説明セクション */}
        <Card className="rounded-3xl shadow-sm border-leaf/5 mb-8">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-ink mb-4">
                失敗を成長の種に変えよう
              </h2>
              <p className="text-lg text-ink/80 max-w-2xl mx-auto leading-relaxed">
                FailSeedは、あなたの体験を温かく受け止めて、学びに変換するAIパートナーです。
                失敗や困難な体験も、適切な振り返りによって貴重な成長の種になります。
              </p>
            </div>

            {/* プロセス説明（イラスト風） */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-sage/30 rounded-2xl border-leaf/10">
                <div className="text-center">
                  <div className="w-12 h-12 bg-leaf/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-6 h-6 text-leaf" />
                  </div>
                  <h3 className="font-semibold text-ink mb-2">1. 体験を話す</h3>
                  <p className="text-sm text-ink/70">
                    FailSeed君と自然に対話しながら、あなたの体験を共有します
                  </p>
                </div>
              </div>

              <div className="p-6 bg-sage/30 rounded-2xl border-leaf/10">
                <div className="text-center">
                  <div className="w-12 h-12 bg-leaf/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-6 h-6 text-leaf" />
                  </div>
                  <h3 className="font-semibold text-ink mb-2">2. 学びを発見</h3>
                  <p className="text-sm text-ink/70">
                    AIが体験から価値ある気づきと学びを抽出します
                  </p>
                </div>
              </div>

              <div className="p-6 bg-sage/30 rounded-2xl border-leaf/10">
                <div className="text-center">
                  <div className="w-12 h-12 bg-leaf/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-leaf" />
                  </div>
                  <h3 className="font-semibold text-ink mb-2">3. 成長を記録</h3>
                  <p className="text-sm text-ink/70">
                    学びを記録し、継続的な成長を可視化します
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 名言セクション */}
        <Card className="mb-8 bg-sage/20 border-leaf/10">
          <CardContent className="p-6 text-center">
            <blockquote className="text-lg font-medium text-ink mb-2">
              {randomQuote.isJapanese ? (
                randomQuote.text
              ) : (
                <>
                  <div className="italic mb-1">"{randomQuote.text}"</div>
                  <div className="text-sm text-ink/70">"{randomQuote.translation}"</div>
                </>
              )}
            </blockquote>
            <cite className="text-sm text-ink/70">— {randomQuote.author}</cite>
          </CardContent>
        </Card>

        {/* 対話開始セクション */}
        <Card className="bg-white border-leaf/10 shadow-lg rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-ink mb-2">
                今日はどんなことがありましたか？
              </h3>
              <p className="text-ink/70">
                どんな小さなことでも大丈夫です。FailSeed君が温かく受け止めます。
              </p>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="今日のプレゼンでうまく話せなかった..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] border-leaf/20 focus:border-leaf/40 focus:ring-leaf/30 rounded-2xl bg-sage/30"
              />

              <div className="text-center">
                <Button 
                  size="lg"
                  disabled={!text.trim()}
                  className="px-8 py-3 bg-leaf hover:bg-leaf/90 text-white font-medium rounded-2xl shadow-sm"
                  onClick={() => {
                    if (text.trim()) {
                      window.location.href = `/chat?initialText=${encodeURIComponent(text)}`;
                    }
                  }}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  FailSeed君と話す
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}