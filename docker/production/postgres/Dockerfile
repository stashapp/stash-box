FROM postgres:17.2

RUN apt-get update \
		&& apt-get install -y --no-install-recommends \
			git \
			make \
			gcc \
			postgresql-server-dev-17 \
			ca-certificates \
		&& git clone https://github.com/fake-name/pg-spgist_hamming.git \
		&& make -C pg-spgist_hamming/bktree \
		&& make -C pg-spgist_hamming/bktree install \
		&& rm -rf pg-spgist_hamming \
		&& apt-get purge -y --auto-remove \
			git \
			make \
			gcc \
			postgresql-server-dev-17 \
		&& rm -rf /var/lib/apt/lists/*

EXPOSE 5432
CMD ["postgres"]
