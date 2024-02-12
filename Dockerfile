# Use uma imagem base do Node.js
FROM node:latest

# Crie e defina o diretório de trabalho no contêiner
WORKDIR /usr/src/app

# Copie o package.json e o package-lock.json (se existirem) para o diretório de trabalho
COPY package*.json ./

# Instale as dependências da aplicação
RUN npm install

# Copie o código-fonte da aplicação para o diretório de trabalho
COPY ./src .
# Comando para iniciar a aplicação
CMD [ "node", "server.js" ]
