import OpenAI from "openai";
import { LEARNING_CATEGORIES } from "@shared/schema";

// Using gpt-4o to match existing codebase model usage
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CategorizationResult {
  category: string;
  confidence: number;
  reasoning: string;
}

/**
 * Automatically categorizes a learning entry using AI analysis
 * @param entryText - The original event description from the user
 * @param aiGrowth - The AI-generated growth insight
 * @param aiHint - The AI-generated actionable hint (optional)
 * @returns Promise<CategorizationResult>
 */
export async function categorizeEntry(
  entryText: string,
  aiGrowth: string,
  aiHint?: string
): Promise<CategorizationResult> {
  try {
    const categories = LEARNING_CATEGORIES.join(", ");
    
    const prompt = `以下の学習記録を分析して、最も適切なカテゴリーに分類してください。

利用可能なカテゴリー: ${categories}

分析対象:
- 元の出来事: ${entryText}
- 成長した部分: ${aiGrowth}
${aiHint ? `- 実践ヒント: ${aiHint}` : ''}

以下のJSON形式で回答してください:
{
  "category": "選択されたカテゴリー名",
  "confidence": 0.85,
  "reasoning": "分類の理由を簡潔に説明"
}

confidence は 0.0 から 1.0 の間で、分類の確信度を表します。
reasoning は日本語で、なぜそのカテゴリーを選んだかを簡潔に説明してください。`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "あなたは学習記録の分類専門家です。ユーザーの経験と成長を分析し、適切なカテゴリーに分類してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Lower temperature for more consistent categorization
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate the result
    if (!result.category || !LEARNING_CATEGORIES.includes(result.category)) {
      console.warn("AI returned invalid category:", result.category, "Defaulting to その他");
      return {
        category: "その他",
        confidence: 0.5,
        reasoning: "AIが適切なカテゴリーを判定できませんでした"
      };
    }

    return {
      category: result.category,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      reasoning: result.reasoning || "AIによる自動分類"
    };

  } catch (error) {
    console.error("AI categorization failed:", error);
    
    // Fallback to basic keyword matching
    const fallbackCategory = getCategoryByKeywords(entryText, aiGrowth);
    return {
      category: fallbackCategory,
      confidence: 0.3,
      reasoning: "AIサービスエラーのため、キーワードベースで分類しました"
    };
  }
}

/**
 * Fallback categorization using simple keyword matching
 */
function getCategoryByKeywords(entryText: string, aiGrowth: string): string {
  const text = `${entryText} ${aiGrowth}`.toLowerCase();
  
  const keywordMap: Record<string, string[]> = {
    "技術・スキル": ["技術", "プログラミング", "コード", "開発", "システム", "ツール", "スキル"],
    "人間関係": ["人間関係", "コミュニケーション", "チーム", "上司", "同僚", "友人", "家族"],
    "目標・計画": ["目標", "計画", "予定", "スケジュール", "戦略", "方針"],
    "失敗・挫折": ["失敗", "挫折", "ミス", "エラー", "間違い", "困難", "問題"],
    "成功・達成": ["成功", "達成", "完成", "勝利", "成果", "結果"],
    "健康・メンタル": ["健康", "メンタル", "心", "体", "運動", "食事", "睡眠"],
    "仕事・キャリア": ["仕事", "キャリア", "職場", "転職", "昇進", "業務"],
    "学習・成長": ["学習", "成長", "勉強", "研修", "セミナー", "読書"],
    "創造・アイデア": ["創造", "アイデア", "発明", "デザイン", "芸術", "作品"]
  };

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return "その他";
}