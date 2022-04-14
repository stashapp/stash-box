
# must be built from /dist directory

FROM alpine as app
LABEL MAINTAINER="https://discord.gg/Uz29ny"

COPY stash-box-linux /usr/bin/stash-box

EXPOSE 9998
CMD ["stash-box", "--config_file", "/root/.stash-box/stash-box-config.yml"]
