FROM node:20-alpine
WORKDIR /usr/src/app
RUN apt install --no-cache tzdata
COPY package.json yarn.lock ./
RUN yarn install --production
COPY ./ ./
ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "src/app.js"]