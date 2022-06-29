# ReVanced Builder
This project will allow you to build ReVanced and download YouTube APK easily!

## Required
You'll need at least NodeJS v13, Zulu JDK 17 and ADB

## How to build

### First, clone or download the repository
### Second, install the modules (`npm i`)
### Third, build ReVanced! (`node . --patch`)
### If you want to exclude a patch, add the `exclude` option:
### `node . --patch --exclude disable-shorts-button`
### If you want to exclude more, seperate the patches with a comma:
### `node . --patch --exclude disable-shorts-button,microg-support`
### If you want to patch a specific YT version, download the APK, move it to this folder and rename it to `youtube.apk`:
### `node . --patch --manual-apk`