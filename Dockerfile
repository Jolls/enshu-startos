# syntax=docker/dockerfile:1
#
# Custom build: upstream-project/Dockerfile builds only the `enshu` binary into a
# distroless (shell-less) final stage. This package's oneshot ('migrate' in
# startos/main.ts) needs to run `goose` against /migrations before the daemon
# starts, so this Dockerfile adds a second binary and keeps a minimal shell in
# the final stage. See UPDATING.md for how this tracks upstream-project's pin.

FROM golang:1.26 AS build
WORKDIR /src
COPY upstream-project/go.mod upstream-project/go.sum ./
RUN go mod download
COPY upstream-project/ .
RUN CGO_ENABLED=0 go build -o /out/enshu ./cmd/enshu
# Version pin matches upstream-project's own CI (.github/workflows/ci.yml).
RUN CGO_ENABLED=0 go install github.com/pressly/goose/v3/cmd/goose@v3.27.3 \
    && cp "$(go env GOPATH)/bin/goose" /out/goose

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /out/enshu /usr/local/bin/enshu
COPY --from=build /out/goose /usr/local/bin/goose
COPY upstream-project/migrations /migrations
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/enshu"]
