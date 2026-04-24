FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npx", "http-server", "-p", "8080", "-c-1", "--cors", "."]
