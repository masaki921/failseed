import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface ConversationResponse {
  message: string;
  shouldFinalize: boolean;
}

export interface FinalizationResponse {
  growth: string;
  hint?: string;
}

export async function generateConversationResponse(
  conversationHistory: string,
  userMessage: string
): Promise<ConversationResponse> {
  try {
    const systemPrompt = `あなたは「FailSeed君」として、HSPや完璧主義者の方に寄り添う優しいカウンセラーです。
ユーザーの体験から学びに変換することが目的で、会話を自然に主導してください。

【役割】
- 否定的な体験を成長の材料に変換するお手伝い
- 時には慰め、応援し、必要に応じて深掘り質問
- 十分な情報が得られたら会話を包括して学びを抽出

【会話の進め方】
- 受容的で温かい表現を使用
- 命令形を避け、柔らかい質問で情報を引き出す
- ユーザーの感情に寄り添いながら、徐々に学びへ導く
- 十分な会話ができたと判断したら shouldFinalize を true にする

【応答ルール】
- 医療・法律・投資助言は行わない
- 評価・断定・命令を避ける
- 自然な会話を心がける

JSON形式で以下のように返してください：
{
  "message": "応答メッセージ",
  "shouldFinalize": false/true（学びを抽出するタイミングかどうか）
}`;

    const conversationContext = conversationHistory 
      ? `過去の会話:\n${conversationHistory}\n\n現在のメッセージ: ${userMessage}`
      : `ユーザーの体験: ${userMessage}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
            shouldFinalize: { type: "boolean" },
          },
          required: ["message", "shouldFinalize"],
        },
      },
      contents: conversationContext,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("AIからの応答が空です");
    }

    const data: ConversationResponse = JSON.parse(rawJson);
    return data;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("AI応答の生成に失敗しました");
  }
}

export async function generateFinalizationResponse(
  conversationHistory: string
): Promise<FinalizationResponse> {
  try {
    const systemPrompt = `あなたは「FailSeed君」として、会話全体を振り返り、ユーザーの体験から学びを抽出します。

【タスク】
会話全体を包括的に分析し、ユーザーの体験から得られた成長や学びを抽出してください。

【出力ルール】
- growth: 体験から得られた成長や気づき（最大3行、具体的で前向きな表現）
- hint: 今後に活かせる具体的な学びや行動（5分で実践できるもの、希望形で表現）

【表現ガイドライン】
- 命令形を避け、柔らかい表現を使用
- ユーザーの強みや成長に焦点を当てる
- 実践的で具体的な内容にする

JSON形式で以下のように返してください：
{
  "growth": "体験から得られた成長・気づき",
  "hint": "今後に活かせる学び・行動"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            growth: { type: "string" },
            hint: { type: "string" },
          },
          required: ["growth"],
        },
      },
      contents: `会話履歴:\n${conversationHistory}`,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("AIからの応答が空です");
    }

    const data: FinalizationResponse = JSON.parse(rawJson);
    
    // Ensure growth is max 3 lines
    const growthLines = data.growth.split('\n');
    if (growthLines.length > 3) {
      data.growth = growthLines.slice(0, 3).join('\n');
    }

    return data;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("学びの抽出に失敗しました");
  }
}

export function detectDangerousContent(text: string): boolean {
  const dangerKeywords = [
    "自殺", "死にたい", "消えたい", "生きていたくない",
    "自傷", "リストカット", "薬を飲む", "飛び降り"
  ];
  
  return dangerKeywords.some(keyword => text.includes(keyword));
}
