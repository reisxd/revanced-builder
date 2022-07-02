# ReVanced Builder

This project will allow you to download the YouTube APK and build ReVanced easily!

## Required

You'll need at least [NodeJS v13](https://nodejs.org/), [Zulu JDK 17](https://www.azul.com/downloads/?version=java-17-lts&package=jdk) and [ADB](https://developer.android.com/studio/command-line/adb) (optional, required for root).

## The noob way

If you aren't tech savvy, you can download the prebuilt EXE file from [here](https://github.com/reisxd/revanced-builder/releases).

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

If you want to exclude a patch, use the `--exclude` option:
```bash
$ node . --patch --exclude disable-shorts-button
```

If you want to exclude more, seperate the patches with a comma:
```bash
$ node . --patch --exclude disable-shorts-button,microg-support
```

If you want to patch a specific YT version, download the APK, move it to this folder and rename it to `youtube.apk`:
```bash
$ node . --patch --manual-apk
```
