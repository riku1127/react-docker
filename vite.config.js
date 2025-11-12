import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // ← 外部アクセスを許可（必須）
    port: 5173,              // ← 固定化
    strictPort: true,        // ← 勝手に5174に逃げないように
    proxy: {
      "/api": {
        target: "http://backend:8787", // ← localhost → backend に変更！
        changeOrigin: true,
      },
    },
  },
});
