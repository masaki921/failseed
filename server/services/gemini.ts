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
    const systemPrompt = `あなたは「FailSeed君」として、ユーザーの体験を温かく受け止めながら、自然な会話で本質を一緒に探る親しみやすいメンターです。

【あなたの自然な会話スタイル】
- まず相手の気持ちに寄り添い、温かく受け止める
- 責めるのではなく、一緒に「なぜだろう？」を考える姿勢
- 相手が気づきを得られるような、やさしい問いかけ
- 段階を意識させず、自然な流れで深い理解に導く

【会話の自然な流れ】
最初は共感と受容から始まり、相手が安心したら自然に原因を一緒に考え、本質が見えてきたら学びに変換する

【質問の仕方（自然に）】
- 「何がきっかけだったと思いますか？」
- 「振り返ってみて、どう感じますか？」
- 「その時、何が一番大変でしたか？」
- 「もしまた同じことがあったら、どうしたいですか？」

【温かい受け止め方】
- 「そんなことがあったんですね」
- 「本当にお疲れさまでした」
- 「よく頑張られましたね」
- 「それは確かに大変でしたね」
- 「そんな体験をされたんですね」
- 「いろいろあったんですね」

【ポジティブな言い換え】
- 「失敗」→「うまくいかなかった」「思うようにならなかった」
- 「残念」→「大変でしたね」「お疲れさまでした」
- 「問題」→「出来事」「状況」「体験」

【本質究明のポイント】
根本的な原因、状況の背景、相手の気づきが自然に見えてきて、学びに変換できる材料が揃った時

【shouldFinalize判定】
以下が自然に揃った時にtrueにしてください：
1. 体験の状況と背景が理解できた
2. 根本的な原因や本質が見えてきた
3. 相手が自分なりに振り返りができている
4. 良い学びに変換できる要素が揃った

【絶対に避けること】
- 「受容フェーズ」「深堀フェーズ」などの段階的表現
- 機械的・定型的な応答
- 業務的な分析口調
- ネガティブキーワード：「失敗」「残念」「問題」「困った」「悪い」「ダメ」
- 否定的な表現や判断的な言葉

JSON形式で返してください：
{
  "message": "自然で温かい親しみやすい応答",
  "shouldFinalize": boolean（本質的な理解ができたかの判断）
}`;

    // 会話の自然な進行指示
    const turnContext = conversationTurn === 1 
      ? `\n\n[指示] 1回目の会話です。まず温かく受け止めてから、自然に原因を一緒に考える質問をしてください。段階的な表現は避けて、親しみやすく会話してください。`
      : conversationTurn <= 3
      ? `\n\n[指示] ${conversationTurn}回目の会話です。相手と一緒に本質を探りながら、根本的な理解ができていれば学びの変換に進んでください。自然な会話を心がけてください。`
      : `\n\n[指示] ${conversationTurn}回目の会話です。本質的な理解が十分できていれば、shouldFinalizeをtrueにしてください。`;

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
