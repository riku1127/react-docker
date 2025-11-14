import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // ← 外部アクセスを許可（必須）
    port: 5174,              // ← 固定化
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8787", // ← localhost → backend に変更！
        changeOrigin: true,
      },
    },
  },
});
