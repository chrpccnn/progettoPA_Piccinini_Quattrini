# Immagine Node.js utilizzata per preparare ed eseguire l'applicazione.
FROM node:24 AS build

# Definisce la directory di lavoro all'interno del container.
WORKDIR /app

# Copia i manifest delle dipendenze per installarle prima del codice sorgente.
COPY package*.json ./

# Installa le dipendenze rispettando il lockfile.
RUN npm ci

# Copia il resto del progetto nel container.
COPY . .

# Compila il progetto.
RUN npm run build

# Documenta la porta utilizzata dall'applicazione.
EXPOSE 3000

# Avvia l'applicazione tramite lo script start di package.json.
CMD ["npm", "start"]