FROM node:20

WORKDIR  /backend

COPY  package*.json ./

RUN npm install

RUN npm install -g ts-node

COPY . .

EXPOSE 6969 1234

CMD ["npx", "ts-node", "app.ts"]