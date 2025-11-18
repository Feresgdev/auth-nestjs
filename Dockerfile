FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build
RUN apk add --no-cache curl

EXPOSE 5000

CMD ["npm", "run", "start:dev"]