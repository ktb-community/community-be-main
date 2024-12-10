FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --prod
COPY ./ ./
EXPOSE 8000
CMD ["node", "src/app.js"]