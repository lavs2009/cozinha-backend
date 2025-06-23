# Imagem base leve com Node.js
FROM node:20-slim

# Adiciona utilitários necessários
RUN apt-get update && apt-get install -y \
  curl \
  bash \
  postgresql-client \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN yarn install

# Copia o restante do código, incluindo schema.prisma e pasta prisma/
COPY . .

# Compila a aplicação
#RUN yarn build

# Expõe a porta usada pela aplicação
EXPOSE 3000

# Comando padrão para iniciar o app
CMD ["yarn", "start"]