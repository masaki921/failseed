import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

// Session interface extension for TypeScript
declare module 'express-session' {
  export interface SessionData {
    userId?: string;
    guestConversations?: {
      [entryId: string]: {
        messages: ConversationMessage[];
        turnCount: number;
      };
    };
    guestEntries?: {
      id: string;
      text: string;
      aiGrowth?: string;
      aiHint?: string;
      createdAt: string;
      isCompleted: number;
    }[];
  }
}
import { generateConversationResponse, generateFinalizationResponse, detectDangerousContent } from "./services/gemini";
import { 
  startConversationSchema, 
  continueConversationSchema, 
  finalizeConversationSchema,
  updateHintSchema,
  registerUserSchema,
  loginUserSchema,
  type AIConversationResponse, 
  type AIFinalizationResponse,
  type ConversationMessage,
  type User 
} from "@shared/schema";

// Authentication middleware
const requireAuth = async (req: Request, res: any, next: any) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        error: "not_authenticated",
        message: "この機能を使用するにはログインが必要です。"
      });
    }
    
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      // User not found, clear session
      req.session.destroy(() => {});
      return res.status(401).json({
        error: "user_not_found",
        message: "ユーザーが見つかりません。再度ログインしてください。"
      });
    }
    
    // Attach user to request for convenience
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: "server_error",
      message: "認証の確認に失敗しました。"
    });
  }
};

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({
          error: "user_exists",
          message: "このメールアドレスは既に登録されています。"
        });
      }
      
      // Create new user
      const user = await storage.createUser(userData);
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Return user data without password hash
      const { passwordHash, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error: any) {
      console.error("Register error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: "validation_error",
          message: "入力内容に不備があります。",
          details: error.errors
        });
      }
      res.status(500).json({
        error: "server_error",
        message: "ユーザー登録に失敗しました。"
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      
      // Get user by email
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({
          error: "invalid_credentials",
          message: "メールアドレスまたはパスワードが正しくありません。"
        });
      }
      
      // Verify password
      const isValidPassword = await storage.verifyPassword(loginData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: "invalid_credentials",
          message: "メールアドレスまたはパスワードが正しくありません。"
        });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Return user data without password hash
      const { passwordHash, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: "validation_error",
          message: "入力内容に不備があります。",
          details: error.errors
        });
      }
      res.status(500).json({
        error: "server_error",
        message: "ログインに失敗しました。"
      });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({
            error: "server_error",
            message: "ログアウトに失敗しました。"
          });
        }
        res.json({ message: "ログアウトしました。" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        error: "server_error",
        message: "ログアウトに失敗しました。"
      });
    }
  });

  app.get("/api/auth/current-user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          error: "not_authenticated",
          message: "ログインしていません。"
        });
      }
      
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        // User not found, clear session
        req.session.destroy(() => {});
        return res.status(401).json({
          error: "user_not_found",
          message: "ユーザーが見つかりません。"
        });
      }
      
      // Return user data without password hash
      const { passwordHash, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Current user error:", error);
      res.status(500).json({
        error: "server_error",
        message: "ユーザー情報の取得に失敗しました。"
      });
    }
  });

  // Guest mode conversation start (database-backed for full functionality)
  app.post("/api/guest/conversation/start", async (req, res) => {
    try {
      const { text } = startConversationSchema.parse(req.body);
      
      // 入力サイズ制限
      if (text.length > 5000) {
        return res.status(400).json({
          error: "input_too_long",
          message: "入力が長すぎます。5000文字以下で入力してください。"
        });
      }

      // 危険性検出
      const isDangerous = await detectDangerousContent(text);
      if (isDangerous) {
        return res.status(400).json({
          error: "safety_concern",
          message: "心配な内容が含まれています。専門の相談窓口にご相談ください。",
          resources: [
            "いのちの電話: 0570-783-556",
            "こころの健康相談統一ダイヤル: 0570-064-556"
          ]
        });
      }

      // セッションIDを使用してプライバシーを保護
      const sessionId = req.sessionID;
      
      // データベースに記録を作成
      const entry = await storage.createGuestConversation(text, sessionId);
      
      // Generate AI response
      const aiResponse = await generateConversationResponse("", text, 1);

      // 対話履歴を更新
      const conversationMessages = [
        { role: 'user', content: text, timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiResponse.message, timestamp: new Date().toISOString() }
      ];
      
      await storage.updateGuestConversationHistory(entry.id, conversationMessages as ConversationMessage[], 1);

      const response: AIConversationResponse = {
        message: aiResponse.message,
        shouldFinalize: aiResponse.shouldFinalize,
        entryId: entry.id,
      };

      res.json(response);
    } catch (error) {
      console.error("Guest conversation start error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "応答の生成に失敗しました。しばらく待ってからもう一度お試しください。"
      });
    }
  });

  // Start new conversation
  app.post("/api/conversation/start", requireAuth, async (req, res) => {
    try {
      const { text } = startConversationSchema.parse(req.body);
      
      // 入力サイズ制限
      if (text.length > 5000) {
        return res.status(400).json({
          error: "input_too_long",
          message: "入力が長すぎます。5000文字以下で入力してください。"
        });
      }

      // Check for dangerous content
      if (detectDangerousContent(text)) {
        return res.status(400).json({
          error: "safety_concern",
          message: "心配な内容が含まれています。専門の相談窓口にご相談ください。",
          resources: [
            "いのちの電話: 0570-783-556",
            "こころの健康相談統一ダイヤル: 0570-064-556"
          ]
        });
      }

      // Get authenticated user ID
      const userId = req.session.userId!;
      
      // セキュリティ: 本番環境ではデバッグログを出力しない
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] User: ${userId.substring(0, 8)}..., Text length: ${text.length}`);
      }

      // Create new conversation entry
      const entry = await storage.createConversation(text, userId);

      // Generate AI response with conversation turn count
      const aiResponse = await generateConversationResponse("", text, 1);
      
      // Initialize conversation history
      const messages: ConversationMessage[] = [
        {
          role: 'user',
          content: text,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date().toISOString()
        }
      ];

      // Update conversation history
      await storage.updateConversationHistory(entry.id, messages, 1);

      const response: AIConversationResponse = {
        message: aiResponse.message,
        shouldFinalize: aiResponse.shouldFinalize,
        entryId: entry.id,
      };

      res.json(response);
    } catch (error) {
      console.error("Start conversation error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "応答の生成に失敗しました。しばらく待ってからもう一度お試しください。"
      });
    }
  });

  // Guest mode conversation continue
  app.post("/api/guest/conversation/continue", async (req, res) => {
    try {
      const { entryId, message } = continueConversationSchema.parse(req.body);
      
      // 入力サイズ制限
      if (message.length > 5000) {
        return res.status(400).json({
          error: "input_too_long",
          message: "入力が長すぎます。5000文字以下で入力してください。"
        });
      }

      // Check for dangerous content
      if (detectDangerousContent(message)) {
        return res.status(400).json({
          error: "safety_concern",
          message: "心配な内容が含まれています。専門の相談窓口にご相談ください。",
          resources: [
            "いのちの電話: 0570-783-556",
            "こころの健康相談統一ダイヤル: 0570-064-556"
          ]
        });
      }

      // Get guest conversation from session
      if (!req.session.guestConversations || !req.session.guestConversations[entryId]) {
        return res.status(404).json({ 
          error: "not_found",
          message: "会話が見つかりません。"
        });
      }

      const conversation = req.session.guestConversations[entryId];
      const turnCount = conversation.turnCount + 1;

      // Build conversation history for AI context
      const conversationHistory = conversation.messages.map((msg: any) => 
        `${msg.role === 'user' ? 'ユーザー' : 'FailSeed君'}: ${msg.content}`
      ).join('\n\n');

      // Generate AI response
      const aiResponse = await generateConversationResponse(conversationHistory, message, turnCount);

      // Add new messages to conversation
      conversation.messages.push(
        {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date().toISOString()
        }
      );
      conversation.turnCount = turnCount;

      const response: AIConversationResponse = {
        message: aiResponse.message,
        shouldFinalize: aiResponse.shouldFinalize,
        entryId,
      };

      res.json(response);
    } catch (error) {
      console.error("Guest conversation continue error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "応答の生成に失敗しました。しばらく待ってからもう一度お試しください。"
      });
    }
  });

  // Guest mode conversation finalize (database-backed)
  app.post("/api/guest/conversation/finalize", async (req, res) => {
    try {
      const { entryId } = finalizeConversationSchema.parse(req.body);

      // セッションIDでプライバシー保護
      const sessionId = req.sessionID;
      
      // データベースからゲスト記録を取得
      const entry = await storage.getGuestEntry(entryId, sessionId);
      if (!entry) {
        return res.status(404).json({ 
          error: "not_found",
          message: "会話が見つかりません。"
        });
      }

      // 対話履歴を構築
      let conversationHistory = '';
      if (entry.conversationHistory) {
        const messages = JSON.parse(entry.conversationHistory) as ConversationMessage[];
        conversationHistory = messages.map((msg: ConversationMessage) => 
          `${msg.role === 'user' ? 'ユーザー' : 'FailSeed君'}: ${msg.content}`
        ).join('\n\n');
      } else {
        // 初期テキストをベースに
        conversationHistory = `ユーザー: ${entry.text}`;
      }

      // 学びのインサイトを生成
      const aiResponse = await generateFinalizationResponse(conversationHistory);

      // データベースで会話を完了状態にする
      await storage.finalizeGuestConversation(entryId, aiResponse.growth, aiResponse.hint);

      const response: AIFinalizationResponse = {
        growth: aiResponse.growth,
        hint: aiResponse.hint,
        entryId: entryId
      };

      res.json(response);
    } catch (error) {
      console.error("Guest conversation finalize error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "学びの生成に失敗しました。しばらく待ってからもう一度お試しください。"
      });
    }
  });

  // Get guest entries from database (session-based privacy)
  app.get("/api/guest/entries", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const guestEntries = await storage.getAllGuestEntries(sessionId);
      console.log('Fetching guest entries from database:', guestEntries.length, 'entries');
      res.json(guestEntries);
    } catch (error) {
      console.error("Get guest entries error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "記録の取得に失敗しました。"
      });
    }
  });

  // Continue conversation
  app.post("/api/conversation/continue", requireAuth, async (req, res) => {
    try {
      const { entryId, message } = continueConversationSchema.parse(req.body);
      
      // 入力サイズ制限
      if (message.length > 5000) {
        return res.status(400).json({
          error: "input_too_long",
          message: "入力が長すぎます。5000文字以下で入力してください。"
        });
      }

      // Get authenticated user ID
      const userId = req.session.userId!;
      
      // セキュリティ: 本番環境ではデバッグログを出力しない
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] User: ${userId.substring(0, 8)}..., EntryId: ${entryId}`);
      }

      // Get the conversation entry
      const entry = await storage.getEntry(entryId, userId);
      if (!entry) {
        return res.status(404).json({ 
          error: "not_found",
          message: "会話が見つかりません。"
        });
      }

      // Check for dangerous content
      if (detectDangerousContent(message)) {
        return res.status(400).json({
          error: "safety_concern",
          message: "心配な内容が含まれています。専門の相談窓口にご相談ください。",
          resources: [
            "いのちの電話: 0570-783-556",
            "こころの健康相談統一ダイヤル: 0570-064-556"
          ]
        });
      }

      // Parse existing conversation history
      const existingMessages: ConversationMessage[] = entry.conversationHistory 
        ? JSON.parse(entry.conversationHistory) 
        : [];

      // Calculate conversation turn (count user messages + 1 for current message)
      const conversationTurn = existingMessages.filter(msg => msg.role === 'user').length + 1;

      // Generate conversation context for AI
      const conversationContext = existingMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Generate AI response with conversation turn count
      const aiResponse = await generateConversationResponse(conversationContext, message, conversationTurn);
      
      // Update conversation history
      const updatedMessages: ConversationMessage[] = [
        ...existingMessages,
        {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: aiResponse.message,
          timestamp: new Date().toISOString()
        }
      ];

      await storage.updateConversationHistory(entryId, updatedMessages, conversationTurn);

      const response: AIConversationResponse = {
        message: aiResponse.message,
        shouldFinalize: aiResponse.shouldFinalize,
        entryId: entryId,
      };

      res.json(response);
    } catch (error) {
      console.error("Continue conversation error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "応答の生成に失敗しました。しばらく待ってからもう一度お試しください。"
      });
    }
  });

  // Finalize conversation and extract learning
  app.post("/api/conversation/finalize", requireAuth, async (req, res) => {
    try {
      const { entryId } = finalizeConversationSchema.parse(req.body);

      // Get authenticated user ID
      const userId = req.session.userId!;

      // Get the conversation entry
      const entry = await storage.getEntry(entryId, userId);
      if (!entry) {
        return res.status(404).json({ 
          error: "not_found",
          message: "会話が見つかりません。"
        });
      }

      // Parse conversation history
      const messages: ConversationMessage[] = entry.conversationHistory 
        ? JSON.parse(entry.conversationHistory) 
        : [];

      const conversationContext = messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Generate finalization response
      const finalizationResponse = await generateFinalizationResponse(conversationContext);
      
      // Finalize conversation in storage
      const completedEntry = await storage.finalizeConversation(
        entryId,
        finalizationResponse.growth,
        finalizationResponse.hint
      );

      const response: AIFinalizationResponse = {
        growth: finalizationResponse.growth,
        hint: finalizationResponse.hint,
        entryId: completedEntry.id,
      };

      res.json(response);
    } catch (error) {
      console.error("Finalize conversation error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "学びの抽出に失敗しました。しばらく待ってからもう一度お試しください。"
      });
    }
  });

  // Update hint status
  app.patch("/api/entry/:id/hint", async (req, res) => {
    try {
      const { id } = req.params;
      const { hintStatus } = updateHintSchema.parse(req.body);

      const updatedEntry = await storage.updateHintStatus(id, hintStatus);
      if (!updatedEntry) {
        return res.status(404).json({ 
          error: "not_found",
          message: "エントリが見つかりません。"
        });
      }

      res.json(updatedEntry);
    } catch (error) {
      console.error("Update hint error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "ヒントステータスの更新に失敗しました。"
      });
    }
  });

  // Delete entry
  app.delete("/api/entry/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          error: "invalid_request",
          message: "記録IDが必要です。"
        });
      }

      // Get authenticated user ID
      const userId = req.session.userId!;
      
      // Delete the entry
      const success = await storage.deleteEntry(id, userId);
      
      if (!success) {
        return res.status(404).json({
          error: "not_found",
          message: "記録が見つからないか、削除権限がありません。"
        });
      }

      // Log for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] User: ${userId.substring(0, 8)}..., deleted entry: ${id}`);
      }

      res.json({ success: true, message: "記録を削除しました。" });
    } catch (error) {
      console.error("Delete entry error:", error);
      res.status(500).json({
        error: "server_error",
        message: "記録の削除に失敗しました。"
      });
    }
  });

  // Get all completed entries
  app.get("/api/grows", requireAuth, async (req, res) => {
    try {
      // Get authenticated user ID
      const userId = req.session.userId!;
      
      // セキュリティ: 本番環境ではデバッグログを出力しない
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] User: ${userId.substring(0, 8)}..., requesting entries`);
      }

      const entries = await storage.getAllCompletedEntries(userId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] Found ${entries.length} entries for session`);
      }
      res.json(entries);
    } catch (error) {
      console.error("Get grows error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "成長記録の取得に失敗しました。"
      });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "jpy",
        metadata: {
          userId: req.session.userId!
        }
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ 
        error: "payment_error",
        message: "決済の初期化に失敗しました。" 
      });
    }
  });

  // Stripe subscription creation for guests (no auth required)
  app.post('/api/create-subscription-guest', async (req, res) => {
    try {
      // Create a temporary customer
      const customer = await stripe.customers.create({
        email: `guest-${Date.now()}@example.com`,
        metadata: { guest: 'true' }
      });

      // Create a simple product
      const product = await stripe.products.create({
        name: 'FailSeed プラスプラン',
        description: '無制限の成長記録と高度なAI分析機能'
      });

      // Create a price for the product
      const price = await stripe.prices.create({
        currency: 'jpy',
        unit_amount: 480, // 480円/月
        recurring: { interval: 'month' },
        product: product.id
      });

      // Create subscription with the price ID
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent'],
      });

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent as any;
      
      console.log('Subscription created:', {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        invoiceStatus: invoice?.status,
        paymentIntentStatus: paymentIntent?.status,
        paymentIntentId: paymentIntent?.id,
        clientSecret: paymentIntent?.client_secret ? 'Present' : 'Missing'
      });

      // If no payment intent was created automatically, create one manually
      if (!paymentIntent?.client_secret) {
        const manualPaymentIntent = await stripe.paymentIntents.create({
          amount: 480, // 480円
          currency: 'jpy',
          customer: customer.id,
          setup_future_usage: 'off_session',
          metadata: {
            subscription_id: subscription.id
          }
        });
        
        console.log('Manual payment intent created:', manualPaymentIntent.id);
        
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: manualPaymentIntent.client_secret,
          customerId: customer.id
        });
      }

      if (!paymentIntent?.client_secret) {
        return res.status(400).json({ 
          error: 'No client secret found in payment intent',
          subscriptionId: subscription.id,
          customerId: customer.id,
          debug: {
            subscriptionStatus: subscription.status,
            invoiceStatus: invoice?.status,
            paymentIntentStatus: paymentIntent?.status
          }
        });
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create or get subscription
  app.post('/api/create-subscription', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          error: "user_not_found",
          message: "ユーザーが見つかりません。" 
        });
      }

      // Check if user already has a subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active') {
          return res.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            message: "既にアクティブなサブスクリプションがあります。"
          });
        }
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
      }

      // Create a simple product
      const product = await stripe.products.create({
        name: 'FailSeed プラスプラン',
        description: '無制限の成長記録と高度なAI分析機能'
      });

      // Create a price for the product
      const price = await stripe.prices.create({
        currency: 'jpy',
        unit_amount: 480, // 480円/月
        recurring: { interval: 'month' },
        product: product.id
      });

      // Create subscription with the price ID
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, { 
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status 
      });

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent as any;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ 
        error: "subscription_error",
        message: "サブスクリプションの作成に失敗しました。" 
      });
    }
  });

  // Check subscription status
  app.get('/api/subscription-status', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUserById(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.json({ 
          status: 'inactive',
          hasSubscription: false 
        });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Update local status if different
      if (subscription.status !== user.subscriptionStatus) {
        await storage.updateUserStripeInfo(userId, { 
          subscriptionStatus: subscription.status 
        });
      }

      res.json({
        status: subscription.status,
        hasSubscription: true,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
    } catch (error: any) {
      console.error("Subscription status check error:", error);
      res.status(500).json({ 
        error: "subscription_error",
        message: "サブスクリプション状態の確認に失敗しました。" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
