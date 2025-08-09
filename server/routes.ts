import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateConversationResponse, generateFinalizationResponse, detectDangerousContent } from "./services/gemini";
import { 
  startConversationSchema, 
  continueConversationSchema, 
  finalizeConversationSchema,
  updateHintSchema, 
  type AIConversationResponse, 
  type AIFinalizationResponse,
  type ConversationMessage 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Start new conversation
  app.post("/api/conversation/start", async (req, res) => {
    try {
      const { text } = startConversationSchema.parse(req.body);

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

      // Create new conversation entry
      const entry = await storage.createConversation(text);

      // Generate AI response
      const aiResponse = await generateConversationResponse("", text);
      
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
      await storage.updateConversationHistory(entry.id, messages);

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

  // Continue conversation
  app.post("/api/conversation/continue", async (req, res) => {
    try {
      const { entryId, message } = continueConversationSchema.parse(req.body);

      // Get the conversation entry
      const entry = await storage.getEntry(entryId);
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

      // Generate conversation context for AI
      const conversationContext = existingMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Generate AI response
      const aiResponse = await generateConversationResponse(conversationContext, message);
      
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

      await storage.updateConversationHistory(entryId, updatedMessages);

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
  app.post("/api/conversation/finalize", async (req, res) => {
    try {
      const { entryId } = finalizeConversationSchema.parse(req.body);

      // Get the conversation entry
      const entry = await storage.getEntry(entryId);
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

  // Get all completed entries
  app.get("/api/grows", async (req, res) => {
    try {
      const entries = await storage.getAllCompletedEntries();
      res.json(entries);
    } catch (error) {
      console.error("Get grows error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "成長記録の取得に失敗しました。"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
