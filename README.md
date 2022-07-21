# ReVanced Builder

This project will allow you to download the YouTube APK and build ReVanced easily!

## Required

You'll need at least [Zulu JDK 17](https://www.azul.com/downloads/?version=java-17-lts&package=jdk) and [ADB](https://developer.android.com/studio/command-line/adb) (optional, required only for rooted phones).

If you plan to use it from source, you'll also require [NodeJS >=13](https://nodejs.org/).

## The noob way

If you aren't tech savvy, you can download the precompiled EXE file from [here](https://github.com/reisxd/revanced-builder/releases/latest).

## How to build

1. Clone or download the repository.

```bash
$ git clone https://github.com/reisxd/revanced-builder
```

2. Install the modules.

```bash
$ npm install
```

3. Build ReVanced!

```bash
$ node . --patch
```

If you want to exclude a patch, use the `--exclude` option, example:

```bash
$ node . --patch --exclude disable-shorts-button
```

If you want to exclude more, seperate the patches with a comma:

```bash
$ node . --patch --exclude disable-shorts-button,microg-support
```

If you want to explicitly include a patch, use the `--include` option, example:

```bash
$ node . --patch --include autorepeat-by-default
```

If you want to include more, seperate the patches with a comma (same as the exclude option).

If you want to patch a specific YT version, download the APK, move it to this folder and rename it to `youtube.apk`:

```bash
$ node . --patch --manual-apk
```

## Docker

If you want to build revanced using docker with this node implementation, you can use the included Dockerfile.

```bash
$ docker build -t revanced-builder .
$ docker run --rm -v $(pwd):/app -it revanced-builder
```
