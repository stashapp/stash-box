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
	
WORKDIR /

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


