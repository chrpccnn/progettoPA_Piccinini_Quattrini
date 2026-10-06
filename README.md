# Progetto Programmazione Avanzata

L'obiettivo del progetto è la realizzazione di un sistema di gestione di Space Battleship 3D, una variante spaziale e tridimensionale
della battaglia navale. 

Backend REST sviluppato in **Node.js, Express, TypeScript, Sequelize e MySQL**, con ambiente containerizzato tramite Docker.

Il progetto è strutturato a livelli, in modo da separare la gestione delle richieste HTTP, la logica applicativa e l'accesso al database.

---

## 1. Tecnologie utilizzate

* **Node.js** — runtime JavaScript
* **TypeScript** — linguaggio utilizzato per il codice sorgente
* **Express** — framework per la realizzazione delle API REST
* **Sequelize** — ORM per la comunicazione con MySQL
* **MySQL 8** — database relazionale
* **Docker / Docker Compose** — containerizzazione dell'applicazione e del database
* **Jest** — testing
* **Supertest** — test delle API HTTP
* **express-validator** — validazione dei dati ricevuti dalle API
* **dotenv** — gestione delle variabili d'ambiente

---

# 2. Struttura del progetto

La struttura prevista è la seguente:

```text
progettopa_piccinini_quattrini/
│
├── src/
│   ├── config/
│   │   └── database.ts
│   │
│   ├── controllers/
│   │   ├── indexController.ts
│   │   └── authController.ts
│   │
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   │
│   ├── models/
│   │   └── user.ts
│   │
│   ├── repositories/
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   └── indexService.ts
│   │
│   ├── types/
│   │   └── api.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   └── app.test.ts
│
├── dist/
│   └── ...
│
├── .env
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
├── package-lock.json
└── README.md
```

La cartella `dist/` viene generata automaticamente durante la compilazione TypeScript e non contiene codice da modificare manualmente.

---

# 3. Organizzazione del codice

Il progetto segue una separazione a livelli.

Il flusso principale di una richiesta sarà:

```text
Client / Postman
       │
       ▼
   Middleware
       │
       ▼
     Route
       │
       ▼
   Controller
       │
       ▼
    Service
       │
       ▼
 Repository / DAO
       │
       ▼
    Sequelize
       │
       ▼
      MySQL
```

La risposta segue il percorso inverso fino al client.

Questa separazione permette di evitare di inserire tutta la logica all'interno delle route e rende il progetto più semplice da mantenere e testare.

---

# 4. Cartella `src`

La cartella `src` contiene tutto il codice sorgente scritto in TypeScript.

## `src/app.ts`

Contiene la configurazione principale di Express.

Qui vengono registrati:

* middleware globali;
* parsing delle richieste JSON;
* router;
* gestione degli errori.

Non deve contenere la logica delle singole funzionalità.

Esempio del flusso attuale:

```text
Express
  │
  ├── express.json()
  ├── logger
  ├── routes
  └── errorHandler
```

---

## `src/server.ts`

È il punto di avvio dell'applicazione.

Si occupa principalmente di:

1. caricare le variabili d'ambiente;
2. verificare la connessione al database;
3. avviare il server HTTP.

La configurazione di Express rimane invece in `app.ts`.

Questa separazione permette anche di utilizzare `app.ts` direttamente nei test senza dover avviare un server reale.

---

# 5. `src/config`

Contiene la configurazione delle componenti esterne dell'applicazione.

Attualmente contiene:

```text
src/config/
└── database.ts
```

## `database.ts`

Contiene la configurazione di Sequelize e della connessione a MySQL.

Le credenziali e le configurazioni variabili non devono essere scritte direttamente nel codice, ma devono essere recuperate tramite variabili d'ambiente.

---

# 6. `src/routes`

Contiene le definizioni degli endpoint REST.

Esempio:

```text
GET /
```

Le route devono avere il compito di collegare:

```text
HTTP method + URL
        ↓
    Controller
```

La logica applicativa non deve essere inserita direttamente nelle route.

Quando verranno aggiunte nuove funzionalità, gli endpoint potranno essere organizzati in router separati, ad esempio:

```text
src/routes/
├── index.ts
├── userRoutes.ts
├── authRoutes.ts
└── ...
```

I nomi definitivi verranno stabiliti in base alla specifica del progetto.

---

# 7. `src/controllers`

I controller rappresentano il livello che gestisce le richieste HTTP.

Sono responsabili principalmente di:

* ricevere `Request`;
* recuperare i parametri della richiesta;
* chiamare il Service appropriato;
* costruire la risposta HTTP;
* restituire status code e dati al client.

Il controller non dovrebbe contenere la logica principale dell'applicazione.

Esempio concettuale:

```text
Request
   ↓
Controller
   ↓
Service
   ↓
Response
```

Quando verranno aggiunte nuove funzionalità, ogni gruppo di endpoint potrà avere il proprio controller.

---

# 8. `src/services`

I Service contengono la logica applicativa.

Sono il punto in cui verranno implementate le regole del progetto.

Il Service non dovrebbe occuparsi direttamente della gestione della richiesta HTTP.

Esempio:

```text
Controller
    │
    ▼
 Service
    │
    ├── controlli
    ├── regole applicative
    └── operazioni richieste
```

Quando verranno definite le funzionalità dal progetto, verranno creati i Service necessari.

---

# 9. `src/repositories`

Questa cartella è predisposta per separare l'accesso al database dalla logica applicativa.

I Repository/DAO saranno responsabili delle operazioni sui dati tramite Sequelize.

Esempio concettuale:

```text
Service
   │
   ▼
Repository
   │
   ▼
Sequelize
   │
   ▼
MySQL
```

Il Service non dovrebbe contenere direttamente query o operazioni specifiche del database quando queste possono essere delegate al Repository.

I Repository verranno aggiunti quando saranno definite le entità e le operazioni richieste dalla specifica.

---

# 10. `src/models`

Contiene i Model Sequelize che rappresentano le entità del database.

La struttura definitiva dei Model verrà stabilita dopo aver ricevuto la specifica del progetto e aver identificato:

* entità;
* attributi;
* chiavi primarie;
* chiavi esterne;
* relazioni;
* vincoli.

Esempio futuro:

```text
src/models/
├── User.ts
├── ...
└── index.ts
```

I nomi sono solamente esempi: verranno definiti in base alla specifica reale.

---

# 11. `src/middleware`

Contiene i middleware Express.

Attualmente sono presenti:

```text
src/middleware/
├── logger.ts
├── validation.ts
└── errorHandler.ts
```

## `logger.ts`

Registra le richieste ricevute dal server.

## `validation.ts`

Gestisce la validazione dei dati utilizzando `express-validator`.

## `errorHandler.ts`

Gestisce gli errori non gestiti dalle route e restituisce una risposta HTTP appropriata.

---

## Middleware futuri

In base alla specifica potranno essere aggiunti middleware per:

* autenticazione JWT;
* autorizzazione tramite ruoli;
* validazione;
* gestione di errori personalizzati;
* altri controlli richiesti dal progetto.

Il middleware dovrà essere utilizzato per funzionalità trasversali, evitando di duplicare gli stessi controlli nei vari controller.

---

# 12. `src/types`

Contiene le interfacce e i tipi TypeScript condivisi dall'applicazione.

Attualmente è presente:

```text
src/types/api.ts
```

Questa cartella potrà contenere in futuro i tipi necessari per:

* request;
* response;
* dati dei Model;
* payload JWT;
* DTO;
* altri oggetti utilizzati tra i vari livelli.

---

# 13. Autenticazione e autorizzazione

L'autenticazione avviene tramite le rotte /auth/register e /auth/login. 

Tramite /auth/register è possibile registrare un utente tramite email, il ruolo viene definito in modo fisso "USER" e inserito nel DB.

Tramite /auth/login è possibile effettuare l'accesso al sistema così da poter essere autenticato e agire in base ai propri privilegi.

La struttura prevista potrà comprendere componenti come:

```text
src/
├── controller/
│   ├── authController.ts
│   └── ...
│
├── middleware/
│   ├── authMiddleware.ts
│   └── roleMiddleware.ts
│
├── routes/
│   └── authRoutes.ts
│
├── services/
│   └── authService.ts
│
└── ...
```

Il sistema potrà utilizzare JWT per identificare l'utente autenticato e middleware dedicati per controllare i permessi.

La struttura definitiva verrà stabilita in base ai requisiti effettivi del progetto.

---

# 14. Gestione degli errori

Gli errori devono essere gestiti in modo centralizzato quando possibile.

Il flusso previsto è:

```text
Errore
  ↓
Service / Repository
  ↓
Controller
  ↓
Error Handler
  ↓
HTTP Response
```

In futuro potranno essere introdotti errori personalizzati e un sistema centralizzato per costruire le risposte di errore.

---

# 15. Test

I test si trovano nella cartella:

```text
tests/
```

Attualmente è presente:

```text
tests/
└── app.test.ts
```

I test utilizzano:

* Jest;
* Supertest.

I test dovranno verificare progressivamente:

* middleware;
* endpoint;
* autenticazione;
* autorizzazione;
* Service;
* gestione degli errori;
* comportamento delle funzionalità principali.

I test devono essere aggiornati ogni volta che vengono introdotte nuove funzionalità importanti.

---

# 16. Docker

Il progetto utilizza Docker Compose per eseguire:

```text
┌───────────────────────┐
│       Backend         │
│   Node.js + Express   │
└───────────┬───────────┘
            │
            │ Sequelize
            ▼
┌───────────────────────┐
│        MySQL 8        │
└───────────────────────┘
```

I servizi sono definiti in:

```text
docker-compose.yml
```

Il backend viene costruito tramite:

```text
Dockerfile
```

Il database utilizza un volume Docker per mantenere i dati anche quando il container viene ricreato.

---

# 17. Variabili d'ambiente

Le configurazioni sensibili e variabili vengono mantenute nel file:

```text
.env
```

Esempi di configurazioni:

```text
PORT
MSQLUSR
MSQLPSW
MSQLDB
MSQLROOTPSW
DB_HOST
DB_PORT
```

Il file `.env` non deve essere condiviso nel repository.

Per questo motivo è inserito nel `.gitignore`.

---

# 18. File JavaScript generati

Il codice sorgente viene scritto in TypeScript:

```text
src/*.ts
```

e compilato in JavaScript:

```text
dist/*.js
```

La compilazione viene effettuata tramite:

```bash
npm run build
```

I file presenti in `dist/` sono quindi file generati automaticamente e non devono essere modificati manualmente.

La cartella `dist/` è esclusa dal repository tramite `.gitignore`.

---

# 19. Comandi principali

Installazione delle dipendenze:

```bash
npm install
```

Compilazione TypeScript:

```bash
npm run build
```

Avvio del server:

```bash
npm start
```

Esecuzione dei test:

```bash
npm test
```

Avvio dell'ambiente Docker:

```bash
docker compose up -d --build
```

Arresto dei container:

```bash
docker compose down
```

Visualizzazione dello stato dei container:

```bash
docker compose ps
```

---

# 20. Struttura da seguire durante lo sviluppo

Quando viene aggiunta una nuova funzionalità, bisogna prima identificare il livello a cui appartiene.

Regola generale:

```text
Nuova API
   │
   ├── Route
   │
   ├── Controller
   │
   ├── Service
   │
   ├── Repository / DAO
   │
   └── Model
```

Non tutta ogni funzionalità dovrà necessariamente utilizzare tutti i livelli, ma la logica dovrà essere inserita nel livello corretto.

### Regole principali

**Route**

Definisce l'endpoint.

**Controller**

Gestisce HTTP request e response.

**Service**

Implementa la logica applicativa.

**Repository / DAO**

Gestisce l'accesso ai dati.

**Model**

Rappresenta le entità del database.

**Middleware**

Gestisce controlli trasversali alle richieste.

**Config**

Contiene configurazioni e connessioni a servizi esterni.

**Types**

Contiene tipi e interfacce condivise.

**Tests**

Verifica il comportamento dell'applicazione.

---

# 21. Sviluppo futuro

La struttura verrà completata progressivamente seguendo la specifica del progetto.

Ordine previsto:

```text
1. Analisi della specifica
          ↓
2. Identificazione delle entità
          ↓
3. Definizione delle relazioni
          ↓
4. Creazione dei Model Sequelize
          ↓
5. Creazione Repository / DAO
          ↓
6. Implementazione dei Service
          ↓
7. Implementazione dei Controller
          ↓
8. Definizione delle Route
          ↓
9. Middleware e autenticazione
          ↓
10. Gestione degli errori
          ↓
11. Test
          ↓
12. Postman
          ↓
13. Docker e verifica finale
          ↓
14. Documentazione e diagrammi
```

La struttura definitiva delle cartelle e dei file verrà modificata solamente quando i requisiti del progetto lo richiederanno.

---

# 22. Stato attuale

Attualmente sono funzionanti:

* server Express;
* struttura `app.ts` / `server.ts`;
* connessione Sequelize a MySQL;
* database MySQL tramite Docker;
* Docker Compose;
* middleware di logging;
* middleware di validazione;
* gestione centralizzata degli errori;
* prima route REST;
* Service;
* Controller;
* test con Jest e Supertest;
* compilazione TypeScript;
* avvio del backend tramite Docker.

L'implementazione delle funzionalità specifiche del progetto verrà effettuata dopo aver ricevuto e analizzato la relativa specifica.
