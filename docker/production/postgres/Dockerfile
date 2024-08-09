FROM postgres:15.8

RUN buildDeps='git make build-essential postgresql-server-dev-15' \
		&& apt update && apt install -y $buildDeps --no-install-recommends --reinstall ca-certificates \
		&& git clone https://github.com/evirma/pg_bktree.git /usr/local/src/bktree \
  		&& cd /usr/local/src/bktree \
		&& make USE_PGXS=1 && make USE_PGXS=1 install \
		&& apt purge -y --auto-remove $buildDeps

EXPOSE 5432
CMD docker-entrypoint.sh postgres
