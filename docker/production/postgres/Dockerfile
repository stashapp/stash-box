FROM postgres:16

RUN buildDeps='git make gcc postgresql-server-dev-16' \
		&& apt update && apt install -y $buildDeps --no-install-recommends --reinstall ca-certificates clang llvm-dev \
		&& git clone https://github.com/elkorol/pg-spgist_hamming.git \
		&& make -C pg-spgist_hamming/bktree \
		&& make -C pg-spgist_hamming/bktree install \
		&& rm -rf pg-spgist_hamming \
		&& apt purge -y --auto-remove $buildDeps

EXPOSE 5432
CMD docker-entrypoint.sh postgres
