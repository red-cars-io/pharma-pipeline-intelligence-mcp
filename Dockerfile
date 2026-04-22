FROM apify/actor-node:20
COPY package.json ./
RUN npm install --only=prod
COPY . .
CMD ["node", "src/main.js"]
