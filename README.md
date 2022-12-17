# ReVanced Builder

This project will allow you to download the APK of any of the [officially supported](https://github.com/revanced/revanced-patches#-patches) apps and build ReVanced easily!

## Required

You'll need at least [Zulu JDK 17](https://www.azul.com/downloads/?version=java-17-lts&package=jdk) and [ADB](https://developer.android.com/studio/command-line/adb) (optional, required only for rooted phones).

If you plan to use it from source, you'll also require [Node.js >= 16](https://nodejs.org/).

## How to use

If you are on a PC, download the latest executable from [here](https://github.com/reisxd/revanced-builder/releases/latest) or if you are on a Android device, please see [this](https://github.com/reisxd/revanced-builder/wiki/How-to-use-revanced-builder-on-Android).

**NOTE: If you intend to build the rooted version of either YouTube or YouTube Music, you must have the stock YouTube app to be the same version as the one chosen for building. Otherwise, the build will fail.**

## For developers

For developers, see [this](https://github.com/reisxd/revanced-builder/blob/main/DEVELOPERS.md)

## How to use (Docker)

Required [docker](https://docs.docker.com/get-docker/) and [docker-compose (for \*nix cli)](https://docs.docker.com/compose/install/linux/) must be installed

**Note:** If you're using Docker Desktop, `docker-compose` will be pre-installed.

Clone the repository and `cd` into the directory `revanced-builder`

### Build using `docker-compose`

```bash
docker-compose build --no-cache
```

This builds the Docker image (`--no-cache` is used to build the image from scratch; sometimes the cache might cause version conflicts).

After building, launch the container (runs at `localhost:8000`):

```bash
docker-compose up -d
```

To stop the container:

```bash
docker-compose down
```

**Note: docker-compose uses docker-compose.yml so make sure you are in the same directory `revanced-builder`**

To update to a newer version, stop the existing container if it is running, build the image and start it again.

### Build using only `docker`

```bash
docker build . -t <name_of_the_image> --no-cache
```

Run the newly built container:

```bash
docker run -d --name <name_of_container> -p 8000:8000 --restart unless-stopped -v ./revanced/:/app/revanced-builder/revanced/ <name_of_the_image>
```

This launches the container on `http://localhost:8000`

To stop the container:

```bash
docker rm <name_of_container> -f
docker rmi <name_of_the_image> -f
```

To update to a newer version of Builder, stop the existing container if it is running, build the container start it again.

In both the builds, a persistent storage is kept. All the builds are stored in `<path/to>/revanced-builder/revanced/`.
