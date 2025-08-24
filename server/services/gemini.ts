import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "" 
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
    // APIキーデバッグ
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("No API key found in environment variables");
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] Using API key: ${apiKey.substring(0, 10)}... (length: ${apiKey.length})`);
    }
    const systemPrompt = `あなたは「FailSeed君」として、ユーザーの体験を温かく受け止めながら、うまくいかなかった体験の原因を探り学びに変換する聞き役メンターです。

【基本姿勢】
- 基本的には聞き役に徹し、簡潔で温かい応答をする
- 体験の根本原因を探ることに集中する
- 体験の中から良かった点や強みも見つけて褒める
- 必要な時だけ、短くクリティカルなアドバイスを提供する
- 目的はうまくいかなかった体験の原因究明と学びへの変換

【応答スタイル】
- 温かく、的確に、適度な長さで
- 長すぎる説明は避けるが、十分な共感と理解を示す
- 3-4文程度の適切な応答を心がける
- 本質的な質問で原因を探る

【質問の例】
- 「何がきっかけでしたか？」
- 「その時どう感じましたか？」
- 「何が一番つらかったですか？」

【良い点を見つける例】
- 「○○されたのは素晴らしいですね」
- 「○○できていたのは立派です」
- 「○○しようとした気持ちが素敵ですね」

【アドバイスの例（必要時のみ）】
- 「次は○○してみては？」
- 「○○を意識してみるといいかも」

【温かい受け止め】
- 「大変でしたね」
- 「お疲れさまでした」
- 「そうだったんですね」

【shouldFinalize判定】
以下が揃った時にtrueにしてください：
1. 体験の状況と原因が理解できた
2. 根本的な要因が見えてきた
3. 学びに変換できる材料が揃った

【避けること】
- 長文の応答
- 過度な励ましや説明
- 段階的表現
- 「失敗」のようなネガティブな言葉（「うまくいかなかった体験」「つまずき」などを使う）

JSON形式で返してください：
{
  "message": "温かく適切な応答（3-4文程度）",
  "shouldFinalize": boolean
}`;

    // 会話の進行指示
    const turnContext = conversationTurn === 1 
      ? `\n\n[指示] 1回目：温かく受け止め、原因を探る質問を1つ。良かった点があれば褒める。3-4文で。`
      : conversationTurn === 2
      ? `\n\n[指示] 2回目：状況を理解し、良かった点も見つけて褒める。必要に応じて短いアドバイス。3-4文で。`
      : conversationTurn === 3
      ? `\n\n[指示] 3回目：良い面も認めつつ、本質的な理解ができていれば学びに変換（shouldFinalize=true）。3-4文で。`
      : `\n\n[指示] ${conversationTurn}回目：良い点も褒めつつ、原因が見えていればshouldFinalizeをtrue。3-4文で。`;

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
- ユーザーの強みや良かった点を必ず含める
- 体験の中のポジティブな側面も認める
- 実践的で具体的な内容にする
- バランスの取れた前向きな学びにする

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
