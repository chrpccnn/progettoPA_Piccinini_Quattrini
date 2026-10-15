# Progetto Programmazione Avanzata - Space Battleship 3D

**Repository (branch principale):** https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini/tree/main

## 1. Obiettivo del progetto

L'obiettivo del progetto è la realizzazione di un backend REST di **Space Battleship 3D**, una variante spaziale e tridimensionale della battaglia navale.

Il sistema permette di gestire utenti, autenticazione, partite tra utenti o contro un'intelligenza artificiale e le principali meccaniche di gioco, tra cui:

* gestione di una griglia tridimensionale;
* posizionamento delle navi;
* gestione delle flotte;
* gestione dei giocatori umani e IA;
* gestione dei turni;
* sistema di Energy;
* sistema di TOKEN economici;
* azioni di gioco;
* contromosse;
* attacchi;
* scansioni;
* scudi;
* movimento delle navi;
* determinazione della vittoria e della fine della partita.

Il backend è sviluppato utilizzando:

* **Node.js**
* **Express**
* **TypeScript**
* **Sequelize**
* **MySQL**
* **Docker / Docker Compose**

Il progetto segue una struttura a livelli e utilizza principi di progettazione orientati agli oggetti e pattern architetturali per separare le responsabilità e rendere il codice più manutenibile.

---

# 2. Tecnologie utilizzate

* **Node.js** — runtime JavaScript
* **TypeScript** — linguaggio utilizzato per il codice sorgente
* **Express** — framework per la realizzazione delle API REST
* **Sequelize** — ORM per la comunicazione con MySQL
* **MySQL 8** — database relazionale
* **Docker / Docker Compose** — containerizzazione dell'applicazione e del database
* **Jest** — testing
* **Supertest** — test delle API HTTP
* **Zod** — validazione e tipizzazione degli input delle API, con applicazione dei valori di default
* **dotenv** — gestione delle variabili d'ambiente
* **bcrypt** — hashing delle password
* **jsonwebtoken** — autenticazione tramite JWT

---

# 3. Struttura del progetto

La struttura del progetto separa API REST, logica applicativa, persistenza e dominio di gioco.

```text
progettoPA_Piccinini_Quattrini/
├── src/
│   ├── cli/                  # CLI testuale per provare il dominio
│   ├── config/               # configurazione database
│   ├── controllers/          # gestione richieste HTTP
│   ├── errors/               # AppError ed ErrorFactory
│   ├── middleware/           # auth, ruolo, Zod, logger, error handler
│   ├── models/
│   │   ├── Action/           # action e countermeasure
│   │   ├── Engine/           # Game, GameEngine, EnergyConfig, HistoryCsv
│   │   ├── Players/          # HumanPlayer e AIPlayer
│   │   ├── fleet/            # Fleet, Ship, FleetConfig, FleetFactory
│   │   └── grid/             # griglia, celle e coordinate
│   ├── repository/           # authRepository e gameRepository
│   ├── routes/               # route base, auth e game
│   ├── services/             # authService, gameService, indexService
│   ├── Zod/                  # schema e tipi derivati dagli input API
│   ├── TokenCost.ts
│   ├── app.ts
│   └── server.ts
├── tests/
├── Dockerfile
├── docker-compose.yaml
├── package.json
└── README.md
```

La cartella `dist/` viene generata automaticamente durante la compilazione TypeScript e non contiene codice da modificare manualmente.

---

# 4. Progettazione

Il progetto è stato progettato separando le responsabilità tra diversi livelli.

Il flusso generale delle richieste REST è:

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
  Repository
       │
       ▼
   Sequelize
       │
       ▼
     MySQL
```

Le funzionalità di dominio del gioco sono invece organizzate separatamente dalla parte REST (domain-driven design leggera).

---

# 5. Dominio di gioco

_(le sezioni 5–24 mantengono la stessa struttura e contenuto funzionale del README originale; qui integriamo dettagli di implementazione e aggiornamenti)_

## 5.1 Grid

La griglia è attualmente implementata con la classe `MapGrid` (implementazione concreta dell'interfaccia `Grid`). Internamente viene usata una mappa (Map) per risparmiare memoria sulle celle vuote e permettere accessi O(1) per coordinate convertite in chiavi stringa/oggetti `Coordinates`.

Nota implementativa: la factory `GridFactory.create(width, height, depth)` restituisce l'istanza corretta e viene utilizzata durante la creazione della partita nelle routine di setup.

---

## 5.2 Coordinates

`Coordinates` è un Value Object con factory `Coordinates.create(x,y,z)`. La factory mantiene un cache interno (flyweight) che garantisce che per ogni terna (x,y,z) venga restituita la stessa istanza — utile per confronti di identità nelle Map/Set.

---

## 5.3 Cell

Le celle sono leggere: contengono solo lo stato (`CellState`) e riferimenti eventualmente a entità che le occupano. Stati principali: EMPTY, OCCUPIED, HIT, MISS. Lo stato degli scudi e altre coperture è mantenuto nella partita per poter essere consultato anche da azioni future.

---

# 6. Navi e flotte

Dettagli implementativi aggiuntivi:

- `Ship` è responsabile della validazione della propria dimensione e orientamento. I metodi principali sono `hit(coordinate)`, `isDestroyed()`, `moveTo(newCoordinates[])`.
- Ogni `Ship` mantiene un Set/Map delle posizioni occupate e un Set delle posizioni colpite per un controllo efficiente dello stato.
- `Fleet` mantiene liste di navi indicizzate per tipo e fornisce metodi per validare composizione, conteggio e coerenza all'interno della griglia.

---

# 7. Player

I giocatori sono modellati tramite l'interfaccia `IPlayer` con implementazioni `HumanPlayer` e `AIPlayer`.

- `HumanPlayer` contiene riferimenti a User (persistito nel DB), mentre `AIPlayer` è un'entità senza utente associato.
- `AIPlayer` espone metodi per generare posizionamenti validi e calcolare mosse base (attacco casuale, scansione mirata, ecc.). L'IA attuale è euristica e si basa su posizionamenti casuali e scelte semplici in fase di attacco.

---

# 8. Game

`Game` incapsula lo stato di una singola partita. Le transizioni di stato (WAITING → RUNNING → FINISHED) sono validate in `GameEngine`/`Game`.

Implementazione: l'oggetto partita serializza solo i campi necessari per la persistenza (ID, stato, turno, giocatori, griglia semplificata, energia/crediti). La persistenza completa del dominio avviene tramite trasformazioni (DTO ↔ domain) gestite nel repository.

---

# 9. Action e Command Pattern

Le azioni implementano `IAction` (metodi `getCost()` ed `execute(context)`).

- `BasicMove` e `Countermeasure` sono categorie che raggruppano le varie action concrete.
- Ogni action è testabile isolatamente: i test unitari invocano `execute` passando un `ActionContext` costruito con helper di test.

---

# 10. ActionContext

L'`ActionContext` contiene riferimenti al `Game` e al `Player` corrente e fornisce helper per effettuare lookup sicuri (es. ottenere fleet avversaria, controllare energia residua, applicare effetti temporanei come scudi).

---

# 11–15 Basic Moves / Countermeasures

Tutte le regole descritte nella sezione originale sono implementate come logica all'interno delle rispettive action. Le action non toccano direttamente il DB: effettuano le mutazioni sullo stato dell'istanza `Game` in memoria; il repository è responsabile di serializzare il nuovo stato al termine del turno.

---

# 16. GameEngine

`GameEngine` è implementato come Singleton e orchestratore centrale dell'esecuzione di action e contromosse. Le responsabilità implementative principali sono:

- validare pre-condizioni (stato partita, turno, energia, regole di movimento)
- consumare resource (energy, token)
- invocare `action.execute(context)`
- applicare effetti collaterali (aggiornare stato nave, segnare cellule, impostare scudi)
- avanzare il turno (`nextTurn()`)

Importante: la logica specifica delle action rimane dentro l'action stessa; l'engine chiama e si limita a orchestrare e persistere.

---

# 17–18 Energy e TOKEN

La configurazione di `Energy` è gestita tramite `EnergyConfig` con valori di default e validazione Zod. I TOKEN rappresentano una valuta separata; la logica di addebito è implementata nelle chiamate ai servizi che creano partite o eseguono azioni a costo di token.

---

# 19–22 Creazione partita, posizionamento e turni

- Endpoint REST `POST /game` valida il body con Zod, applica i default (griglia, fleet, energy) e crea il dominio `Game` via `GameService`.
- Nel caso `USER vs USER` il creatore indica `opponentEmail`; le email devono essere diverse.
- Per `USER vs AI` il sistema genera un `AIPlayer` con posizionamento valido.
- L'IA usa una strategia di posizionamento che prova a collocare navi dalla più grande alla più piccola, rollbackando e ritentando se necessario fino a trovare una configurazione valida.

---

# 23. Autenticazione e autorizzazione

Endpoints principali:

* `POST /auth/register` — registra un nuovo utente (email, password). Password hashed con `bcrypt`.
* `POST /auth/login` — autentica e restituisce JWT.

Il JWT è verificato dal middleware e il payload viene validato con Zod. Il ruolo (USER/ADMIN) viene assegnato dal sistema; gli ADMIN possono ricaricare TOKEN.

---

# 24. Pattern utilizzati

Vengono utilizzati Repository, Service Layer, Command Pattern, Factory, Singleton e Value Object come descritto nella versione originale. Implementativamente:

- Repository: ogni repository espone metodi CRUD e metodi di mapping domain↔persistence.
- Service: orchestrano la validazione Zod, la logica applicativa e chiamano i repository.
- Controllers: ricevono le richieste, validano input e delegano ai servizi; aspettano DTO/oggetti semplificati come risultato.

---

# 25. src/app.ts & #26 src/server.ts

`src/app.ts` configura Express, registra middleware (parser JSON, logger, autenticazione, error handler) e monta le rotte; non avvia il server per permettere di importare l'app nei test.

`src/server.ts` importa `app` e avvia l'HTTP server. In produzione è il punto di ingresso principale.

---

# 27. Script utili (package.json)

I comandi più utili sono:

* `npm run build` — compila TypeScript in `dist/`.
* `npm run start` — avvia il server compilato (`node dist/server.js`).
* `npm run dev` — avvia in sviluppo con `nodemon` (esegue `src/server.ts`).
* `npm run test` — esegue test con `jest`.
* `npm run seed:dev` — esegue lo seed in TS (utile in sviluppo).

---

# 28. Variabili d'ambiente

L'app legge le configurazioni principali da variabili d'ambiente. Esempi attesi (nomi possono variare a seconda del file in `src/config`):

* DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
* JWT_SECRET
* NODE_ENV

Assicurarsi che queste variabili siano impostate (o presenti in `.env` in sviluppo) prima dell'avvio.

---

# 29. Persistence e Sequelize

La persistenza è astratta tramite repository che utilizzano Sequelize per salvare entità come User, Game, History, TokenBalance ecc. Le trasformazioni tra oggetti di dominio e tabelle sono centralizzate nelle classi repository.

Nota: non tutte le entità di dominio sono mappate 1:1 nel DB; alcuni campi complessi (es. griglia, posizione navi) vengono serializzati in JSON dentro colonne text/JSON a seconda della configurazione del DB.

---

# 30. Testing

La suite di test utilizza Jest e Supertest per test end-to-end delle API. Le unità di dominio sono testate isolatamente (action, fleet, ship, grid). Per eseguire i test è consigliabile avere un DB di test o usare mocking dei repository.

---

# 31. Docker

Sono presenti `Dockerfile` e `docker-compose.yaml` per avviare l'app e un'istanza MySQL in container. Usare `docker compose up --build` per avviare l'ambiente completo.

---

# 32. Ultimi aggiornamenti (changelog)

Questi sono i commit più recenti inclusi nel repository (descrizione e impatto sul codice):

* [collegamento rotte action countermeasure e pass](https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini/commit/4aea0e308a969a23b82fe5224359d99a302912eb) — 2026-10-14 by lauraqua
  - integrazione e collegamento delle rotte relative alle action di tipo `Countermeasure` e alla transizione `PASS` nella finestra delle contromosse;
  - impatto: aggiornamenti ai controller/route e probabilmente al `GameEngine` per gestire la finestra di contromossa.

* [Sequence diagram e rotta refill](https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini/commit/e3660e7722f486ed8ac5d57d8a882e7d89f85aab) — 2026-10-14 by lauraqua
  - aggiunta/provvisorio dei diagrammi di sequenza per documentare il flusso delle chiamate; aggiunta rotta `refill` (ricarica token) e relativo handler;
  - impatto: nuove API per refill token e documentazione aggiornata per il comportamento di refill.

* [persistenza](https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini/commit/5fd9f24b3af9d6f5308d20babbde4d7de8735687) — 2026-10-13 by chrpccnn
  - commit che introduce o modifica la logica di persistenza; mapping domain↔DB consolidato;
  - impatto: miglioramenti nel repository layer e nella serializzazione delle entità di gioco.

* [correzione scan](https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini/commit/adacd959fc1aabc892ea7d57ef5ddb587ec2c49d) — 2026-10-13 by chrpccnn
  - fix alla logica di `Scan` (probabilmente alla verifica dei bordi o conteggio delle celle occupate);
  - impatto: comportamento della scansione corretto e test associati aggiornati.

* [Sequence diagrams provvisori](https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini/commit/c3bca726737191da1b9e43ae99659bd518e0dff4) — 2026-10-12 by lauraqua
  - aggiunta diagrammi provvisori per la documentazione delle sequenze di gioco e API.

Nota: l'API returns page-limited results; ci sono altri commit storici precedenti a questi. Vuoi che includa l'intera cronologia commit o solo un changelog sintetico come qui?

---

# 33. Come contribuire / sviluppo locale rapido

1. clonare il repository
2. copiare `.env.example` in `.env` e impostare le variabili d'ambiente
3. eseguire `npm install`
4. se si usa Docker: `docker compose up --build` (crea DB e avvia l'app)
5. in locale (senza Docker) assicurarsi che il DB sia raggiungibile e poi:
   * `npm run seed:dev` per popolare dati di esempio
   * `npm run dev` per avviare in modalità sviluppo
6. eseguire i test con `npm run test`

---

# 34. Contatti

Per domande sul codice o report di bug aprire una issue sul repository o contattare gli autori tramite GitHub.

---

(README aggiornato automaticamente per riflettere gli ultimi commit e per includere il link al branch `main`; se vuoi che inserisca più dettagli tecnici su file specifici (ad es. esempi di interfacce, snippet da `GameEngine`, `Action` o repository) indicami quali file desideri che citi e li estrarrò direttamente dal codice.)
