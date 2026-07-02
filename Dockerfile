FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000

# 🚀 Run the TypeScript file directly using your dev setup configuration
CMD ["npx", "ts-node", "src/server.ts"]
