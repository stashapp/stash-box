FROM postgres:14.2

RUN buildDeps='git make gcc postgresql-server-dev-14' \
		&& apt update && apt install -y $buildDeps --no-install-recommends --reinstall ca-certificates \
		&& git clone https://github.com/fake-name/pg-spgist_hamming.git \
		&& make -C pg-spgist_hamming/bktree \
		&& make -C pg-spgist_hamming/bktree install \
		&& rm -rf pg-spgist_hamming \
		&& apt purge -y --auto-remove $buildDeps

EXPOSE 5432
CMD docker-entrypoint.sh postgres
