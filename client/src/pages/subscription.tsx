import { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sprout, CreditCard, Check } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Stripe公開キーの確認
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscriptionForm = ({ selectedPlan }: { selectedPlan: 'monthly' | 'yearly' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const planDetails = {
    monthly: { price: '480円', period: '月額', text: 'プラスプランに登録' },
    yearly: { price: '4,500円', period: '年額', text: 'プラスプランに登録（年額）' }
  };
  
  const currentPlan = planDetails[selectedPlan] || planDetails.monthly;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/subscription?success=true',
      },
    });

    if (error) {
      toast({
        title: "決済に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "決済が完了しました",
        description: "プラスプランへようこそ！",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-leaf text-white hover:bg-leaf/90 rounded-2xl py-3"
        data-testid="button-subscribe"
      >
        {isProcessing ? "処理中..." : `${currentPlan.period}${currentPlan.price}で${currentPlan.text}`}
      </Button>
    </form>
  );
};

export default function Subscription() {
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  // URLパラメータで成功状態を確認
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get('success') === 'true';

  useEffect(() => {
    // まずサブスクリプション状態を確認
    const checkSubscriptionStatus = async () => {
      try {
        // 認証済みユーザーのみサブスクリプション状態を確認
        try {
          const response = await apiRequest("GET", "/api/subscription-status");
          const data = await response.json();
          setSubscriptionStatus(data.status);
          
          if (data.status === 'active') {
            setIsLoading(false);
            return; // 既にアクティブなら決済フォームは表示しない
          }
        } catch (authError) {
          // 未認証ユーザーの場合はスキップ
          console.log("User not authenticated, proceeding with subscription setup");
        }
        
        // 新しいサブスクリプションを作成（認証不要）
        const subscriptionResponse = await apiRequest("POST", "/api/create-subscription-guest", {
          plan: selectedPlan
        });
        const subscriptionData = await subscriptionResponse.json();
        
        console.log('Subscription response:', subscriptionData);
        
        if (subscriptionData.clientSecret) {
          setClientSecret(subscriptionData.clientSecret);
        } else if (subscriptionData.error) {
          toast({
            title: "エラー",
            description: subscriptionData.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "エラー",
            description: "決済フォームの準備に問題があります。",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Subscription check error:", error);
        toast({
          title: "エラー",
          description: "決済フォームの準備に失敗しました。ページを再読み込みしてください。",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [selectedPlan, toast]);

  // プラン変更時のclientSecret再取得
  const handlePlanChange = (newPlan: 'monthly' | 'yearly') => {
    setSelectedPlan(newPlan);
    setClientSecret(""); // clientSecretをクリアして再取得トリガー
    setIsLoading(true);
  };

  // 成功画面
  if (isSuccess || subscriptionStatus === 'active') {
    return (
      <div className="min-h-screen bg-sage flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-leaf/20 shadow-lg rounded-3xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-ink">登録完了</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-ink/70">
              FailSeedプラスプランへの登録が完了しました！
            </p>
            <div className="bg-leaf/10 p-4 rounded-2xl">
              <h3 className="font-semibold text-leaf mb-2">プラス特典</h3>
              <ul className="text-sm text-ink/70 space-y-1">
                <li>• 無制限の成長記録保存</li>
                <li>• 高度なAI分析機能</li>
                <li>• 詳細な成長レポート</li>
                <li>• 優先サポート</li>
              </ul>
            </div>
            <Link href="/">
              <Button className="w-full bg-leaf text-white hover:bg-leaf/90 rounded-2xl">
                ホームに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ローディング画面
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

  // 決済フォーム画面
  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-sage flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-leaf/20 shadow-lg rounded-3xl">
          <CardContent className="p-6 text-center space-y-4">
            <Alert className="mb-4">
              <AlertDescription>
                決済フォームの準備中です。しばらくお待ちください。
              </AlertDescription>
            </Alert>
            <div className="w-12 h-12 border-4 border-leaf/20 border-t-leaf rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="text-leaf border-leaf/30 hover:bg-leaf/10 rounded-2xl mr-2"
              >
                再読み込み
              </Button>
              <Link href="/">
                <Button variant="outline" className="text-ink/60 border-ink/20 hover:bg-ink/10 rounded-2xl">
                  ホームに戻る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-leaf/20 shadow-lg rounded-3xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-between items-start mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-ink/60 hover:bg-ink/10 rounded-xl">
                ← 戻る
              </Button>
            </Link>
            <Link href="/">
              <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center cursor-pointer">
                <Sprout className="w-8 h-8 text-white" />
              </div>
            </Link>
            <div className="w-16"></div> {/* スペーサー */}
          </div>
          <CardTitle className="text-2xl font-bold text-ink">プラスプラン</CardTitle>
          <p className="text-ink/70">月額480円でより深い成長体験を</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-3">
            <div className="bg-leaf/10 p-4 rounded-2xl">
              <h3 className="font-semibold text-leaf mb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                プラス特典
              </h3>
              <ul className="text-sm text-ink/70 space-y-1">
                <li>• 無制限の成長記録保存</li>
                <li>• 高度なAI分析機能</li>
                <li>• 詳細な成長レポート</li>
                <li>• 優先サポート</li>
              </ul>
            </div>
          </div>

          {/* プラン選択UI */}
          <div className="mb-6">
            <h3 className="font-semibold text-ink mb-4">プランを選択</h3>
            <RadioGroup value={selectedPlan} onValueChange={handlePlanChange}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-4 border border-leaf/20 rounded-2xl hover:bg-leaf/5 transition-colors">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-ink">月額プラン</div>
                        <div className="text-sm text-ink/70">毎月480円でお支払い</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-leaf">480円</div>
                        <div className="text-xs text-ink/70">/ 月</div>
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border border-leaf/20 rounded-2xl hover:bg-leaf/5 transition-colors">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-ink">年額プラン</div>
                        <div className="text-sm text-ink/70">年間一括払い</div>
                        <div className="text-xs text-leaf font-medium mt-1">
                          月額プランより約22%お得 🎉
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-leaf">4,500円</div>
                        <div className="text-xs text-ink/70">/ 年</div>
                        <div className="text-xs text-ink/50 line-through">5,760円</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }} key={clientSecret}>
              <SubscriptionForm selectedPlan={selectedPlan} />
            </Elements>
          )}

          <div className="mt-6 text-center space-y-3">
            <p className="text-xs text-ink/50">
              安全なStripe決済を利用しています
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/">
                <Button variant="outline" size="sm" className="text-ink/60 border-ink/20 hover:bg-ink/10 rounded-xl">
                  ホームに戻る
                </Button>
              </Link>
              <Link href="/growth">
                <Button variant="outline" size="sm" className="text-ink/60 border-ink/20 hover:bg-ink/10 rounded-xl">
                  記録一覧
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}