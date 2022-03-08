# Build stage
FROM node:16.13.1-alpine3.15 as build

RUN apk add --update --no-cache \
    curl \
    alpine-sdk \
    python3

WORKDIR /var/www

COPY package.json yarn.lock /var/www/

RUN yarn install --pure-lockfile

COPY . /var/www

RUN NODE_OPTIONS="--max-old-space-size=2048" yarn build

RUN npm prune --production

# Final image
FROM node:16.13.1-alpine3.15

ARG UID=1001
ARG GID=1001

RUN addgroup -S syncingserver -g $GID && adduser -D -S syncingserver -G syncingserver -u $UID

WORKDIR /var/www

RUN chown -R $UID:$GID .

USER syncingserver

COPY --from=build /var/www /var/www

ENTRYPOINT [ "docker/entrypoint.sh" ]

CMD [ "start-web" ]
