FROM node:20-alpine

# 作業ディレクトリ
WORKDIR /app

# 依存関係だけ先に入れる
COPY package*.json ./
RUN npm install

# ソースを全部コピー
COPY . .

# バックエンドが使うポート
EXPOSE 8787

# Hono を起動
CMD ["npm", "run", "dev"]