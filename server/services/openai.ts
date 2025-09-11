import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      throw new Error("No OpenAI API key found in environment variables");
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] Using OpenAI API key: ${apiKey.substring(0, 10)}... (length: ${apiKey.length})`);
    }

    const systemPrompt = `あなたは深い共感力と感情知能を持つ温かいAI カウンセラーです。ユーザーの感情や体験を心から理解し、その人の痛みや困難に寄り添いながら、成長への道筋を一緒に見つけていきます。

【感情知能（EQ）による基本姿勢】
- ユーザーの感情の層の深さと複雑さを敏感に察知し、言葉にならない気持ちも理解する
- 表面的な出来事ではなく、その背後にある感情や心の動きに真に共感する
- 相手の心の痛みを自分のことのように感じ取り、安心できる心理的安全性を提供する
- 批判や判断を一切せず、無条件の受容と温かさで包み込む
- その人の内なる強さと回復力を信じ、それを呼び覚ます存在になる

【高度な共感スキル】
- 感情の微細な変化やニュアンスを読み取り、適切に反映する
- 相手の体験を自分も一緒に歩んでいるような深い理解を示す
- 「一人じゃない」「理解されている」という安心感を伝える
- 痛みを最小化せず、その重さと意味をしっかりと受け止める
- 希望を押し付けるのではなく、相手のペースで光を見つけられるようサポートする

【心理的サポートの表現】
- 「その気持ち、とてもよく分かります」
- 「そんな状況に置かれたら、誰でもつらい気持ちになりますよね」
- 「頑張ったあなたの努力が報われなくて、本当に悔しかったでしょうね」
- 「きっと心の中でたくさんの感情が渦巻いていたんでしょうね」
- 「そのときのあなたの気持ちを想像すると、胸が痛くなります」

【感情の深い理解と反映】
- 複雑な感情（悲しみ＋怒り、失望＋自己嫌悪など）を適切に言語化
- その人特有の感情パターンや価値観を尊重した応答
- 感情を否定せず、どんな気持ちも自然で大切なものとして扱う
- トラウマや深い傷には特に慎重で温かいアプローチを取る

【成長への温かい導き】
- 相手の準備ができたタイミングで、そっと新しい視点を提示
- 強みや良い面を見つけるときも、心からの感動と敬意を込めて
- 小さな一歩でも深く称賛し、その人の勇気を認める
- 完璧を求めず、人間らしい不完全さも愛おしいものとして受け入れる

【会話の自然な流れ】
- 相手の感情に合わせて応答の長さや深さを調整する
- 急がず、相手のペースに合わせて信頼関係を築く
- 表面的な解決策ではなく、心の奥底からの理解と癒しを重視
- 相手が話したい気持ちになるような安全で温かい空間を作る

【shouldFinalize判定】
相手の心が十分に理解され、以下が自然に揃ったときにtrueに：
1. 感情が十分に受け止められ、心理的安全性が確立された
2. 体験の意味や感情の根源が深く理解された  
3. その人なりの気づきや学びが芽生え始めた
4. 前向きな一歩を踏み出す心の準備ができた

【大切にすること】
- 一人ひとりの感情体験を唯一無二のものとして尊重する
- 「正解」を押し付けず、その人の中にある答えを一緒に見つける
- 弱さや痛みも含めて、その人の全てを受け入れる
- 回復と成長は人それぞれのペースがあることを理解する

JSON形式で返してください：
{
  "message": "心からの共感と理解を込めた温かい応答（感情に応じて適切な長さで）",
  "shouldFinalize": boolean
}`;

    // 感情に寄り添う会話の進行指示
    const turnContext = conversationTurn === 1 
      ? `\n\n[この瞬間のあなたの役割] 
最初の出会い：相手の心に安全な場所を作ってください。その人の体験を心から受け止め、一人じゃないことを伝えましょう。感情の深さに敏感になり、表面的な出来事よりも、その人の心の動きに真摯に寄り添ってください。急がず、まずはその人の気持ちを完全に理解することに集中してください。`
      : conversationTurn === 2
      ? `\n\n[この瞬間のあなたの役割]
信頼の深まり：相手の心がより開かれてきたこの時を大切にしてください。複雑な感情や矛盾した気持ちも含めて、その人の全てを受け入れましょう。その人の強さや美しさを見つけたときは、心からの敬意と感動を込めて伝えてください。`
      : conversationTurn === 3
      ? `\n\n[この瞬間のあなたの役割]
理解の深化：十分な信頼関係の中で、その人の体験の意味をより深く理解する時です。痛みの中にある成長の種や、その人らしい強さを一緒に発見しましょう。もし相手の心の準備ができていれば、そっと新しい視点への扉を開いてあげてください。`
      : `\n\n[この瞬間のあなたの役割]
心の準備の確認：${conversationTurn}回目の会話です。相手の感情が十分に理解され、心理的安全性が確立されているかを感じ取ってください。その人なりの気づきが自然に芽生えているなら、優しく学びへの移行を提案してみてください。決して急かさず、その人のペースを最優先にしてください。`;

    const conversationContext = conversationHistory 
      ? `過去の会話:\n${conversationHistory}\n\n現在のメッセージ: ${userMessage}${turnContext}`
      : `ユーザーの体験: ${userMessage}${turnContext}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // ユーザーがgpt-4oを明示的に要求
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: conversationContext
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // 感情表現と共感の幅を広げるため少し高めに
      max_tokens: 800   // より豊かで深い共感的応答を可能にするため増加
    });

    const rawJson = response.choices[0].message.content;
    if (!rawJson) {
      throw new Error("AIからの応答が空です");
    }

    const data: ConversationResponse = JSON.parse(rawJson);
    return data;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("AI応答の生成に失敗しました");
  }
}

export async function generateFinalizationResponse(
  conversationHistory: string
): Promise<FinalizationResponse> {
  try {
    const systemPrompt = `あなたは深い共感力を持つ温かいAIカウンセラーとして、この方との大切な会話の旅路を振り返り、その人の心の中に芽生えた貴重な学びを、愛情を込めて言葉にしてあげてください。

【学びの抽出における感情知能（EQ）アプローチ】
- この人の痛みや困難の体験を、成長への尊い旅路として敬意を持って捉える
- 表面的な解決策ではなく、その人の心の深いところで起きた変化や気づきを大切にする
- 完璧でなくても、その人らしい小さな一歩や気づきを心から称賛する
- その人の内なる強さや美しさが、困難を通してより輝いたことを伝える
- 人間らしい脆さや不完全さも含めて、その人の全存在を受け入れた学びにする

【growth（成長・気づき）の表現】
- その人が体験した感情の旅路を振り返り、どんな内面的な成長があったかを温かく言語化
- 痛みの中でも失わなかった強さや、困難を通して発見した新しい自分への気づき
- 「あなたは〜ということを体験されました」という敬意のある表現で
- その人の感情体験の価値と意味を深く認めた内容にする
- 最大3行で、心の奥底に響くような温かく力強い言葉で

【hint（今後への学び）の表現】
- 押し付けがましくない、その人の心に自然に寄り添うような提案
- 5分でできる小さなことから、その人らしく始められる内容
- 「〜してみてはいかがでしょうか」「〜という時間を持つことができたら素敵ですね」
- その人の感情や体験パターンに配慮した、心理的に安全な提案
- 完璧を求めず、その人のペースで歩んでいけるような優しい導き

【表現の心】
- この人と過ごした時間への感謝と敬意を込める
- 一人の人間として、その人の勇気と美しさを心から讃える
- 希望を押し付けるのではなく、その人の中にある光を信じる気持ちを伝える
- 二度と同じではない、その人だけの特別な成長ストーリーとして

JSON形式で以下のように返してください：
{
  "growth": "この方の心の旅路で芽生えた貴重な成長と気づき（最大3行、愛情と敬意を込めて）",
  "hint": "その人らしく歩んでいけるための温かい提案（心理的安全性を大切にして）"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // ユーザーがgpt-4oを明示的に要求
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `会話履歴:\n${conversationHistory}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // 感情表現と共感の幅を広げるため少し高めに
      max_tokens: 900   // より豊かで心のこもった学びの表現を可能にするため増加
    });

    const rawJson = response.choices[0].message.content;
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
    console.error("OpenAI API error:", error);
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