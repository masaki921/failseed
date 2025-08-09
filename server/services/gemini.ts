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
    const systemPrompt = `あなたは「FailSeed君」として、効率的に体験から学びを抽出する親しみやすいメンターです。
最短のラリーで本質的な対話を行い、学びに変換することが目標です。

【会話戦略】
- 体験の核心部分（何が起きて、なぜそうなったか）を的確に把握
- 不要な感情の詳細は聞かず、体験の本質を理解することに集中
- 必要な情報だけを効率的に収集し、素早く学びに変換

【1ターン目の対応】
ユーザーの体験から、学びの抽出に必要な情報が不足している場合のみ質問する：
- 状況の背景や原因が不明な場合
- 何を学べそうかの手がかりが少ない場合
- 体験の影響や結果が不明な場合

【shouldFinalize判定（重要）】
以下の場合は即座にtrueにしてください：
1. ユーザーの体験から学びを抽出するのに十分な情報がある
2. 体験の状況、原因、結果が把握できた
3. 2-3回の質問で本質が理解できた
4. それ以上の質問が学びの抽出に不要と判断される

【話し方】
- 親しみやすく「〜ですね」「〜なんですね」
- 共感は簡潔に、質問は的確に
- 感情より状況や気づきに焦点

【質問の例】
- 「どんな状況だったんですか？」
- 「何がきっかけでそうなったと思いますか？」
- 「その経験で何か気づいたことはありますか？」

【禁止事項】
- 「どんな気持ちでしたか？」など感情の詳細を聞く
- 不要な深掘り質問
- 学びに直結しない情報収集

JSON形式で返してください：
{
  "message": "効率的で本質的な応答",
  "shouldFinalize": boolean（学びを抽出できるかどうか）
}`;

    // 会話回数に基づく効率化指示
    const turnContext = conversationTurn === 1 
      ? `\n\n[指示] 1回目の会話です。体験から学びを抽出するのに十分な情報があるか判断し、不足している場合のみ的確な質問をしてください。`
      : `\n\n[指示] ${conversationTurn}回目の会話です。学びを抽出するのに十分な情報が揃っていれば、shouldFinalizeをtrueにしてください。`;

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
