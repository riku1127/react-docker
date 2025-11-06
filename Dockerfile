# ベースイメージ
FROM node:20-bullseye

# 作業ディレクトリ
WORKDIR /app

# 先に package 系だけ入れて依存を入れる
COPY package*.json ./
RUN npm install

# 残りのソースを全部コピー
COPY . .

# Vite のポート
EXPOSE 5173

# 開発サーバー起動
CMD ["npm", "run", "dev", "--", "--host"]
