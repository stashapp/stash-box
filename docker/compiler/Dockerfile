FROM dockercore/golang-cross:1.13.14
LABEL maintainer="github.com/stashapp/stash-box"

ENV PACKR2_VERSION=2.0.2
ENV PACKR2_SHA=f95ff4c96d7a28813220df030ad91700b8464fe292ab3e1dc9582305c2a338d2
ENV PACKR2_DOWNLOAD_FILE=packr_${PACKR2_VERSION}_linux_amd64.tar.gz
ENV PACKR2_DOWNLOAD_URL=https://github.com/gobuffalo/packr/releases/download/v${PACKR2_VERSION}/${PACKR2_DOWNLOAD_FILE}

# Install tools
RUN apt-get update && apt-get install -y apt-transport-https
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -

RUN apt-get update && \
    apt-get install -y automake autogen \
    libtool libxml2-dev uuid-dev libssl-dev bash \
    patch make tar xz-utils bzip2 gzip sed cpio \
	--no-install-recommends || exit 1; \
	rm -rf /var/lib/apt/lists/*;

RUN mkdir -p /root/.ssh; \
    chmod 0700 /root/.ssh; \
    ssh-keyscan github.com > /root/.ssh/known_hosts;

RUN wget ${PACKR2_DOWNLOAD_URL}; \
			echo "$PACKR2_SHA $PACKR2_DOWNLOAD_FILE" | sha256sum -c - || exit 1; \
			tar -xzf $PACKR2_DOWNLOAD_FILE -C /usr/bin/ packr2; \
			rm $PACKR2_DOWNLOAD_FILE;

CMD ["packr2", "version"]