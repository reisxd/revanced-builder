FROM node:lts-buster

WORKDIR /app

RUN apt-get update && \
  apt-get -y install wget java-common libasound2 libxi6 libxtst6 && \
  wget -O /app/zulu.deb https://cdn.azul.com/zulu/bin/zulu17.34.19-ca-jdk17.0.3-linux_amd64.deb && \
  yes | dpkg -i /app/zulu.deb && \
  rm /app/zulu.deb && \
  apt-get -f install

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "."]
