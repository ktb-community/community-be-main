FROM node:20-alpine
WORKDIR /usr/src/app
ENV TZ=Asia/Seoul
RUN apk add --no-cache tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
COPY package.json yarn.lock ./
RUN yarn install --production
COPY ./ ./
ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "src/app.js"]