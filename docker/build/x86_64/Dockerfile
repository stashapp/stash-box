# this dockerfile must be built from the top-level stash directory
# ie from top=level stash:
# docker build -t stash-box/build -f docker/build/x86_64/Dockerfile .

FROM golang:1.13.14 as compiler

RUN apt-get update && apt-get install -y apt-transport-https
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update && \
    apt-get install -y nodejs yarn xz-utils --no-install-recommends || exit 1; \
	rm -rf /var/lib/apt/lists/*;
	
ENV PACKR2_VERSION=2.0.2
ENV PACKR2_SHA=f95ff4c96d7a28813220df030ad91700b8464fe292ab3e1dc9582305c2a338d2
ENV PACKR2_DOWNLOAD_FILE=packr_${PACKR2_VERSION}_linux_amd64.tar.gz
ENV PACKR2_DOWNLOAD_URL=https://github.com/gobuffalo/packr/releases/download/v${PACKR2_VERSION}/${PACKR2_DOWNLOAD_FILE}

WORKDIR /
RUN wget ${PACKR2_DOWNLOAD_URL}; \
	echo "$PACKR2_SHA $PACKR2_DOWNLOAD_FILE" | sha256sum -c - || exit 1; \
	tar -xzf $PACKR2_DOWNLOAD_FILE -C /usr/bin/ packr2; \
	rm $PACKR2_DOWNLOAD_FILE;

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# copy the ui yarn stuff so that it doesn't get rebuilt every time
COPY ./frontend/package.json ./frontend/yarn.lock /stash-box/frontend/
COPY ./Makefile /stash-box/

WORKDIR /stash-box
RUN make pre-ui

COPY . /stash-box/
ENV GO111MODULE=on

RUN make generate 
RUN make ui 
RUN make build

FROM ubuntu:19.10 as app

RUN apt-get update && apt-get -y install ca-certificates
COPY --from=compiler /stash-box/stash-box /usr/bin/

EXPOSE 9998
CMD ["stash-box", "--config_file", "/root/.stash-box/stash-box-config.yml"]


