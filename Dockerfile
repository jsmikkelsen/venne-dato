FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Opret datamappen så permissions er korrekte
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]