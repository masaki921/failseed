import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 静的ファイル配信
app.use(express.static(path.join(__dirname, "../dist/public")));

// すべてのルートでindex.htmlを返す（SPA用）
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

const port = 3000; // 異なるポートを使用
app.listen(port, "0.0.0.0", () => {
  console.log(`🌱 FailSeed serving on port ${port}`);
});