FROM node:16

WORKDIR /app/server

COPY . .

RUN npm install -g @nestjs/cli && \
  npm i && \
  npm run build

CMD [ "node", "dist" ]
