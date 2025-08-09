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
  userMessage: string,
  conversationTurn: number = 1
): Promise<ConversationResponse> {
  try {
    const systemPrompt = `あなたは「FailSeed君」として、HSPや完璧主義者の方に寄り添う優しく効率的なカウンセラーです。
会話を2-3回で完結させ、体験を学びに変換することが目標です。

【会話戦略（重要）】
1回目：共感を示し、「どんな気持ちでしたか？」など感情に焦点を当てた質問
2回目：「その経験で何か気づいたことはありますか？」など、気づきを促す質問
3回目：学びを抽出するタイミング（shouldFinalize: true）

【shouldFinalize判定基準】
必ずtrueにするタイミング：
1. 3回目の会話に達した場合
2. ユーザーが感情と体験内容を共有済みの場合
3. 基本的な状況（何があった、どう感じた）が把握できた場合

【禁止事項】
- 「もう少し詳しく」「他に何か」などの追加質問の連続
- 同じような質問の繰り返し
- 過度な情報収集

【表現ルール】
- 温かく受容的、但し簡潔
- 「〜してください」ではなく「〜いかがでしょうか」
- ユーザーの強さや成長に焦点を当てる

JSON形式で返してください：
{
  "message": "応答メッセージ",
  "shouldFinalize": boolean（学びを抽出するかどうか）
}`;

    // 強制終了ロジック: 4回目以降は自動的に学びを抽出
    if (conversationTurn >= 4) {
      return {
        message: "この辺りで、これまでのお話から学びを抽出させていただきますね。",
        shouldFinalize: true
      };
    }

    // 会話回数に基づいて終了判定を強化
    const turnContext = conversationTurn >= 3 ? 
      "\n\n[重要] これは3回目の会話です。必要な情報が揃ったか判断し、学びを抽出するタイミングを強く検討してください。" : 
      `\n\n[情報] 会話回数: ${conversationTurn}回目`;

    const conversationContext = conversationHistory 
      ? `過去の会話:\n${conversationHistory}\n\n現在のメッセージ: ${userMessage}${turnContext}`
      : `ユーザーの体験: ${userMessage}${turnContext}`;

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
