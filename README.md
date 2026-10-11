# Progetto Programmazione Avanzata - Space Battleship 3D

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

Il progetto segue una struttura a livelli e utilizza principi di progettazione orientati agli oggetti e pattern architetturali per separare le responsabilità e rendere il codice più manutenibile e testabile.

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

Le funzionalità di dominio del gioco sono invece organizzate separatamente dalla parte REST:

```text
                    Game
                     │
          ┌──────────┼──────────┐
          │          │          │
        Grid       Players     Fleet
          │                     │
     Coordinates               Ship
     Cell / State
                     │
                     ▼
                GameEngine
                     │
                     ▼
                   Action
                     │
          ┌──────────┴──────────┐
          │                     │
      BasicMove           Countermeasure
          │                     │
    ┌─────┼─────┐         ┌─────┼─────────┐
    │     │     │         │     │         │
 Attack Scan Shield Move Cancel Alter   Radio
                           Attack Scan   Silence
```

Questa separazione permette di mantenere indipendente la logica di gioco dalla gestione HTTP.

---

# 5. Dominio di gioco

## 5.1 Grid

La griglia rappresenta lo spazio tridimensionale nel quale viene giocata la partita.

La griglia è parametrizzata tramite:

```text
width
height
depth
```

Le coordinate partono da `0`.

La griglia non contiene direttamente la logica relativa alle navi o agli attacchi.

È responsabile solamente della gestione dello spazio di gioco e dello stato delle celle.

L'interfaccia `Grid` permette di astrarre l'implementazione concreta della griglia.

L'implementazione attuale è `MapGrid`.

---

## 5.2 Coordinates

`Coordinates` rappresenta un **Value Object** per le coordinate tridimensionali.

Ogni coordinata è identificata dalla terna:

```text
(x, y, z)
```

Le coordinate vengono create tramite:

```text
Coordinates.create(x, y, z)
```

La factory mantiene una singola istanza per ogni combinazione di coordinate.

Questo permette di mantenere un'identità coerente delle coordinate all'interno del dominio e rende possibile utilizzarle efficacemente anche all'interno delle strutture `Set` e `Map`.

---

## 5.3 Cell

La `Cell` rappresenta una posizione della griglia.

La cella non contiene la logica di gioco.

Lo stato della cella viene invece gestito separatamente tramite `CellState`.

Gli stati previsti sono:

```text
EMPTY
OCCUPIED
HIT
MISS
```

La separazione tra posizione e stato evita di caricare `Cell` con responsabilità appartenenti alla logica della partita.

---

# 6. Navi e flotte

## 6.1 Ship

Le navi disponibili sono:

| Nave       | Dimensione |
| ---------- | ---------: |
| MotherShip |    5 celle |
| Cruiser    |    4 celle |
| Scout      |    2 celle |
| Drone      |    1 cella |

I tipi sono rappresentati dall'enum `ShipType`.

Le navi possono avere orientamento:

```text
HORIZONTAL
VERTICAL
DEPTH
```

`Ship` mantiene:

* identificativo;
* tipo;
* dimensione;
* orientamento;
* posizioni occupate;
* stato;
* posizioni colpite.

Gli stati possibili sono:

```text
INTACT
DAMAGED
DESTROYED
```

Una nave può essere colpita tramite `hit()`.

Quando tutte le sue celle sono state colpite, la nave passa allo stato `DESTROYED`.

Una nave che è stata colpita non può essere spostata.

Il metodo `moveTo()` verifica inoltre che il numero di nuove posizioni corrisponda alla dimensione della nave e che non ci siano posizioni duplicate.

La classe `Ship` verifica anche la coerenza tra tipo e dimensione:

```text
MotherShip → 5
Cruiser    → 4
Scout      → 2
Drone      → 1
```

---

## 6.2 Fleet

`Fleet` rappresenta la flotta di un giocatore.

La flotta gestisce:

* aggiunta delle navi;
* rimozione delle navi;
* ricerca di una nave tramite ID;
* conteggio delle navi per categoria;
* verifica della composizione;
* verifica della distruzione completa della flotta.

I limiti massimi sono:

| Nave       | Massimo |
| ---------- | ------: |
| MotherShip |       3 |
| Cruiser    |       3 |
| Scout      |       4 |
| Drone      |       5 |

All'inizio della partita deve essere presente almeno una nave per ogni categoria.

Il numero effettivo di navi può quindi variare in base alle dimensioni della griglia.

Le navi possono essere adiacenti, ma non possono sovrapporsi.

---

# 7. Player

Il dominio prevede due tipologie di giocatore:

```text
HUMAN
AI
```

La struttura comune è definita tramite l'interfaccia:

```text
IPlayer
```

Le implementazioni concrete sono:

```text
HumanPlayer
AIPlayer
```

Ogni giocatore possiede:

* ID;
* tipo;
* flotta;
* Energy;
* Credits;
* utenti associati.

L'interfaccia permette di utilizzare un giocatore umano e un giocatore IA tramite la stessa astrazione.

---

# 8. Game

`Game` rappresenta una singola partita.

Una partita contiene:

* ID;
* stato;
* griglia;
* due giocatori;
* giocatore corrente;
* numero del turno;
* eventuale vincitore.

Gli stati della partita sono:

```text
WAITING
RUNNING
FINISHED
```

Una partita deve avere esattamente due giocatori.

Le principali operazioni sono:

```text
start()
nextTurn()
end()
getWinner()
```

`start()` avvia la partita.

`nextTurn()` passa il controllo al giocatore successivo.

`end()` termina la partita e registra il vincitore.

---

# 9. Action e Command Pattern

Per le azioni di gioco viene utilizzato il **Command Pattern**.

L'astrazione comune è:

```text
IAction
```

L'interfaccia definisce:

```text
getCost()
execute(context)
```

Ogni azione è quindi rappresentata da un oggetto autonomo che contiene la propria logica di esecuzione.

La gerarchia è:

```text
IAction
│
├── BasicMove
│   │
│   ├── Attack
│   ├── Scan
│   ├── Shield
│   └── Move
│
└── Countermeasure
    │
    ├── CancelAttack
    ├── ReduceAttack
    ├── AlterScan
    └── RadioSilence
```

Non viene utilizzata una classe concreta comune `Action`: l'astrazione è fornita da `IAction`, mentre `BasicMove` e `Countermeasure` rappresentano le due categorie di comandi.

---

# 10. ActionContext

Le action ricevono un `ActionContext`.

Il context contiene:

```text
Game
Player
```

In questo modo il comando può accedere alle informazioni necessarie per eseguire la propria logica senza ricevere numerosi parametri separati.

Il flusso è:

```text
GameEngine
     │
     ▼
ActionContext
     │
     ├── Game
     └── Player
     │
     ▼
action.execute(context)
```

---

# 11. Basic Moves

## 11.1 Attack

`Attack` riceve una specifica coordinata.

Il costo è:

```text
1 Energy
```

L'attacco verifica la presenza di una nave dell'avversario nella posizione indicata.

I risultati possibili sono:

```text
MISS
HIT
DESTROYED
GAME_OVER
BLOCKER
```

Se viene distrutta l'ultima nave della flotta avversaria, la partita termina e viene determinato il vincitore.

Una coordinata può essere attaccata nuovamente, poiché una nave può successivamente spostarsi oppure una cella può essere protetta da uno scudo.

---

# 12. Scan

`Scan` permette di analizzare un cubo:

```text
3 × 3 × 3
```

centrato sulla coordinata scelta.

Il costo è:

```text
2 Energy
```

Il centro della scansione deve essere sufficientemente distante dai bordi della griglia affinché il cubo sia completamente contenuto nella griglia.

La scansione restituisce solamente il numero di celle occupate.

Non viene comunicato:

* quale nave occupa la cella;
* se si tratta di una nave o di un relitto.

Il risultato viene mantenuto dall'istanza della `Scan` tramite il relativo getter.

---

# 13. Shield

`Shield` permette di proteggere una singola cella.

Il costo è:

```text
2 Energy
```

Lo scudo dura per il turno previsto dalle regole di gioco.

Se l'avversario attacca la cella protetta, l'attacco produce:

```text
BLOCKER
```

Lo stato dello scudo deve essere mantenuto nella partita, in quanto deve essere disponibile anche alle successive istanze di `Attack`.

---

# 14. Move

`Move` permette di spostare solamente:

```text
Scout
Drone
```

Il costo è:

```text
2 Energy
```

Il movimento avviene di una sola cella e mantiene l'orientamento e la forma della nave.

Prima dello spostamento vengono verificati:

* appartenenza della nave al giocatore;
* tipo di nave;
* stato della nave;
* distanza dello spostamento;
* validità delle nuove coordinate;
* assenza di sovrapposizioni con altre navi.

Una nave precedentemente colpita non può essere spostata.

---

# 15. Countermeasure

Le contromosse vengono utilizzate durante la finestra prevista dopo una `Attack` o una `Scan`.

Le contromosse previste sono:

```text
CancelAttack
ReduceAttack
AlterScan
RadioSilence
```

Le contromosse appartengono alla gerarchia `Countermeasure` e implementano autonomamente la propria logica tramite `execute(context)`.

Le contromosse vengono eseguite durante il turno dell'avversario.

È inoltre prevista la possibilità di effettuare un `PASS`.

Le contromosse consumano Energy e TOKEN secondo le regole della partita.

`RadioSilence` è disponibile solamente nelle partite tra utenti e utilizza inoltre gli specifici `silence credits`.

---

# 16. GameEngine

`GameEngine` rappresenta il componente responsabile dell'esecuzione delle azioni all'interno della partita.

È implementato come **Singleton**, poiché viene utilizzato come punto centrale per l'esecuzione delle azioni.

Le principali operazioni sono:

```text
executeAction()
executeCountermeasure()
validateMove()
validateCountermeasure()
```

Il flusso di una normale action è:

```text
executeAction()
       │
       ▼
validateMove()
       │
       ├── partita RUNNING
       ├── giocatore corretto
       └── Energy sufficiente
       │
       ▼
consumeEnergy()
       │
       ▼
action.execute(context)
       │
       ▼
nextTurn()
```

Il `GameEngine` non contiene la logica specifica di `Attack`, `Scan`, `Shield` o `Move`.

Questa responsabilità viene delegata alle singole action.

---

# 17. Sistema Energy

Ogni giocatore dispone di Energy. La configurazione è gestita tramite `EnergyConfig`.

I valori predefiniti sono:

```text
3 Energy iniziali
6 Energy massimi
+2 Energy rigenerati a turno
```

I valori possono essere configurati in fase di creazione della partita e vengono validati tramite Zod.

I costi delle action sono:

| Action | Energy |
| ------ | -----: |
| Attack |      1 |
| Scan   |      2 |
| Shield |      2 |
| Move   |      2 |

Se il giocatore non possiede abbastanza Energy, l'azione viene rifiutata.

In questo caso:

* non viene consumata Energy;
* non viene consumato il turno;
* non viene consumato TOKEN.

---

# 18. Sistema TOKEN

I TOKEN rappresentano una valuta economica separata dall'Energy utilizzata durante la partita.

La creazione di una partita costa:

```text
0,30 TOKEN
```

Ogni mossa effettuata durante una partita costa:

```text
0,015 TOKEN
```

Il costo viene applicato alle azioni e alle contromosse secondo le regole del gioco.

Se un utente termina i TOKEN durante una partita, la partita continua normalmente fino alla sua conclusione.

L'utente non potrà però creare una nuova partita finché non avrà nuovamente abbastanza TOKEN.

La ricarica dei TOKEN può essere effettuata solamente da un utente `ADMIN`.

I TOKEN ricevuti vengono sommati a quelli già posseduti dall'utente.

---

# 19. Creazione della partita

Un utente può creare una partita scegliendo tra:

```text
USER vs USER
USER vs AI
```

Un utente può partecipare a una sola partita alla volta.

La creazione REST è esposta tramite `POST /game`. Il body viene validato e normalizzato con Zod; in assenza di valori espliciti vengono applicati i default previsti per griglia, flotta, orientamenti ed Energy. Alla creazione vengono addebitati `0,30 TOKEN` al creatore e viene creato e avviato l'oggetto di dominio `Game`. La persistenza completa della partita nel database è il prossimo passaggio da implementare.

## Partita contro un altro utente

Il creatore deve indicare l'email dell'avversario tramite il campo `opponentEmail`.

Le email dei due giocatori devono essere diverse.

In una partita tra due utenti inizia sempre il giocatore che ha creato la partita.

## Partita contro IA

La partita viene creata contro un giocatore `AI`.

In questo caso:

```text
USER → primo turno
AI   → secondo turno
```

L'IA deve inoltre essere in grado di generare un posizionamento valido delle proprie navi.

---

# 20. Posizionamento delle navi

All'inizio della partita ogni giocatore deve avere almeno una nave per categoria.

I limiti massimi sono:

```text
MotherShip → 3
Cruiser    → 3
Scout      → 4
Drone      → 5
```

Il numero effettivo di navi deve essere compatibile con la dimensione della griglia.

Le navi:

* possono essere adiacenti;
* non possono sovrapporsi;
* possono essere orientate lungo i tre assi;
* devono essere completamente contenute nella griglia.

I due giocatori devono avere lo stesso numero complessivo di navi.

---

# 21. Posizionamento IA

Il posizionamento dell'IA è casuale.

Le navi vengono posizionate partendo dalle più grandi.

Se una nave successiva non può essere posizionata, il sistema deve poter annullare il posizionamento precedente e tentare una configurazione differente.

Il processo continua fino a ottenere una configurazione valida della flotta.

---

# 22. Turni

Ogni giocatore può effettuare una sola action principale per turno.

Il flusso previsto è:

```text
Giocatore A
     │
     ▼
Action
     │
     ▼
Finestra contromossa
     │
     ├── Countermeasure
     │
     └── PASS
     │
     ▼
Fine turno
     │
     ▼
Giocatore B
```

Le contromosse non costituiscono una normale action principale e possono essere effettuate solamente nella finestra prevista dopo una `Attack` o una `Scan`.

---

# 23. Autenticazione e autorizzazione

L'autenticazione avviene tramite:

```text
POST /auth/register
POST /auth/login
```

La registrazione permette di creare un nuovo utente tramite email e password.

Il ruolo assegnato agli utenti registrati tramite API è quello previsto dal sistema e non viene scelto liberamente dal client.

Il login verifica le credenziali e restituisce un JWT.

Il JWT viene utilizzato dal middleware di autenticazione per identificare l'utente. Il payload viene validato tramite Zod e la chiave JWT viene letta dalle variabili d'ambiente senza fallback hard-coded.

Il sistema prevede inoltre la distinzione tra:

```text
USER
ADMIN
```

L'utente `ADMIN` possiede privilegi aggiuntivi, tra cui la possibilità di ricaricare i TOKEN degli utenti.

---

# 24. Pattern utilizzati

## 24.1 Repository Pattern

Il Repository Pattern viene utilizzato per separare la logica applicativa dall'accesso al database.

Esempio:

```text
AuthService
     │
     ▼
UserRepository
     │
     ▼
Sequelize
     │
     ▼
MySQL
```

Il Service non esegue direttamente le operazioni Sequelize.

### Motivazione

Il pattern permette di:

* separare persistenza e logica applicativa;
* semplificare i test;
* ridurre l'accoppiamento con Sequelize;
* rendere più semplice la sostituzione dell'implementazione di persistenza.

---

## 24.2 Service Layer

La logica applicativa viene concentrata nei Service.

Il Controller non contiene le regole principali del dominio.

Il flusso è:

```text
Controller
    │
    ▼
Service
    │
    ▼
Repository
```

### Motivazione

Questo permette di separare il livello HTTP dalla logica applicativa.

---

## 24.3 Command Pattern

Il Command Pattern viene utilizzato per rappresentare le azioni di gioco.

Ogni action è un oggetto autonomo:

```text
Attack
Scan
Shield
Move
```

e dispone del proprio:

```text
execute(context)
```

### Motivazione

Il pattern è particolarmente adatto perché le azioni devono essere:

* indipendenti;
* eseguibili tramite un'interfaccia comune;
* dotate di un costo differente;
* facilmente estendibili;
* utilizzabili dal `GameEngine` senza conoscere i dettagli della singola azione.

Inoltre permette di aggiungere nuove azioni senza modificare la logica delle action già esistenti.

---

## 24.4 Factory Pattern

Il progetto utilizza una Factory per la creazione della griglia:

```text
GridFactory.create(width, height, depth)
```

La Factory restituisce un'implementazione dell'interfaccia `Grid`.

### Motivazione

Il codice che utilizza la griglia non deve conoscere necessariamente la classe concreta `MapGrid`.

Questo riduce l'accoppiamento tra utilizzatore e implementazione.

---

## 24.5 Singleton Pattern

Il `GameEngine` viene implementato come Singleton.

```text
GameEngine.getInstance()
```

### Motivazione

Il pattern garantisce l'utilizzo di un'unica istanza dell'engine all'interno dell'applicazione.

---

## 24.6 Value Object

`Coordinates` viene progettato come Value Object.

Una coordinata è definita esclusivamente dai valori:

```text
x
y
z
```

### Motivazione

Le coordinate rappresentano un valore del dominio e non possiedono un'identità indipendente.

La factory garantisce inoltre una gestione coerente delle istanze delle coordinate.

---

# 25. `src/app.ts`

Contiene la configurazione principale di Express.

Qui vengono registrati:

* middleware globali;
* parsing JSON;
* logger;
* router;
* route di autenticazione;
* route di gioco;
* error handler.

Il server HTTP non viene avviato da `app.ts`.

Questo permette di importare l'applicazione direttamente nei test.

---

# 26. `src/server.ts`

È il punto di avvio dell'applicazione.

Si occupa principalmente di:

1. caricare le variabili d'ambiente;
2. inizializzare i Model Sequelize;
3. verificare la connessione al database;
4. sincronizzare il database;
5. avviare il server HTTP.

La configurazione Express rimane in `app.ts`.

Questa separazione permette di utilizzare `app.ts` direttamente nei test senza avviare un server reale.

---

# 27. Middleware

I middleware gestiscono funzionalità trasversali alle richieste.

Sono presenti:

```text
logger.ts
authMiddleware.ts
roleMiddleware.ts
gameValuesMiddleware.ts
errorHandler.ts
```

## Logger

Registra le richieste ricevute dal server.

## Validation

La validazione degli input viene gestita tramite Zod. `gameValuesMiddleware` valida il body di creazione della partita e assegna a `req.body` il risultato del parsing, mantenendo quindi default e trasformazioni definiti negli schema.

## AuthMiddleware

Protegge le route che richiedono autenticazione.

Il middleware:

1. legge l'header `Authorization`;
2. verifica il formato `Bearer <token>`;
3. verifica il JWT;
4. salva il payload nella richiesta;
5. permette il proseguimento tramite `next()`.

## RoleMiddleware

`roleMiddleware` verifica che l'utente autenticato possieda il ruolo necessario per accedere alle route di gioco protette.

## ErrorHandler

Gestisce centralmente gli errori generati dall'applicazione.

Gli `AppError` vengono trasformati nella risposta HTTP corrispondente.

Gli errori non riconosciuti vengono trasformati in:

```text
500 Internal Server Error
```

---

# 28. Gestione degli errori

Gli errori vengono gestiti centralmente quando possibile.

Il flusso è:

```text
Errore
   │
   ▼
Service / Repository / Domain
   │
   ▼
Controller
   │
   ▼
Error Handler
   │
   ▼
HTTP Response
```

Il progetto utilizza errori personalizzati per distinguere gli errori applicativi dagli errori generici.

---

# 29. Test

I test si trovano nella cartella:

```text
tests/
```

Il progetto utilizza:

* **Jest**
* **Supertest**

I test verificano progressivamente:

* middleware;
* endpoint;
* autenticazione;
* validazione;
* Service;
* gestione degli errori;
* funzionalità del dominio di gioco.

In particolare devono essere presenti almeno i test di due funzioni middleware richiesti dalla specifica del progetto.

I test HTTP utilizzano `app.ts` invece di `server.ts`, evitando di avviare un server reale e di effettuare una connessione al database durante i test che non ne hanno bisogno.

---

# 30. Test con Postman

Le API REST vengono verificate anche tramite chiamate HTTP effettuate con **Postman** o strumenti equivalenti.

Le principali operazioni attualmente disponibili includono:

```text
POST /auth/register
POST /auth/login
POST /game
```

Sono inoltre predisposte le route per stato partita, azioni, contromosse, PASS e storico CSV; saranno collegate alla persistenza del database tramite `gameRepository`.

I test tramite Postman permettono di verificare:

* registrazione;
* autenticazione;
* generazione JWT;
* accesso alle route protette;
* autorizzazione in base al ruolo;
* validazione della configurazione di una partita;
* gestione degli errori HTTP.

La route `POST /game` è protetta tramite JWT e controllo del ruolo, valida il body tramite Zod, crea l'oggetto di dominio, addebita il costo di creazione e avvia la partita. La persistenza completa della partita e delle flotte nel database deve ancora essere collegata.

---

# 31. Docker

Il progetto utilizza Docker Compose per eseguire il backend e il database.

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

# 32. Variabili d'ambiente

Le configurazioni sensibili e variabili vengono mantenute nel file:

```text
.env
```

Esempi:

```text
PORT
MSQLUSR
MSQLPSW
MSQLDB
MSQLROOTPSW
DB_HOST
DB_PORT
JWT_SECRET
```

Il file `.env` non deve essere inserito nel repository.

Per questo motivo deve essere presente nel `.gitignore`.

---

# 33. Avvio del progetto

## Installazione delle dipendenze

```bash
npm install
```

## Compilazione TypeScript

```bash
npm run build
```

## Avvio del server

```bash
npm start
```

## Esecuzione dei test

```bash
npm test
```

## Avvio della CLI di gioco

```bash
npx ts-node src/cli/play.ts
```

## Avvio tramite Docker Compose

```bash
docker compose up -d --build
```

## Visualizzazione dello stato dei container

```bash
docker compose ps
```

## Arresto dei container

```bash
docker compose down
```

---

# 34. File JavaScript generati

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

I file presenti in `dist/` sono generati automaticamente e non devono essere modificati manualmente.

La cartella `dist/` è esclusa dal repository tramite `.gitignore`.

---

# 35. Diagrammi UML

La documentazione definitiva del progetto deve comprendere i diagrammi UML richiesti dalla specifica.

In particolare:

* diagramma dei casi d'uso;
* diagrammi delle sequenze.

## Casi d'uso principali

Gli attori principali del sistema sono:

```text
USER
ADMIN
AI
```

I casi d'uso principali comprendono:

```text
USER
 │
 ├── Registrarsi
 ├── Effettuare login
 ├── Creare partita
 ├── Scegliere avversario
 ├── Posizionare navi
 ├── Attack
 ├── Scan
 ├── Shield
 ├── Move
 ├── Utilizzare contromossa
 └── Terminare partita

ADMIN
 │
 └── Ricaricare TOKEN
```

I diagrammi UML completi verranno mantenuti nella documentazione del progetto e aggiornati insieme all'evoluzione delle funzionalità.

---

# 36. Diagrammi delle sequenze

I principali diagrammi di sequenza da documentare comprendono:

### Registrazione

```text
Client
  │
  ▼
AuthRoute
  │
  ▼
AuthController
  │
  ▼
AuthService
  │
  ▼
UserRepository
  │
  ▼
Sequelize
  │
  ▼
MySQL
```

### Login

```text
Client
  │
  ▼
AuthController
  │
  ▼
AuthService
  │
  ├── UserRepository
  │
  ├── bcrypt
  │
  └── JWT
```

### Esecuzione di un'azione

```text
Client
  │
  ▼
Controller / Service
  │
  ▼
GameEngine
  │
  ├── validateMove()
  │
  ├── consumeEnergy()
  │
  └── action.execute(context)
              │
              ▼
             Game
              │
              ▼
          nextTurn()
```

I diagrammi verranno aggiornati quando saranno completate le contromosse e la gestione completa dei TOKEN.

---

# 37. Principi di progettazione

Il progetto segue principalmente i principi **SOLID**.

## Single Responsibility Principle

Le classi hanno responsabilità distinte.

Esempi:

```text
Grid       → gestione della griglia
Ship       → stato e comportamento della nave
Fleet      → composizione della flotta
Game       → stato della partita
GameEngine  → coordinamento dell'esecuzione
Attack     → logica dell'attacco
Scan       → logica della scansione
```

## Open/Closed Principle

La struttura delle action permette di aggiungere nuovi comandi senza modificare le action esistenti.

Ad esempio una nuova action può implementare `IAction` oppure estendere `BasicMove`.

## Liskov Substitution Principle

Le implementazioni di `IPlayer` possono essere utilizzate tramite l'astrazione comune:

```text
IPlayer
   ├── HumanPlayer
   └── AIPlayer
```

Analogamente le action possono essere utilizzate tramite `IAction`.

## Interface Segregation Principle

Le interfacce vengono mantenute specifiche rispetto alle responsabilità necessarie.

## Dependency Inversion Principle

Le componenti applicative utilizzano astrazioni dove possibile.

Un esempio è:

```text
Grid
  ▲
  │
MapGrid
```

Il resto del dominio può lavorare con `Grid` senza dipendere direttamente dall'implementazione concreta.

---

# 38. Stato attuale del progetto

Attualmente sono presenti e funzionanti:

* server Express, Docker Compose e connessione Sequelize/MySQL;
* registrazione e login con JWT;
* middleware di autenticazione, autorizzazione, logging, validazione Zod e gestione centralizzata degli errori;
* `ErrorFactory` / `AppError` per gli errori applicativi e risposta JSON `404` per route inesistenti;
* struttura REST a livelli `Route → Controller → Service → Repository`;
* route protetta `POST /game` per la creazione di partite `user` o `ai`;
* addebito di `0,30 TOKEN` alla creazione della partita e persistenza del credito residuo dell'utente;
* configurazione Zod di griglia, flotta, orientamenti, Energy e `silence`, con valori di default coerenti con il dominio;
* dominio di gioco con `Game`, `GameEngine`, action, countermeasure, Energy, TOKEN e gestione dei turni;
* `FleetFactory` / `FleetConfig` per la generazione casuale delle flotte;
* storico delle mosse tramite `MoveRecord` e conversione CSV tramite `HistoryCsv`;
* CLI testuale (`src/cli/play.ts`) per provare il dominio di gioco;
* test con Jest e Supertest e compilazione TypeScript.

Sono predisposte a livello REST le route per stato partita, azioni, contromosse, PASS e storico CSV. Il prossimo blocco di lavoro riguarda la progettazione e implementazione della persistenza delle partite nel database, includendo partecipanti, configurazione, flotte, posizioni e storico.

---

# 39. Sviluppo futuro

Il prossimo passo è completare la persistenza delle partite. L'ordine previsto è:

```text
1. Progettazione schema database delle partite
          ↓
2. Model Sequelize e relazioni
          ↓
3. Persistenza di partita, partecipanti, flotte e posizioni
          ↓
4. Collegamento di gameRepository alle route già predisposte
          ↓
5. Persistenza e restituzione dello storico CSV
          ↓
6. Completamento test REST / Postman
          ↓
7. Diagrammi UML e documentazione finale
```

La logica di dominio rimane separata dalla parte REST e dalla persistenza, così da mantenere chiare le responsabilità dei diversi livelli.
