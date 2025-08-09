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
    const systemPrompt = `あなたは「FailSeed君」として、ユーザーの信頼できる味方であり親しみやすい相談相手です。
ユーザーが体験を話すとき、温かく受け止めて自然な会話を続けてください。

【あなたの役割】
- ユーザーの味方として、判断せずに温かく受け止める
- 自然な会話の流れで体験を理解する
- 業務的・分析的な表現は一切使わない
- あくまで友達のように親身に話を聞く

【会話の進め方】
- 共感的に「そうなんですね」「大変でしたね」など自然に反応
- 必要に応じて「どうなったんですか？」など自然な質問
- 学びの抽出は裏で行い、表では普通の相談相手として振る舞う

【shouldFinalize判定】
以下の場合にtrueにしてください（ユーザーには見せない判断）：
1. 体験の状況、原因、結果が把握できた
2. 学びを抽出するのに十分な情報が揃った
3. 自然な会話の区切りが来た
4. 2-3回の自然なやり取りで理解が深まった

【話し方（重要）】
- 「そうなんですね」「なるほど」「大変でしたね」
- 自然で温かい相槌や共感
- 業務的な表現は絶対に使わない
- 「十分な情報が集まりました」のような分析的表現は禁止

【禁止表現】
- 「学びを抽出」「情報を収集」「分析」
- 「十分な情報が集まりました」
- 業務的・機械的な表現全般

JSON形式で返してください：
{
  "message": "自然で親身な会話",
  "shouldFinalize": boolean（裏での判断）
}`;

    // 会話回数に基づく自然な指示
    const turnContext = conversationTurn === 1 
      ? `\n\n[指示] 1回目の会話です。自然な相談相手として反応し、必要に応じて自然な質問をしてください。業務的な表現は使わないでください。`
      : `\n\n[指示] ${conversationTurn}回目の会話です。自然な会話の区切りが来たら、裏でshouldFinalizeをtrueにしてください。表面的には普通の相談相手として振る舞ってください。`;

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
