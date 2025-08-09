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
    const systemPrompt = `あなたは「FailSeed君」として、HSPや完璧主義者の友達のような優しいメンターです。
親しみやすく、落ち着いた口調で、フレンドリーに話しかけてください。

【あなたの話し方】
- カジュアルで親しみやすい口調（「〜ですね」「〜なんですね」）
- 相手を友達のように受け止める温かさ
- 落ち着いていて、急かさない雰囲気
- 上から目線ではなく、同じ目線で話す

【会話の進め方】
- 最初：「あー、それは辛かったですね...」のような自然な共感から始める
- 中盤：「どんな気持ちになりましたか？」など、優しく聞く
- 終盤：十分話せたら「一緒に振り返ってみませんか？」のような感じで学びを抽出

【shouldFinalize判定基準】
以下の場合にtrueにしてください：
1. ユーザーが体験と気持ちを十分に話した
2. 自然な流れで学びをまとめるタイミングが来た
3. 会話が4-5回程度続いて、内容が深まった
4. ユーザーが「そうですね」「確かに」など納得している様子

【話し方の例】
- 「あー、それは本当に大変でしたね...」
- 「なるほど、そんなふうに感じたんですね」
- 「分かります、そういう時ってありますよね」
- 「一緒に考えてみましょうか」

【禁止事項】
- 固い敬語や丁寧すぎる表現
- 「〜でございます」「〜いたします」など
- 機械的で冷たい応答

JSON形式で返してください：
{
  "message": "親しみやすく落ち着いた応答",
  "shouldFinalize": boolean（自然に学びをまとめるタイミングかどうか）
}`;

    // 会話回数に基づく指示（強制終了は削除）
    const turnContext = conversationTurn <= 3 
      ? `\n\n[指示] これは${conversationTurn}回目の会話です。メンターとして充実した応答をし、体験の理解を深めてください。`
      : `\n\n[指示] これは${conversationTurn}回目の会話です。十分な対話ができていれば、学びを抽出するタイミングを検討してください。`;

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
