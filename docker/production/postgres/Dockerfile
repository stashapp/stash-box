FROM postgres:18-trixie

# Build and install pg-spgist_hamming (pHash matching)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git make gcc postgresql-server-dev-18 ca-certificates \
    && git clone https://github.com/fake-name/pg-spgist_hamming.git \
    && make -C pg-spgist_hamming/bktree \
    && make -C pg-spgist_hamming/bktree install \
    && rm -rf pg-spgist_hamming \
    && apt-get purge -y --auto-remove git make gcc postgresql-server-dev-18 \
    && rm -rf /var/lib/apt/lists/*

# Install pg_search (ParadeDB full-text search)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && curl -fLo /tmp/pg_search.deb \
        https://github.com/paradedb/paradedb/releases/download/v0.21.5/postgresql-18-pg-search_0.21.5-1PARADEDB-trixie_amd64.deb \
    && apt-get install -y /tmp/pg_search.deb \
    && rm -f /tmp/pg_search.deb \
    && apt-get purge -y curl \
    && rm -rf /var/lib/apt/lists/*
