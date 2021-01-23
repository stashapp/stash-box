
# must be built from /dist directory

FROM ubuntu:20.04 as prep
LABEL MAINTAINER="https://discord.gg/Uz29ny"

RUN apt-get update && \
    apt-get -y install curl xz-utils && \
    apt-get autoclean -y && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

FROM ubuntu:20.04 as app
RUN apt-get update && apt-get -y install ca-certificates
COPY /stashdb-linux /usr/bin/stash-box

EXPOSE 9998
CMD ["stash-box"]
