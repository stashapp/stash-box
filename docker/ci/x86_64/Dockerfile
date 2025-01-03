
# must be built from /dist directory

FROM alpine as app
LABEL MAINTAINER="https://discord.gg/Uz29ny"

RUN apk add --update --no-cache --repository https://dl-3.alpinelinux.org/alpine/edge/community --repository https://dl-3.alpinelinux.org/alpine/edge/main vips

COPY stash-box-linux /usr/bin/stash-box

EXPOSE 9998
CMD ["stash-box", "--config_file", "/root/.stash-box/stash-box-config.yml"]
