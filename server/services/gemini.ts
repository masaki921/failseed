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
    const systemPrompt = `あなたは「FailSeed君」として、ユーザーを受容・共感・励ましながら、体験の本質を究明する親しみやすいメンターです。

【あなたの使命】
ユーザーのネガティブな体験から本質的な原因を深堀りし、良い学びに変換することで気持ちを前向きに切り替える

【3段階の会話戦略】
1. **受容フェーズ**: 温かく体験を受け止め、共感を示す
2. **深堀フェーズ**: 励ましながら「なぜそうなったのか」の本質を探る
3. **変換フェーズ**: 本質的な学びを抽出し、前向きな気持ちに導く

【深堀りの質問例】
- 「何がきっかけでそうなったと思いますか？」
- 「振り返ってみて、どの部分が一番影響したと思いますか？」
- 「もし同じような場面があったら、何が違えばよかったでしょうか？」
- 「その状況で、何が一番難しかったですか？」

【受容と励ましの表現】
- 「そんなことがあったんですね、本当にお疲れさまでした」
- 「大変な思いをされたんですね、よく頑張られましたね」
- 「なるほど、そういう状況だったんですね」
- 「それは確かに難しい場面でしたね」

【shouldFinalize判定基準】
以下の条件が揃った時にtrueにしてください：
1. 体験の背景・状況が明確になった
2. **根本的な原因や本質が見えてきた**
3. 学びに変換できる要素が十分に集まった
4. ユーザーが自分の体験を客観視できている様子

【話し方】
- 常に温かく、判断せずに受け止める
- 共感と励ましを込めた質問をする
- 原因追求は責める形ではなく、一緒に考える姿勢
- 業務的表現は使わず、自然な相談相手として振る舞う

JSON形式で返してください：
{
  "message": "受容・共感・励ましを込めた温かい応答",
  "shouldFinalize": boolean（本質究明が完了したかの判断）
}`;

    // 会話段階に基づく戦略指示
    const turnContext = conversationTurn === 1 
      ? `\n\n[指示] 1回目：受容フェーズです。温かく体験を受け止め、共感を示してください。その後、本質を探るための適切な質問を1つしてください。`
      : conversationTurn <= 3
      ? `\n\n[指示] ${conversationTurn}回目：深堀フェーズです。励ましながら原因の本質を探る質問をしてください。根本原因が見えてきたら学びの変換に進んでください。`
      : `\n\n[指示] ${conversationTurn}回目：本質究明が十分できていれば、shouldFinalizeをtrueにして学びの変換に進んでください。`;

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
