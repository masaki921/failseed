import { createRoot } from "react-dom/client";
import App from "./App";
import TestComponent from "./TestComponent";
import "./index.css";

// デバッグ: コンソールに出力
console.log("main.tsx is loading...");

const rootElement = document.getElementById("root");
console.log("Root element found:", rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log("React root created, rendering TestComponent first...");
  
  // テスト用：シンプルなコンポーネントを最初にレンダリング
  root.render(<TestComponent />);
  
  // 2秒後にメインアプリに切り替え
  setTimeout(() => {
    console.log("Switching to main App...");
    root.render(<App />);
  }, 2000);
  
  console.log("Components scheduled for rendering");
} else {
  console.error("Root element not found!");
}
