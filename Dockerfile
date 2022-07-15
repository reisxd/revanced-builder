FROM node:18-buster

RUN mkdir /app
RUN apt-get --yes update && apt-get --yes install wget
RUN apt-get --yes install java-common libasound2 libxi6 libxtst6
RUN wget -O /app/zulu.deb https://cdn.azul.com/zulu/bin/zulu17.34.19-ca-jdk17.0.3-linux_amd64.deb
RUN yes | dpkg -i /app/zulu.deb
RUN apt-get -f install

WORKDIR /app
VOLUME app

CMD npm install && node . --patch