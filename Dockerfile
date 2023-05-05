FROM node:20.0.0-alpine as development
ENV NODE_ENV=development

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn run build

FROM node:20.0.0-alpine as production
ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --only-production
COPY dist ./dist

CMD ["node", "dist/src/main"]

