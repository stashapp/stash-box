FROM postgres:18

# Build and install pg-spgist_hamming (pHash matching)
RUN apt-get update \
    && apt-get install -y --no-install-recommends make gcc postgresql-server-dev-18 git ca-certificates \
    && git clone --depth 1 https://github.com/InfiniteStash/pg-spgist_hamming.git /tmp/pg-spgist_hamming \
    && make -C /tmp/pg-spgist_hamming \
    && make -C /tmp/pg-spgist_hamming install \
    && rm -rf /tmp/pg-spgist_hamming /var/lib/apt/lists/* \
    && apt-get purge -y --auto-remove make gcc postgresql-server-dev-18 git

# Install pg_search (ParadeDB full-text search)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fLo /tmp/pg_search.deb \
        https://github.com/paradedb/paradedb/releases/download/v0.26.4/postgresql-18-pg-search_0.26.4-1PARADEDB-trixie_amd64.deb \
    && apt-get install -y postgresql-18-pgvector /tmp/pg_search.deb \
    && rm -f /tmp/pg_search.deb \
    && apt-get purge -y curl \
    && rm -rf /var/lib/apt/lists/*

CMD ["postgres", "-c", "shared_preload_libraries=pg_search"]
