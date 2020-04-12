# Exif Hound 🐕

A simple application deisgned for the digital forensics community for tracking EXIF metadata in the real world.

## Environment Variables

```bash
# client/
NODE_ENV=development

# server/
PORT=8080
DIR_PATH=../client/dist

```

## Development 🔨

```bash
$ cd client/ && npm i --no-progress

$ npm run dev
```

## Docker 🐳

A multi-staged build with a resulting image size of `13MB`.

```bash
$ docker build -t exif-hound:dev -f build/Dockerfile .

$ docker run -it -p 8080:8080 exif-hound:dev
```
