FROM postgres:13.3-alpine

RUN apk add git build-base 
RUN apk add clang-dev llvm-dev
RUN git clone https://github.com/fake-name/pg-spgist_hamming.git
RUN cd pg-spgist_hamming/bktree && make && make install

EXPOSE 5432
CMD docker-entrypoint.sh postgres
