FROM node:20.0.0-alpine as development
ENV NODE_ENV=development

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:20.0.0-alpine as production
ENV NODE_ENV=production

RUN apk --no-cache add tzdata && \
	cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
	echo "Asia/Seoul" > /etc/timezone \
	apk del tzdata

RUN npm i -g pnpm

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --prod
COPY dist ./dist

CMD ["node", "dist/src/main"]

