# Sistema multi-utente per il rilevamento di attacchi di rete basato su architettura client-server

Il sistema sviluppato si inserisce in un contesto applicativo in cui è necessario monitorare il traffico di rete per individuare possibili attività sospette. Nell’infrastruttura ipotizzata, il client invia richieste al backend contenenti feature estratte da flussi di rete (ad esempio sorgente, volume, dimensione dei pacchetti e segnali di anomalie come SYN flood), mentre il server applica procedure di controllo, verifica le credenziali e valuta il rischio associato al traffico.

## 🧠 Obiettivo del progetto

Il presente progetto simula tale scenario attraverso l’impiego di un’architettura client-server, all’interno della quale il client invia al backend richieste contenenti feature estratte dal traffico di rete, come:

- `sourceIP`, ovvero l’indirizzo sorgente del traffico, che identifica l’host che genera i pacchetti;
- `packets`, cioè il numero dei pacchetti inviati in un intervallo di tempo specifico, utile per individuare il volume di traffico anomalo;
- `bytes`, ovvero la quantità totale di bytes trasmessi nella comunicazione tra client e service;
- `synPacketsCount`, cioè il numero di pacchetti TCP con flag `SYN`, rilevante per individuare attacchi `SYN Flood`.

Il backend riceve le richieste tramite API REST sviluppate con Node.js, Express e TypeScript, verifica autenticazione e autorizzazione mediante token JWT, poi valida i dati ricevuti e avvia la logica di analisi del traffico. Sulla base di regole predefinite, il sistema classifica il flusso come benigno o sospetto, applicando decisioni di tipo accesso consentito, warning o blocco.

Il traffico viene classificato tramite un approccio rule-based, basato su regole e soglie predefinite, distinguendo tra:

- traffico benigno;
- attacchi DoS;
- tentativi di brute force.

Sulla base della classificazione ottenuta, il sistema produce una decisione operativa tra:

- consentire la richiesta;
- generare un avviso;
- applicare un blocco temporaneo;
- applicare un blocco permanente.

Il sistema include inoltre una componente di persistenza dei dati basata sull’utilizzo di database relazionale esterno, interfacciato mediante Sequelize, così da memorizzare le analisi effettuate e le informazioni di stato del sistema.

Le informazioni salvate possono essere consultate attraverso rotte protette riservate agli utenti amministratori.

## ⚙️ Strumenti per lo sviluppo

- Node.js
- Express
- TypeScript
- Sequelize
- SQLite / MySQL
- JWT
- Docker
- Jest
- Postman
- Diagrammi UML

## 📌 Aggiornamenti recenti

Nel corso dello sviluppo abbiamo consolidato la struttura del backend, ampliato la logica applicativa e migliorato in modo concreto la parte di autenticazione e gestione delle API. In particolare, i recenti avanzamenti includono:

- introduzione dell’autenticazione con chiave RSA e token JWT firmati con algoritmo `RS256`, con verifica della firma tramite chiave pubblica;
- miglioramento della gestione degli stati HTTP e delle risposte REST per le azioni dell’AI, con comportamento più chiaro e più robusto in caso di errori;
- aggiunta della logica di posizionamento manuale delle navi, utile per testare scenari più realistici e controllati;
- aggiornamento della documentazione dei diagrammi, dei flussi delle API e della struttura del dominio applicativo;
- consolidamento della CLI come strumento rapido per verificare la logica di gioco senza dover partire da un client esterno.

Questi cambiamenti sono coerenti con l’architettura adottata: il dominio resta isolato da HTTP e database, mentre i controller, i service e la repository gestiscono i punti di contatto tra il sistema e il mondo esterno. La CLI, in particolare, continua a risultare utile per validare rapidamente la logica del motore e del gioco prima di passare a test più complessi o all’uso da parte di un client reale.

## 🧭 Diagrammi UML

### Diagramma dei casi d'uso

<img src="./Sequence Diagrams/casiduso.png" alt="Diagramma dei casi d'uso" width="900" />

### Diagramma delle classi

```mermaid
classDiagram
    class User {
      +id: number
      +username: string
      +passwordHash: string
      +role: string
    }

    class AuthService {
      +login(username, password): Token
      +register(userData): User
      +verifyToken(token): Payload
    }

    class JwtMiddleware {
      +authenticate(req, res, next)
      +authorize(role, req, res, next)
    }

    class AuthController {
      +login(req, res)
      +register(req, res)
    }

    class GameController {
      +createGame(req, res)
      +getGameState(req, res)
      +executeAction(req, res)
    }

    class GameService {
      +createGame()
      +getState()
      +executeAction(action)
      +restoreGame()
    }

    class GameEngine {
      +executeMove(action)
      +applyCountermeasure(action)
      +resolveTurn()
    }

    class Player {
      +name: string
      +type: PlayerType
      +energy: number
    }

    class HumanPlayer
    class AIPlayer

    class AIStrategy {
      +chooseAction(gameState): Action
    }

    class FleetFactory {
      +buildFleet(): Fleet
    }

    class GridFactory {
      +buildGrid(): Grid
    }

    class GameRepository {
      +save(game)
      +findById(id)
      +update(game)
    }

    class GameModel
    class UserModel

    classDef app fill:#f8fafc,stroke:#334155,stroke-width:1.2px,color:#0f172a;
    classDef core fill:#e0f2fe,stroke:#0284c7,stroke-width:1.2px,color:#082f49;
    classDef domain fill:#dcfce7,stroke:#16a34a,stroke-width:1.2px,color:#14532d;
    classDef data fill:#ede9fe,stroke:#7c3aed,stroke-width:1.2px,color:#4c1d95;

    class AuthService,AuthController,GameController,GameService,JwtMiddleware app;
    class GameEngine,Player,HumanPlayer,AIPlayer,AIStrategy,FleetFactory,GridFactory core;
    class User,GameRepository,GameModel,UserModel data;
    class GameService --> GameEngine
    class GameEngine --> Player
    class HumanPlayer --> GameEngine
    class AIPlayer --> AIStrategy
    class FleetFactory --> GridFactory
    class AuthController --> AuthService
    class GameController --> GameService
    class JwtMiddleware --> AuthController
    class GameService --> GameRepository
    class GameRepository --> GameModel
    class AuthService --> UserModel
    class User --> UserModel
```

### Diagramma di sequenza

La seguente tabella riassume le principali caratteristiche delle rotte del sistema.

| Metodo | Endpoint | Descrizione | Autenticazione | Gestore richiesta HTTP |
| |---|---|---|---|
| POST | `/api/auth/login` | Verifica le credenziali dell'utente e genera un token JWT | No | `AuthController` |
| POST | `/api/detection` | Riceve i dati di traffico e ne restituisce la classificazione e la decisione | No | `DetectionController` |
| GET | `/api/admin/statistics` | Restituisce lo stato delle IP monitorate e lo stato di blocco | JWT | `AdminController` |
| GET | `/api/admin/analysis` | Restituisce l'elenco delle analisi memorizzate | JWT | `AdminController` |
| DELETE | `/api/admin/cache` | Svuota la cache del sistema | JWT | `AdminController` |

### Sequenza: login

<img src="./Sequence Diagrams/SD login.png" alt="Diagramma di sequenza login" width="900" />

### Sequenza: creazione partita / analisi principale

<img src="./Sequence Diagrams/SD game.png" alt="Diagramma di sequenza creazione partita" width="900" />

### Sequenza: azione / movimento

<img src="./Sequence Diagrams/SD action.png" alt="Diagramma di sequenza azione" width="900" />

### Sequenza: contromisura

<img src="./Sequence Diagrams/SD countermeasure.png" alt="Diagramma di sequenza contromisura" width="900" />

### Sequenza: stato e storicizzazione

<img src="./Sequence Diagrams/SD state.png" alt="Diagramma di sequenza stato" width="900" />

<img src="./Sequence Diagrams/SD history.png" alt="Diagramma di sequenza storico" width="900" />

### Sequenza di alta qualità / overview

<img src="./Sequence Diagrams/3D BATTLESHIP-2026-10-23-101904.png" alt="Overview layout del sistema" width="900" />

---

## 🔐 Rotta `/api/auth/login`

Questa rotta autentica l’utente verificando username e password forniti. Se le credenziali inserite sono corrette, il server genera e restituisce un token JWT. Nella collection Postman è stato definito il payload di login e la chiave pubblica usata per la verifica del token, con supporto all’algoritmo RSA (`RS256`).

Il flusso è il seguente:

1. il client invia una richiesta `POST /api/auth/login` con `username` e `password`;
2. la richiesta viene intercettata da `authRoutes`, che la inoltra a `AuthController`;
3. `AuthController` richiama `AuthService`;
4. `AuthService` usa il repository per verificare l’utente nel database;
5. se le credenziali sono valide, viene generato un JWT firmato con chiave RSA;
6. il server restituisce `200 OK` con il token e il client lo usa nelle richieste successive come header `Authorization`.

In questa base architetturale, il repository gestisce il lato dati, mentre il service coordina la logica applicativa. In questo progetto, lo stesso principio si ritrova in `src/repository/gameRepository.ts`, `src/services/gameService.ts` e `src/models/Engine/GameEngine.ts`.

## 🚦 Rotta `/api/detection`

Questa rotta riceve i dati di traffico provenienti dal client e li analizza per individuare eventuali attacchi di rete.

Il flusso di esecuzione della rotta è il seguente:

1. il client invia una richiesta `POST /api/detection`;
2. la richiesta viene intercettata da `detectionRoutes`;
3. il middleware di validazione verifica la presenza dei campi obbligatori;
4. `DetectionController` richiama `DetectionService`;
5. il service verifica lo stato del sistema, aggiorna la cache e analizza il traffico;
6. il risultato viene classificato e associato a una decisione finale;
7. la risposta viene inviata al client in JSON.

Se si verifica un’eccezione, l’error middleware la gestisce e restituisce un errore HTTP.

Nel codice del progetto reale, il punto equivalente è il motore di azioni e regole del gioco: `src/models/Engine/GameEngine.ts`, che applica validazioni, gestisce azioni e contromisure e determina lo stato finale di una partita.

## 📊 Rotta `/api/admin/statistics`

Questa rotta consente a un amministratore autenticato di visualizzare lo stato degli IP monitorati dal sistema. Il flusso prevede:

1. `authMiddleware` per verificare il token JWT;
2. `roleMiddleware` per verificare il ruolo amministratore;
3. `AdminController` per recuperare le statistiche;
4. risposta `200 OK` con i dati richiesti.

In questo progetto, il medesimo principio di separazione tra autenticazione e autorizzazione è rispettato tramite `src/middleware/authMiddleware.ts` e `src/middleware/roleMiddleware.ts`, e la logica di controllo delle autorizzazioni è eseguita prima dell’accesso alle risorse protette.

## 🗃️ Rotta `/api/admin/analysis`

Questa rotta consente ad un amministratore autenticato di visualizzare tutte le analisi memorizzate nel database. In questo caso il repository è il punto centrale per la persistenza, così come avviene in `src/repository/gameRepository.ts` e nei modelli Sequelize presenti in `src/models/db`.

## 🧹 Rotta `/api/admin/cache`

Questa rotta svuota la cache del sistema, utile per resettare lo stato temporaneo delle richieste e dei blocchi. In pratica, il controller richiama un service che delega la cancellazione della cache e il reset del sistema in modo centralizzato e sicuro.

---

## 🧩 Design Pattern utilizzati

Il progetto adotta diversi pattern software per garantire separazione delle responsabilità, facilità di manutenzione ed estendibilità del codice.

### 1) Layered Architecture

Il progetto è organizzato a livelli, ciascuno con responsabilità precise:

- `routes`: definiscono gli endpoint e la catena di middleware;
- `middleware`: controllano autenticazione, autorizzazione e gestione errori;
- `controllers`: ricevono la richiesta e la inoltrano al service;
- `services`: orchestrano la logica applicativa;
- `repository`: gestiscono persistenza e recupero dei dati;
- `models`: rappresentano il dominio e i dati persistenti.

Questo schema è leggibile in tutta la struttura del codice, e in particolare in `src/routes`, `src/controllers`, `src/services` e `src/repository`.

### 2) Repository Pattern

Il Repository Pattern separa la logica applicativa dalle operazioni di persistenza. Il service non interagisce direttamente con il database, ma usa un repository che incapsula tutte le chiamate SQL e la semantica del salvataggio dei dati.

Esempi concreti:

- `src/repository/gameRepository.ts`: salva e riporta lo stato delle partite e dei giocatori;
- `src/models/db`: modelli Sequelize usati dal repository per mappare i dati al dominio;
- `src/services/gameService.ts`: usa il repository, non il database direttamente.

Questo produce un design molto pulito: il dominio resta indipendente da Sequelize.

### 3) Strategy Pattern

Lo strategy pattern è stato usato per separare la logica di scelta dell’azione da quella di esecuzione. L’idea è che un algoritmo di decisione possa cambiare senza dover modificare il motore del gioco.

Nel codice reale:

- `src/models/Players/AIStrategy.ts` implementa la logica di scelta dell’AI;
- `AIPlayer` usa questa strategia per decidere se attaccare, spostarsi, difendersi o preparare una contromisura;
- `GameEngine` applica la decisione senza dover conoscere i dettagli specifici dell’algoritmo di IA.

Questa scelta è fondamentale per rendere l’AI facilmente sostituibile o estendibile.

### 4) Singleton Pattern

Il motore del sistema è stato modellato come singleton per evitare di creare istanze multiple di un componente centrale.

In `src/models/Engine/GameEngine.ts` troviamo:

```ts
public static getInstance(): GameEngine {
  if (GameEngine.instance === undefined) {
    GameEngine.instance = new GameEngine();
  }
  return GameEngine.instance;
}
```

Questo assicura che tutta la logica di esecuzione delle azioni e delle contromisure sia centralizzata in un unico punto.

### 5) Factory Pattern

Le classi factory servono a creare oggetti complessi senza lasciare la responsabilità al chiamante. In questo progetto sono presenti diversi esempi:

- `src/models/grid/GridFactory.ts`: costruisce la griglia;
- `src/models/fleet/FleetFactory.ts`: crea flotte e posiziona le navi;
- `src/errors/ErrorFactory.ts`: centralizza la creazione di errori applicativi.

Questa logica è molto utile perché semplifica il codice dei service e riduce la duplicazione.

### 6) Command Pattern

Le azioni di gioco sono modellate come oggetti separati che rappresentano un comando. In `src/models/Action` troviamo:

- `Attack`
- `Scan`
- `Shield`
- `Move`
- `CancelAttack`
- `AlterScan`
- `RadioSilance`

Il `GameEngine` riceve un’istanza del comando e la esegue, senza dover implementare direttamente tutto il comportamento specifico in un unico metodo enorme. In pratica, le azioni sono autonome, ma il motore resta il punto di orchestrazione.

### 7) Chain of Responsibility

L’architettura delle route utilizza la catena di middleware di Express, che è un classico esempio di Chain of Responsibility. In pratica:

- `authMiddleware` verifica l’utente;
- `roleMiddleware` verifica il ruolo;
- se tutto va bene, la richiesta arriva al controller;
- se qualcosa va storto, si interrompe la catena generando un errore.

Questo pattern permette di mantenere chiara la logica dell’autenticazione e dell’autorizzazione senza duplicare codice in ogni controller.

---

## 🧪 Repository CLI per testare la logica di base

Una parte importante del progetto è stata la realizzazione di una CLI per testare la logica di base del sistema senza mettere in piedi un client completo. Questa CLI è implementata in:

- `src/cli/play.ts`
- `src/cli/prompt.ts`
- `src/cli/render.ts`

Lo scopo è semplice:

- creare una partita in memoria;
- far scegliere le azioni all’utente o all’IA;
- mostrare lo stato della griglia e del sistema;
- verificare il comportamento del motore e delle regole;
- eseguire test manuali sulla logica prima di passare alla parte HTTP o a un client esterno.

Questa CLI è molto utile perché permette di evidenziare rapidamente problemi di business logic, invece di scoprire le anomalie solo tramite chiamate API. Inoltre, il codice della CLI usa il dominio del progetto senza introdurre dipendenze inutili dal lato HTTP.

## 🧰 Installazione

### Requisiti

- Node.js
- npm
- Docker e Docker Compose (opzionale ma consigliato)
- Postman per test manuali

### Clonazione

```bash
git clone https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini.git
cd progettoPA_Piccinini_Quattrini
```

### Installazione dipendenze

```bash
npm install
```

### Avvio in locale

```bash
npm run build
npm run dev
```

### Avvio con Docker

```bash
docker compose up --build
```

### Esecuzione della CLI

```bash
npx ts-node src/cli/play.ts
```

Questa è la via più veloce per testare la logica di base del dominio senza dover preparare una chiamata HTTP completa.

## ✅ Test

Il progetto prevede una sezione di test automatizzati con Jest. I test principali sono presenti nella cartella `tests/` e verificano:

- corretto comportamento del motore di gioco;
- validità delle azioni e delle contromisure;
- persistenza e ripristino dello stato;
- regole del dominio e del gioco;
- comportamento globale del backend.

Per eseguirli:

```bash
npm test
```

In pratica, i test coprono sia il livello di dominio sia il comportamento generale del backend, così da mantenere la logica sotto controllo e prevenire regressioni durante le modifiche più importanti.

## 🪪 Autore

Cecilia Lisci

## 📜 License

MIT License

Copyright © 2026 Cecilia Lisci
