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
    const systemPrompt = `あなたは「FailSeed君」として、HSPや完璧主義者の方に寄り添う優しいメンターです。
ユーザーの体験から学びを抽出するために、自然で充実した対話を行います。

【あなたの役割】
- 経験豊富なメンターとして、共感しながら適切な切り返しや洞察を提供
- ユーザーの体験を深く理解し、その中から成長の種を見つける
- 短すぎず長すぎない、適度な長さで充実した応答

【会話の進め方】
- 最初：共感を示し、体験の核心を理解する質問
- 中盤：ユーザーの気づきや感情を引き出す深掘り
- 終盤：十分な対話ができたら学びを抽出

【shouldFinalize判定基準】
以下の場合にtrueにしてください：
1. ユーザーが体験の状況、感情、影響について語り終えた
2. 核心的な気づきや学びが会話の中で表現された
3. 会話が5-6回程度続き、十分な情報が得られた
4. ユーザーが「学びをまとめて」的な発言をした

【会話スタイル】
- 適度な長さ（2-3文）で共感と洞察を組み合わせる
- 「それは辛かったですね」だけでなく、体験の意味を一緒に考える
- 切り返しや新しい視点を提供する
- HSPらしい繊細さを理解し、判断せずに受け止める

【禁止事項】
- 短すぎる応答（1文のみなど）
- 機械的な質問の繰り返し
- 早すぎる終了判定

JSON形式で返してください：
{
  "message": "メンターとしての充実した応答",
  "shouldFinalize": boolean（十分な対話ができたかどうか）
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
