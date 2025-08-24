import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sprout, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { registerUserSchema, type InsertUser } from "@shared/schema";

export default function Register() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { register, isRegisterPending, registerError, isAuthenticated } = useAuth();

  const form = useForm<InsertUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/");
  }

  const onSubmit = (data: InsertUser) => {
    register(data, {
      onSuccess: () => {
        setLocation("/");
      },
    });
  };

  const getErrorMessage = (error: any) => {
    if (error?.message?.includes("user_exists")) {
      return "このメールアドレスは既に登録されています。";
    }
    if (error?.message?.includes("validation_error")) {
      return "入力内容に不備があります。各項目をご確認ください。";
    }
    return "アカウント作成に失敗しました。しばらく待ってからもう一度お試しください。";
  };

  return (
    <div className="min-h-screen bg-sage flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-leaf/5 shadow-sm rounded-3xl">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-leaf to-soil rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-ink">新規登録</CardTitle>
          <p className="text-ink/70">FailSeedへようこそ</p>
        </CardHeader>
        <CardContent>
          {registerError && (
            <Alert className="mb-6 border-destructive/20 bg-destructive/10">
              <AlertDescription className="text-destructive">
                {getErrorMessage(registerError)}
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
                          placeholder="8文字以上のパスワード"
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
                    <FormMessage />
                    <div className="text-xs text-ink/60 mt-1">
                      英数字記号を含む8文字以上で設定してください
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-leaf text-white hover:bg-leaf/90 rounded-2xl py-3"
                disabled={isRegisterPending}
                data-testid="button-register"
              >
                {isRegisterPending ? "アカウント作成中..." : "アカウントを作成"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-ink/70 text-sm">
              既にアカウントをお持ちの方は{" "}
              <Link href="/login">
                <span className="text-leaf hover:text-leaf/80 font-medium cursor-pointer" data-testid="link-login">
                  ログイン
                </span>
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center space-y-2">
            <Link href="/">
              <Button variant="ghost" className="text-ink/70 hover:text-ink hover:bg-soil/20 rounded-2xl" data-testid="button-home">
                ホームに戻る
              </Button>
            </Link>
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