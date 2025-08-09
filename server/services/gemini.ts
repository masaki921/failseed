import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface Step1Response {
  comfort: string;
  question?: string;
}

export interface Step2Response {
  comfort: string;
  growth: string;
  hint?: string;
}

export async function generateStep1Response(eventText: string): Promise<Step1Response> {
  try {
    const systemPrompt = `あなたは優しく共感的なカウンセラーです。HSPや完璧主義者の方に寄り添い、否定的な体験を成長の材料に変換するお手伝いをします。

以下のガイドラインに従ってください：
- 受容的で短文の慰めメッセージ（最大全角50字）
- 命令形を避け、柔らかい表現を使用
- 追加で聞きたいことがあれば、1つだけ優しく質問（「〜について少し教えてくれますか？」形式）
- 医療・法律・投資助言は行わない
- 評価・断定・命令を避ける

JSON形式で以下のように返してください：
{
  "comfort": "受けとめのメッセージ",
  "question": "追加質問（あれば）"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            comfort: { type: "string" },
            question: { type: "string" },
          },
          required: ["comfort"],
        },
      },
      contents: `出来事: ${eventText}`,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("AIからの応答が空です");
    }

    const data: Step1Response = JSON.parse(rawJson);
    
    // Validate response length
    if (data.comfort.length > 50) {
      data.comfort = data.comfort.substring(0, 47) + "...";
    }

    return data;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("AI応答の生成に失敗しました");
  }
}

export async function generateStep2Response(
  eventText: string, 
  detailText?: string
): Promise<Step2Response> {
  try {
    const systemPrompt = `あなたは優しく共感的なカウンセラーです。HSPや完璧主義者の方に寄り添い、否定的な体験を成長の材料に変換するお手伝いをします。

以下のガイドラインに従ってください：
- 受容的で短文の慰めメッセージ（最大全角50字）
- 育った部分の指摘（最大2行）- ポジティブな気づきや学びに焦点
- 5分で試せる具体的な提案を1つ（希望形で表現）
- 命令形を避け、柔らかい表現を使用
- 評価・断定・命令を避ける

JSON形式で以下のように返してください：
{
  "comfort": "受けとめのメッセージ",
  "growth": "育った部分（改行は\\nで表現）",
  "hint": "芽を伸ばすヒント"
}`;

    const fullText = detailText 
      ? `出来事: ${eventText}\n追加詳細: ${detailText}`
      : `出来事: ${eventText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            comfort: { type: "string" },
            growth: { type: "string" },
            hint: { type: "string" },
          },
          required: ["comfort", "growth"],
        },
      },
      contents: fullText,
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("AIからの応答が空です");
    }

    const data: Step2Response = JSON.parse(rawJson);
    
    // Validate response lengths
    if (data.comfort.length > 50) {
      data.comfort = data.comfort.substring(0, 47) + "...";
    }

    // Ensure growth is max 2 lines
    const growthLines = data.growth.split('\n');
    if (growthLines.length > 2) {
      data.growth = growthLines.slice(0, 2).join('\n');
    }

    return data;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("AI応答の生成に失敗しました");
  }
}

export function detectDangerousContent(text: string): boolean {
  const dangerKeywords = [
    "自殺", "死にたい", "消えたい", "生きていたくない",
    "自傷", "リストカット", "薬を飲む", "飛び降り"
  ];
  
  return dangerKeywords.some(keyword => text.includes(keyword));
}
