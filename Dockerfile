FROM node:lts-buster

WORKDIR /app

RUN apt-get --yes update && \
  apt-get --yes install wget java-common libasound2 libxi6 libxtst6 && \
  wget -O /app/zulu.deb https://cdn.azul.com/zulu/bin/zulu17.34.19-ca-jdk17.0.3-linux_amd64.deb && \
  yes | dpkg -i /app/zulu.deb && \
  rm /app/zulu.deb && \
  apt-get -f install

RUN mkdir revanced/

RUN apt-get --yes install xdg-utils

RUN wget -O /app/builder https://github.com/reisxd/revanced-builder/releases/download/v3.4.5/revanced-builder-linux

RUN chmod +x builder

EXPOSE 8000

CMD ["/app/builder"]
