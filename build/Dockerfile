#######################
# Client Build Stage
#######################
FROM node:13.12.0 AS client-builder

ENV NODE_ENV=production

WORKDIR /app

COPY ./client .

RUN npm i --no-progress && \
  npm run build


#######################
# Server Build Stage
#######################
FROM golang:1.14.2-alpine AS server-builder

ENV CGO_ENABLED=0
ENV GO111MODULE=on
ENV GOARCH=amd64
ENV GOOS=linux

WORKDIR /src

COPY ./server .

RUN go build -ldflags="-w -s" -o /server ./main.go && \
  # Create the user and group files that will be used in the running container to
  # run the process an unprivileged user.
  mkdir /user && \
  echo 'nobody:x:65534:65534:nobody:/:' > /user/passwd && \
  echo 'nobody:x:65534:' > /user/group


#######################
# Final Stage
#######################
FROM scratch AS final

ENV PORT 8080
ENV DIR_PATH /app/dist

WORKDIR /app

COPY --from=client-builder /app/dist /app/dist

COPY --from=server-builder /user/group /user/passwd /etc/
COPY --from=server-builder /server /app/server

USER nobody:nobody

EXPOSE 8080

ENTRYPOINT ["/app/server"]
