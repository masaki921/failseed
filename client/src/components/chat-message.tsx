import { Card, CardContent } from "@/components/ui/card";

interface ChatMessageProps {
  message: {
    type: 'user' | 'ai';
    content: string;
    isStep1?: boolean;
    isStep2?: boolean;
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end ml-8' : 'justify-start mr-8'}`}>
      <Card className={`max-w-md rounded-2xl shadow-sm ${
        isUser 
          ? 'bg-leaf text-white border-leaf' 
          : 'bg-white border-leaf/10'
      }`}>
        <CardContent className="p-4">
          {message.content.includes('**') ? (
            <div className="space-y-3">
              {message.content.split('\n\n').map((section, index) => {
                if (section.startsWith('**受けとめ**:')) {
                  return (
                    <div key={index} className="pb-2 border-b border-current/20">
                      <div className="font-medium text-sm opacity-80 mb-1">受けとめ</div>
                      <div>{section.replace('**受けとめ**: ', '')}</div>
                    </div>
                  );
                }
                if (section.startsWith('**質問**:')) {
                  return (
                    <div key={index}>
                      <div className="font-medium text-sm opacity-80 mb-1">質問</div>
                      <div>{section.replace('**質問**: ', '')}</div>
                    </div>
                  );
                }
                if (section.startsWith('**育った部分**:')) {
                  return (
                    <div key={index} className="pb-2 border-b border-current/20">
                      <div className="font-medium text-sm opacity-80 mb-1">育った部分</div>
                      <div className="whitespace-pre-line">
                        {section.replace('**育った部分**:\n', '')}
                      </div>
                    </div>
                  );
                }
                if (section.startsWith('**芽を伸ばすヒント**:')) {
                  return (
                    <div key={index} className="bg-current/10 rounded-xl p-3">
                      <div className="font-medium text-sm opacity-80 mb-1 flex items-center">
                        <span className="mr-2">💡</span>
                        芽を伸ばすヒント
                      </div>
                      <div>{section.replace('**芽を伸ばすヒント**: ', '')}</div>
                    </div>
                  );
                }
                return (
                  <div key={index}>{section}</div>
                );
              })}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
