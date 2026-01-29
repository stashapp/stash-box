FROM postgres:18-bookworm

RUN apt-get update \
		&& apt-get install -y --no-install-recommends \
			git \
			make \
			gcc \
			curl \
			postgresql-server-dev-18 \
			ca-certificates \
			libicu72 \
		&& git clone https://github.com/fake-name/pg-spgist_hamming.git \
		&& make -C pg-spgist_hamming/bktree \
		&& make -C pg-spgist_hamming/bktree install \
		&& rm -rf pg-spgist_hamming \
		&& curl -L "https://github.com/paradedb/paradedb/releases/download/v0.21.4/postgresql-18-pg-search_0.21.4-1PARADEDB-bookworm_amd64.deb" -o /tmp/pg_search.deb \
		&& apt-get install -y /tmp/pg_search.deb \
		&& rm -f /tmp/pg_search.deb \
		&& apt-get purge -y \
			git \
			make \
			gcc \
			curl \
			postgresql-server-dev-18 \
		&& apt-get autoremove -y --purge \
		&& rm -rf /var/lib/apt/lists/*

EXPOSE 5432
CMD ["postgres"]
