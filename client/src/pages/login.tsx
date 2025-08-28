import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sprout, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { loginUserSchema, type LoginUser } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [saveEmail, setSaveEmail] = useState(false);
  const [savePassword, setSavePassword] = useState(false);
  const { login, isLoginPending, loginError, isAuthenticated } = useAuth();

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ページ読み込み時に保存された情報を復元
  useEffect(() => {
    const savedEmail = localStorage.getItem('failseed_saved_email');
    const savedPassword = localStorage.getItem('failseed_saved_password');
    const emailSaveFlag = localStorage.getItem('failseed_save_email') === 'true';
    const passwordSaveFlag = localStorage.getItem('failseed_save_password') === 'true';

    if (savedEmail && emailSaveFlag) {
      form.setValue('email', savedEmail);
      setSaveEmail(true);
    }
    if (savedPassword && passwordSaveFlag) {
      form.setValue('password', savedPassword);
      setSavePassword(true);
    }
  }, [form]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/");
  }

  const onSubmit = (data: LoginUser) => {
    // ログイン情報の保存処理
    if (saveEmail) {
      localStorage.setItem('failseed_saved_email', data.email);
      localStorage.setItem('failseed_save_email', 'true');
    } else {
      localStorage.removeItem('failseed_saved_email');
      localStorage.removeItem('failseed_save_email');
    }

    if (savePassword) {
      localStorage.setItem('failseed_saved_password', data.password);
      localStorage.setItem('failseed_save_password', 'true');
    } else {
      localStorage.removeItem('failseed_saved_password');
      localStorage.removeItem('failseed_save_password');
    }

    login(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  const getErrorMessage = (error: any) => {
    if (error?.message?.includes("invalid_credentials")) {
      return "メールアドレスまたはパスワードが正しくありません。";
    }
    return "ログインに失敗しました。しばらく待ってからもう一度お試しください。";
  };

  return (
    <div className="min-h-screen bg-sage flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-leaf/5 shadow-sm rounded-3xl">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-ink">ログイン</CardTitle>
          <p className="text-ink/70">FailSeedへおかえりなさい</p>
        </CardHeader>
        <CardContent>
          {loginError && (
            <Alert className="mb-6 border-destructive/20 bg-destructive/10">
              <AlertDescription className="text-destructive">
                {getErrorMessage(loginError)}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ink">メールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        className="border-leaf/20 focus:border-leaf/40 focus:ring-leaf/30 rounded-2xl"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="save-email"
                        checked={saveEmail}
                        onCheckedChange={(checked) => setSaveEmail(checked as boolean)}
                        data-testid="checkbox-save-email"
                      />
                      <label
                        htmlFor="save-email"
                        className="text-sm text-ink/70 cursor-pointer"
                      >
                        メールアドレスを保存する
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-ink">パスワード</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="パスワードを入力"
                          className="border-leaf/20 focus:border-leaf/40 focus:ring-leaf/30 rounded-2xl pr-10"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-ink/50" />
                          ) : (
                            <Eye className="h-4 w-4 text-ink/50" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="save-password"
                        checked={savePassword}
                        onCheckedChange={(checked) => setSavePassword(checked as boolean)}
                        data-testid="checkbox-save-password"
                      />
                      <label
                        htmlFor="save-password"
                        className="text-sm text-ink/70 cursor-pointer"
                      >
                        パスワードを保存する
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-leaf text-white hover:bg-leaf/90 rounded-2xl py-3"
                disabled={isLoginPending}
                data-testid="button-login"
              >
                {isLoginPending ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-ink/70 text-sm">
              アカウントをお持ちでない方は{" "}
              <Link href="/register">
                <span className="text-leaf hover:text-leaf/80 font-medium cursor-pointer" data-testid="link-register">
                  新規登録
                </span>
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center space-y-2">
            <div className="text-ink/40 text-xs">または</div>
            <Link href="/?guest=true">
              <Button variant="outline" className="text-leaf border-leaf/30 hover:bg-leaf/10 rounded-2xl w-full" data-testid="button-guest">
                ログインせずに利用する
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}