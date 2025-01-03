
# must be built from /dist directory

FROM ubuntu:24.04 as app
LABEL MAINTAINER="https://discord.gg/Uz29ny"

RUN apt-get update && apt-get install -y libvips

COPY stash-box-linux /usr/bin/stash-box

EXPOSE 9998
CMD ["stash-box", "--config_file", "/root/.stash-box/stash-box-config.yml"]
