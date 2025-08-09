import { Card, CardContent } from "@/components/ui/card";

export default function LoadingIndicator() {
  return (
    <div className="flex justify-start mr-8">
      <Card className="bg-white border-leaf/10 rounded-2xl shadow-sm max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-leaf/60 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-leaf/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-leaf/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-ink/60 text-sm">考えています...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
