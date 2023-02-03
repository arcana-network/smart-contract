FROM node:12-buster
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run compile
CMD [ "npm", "run", "deploy:network", "localNetwork" ]