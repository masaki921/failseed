import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Calendar, Lightbulb, Target, Sprout } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// 偉人の名言データ
const inspirationalQuotes = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", translation: "成功は決定的ではなく、失敗は致命的ではない。続ける勇気こそが重要なのです。", author: "Winston Churchill", isJapanese: false },
  { text: "失敗から学ぶことができれば、それは失敗ではない。", author: "野口英世", isJapanese: true },
  { text: "The only real mistake is the one from which we learn nothing.", translation: "唯一の真の間違いは、そこから何も学ばないことです。", author: "Henry Ford", isJapanese: false },
  { text: "転んだら起きればいい。7回転んだら8回起きればいい。", author: "松下幸之助", isJapanese: true },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", translation: "私は失敗していない。うまくいかない1万通りの方法を発見しただけだ。", author: "Thomas Edison", isJapanese: false },
  { text: "It is during our darkest moments that we must focus to see the light.", translation: "最も暗い瞬間こそ、光を見るために集中しなければならない。", author: "Aristotle", isJapanese: false },
  { text: "人生に失敗がないと、人生を失敗する。", author: "斎藤茂太", isJapanese: true },
  { text: "The way to get started is to quit talking and begin doing.", translation: "始める方法は、話すのをやめて行動を開始することです。", author: "Walt Disney", isJapanese: false },
  { text: "失敗は成功のもと。", author: "日本のことわざ", isJapanese: true },
  { text: "Don't be afraid to give up the good to go for the great.", translation: "良いものを手放して偉大なものを目指すことを恐れるな。", author: "John D. Rockefeller", isJapanese: false },
  { text: "一歩ずつでも進んでいれば、必ずゴールに近づいている。", author: "本田宗一郎", isJapanese: true },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", translation: "成功とは、情熱を失うことなく失敗から失敗へと歩んでいくことです。", author: "Winston Churchill", isJapanese: false },
  { text: "努力は必ず報われる。もし報われない努力があるとすれば、それはまだ努力と呼べない。", author: "王貞治", isJapanese: true },
  { text: "The future belongs to those who believe in the beauty of their dreams.", translation: "未来は夢の美しさを信じる人々のものです。", author: "Eleanor Roosevelt", isJapanese: false },
  { text: "困難は、それを乗り越えようとする人の前にだけ現れる。", author: "湯川秀樹", isJapanese: true },
  { text: "Fall seven times, stand up eight.", translation: "七転び八起き。", author: "Japanese Proverb", isJapanese: false },
  { text: "人間はみな平等に無知である。ただ、無知な分野が違うだけだ。", author: "アルベルト・アインシュタイン", isJapanese: true },
  { text: "The only way to do great work is to love what you do.", translation: "素晴らしい仕事をする唯一の方法は、自分の仕事を愛することです。", author: "Steve Jobs", isJapanese: false },
  { text: "失敗を恐れるな。失敗から学べ。", author: "稲盛和夫", isJapanese: true },
  { text: "You miss 100% of the shots you don't take.", translation: "打たないシュートは100%外れる。", author: "Wayne Gretzky", isJapanese: false },
  { text: "為せば成る、為さねば成らぬ何事も。", author: "上杉鷹山", isJapanese: true },
  { text: "Innovation distinguishes between a leader and a follower.", translation: "革新こそがリーダーと追随者を分ける。", author: "Steve Jobs", isJapanese: false },
  { text: "道は近きにあり、しかも人は遠きに求む。", author: "孟子", isJapanese: true },
  { text: "If you want to live a happy life, tie it to a goal, not to people or things.", translation: "幸せな人生を送りたいなら、人やものではなく目標に結び付けなさい。", author: "Albert Einstein", isJapanese: false },
  { text: "何も咲かない寒い日は、下へ下へと根を伸ばせ。やがて大きな花が咲く。", author: "宮沢賢治", isJapanese: true },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", translation: "木を植える最適な時期は20年前だった。次に良い時期は今です。", author: "Chinese Proverb", isJapanese: false },
  { text: "継続は力なり。", author: "日本のことわざ", isJapanese: true },
  { text: "Be yourself; everyone else is already taken.", translation: "自分らしくいなさい。他の人はすでに取られています。", author: "Oscar Wilde", isJapanese: false },
  { text: "一日一歩、三日で三歩、三歩進んで二歩下がる。", author: "美空ひばり", isJapanese: true },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", translation: "私たちの背後にあるものと前方にあるものは、私たちの内側にあるものに比べれば取るに足らない。", author: "Ralph Waldo Emerson", isJapanese: false },
  { text: "心が変われば行動が変わる。行動が変われば習慣が変わる。", author: "ウィリアム・ジェームズ", isJapanese: true },
  { text: "Believe you can and you're halfway there.", translation: "できると信じれば、もう半分は達成したも同然です。", author: "Theodore Roosevelt", isJapanese: false },
  { text: "負けたことがある、というのが大切なんです。", author: "井上雄彦（スラムダンク）", isJapanese: true },
  { text: "It does not matter how slowly you go as long as you do not stop.", translation: "止まらない限り、どんなにゆっくり進んでも構わない。", author: "Confucius", isJapanese: false },
  { text: "夢なき者に成功なし。", author: "吉田松陰", isJapanese: true },
  { text: "The difference between ordinary and extraordinary is that little extra.", translation: "平凡と非凡の違いは、そのちょっとした追加努力です。", author: "Jimmy Johnson", isJapanese: false },
  { text: "人生は一度しかない。だから今日という日を大切にしよう。", author: "坂本龍馬", isJapanese: true },
  { text: "Success is not the key to happiness. Happiness is the key to success.", translation: "成功が幸せの鍵ではない。幸せが成功の鍵なのです。", author: "Albert Schweitzer", isJapanese: false },
  { text: "明日死ぬかのように生きろ。永遠に生きるかのように学べ。", author: "マハトマ・ガンジー", isJapanese: true },
  { text: "The only impossible journey is the one you never begin.", translation: "唯一不可能な旅は、決して始めない旅です。", author: "Tony Robbins", isJapanese: false },
  { text: "今日の成果は過去の努力の結果であり、未来はこれからの努力で決まる。", author: "稲盛和夫", isJapanese: true },
  { text: "Don't watch the clock; do what it does. Keep going.", translation: "時計を見てはいけない。時計がやることをしなさい。進み続けなさい。", author: "Sam Levenson", isJapanese: false },
  { text: "苦労は買ってでもしろ。", author: "日本のことわざ", isJapanese: true },
  { text: "Life is what happens when you're busy making other plans.", translation: "人生とは、あなたが他の計画を立てるのに忙しい時に起こることです。", author: "John Lennon", isJapanese: false },
  { text: "志を立てるのに、老いも若きもない。", author: "吉田松陰", isJapanese: true },
  { text: "The only person you are destined to become is the person you decide to be.", translation: "あなたがなる運命にある唯一の人は、あなたがなると決めた人です。", author: "Ralph Waldo Emerson", isJapanese: false },
  { text: "人間万事塞翁が馬。", author: "中国の故事", isJapanese: true },
  { text: "You are never too old to set another goal or to dream a new dream.", translation: "新しい目標を設定したり、新しい夢を抱いたりするのに、年を取りすぎるということはありません。", author: "C.S. Lewis", isJapanese: false },
  { text: "石の上にも三年。", author: "日本のことわざ", isJapanese: true },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", translation: "生きることの最大の栄光は決して倒れないことにあるのではなく、倒れるたびに立ち上がることにある。", author: "Nelson Mandela", isJapanese: false },
  { text: "実るほど頭を垂れる稲穂かな。", author: "日本のことわざ", isJapanese: true },
  { text: "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.", translation: "森の中で道が二つに分かれていて、私は人があまり通らない道を選んだ。そしてそれがすべてを変えた。", author: "Robert Frost", isJapanese: false },
  { text: "急がば回れ。", author: "日本のことわざ", isJapanese: true },
  { text: "Whether you think you can or you think you can't, you're right.", translation: "できると思ってもできないと思っても、あなたは正しい。", author: "Henry Ford", isJapanese: false },
  { text: "情けは人の為ならず。", author: "日本のことわざ", isJapanese: true },
  { text: "Life is 10% what happens to you and 90% how you react to it.", translation: "人生は10%が自分に起こることで、90%がそれにどう反応するかです。", author: "Charles R. Swindoll", isJapanese: false },
  { text: "温故知新。", author: "論語", isJapanese: true },
  { text: "The way I see it, if you want the rainbow, you gotta put up with the rain.", translation: "私の考えでは、虹が欲しいなら雨に耐えなければならない。", author: "Dolly Parton", isJapanese: false },
  { text: "類は友を呼ぶ。", author: "日本のことわざ", isJapanese: true },
  { text: "It is not the mountain we conquer but ourselves.", translation: "我々が征服するのは山ではなく、自分自身である。", author: "Sir Edmund Hillary", isJapanese: false },
  { text: "能ある鷹は爪を隠す。", author: "日本のことわざ", isJapanese: true },
  { text: "The future depends on what you do today.", translation: "未来は今日あなたがすることにかかっています。", author: "Mahatma Gandhi", isJapanese: false },
  { text: "郷に入っては郷に従え。", author: "日本のことわざ", isJapanese: true },
  { text: "Success is not about the destination, it's about the journey.", translation: "成功は目的地についてではなく、旅路についてです。", author: "Zig Ziglar", isJapanese: false },
  { text: "井の中の蛙大海を知らず。", author: "日本のことわざ", isJapanese: true },
  { text: "The expert in anything was once a beginner.", translation: "何の専門家も、かつては初心者だった。", author: "Helen Hayes", isJapanese: false },
  { text: "知らぬが仏。", author: "日本のことわざ", isJapanese: true },
  { text: "Don't let yesterday take up too much of today.", translation: "昨日のことで今日を占領させてはいけない。", author: "Will Rogers", isJapanese: false },
  { text: "覆水盆に返らず。", author: "中国の故事", isJapanese: true },
  { text: "You can't build a reputation on what you are going to do.", translation: "これからやろうとしていることで評判を築くことはできない。", author: "Henry Ford", isJapanese: false },
  { text: "鳥なき里の蝙蝠。", author: "日本のことわざ", isJapanese: true },
  { text: "The only thing standing between you and your goal is the story you keep telling yourself as to why you can't achieve it.", translation: "あなたと目標の間に立ちはだかる唯一のものは、なぜそれを達成できないのかについて自分自身に語り続けている物語です。", author: "Jordan Belfort", isJapanese: false },
  { text: "虎穴に入らずんば虎子を得ず。", author: "中国の故事", isJapanese: true },
  { text: "If you're going through hell, keep going.", translation: "地獄を通り抜けているなら、歩き続けなさい。", author: "Winston Churchill", isJapanese: false },
  { text: "猿も木から落ちる。", author: "日本のことわざ", isJapanese: true },
  { text: "The secret of getting ahead is getting started.", translation: "前進する秘訣は、始めることです。", author: "Mark Twain", isJapanese: false },
  { text: "蒔かぬ種は生えぬ。", author: "日本のことわざ", isJapanese: true },
  { text: "Do something today that your future self will thank you for.", translation: "将来の自分が感謝するようなことを今日しなさい。", author: "Sean Patrick Flanery", isJapanese: false },
  { text: "千里の道も一歩から。", author: "老子", isJapanese: true },
  { text: "The only way to achieve the impossible is to believe it is possible.", translation: "不可能を達成する唯一の方法は、それが可能だと信じることです。", author: "Charles Kingsleigh", isJapanese: false },
  { text: "雨降って地固まる。", author: "日本のことわざ", isJapanese: true },
  { text: "Success is the sum of small efforts repeated day-in and day-out.", translation: "成功とは、毎日繰り返される小さな努力の積み重ねです。", author: "Robert Collier", isJapanese: false },
  { text: "笑う門には福来る。", author: "日本のことわざ", isJapanese: true },
  { text: "Don't wait for opportunity. Create it.", translation: "機会を待ってはいけない。それを作り出しなさい。", author: "George Bernard Shaw", isJapanese: false },
  { text: "出る杭は打たれる。", author: "日本のことわざ", isJapanese: true },
  { text: "The greatest wealth is to live content with little.", translation: "最大の富は、少ないもので満足して生きることです。", author: "Plato", isJapanese: false },
  { text: "好きこそ物の上手なれ。", author: "日本のことわざ", isJapanese: true },
  { text: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", translation: "挑戦こそが人生を面白くし、それを克服することが人生を意味深いものにする。", author: "Joshua J. Marine", isJapanese: false },
  { text: "習うより慣れろ。", author: "日本のことわざ", isJapanese: true },
  { text: "Your limitation—it's only your imagination.", translation: "あなたの限界—それはあなたの想像力に過ぎない。", author: "Unknown", isJapanese: false },
  { text: "因果応報。", author: "仏教の教え", isJapanese: true },
  { text: "Great things never come from comfort zones.", translation: "素晴らしいことは決して快適な場所からは生まれない。", author: "Unknown", isJapanese: false },
  { text: "三人寄れば文殊の知恵。", author: "日本のことわざ", isJapanese: true },
  { text: "Dream it. Wish it. Do it.", translation: "夢見なさい。願いなさい。実行しなさい。", author: "Unknown", isJapanese: false },
  { text: "努力に勝る天才なし。", author: "日本のことわざ", isJapanese: true },
  { text: "Success doesn't just find you. You have to go out and get it.", translation: "成功はただあなたを見つけてくれるわけではない。外に出てそれを掴みに行かなければならない。", author: "Unknown", isJapanese: false },
  { text: "諦めは心の養生。", author: "日本のことわざ", isJapanese: true },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", translation: "何かのためにより一生懸命働けば働くほど、それを達成した時により大きな達成感を味わえる。", author: "Unknown", isJapanese: false },
  { text: "案ずるより産むが易し。", author: "日本のことわざ", isJapanese: true },
  { text: "Don't stop when you're tired. Stop when you're done.", translation: "疲れた時に止まるな。終わった時に止まれ。", author: "Unknown", isJapanese: false },
  { text: "終わり良ければ全て良し。", author: "シェイクスピア", isJapanese: true },
  { text: "Wake up with determination. Go to bed with satisfaction.", translation: "決意を持って目覚め、満足感を持って眠りにつけ。", author: "Unknown", isJapanese: false }
];

// 今日の日付に基づいて固定の名言を取得
const getTodaysQuote = () => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % inspirationalQuotes.length;
  return inspirationalQuotes[index];
};

interface Message {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export default function Home() {
  const [text, setText] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [conversationState, setConversationState] = useState<'initial' | 'ongoing' | 'complete'>('initial');
  const todaysQuote = getTodaysQuote();

  const startConversationMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      if (!response.ok) throw new Error('Failed to start conversation');
      return response.json();
    },
    onSuccess: (response: any) => {
      setMessages(prev => [
        ...prev,
        { type: 'user', content: text, timestamp: new Date().toISOString() },
        { type: 'ai', content: response.message, timestamp: new Date().toISOString() }
      ]);
      setCurrentEntryId(response.entryId);
      setConversationState('ongoing');
      setText('');
      setIsStarting(false);
      setIsChatting(true);
    },
    onError: (error) => {
      console.error('対話開始エラー:', error);
      alert('対話の開始に失敗しました。もう一度お試しください。');
      setIsStarting(false);
    }
  });

  const continueConversationMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/conversation/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: currentEntryId, message: message })
      });
      if (!response.ok) throw new Error('Failed to continue conversation');
      return response.json();
    },
    onSuccess: (response: any) => {
      setMessages(prev => [
        ...prev,
        { type: 'user', content: inputText, timestamp: new Date().toISOString() },
        { type: 'ai', content: response.message, timestamp: new Date().toISOString() }
      ]);
      setInputText('');
    }
  });

  const finalizeConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/conversation/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: currentEntryId })
      });
      if (!response.ok) throw new Error('Failed to finalize conversation');
      return response.json();
    },
    onSuccess: () => {
      setConversationState('complete');
      setTimeout(() => {
        window.location.href = '/growth';
      }, 2000);
    }
  });

  if (isChatting) {
    return (
      <div className="min-h-screen bg-sage">
        {/* チャットヘッダー */}
        <div className="border-b border-leaf/10 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-ink">FailSeed君との対話</h1>
              </div>
            </div>
          </div>
        </div>

        {/* チャットエリア */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-4 mb-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-leaf text-white' 
                    : 'bg-white text-ink border border-leaf/20'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            
            {continueConversationMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white text-ink border border-leaf/20 px-4 py-2 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-leaf/30 border-t-leaf rounded-full animate-spin"></div>
                    <span>FailSeed君が考えています...</span>
                  </div>
                </div>
              </div>
            )}

            {conversationState === 'complete' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-ink mb-2">学びの記録が完成しました！</h3>
                <p className="text-ink/70">記録一覧ページに移動します...</p>
              </div>
            )}
          </div>

          {conversationState === 'ongoing' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-leaf/20 p-4">
                <div className="flex space-x-4">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="FailSeed君と続きを話してください..."
                    className="flex-1 border-leaf/20 rounded-xl"
                    rows={3}
                  />
                  <Button
                    onClick={() => continueConversationMutation.mutate(inputText)}
                    disabled={!inputText.trim() || continueConversationMutation.isPending}
                    className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl"
                  >
                    送信
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <Button 
                  onClick={() => finalizeConversationMutation.mutate()}
                  disabled={finalizeConversationMutation.isPending}
                  className="bg-leaf text-white hover:bg-leaf/90 rounded-2xl px-8"
                >
                  学びに変換する
                </Button>
              </div>
            </div>
          )}
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-ink">FailSeed</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/growth">
                <Button 
                  variant="outline" 
                  className="text-ink border-leaf/20 hover:bg-soil/20 rounded-2xl"
                >
                  記録一覧
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
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-ink mb-4">
                うまくいかなかった体験を成長の種に変えよう
              </h2>
              <p className="text-lg text-ink/80 max-w-2xl mx-auto leading-relaxed">
                FailSeedは、あなたの体験を温かく受け止めて、学びに変換するAIパートナーです。
                うまくいかなかった体験や困難だった出来事も、適切な振り返りによって貴重な成長の種になります。
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
        <Card className="mb-8 bg-sage/20 border-leaf/10 rounded-3xl shadow-sm">
          <CardContent className="p-6 text-center">
            <blockquote className="text-lg font-medium text-ink mb-2">
              {todaysQuote.isJapanese ? (
                todaysQuote.text
              ) : (
                <>
                  <div className="italic mb-1">"{todaysQuote.text}"</div>
                  <div className="text-sm text-ink/70">"{todaysQuote.translation}"</div>
                </>
              )}
            </blockquote>
            <cite className="text-sm text-ink/70">— {todaysQuote.author}</cite>
          </CardContent>
        </Card>

        {/* 対話開始セクション */}
        <Card className="bg-white border-leaf/5 shadow-sm rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-ink mb-2">
                体験を聞かせてください
              </h3>
              <p className="text-ink/70">
                どんな小さなことでも大丈夫です。FailSeed君が温かく受け止めます。
              </p>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="今日はどんなことがありましたか？"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[120px] border-leaf/20 focus:border-leaf/40 focus:ring-leaf/30 rounded-2xl bg-sage/30"
              />

              <div className="text-center">
                <Button 
                  size="lg"
                  disabled={!text.trim() || isStarting}
                  className="px-8 py-3 bg-leaf hover:bg-leaf/90 text-white font-medium rounded-2xl shadow-sm"
                  onClick={() => {
                    if (text.trim() && !isStarting) {
                      setIsStarting(true);
                      startConversationMutation.mutate(text.trim());
                    }
                  }}
                >
                  {isStarting ? (
                    <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MessageCircle className="w-5 h-5 mr-2" />
                  )}
                  {isStarting ? '対話開始中...' : '対話する'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}