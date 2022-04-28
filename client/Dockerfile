FROM node:16

WORKDIR /app/client

COPY . .

RUN npm i && npm run build

CMD [ "npm", "start" ]
