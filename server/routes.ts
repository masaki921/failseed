import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateStep1Response, generateStep2Response, detectDangerousContent } from "./services/gemini";
import { step1Schema, step2Schema, updateHintSchema, type AIStep1Response, type AIStep2Response } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Step 1: Initial event input → AI comfort + question
  app.post("/api/entry/step1", async (req, res) => {
    try {
      const { text } = step1Schema.parse(req.body);

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

      // Generate AI response
      const aiResponse = await generateStep1Response(text);
      
      // Create partial entry in storage
      const entry = await storage.createPartialEntry(
        text,
        aiResponse.comfort,
        aiResponse.question
      );

      const response: AIStep1Response = {
        comfort: aiResponse.comfort,
        question: aiResponse.question,
        entryId: entry.id,
      };

      res.json(response);
    } catch (error) {
      console.error("Step 1 error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "応答の生成に失敗しました。しばらく待ってからもう一度お試しください。"
      });
    }
  });

  // Step 2: Additional details → AI growth + hint + save complete entry
  app.post("/api/entry/step2", async (req, res) => {
    try {
      const { entryId, detailText } = step2Schema.parse(req.body);

      // Get the partial entry
      const partialEntry = await storage.getEntry(entryId);
      if (!partialEntry) {
        return res.status(404).json({ 
          error: "not_found",
          message: "エントリが見つかりません。"
        });
      }

      // Check for dangerous content in detail text
      if (detailText && detectDangerousContent(detailText)) {
        return res.status(400).json({
          error: "safety_concern",
          message: "心配な内容が含まれています。専門の相談窓口にご相談ください。",
          resources: [
            "いのちの電話: 0570-783-556",
            "こころの健康相談統一ダイヤル: 0570-064-556"
          ]
        });
      }

      // Generate AI step 2 response
      const aiResponse = await generateStep2Response(partialEntry.text, detailText);
      
      // Update entry with growth insights
      const completedEntry = await storage.updateEntryWithGrowth(
        entryId,
        detailText,
        aiResponse.comfort,
        aiResponse.growth,
        aiResponse.hint
      );

      const response: AIStep2Response = {
        comfort: aiResponse.comfort,
        growth: aiResponse.growth,
        hint: aiResponse.hint,
        entryId: completedEntry.id,
      };

      res.json(response);
    } catch (error) {
      console.error("Step 2 error:", error);
      res.status(500).json({ 
        error: "server_error",
        message: "応答の生成に失敗しました。しばらく待ってからもう一度お試しください。"
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

  // Get all growth entries
  app.get("/api/grows", async (req, res) => {
    try {
      const entries = await storage.getAllGrowthEntries();
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
