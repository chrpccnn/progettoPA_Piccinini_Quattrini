# Progetto Programmazione Avanzata — Space Battleship 3D

Backend REST sviluppato per il corso di **Programmazione Avanzata**.

**Repository principale:**  
https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini/tree/main

## Indice

1. [Obiettivo](#1-obiettivo)
2. [Tecnologie utilizzate e struttura](#2-tecnologie-utilizzate-e-struttura)
3. [Regole del gioco](#3-regole-del-gioco)
4. [Diagrammi e rotte](#4-diagrammi-e-rotte)
5. [Pattern](#5-pattern)
6. [Installazione](#6-installazione)

---

# 1. Obiettivo

L'obiettivo del progetto è la realizzazione di un backend REST per **Space Battleship 3D**, una variante tridimensionale della battaglia navale.

Il sistema permette a utenti autenticati tramite JWT di creare e giocare partite:

- **utente contro utente**;
- **utente contro IA**.

Ogni partita viene giocata su una griglia tridimensionale e comprende:

- posizionamento casuale delle flotte;
- gestione dei turni;
- Energy Credits;
- TOKEN economici associati agli utenti;
- azioni principali;
- contromisure;
- persistenza dello stato di gioco;
- storico delle mosse in formato CSV;
- autenticazione e autorizzazione tramite ruoli `user` e `admin`.

L'applicazione separa il livello HTTP dalla logica applicativa, dal dominio di gioco e dalla persistenza, così da mantenere il codice modulare e testabile.

# 2. Tecnologie utilizzate e struttura

## 2.1 Tecnologie

Il progetto utilizza:

- **Node.js** — runtime JavaScript;
- **TypeScript** — linguaggio principale;
- **Express** — realizzazione delle API REST;
- **Sequelize** — ORM;
- **MySQL 8** — database relazionale;
- **Docker / Docker Compose** — containerizzazione;
- **Zod** — validazione runtime degli input e derivazione dei tipi TypeScript;
- **jsonwebtoken** — autenticazione JWT;
- **bcrypt** — hashing delle password;
- **dotenv** — gestione delle variabili d'ambiente;
- **Jest** — test;
- **Supertest** — test delle API HTTP.

## 2.2 Struttura del progetto

```text
progettoPA_Piccinini_Quattrini/
├── src/
│   ├── cli/                  # CLI testuale per provare il dominio
│   ├── config/               # configurazione database
│   ├── controllers/          # gestione richieste HTTP
│   ├── errors/               # AppError ed ErrorFactory
│   ├── middleware/           # auth, ruoli, logger, error handler
│   ├── models/
│   │   ├── Action/           # azioni e contromisure
│   │   ├── Engine/           # Game, GameEngine, EnergyConfig, HistoryCsv
│   │   ├── Players/          # HumanPlayer e AIPlayer
│   │   ├── db/               # model Sequelize
│   │   ├── fleet/            # Fleet, Ship, FleetConfig, FleetFactory
│   │   └── grid/             # griglia, celle e coordinate
│   ├── repository/           # accesso ai dati e mapping DB <-> dominio
│   ├── routes/               # route REST
│   ├── seeds/                # inizializzazione database
│   ├── services/             # logica applicativa
│   ├── Zod/                  # schema di validazione
│   ├── TokenCost.ts
│   ├── app.ts
│   └── server.ts
├── tests/
├── Sequence Diagrams/
├── Dockerfile
├── docker-compose.yaml
├── package.json
└── README.md
```

La cartella `dist/` viene generata durante la compilazione TypeScript e non contiene codice da modificare manualmente.

## 2.3 Architettura

Il flusso generale di una richiesta REST è:

```text
Client / Postman
       |
       v
     Route
       |
       v
   Middleware
       |
       v
   Controller
       |
       v
    Service
       |
       +--------> Domain / GameEngine
       |
       v
   Repository
       |
       v
   Sequelize
       |
       v
     MySQL
```

Le responsabilità sono separate:

- **Route**: definisce endpoint e catena middleware;
- **Middleware**: autenticazione, autorizzazione, logging e gestione degli errori;
- **Controller**: gestisce richiesta e risposta HTTP;
- **Service**: coordina il caso d'uso;
- **Domain / GameEngine**: applica le regole del gioco;
- **Repository**: gestisce persistenza e ricostruzione degli oggetti di dominio;
- **Sequelize / MySQL**: memorizzazione persistente.

---

# 3. Regole del gioco

## 3.1 Modalità di gioco

Space Battleship 3D può essere giocato in due modalità:

- `user`: un utente gioca contro un altro utente;
- `ai`: un utente gioca contro un'intelligenza artificiale.

Nelle partite PvP il creatore indica l'email dell'avversario. Un utente non può essere contemporaneamente coinvolto in più partite attive.

  
La modalità viene specificata nel body di `POST /game` e validata tramite Zod. Nel caso PvP il `GameService` recupera l'avversario tramite email e verifica che entrambi i giocatori siano disponibili. Nel caso AI viene creato un `AIPlayer`.

## 3.2 Griglia tridimensionale

La partita si svolge su una griglia tridimensionale, quindi ogni posizione è identificata da tre coordinate:

```text
(x, y, z)
```

Rispetto alla battaglia navale tradizionale è presente anche l'asse di profondità.

La dimensione della griglia è configurabile. I valori di default sono:

```text
base X/Y: 10
profondità Z: 5
```

  
La griglia viene costruita tramite `GridFactory`. Le coordinate sono rappresentate dalla classe `Coordinates`. La struttura permette di gestire lo stato delle celle e viene ricostruita dal repository quando una partita viene caricata dal database.

## 3.3 Navi, flotta e orientamenti

Ogni giocatore possiede una flotta composta da diversi tipi di nave:

| Tipo | Dimensione |
|---|---:|
| Mother Ship | 5 celle |
| Cruiser | 4 celle |
| Scout | 2 celle |
| Drone | 1 cella |

La configurazione di default è:

| Tipo | Numero |
|---|---:|
| Mother Ship | 1 |
| Cruiser | 1 |
| Scout | 2 |
| Drone | 2 |

Sono previsti i seguenti limiti massimi:

| Tipo | Numero massimo |
|---|---:|
| Mother Ship | 3 |
| Cruiser | 3 |
| Scout | 4 |
| Drone | 5 |

Le navi possono svilupparsi lungo gli orientamenti consentiti dalla partita:

- `HORIZONTAL`;
- `VERTICAL`;
- `DEPTH`.

Una nave deve rientrare completamente nella griglia e non può sovrapporsi a un'altra nave.

  
`Ship` rappresenta la singola nave e mantiene le proprie posizioni e lo stato dei colpi ricevuti. `Fleet` rappresenta l'insieme delle navi di un giocatore.

Durante la creazione della partita, `FleetFactory` genera una disposizione valida delle flotte utilizzando gli orientamenti ammessi. Il backend verifica che le navi rispettino dimensioni, limiti della griglia e assenza di sovrapposizioni.

## 3.4 Turni

La partita è organizzata a turni. Durante il proprio turno un giocatore può eseguire al massimo una azione principale.

Le azioni principali sono:

- `ATTACK`;
- `SCAN`;
- `SHIELD`;
- `MOVE`.

`ATTACK` e `SCAN` possono aprire una finestra nella quale l'avversario può rispondere con una contromisura oppure scegliere `PASS`.

  
`Game` mantiene il turno corrente e il giocatore attivo. `GameEngine` verifica che l'azione venga richiesta dal giocatore corretto, applica le regole dell'azione e gestisce l'avanzamento del turno. Lo stato aggiornato viene poi persistito tramite `GameRepository`.

## 3.5 ATTACK

`ATTACK` permette di colpire una coordinata della griglia avversaria.

Il giocatore specifica:

```text
x
y
z
```

L'attacco può produrre diversi esiti, tra cui `MISS`, `HIT`, `DESTROYED` o `GAME_OVER`.

Prima della risoluzione definitiva l'avversario può avere la possibilità di utilizzare una contromisura.

  
La richiesta viene inviata tramite:

```http
POST /game/:gameId/action
```

Il controller valida il body con Zod, il service costruisce l'azione `Attack` e il `GameEngine` ne gestisce l'esecuzione. Quando è prevista una risposta dell'avversario, l'attacco viene registrato nel `Game` come pending action e successivamente persistito.

## 3.6 SCAN

`SCAN` permette di analizzare un volume 3x3x3 centrato sulla coordinata indicata e ottenere informazioni sulla presenza di celle occupate nell'area.

Anche una scansione può aprire una finestra di contromisura.

  
La richiesta utilizza:

```http
POST /game/:gameId/action
```

Il service costruisce una `Scan` e il `GameEngine` ne esegue la logica. Se è prevista una risposta dell'avversario, la scansione viene mantenuta come pending action fino alla sua risoluzione.

## 3.7 SHIELD

`SHIELD` permette di attivare una protezione temporanea secondo le regole del gioco.

A differenza di `ATTACK` e `SCAN`, lo scudo viene applicato direttamente e non genera una finestra di contromisura.

  
Il service costruisce l'azione `Shield`, che viene eseguita dal `GameEngine`. Gli scudi attivi fanno parte dello stato della partita e vengono salvati e ricostruiti tramite `GameRepository`.

## 3.8 MOVE

`MOVE` consente di spostare di una sola cella una nave che può effettuare movimento.

Il giocatore specifica:

- la nave tramite `shipId`;
- l'asse `X`, `Y` oppure `Z`;
- la direzione positiva `1` o negativa `-1`.

Il movimento non è valido se porta la nave fuori dalla griglia, provoca una sovrapposizione oppure viola le regole previste per quella nave.

  
Il body REST utilizza una forma del tipo:

```json
{
  "type": "MOVE",
  "shipId": "...",
  "axis": "X",
  "direction": 1
}
```

Il `GameService` traduce `axis` e `direction` nella coordinata di destinazione richiesta dal dominio. La classe `Move` verifica poi che lo spostamento effettivo sia di una sola cella e che la nuova posizione sia valida.

## 3.9 Pending action

Quando viene effettuato un `ATTACK` o uno `SCAN`, l'azione può rimanere temporaneamente in attesa della risposta dell'avversario.

Durante questa finestra l'avversario può:

- utilizzare una contromisura;
- scegliere `PASS`.

Finché la pending action non viene risolta, la normale progressione del turno rimane sospesa.

  
`Game` mantiene le informazioni necessarie sulla pending action, come tipo, giocatore che l'ha generata e dati utili alla successiva risoluzione.

`GameRepository` persiste queste informazioni nelle colonne dedicate della partita, così che `findById()` possa ricostruire correttamente la pending action anche dopo un reload dal database.

## 3.10 Contromisure

Le contromisure permettono al giocatore avversario di reagire a una pending action.

Sono previste:

- `CancelAttack`;
- `AlterScan`;
- `RadioSilence`.

`CancelAttack` contrasta un attacco, `AlterScan` modifica l'effetto di una scansione e `RadioSilence` permette di oscurare determinate informazioni secondo le regole del gioco.

  
Le contromisure vengono inviate tramite:

```http
POST /game/:gameId/countermeasure
```

Il controller valida il tipo richiesto. Il service recupera dal `Game` la pending action reale e costruisce la contromisura compatibile.

Il `GameEngine` verifica la presenza della pending action, il giocatore autorizzato, la compatibilità della contromisura, l'Energy disponibile e, quando necessario, il valore di `silence`.

## 3.11 RadioSilence e silence

`RadioSilence` è disponibile nelle partite PvP e utilizza una risorsa limitata chiamata `silence`.

Il valore può essere configurato tra:

```text
0 e 5
```

Ogni utilizzo valido decrementa il valore disponibile. Quando `silence` raggiunge `0`, `RadioSilence` non può più essere utilizzata.

  
Il valore `silence` fa parte dello stato persistente della partita. `GameEngine` ne verifica la disponibilità durante l'esecuzione della contromisura, mentre `GameRepository` salva il valore aggiornato.

## 3.12 PASS

Durante una finestra di contromisura l'avversario può scegliere di non utilizzare nessuna contromisura.

In questo caso esegue `PASS`: la pending action viene risolta normalmente e il turno può proseguire.

  
La richiesta è:

```http
POST /game/:gameId/pass
```

Non richiede body.

Il service carica la partita e delega la gestione a `GameEngine.pass()`, che verifica che il giocatore possa effettuare il pass e risolve la pending action. Lo stato risultante viene poi persistito.

## 3.13 Energy Credits

Gli Energy Credits rappresentano la risorsa utilizzata dal giocatore all'interno della singola partita.

I valori di default sono:

```text
Energy iniziale:       3
Energy massima:        6
Rigenerazione turno:  +2
```

Azioni e contromisure possono consumare Energy. Una operazione non può essere eseguita se il giocatore non dispone dell'Energy richiesta.

L'Energy può rigenerarsi durante il gioco senza superare il valore massimo.

  
La configurazione Energy viene fornita al dominio `Game` e ai giocatori. `GameEngine` controlla e aggiorna l'Energy durante l'esecuzione delle operazioni. Il valore corrente viene persistito per ciascun partecipante tramite `GameRepository`.

## 3.14 TOKEN

I TOKEN sono una risorsa economica associata all'utente e sono separati dall'Energy della partita.

I costi previsti sono:

```text
Creazione partita: 0.300 TOKEN
Azione di gioco:   0.015 TOKEN
```

La creazione di una partita richiede un saldo sufficiente. Gli utenti con ruolo `admin` possono modificare il credito di un utente.

  
I TOKEN sono persistiti sull'utente. Il costo di creazione viene applicato durante `POST /game`, mentre i costi delle operazioni vengono gestiti dalla logica di gioco.

La modifica amministrativa del credito viene effettuata tramite:

```http
POST /refill
```

protetta da autenticazione JWT e controllo del ruolo `admin`.

## 3.15 Stato della partita e vittoria

Una partita attraversa gli stati:

```text
WAITING -> RUNNING -> FINISHED
```

La partita termina quando vengono soddisfatte le condizioni di vittoria previste dal gioco. Il vincitore viene quindi memorizzato.

  
`Game` contiene stato, turno, giocatore corrente e vincitore. `GameEngine` gestisce le transizioni e verifica le condizioni di fine partita.

La rotta:

```http
GET /game/:gameId/state
```

restituisce una rappresentazione della partita adatta al giocatore che effettua la richiesta, senza esporre le coordinate della flotta avversaria.

## 3.16 Storico delle mosse

Le operazioni effettuate durante la partita vengono registrate per permettere di ricostruirne lo svolgimento.

Lo storico contiene informazioni come:

- giocatore;
- tipo di azione;
- coordinate;
- costo Energy;
- esito;
- timestamp.

Lo storico può essere esportato in formato CSV.

  
Le mosse vengono persistite nel database insieme allo stato della partita. Quando una partita viene caricata, `GameRepository.findById()` ricostruisce anche lo storico.

La rotta:

```http
GET /game/:gameId/history
```

utilizza `HistoryCsv` per convertire le informazioni memorizzate nel formato CSV restituito al client.

## 3.17 Persistenza dello stato

Lo stato della partita deve rimanere coerente tra una richiesta REST e la successiva.

Turno, Energy, TOKEN, navi, scudi, storico e pending action non devono quindi andare persi dopo il completamento di una richiesta.

  
`GameRepository.update()` salva lo stato modificato del dominio, mentre `GameRepository.findById()` ricostruisce il `Game` a partire dalle tabelle persistite.

Le operazioni che modificano lo stato della partita vengono eseguite all'interno di transazioni; dove necessario vengono utilizzati lock sulle righe per evitare aggiornamenti concorrenti incoerenti.

---

# 4. Diagrammi e rotte

## 4.1 Rotte principali

| Metodo | Rotta | Descrizione | Accesso |
|---|---|---|---|
| `GET` | `/` | verifica base del backend | pubblico |
| `POST` | `/auth/register` | registrazione utente | pubblico |
| `POST` | `/auth/login` | autenticazione e rilascio JWT | pubblico |
| `POST` | `/game` | creazione partita | `user` |
| `GET` | `/game/:gameId/state` | stato della partita | partecipante |
| `POST` | `/game/:gameId/action` | esecuzione azione principale | partecipante |
| `POST` | `/game/:gameId/countermeasure` | esecuzione contromisura | partecipante |
| `POST` | `/game/:gameId/pass` | rinuncia alla contromisura e risoluzione pending action | partecipante |
| `GET` | `/game/:gameId/history` | storico partita in CSV | partecipante |
| `POST` | `/refill` | ricarica/modifica TOKEN utente | `admin` |

Le route `/game/*` sono protette da:

```text
authMiddleware
        |
        v
roleMiddleware("user")
```

La rotta amministrativa è protetta tramite JWT e controllo del ruolo `admin`.

## 4.2 Autenticazione JWT

Il JWT contiene i metadati essenziali dell'utente.

Il middleware:

1. legge l'header `Authorization`;
2. verifica il token tramite `jsonwebtoken`;
3. valida il payload con Zod;
4. inserisce l'utente autenticato nella request;
5. passa il controllo al middleware successivo.

Il controllo del ruolo è separato dall'autenticazione tramite `roleMiddleware`.

## 4.3 Diagrammi
### 4.3.1 Casi d'uso
<a1><img src="./Sequence Diagrams/casiduso.png" height='500' align="center"/></a>

---
### 4.3.2 Diagrammi di sequenza
> POST /auth/register

Rotta che consente la registrazione di nuovi utenti. Permette solo la creazione di utenti con ruolo `user`. 
- **Parametri**: `email` e `password`
- **Restituisce**: `id`, `email` e `ruolo`

<a1><img src="./Sequence Diagrams/SD register.png" height='500' align="center"/></a>

> POST /auth/login

Rotta che consente l'autenticazione di un utente, tramite cui l'utente potrà creare e giocare le partite. 
- **Parametri**: `email` e `password`
- **Restituisce**: il `token` jwt e i dati del `user`: `id`, `email` e `role`

<a1><img src="./Sequence Diagrams/SD login.png" height='500' align="center"/></a>

> POST /game

Rotta che consente ad un utente di creare una partita. La partita può essere creata in 2 modalità (`user` e `ai`) specificate tra i parametri. L'utente deve essere autenticato e deve essere in possesso di token sufficienti.

> nel caso di `user`
- **Parametri**: `mode` e `opponentEmail` come obbligatori con la possibilità di specificare il parametro `silence` in modo facoltativo.

> nel caso di `ai`
- **Parametri**: `mode` come obbligatorio.

> in comune tra entrambe le modalità è possibile specifcare in modo facoltativo le seguenti categorie:

- **Parametri**:
  - ***grid*** {`grid_base`, `grid_height`} 
  - ***ships*** {`motherShip`, `cruiser`, `scout`, `drone`}
  - ***orientation*** [`"HORIZONTAL"`, `"VERTICAL"`, `"DEPTH"`]
  - ***energy*** {`initial`, `max`, `regeneration`}

- **Restituisce**: i dati della partita appena creata in formato JSON

<a1><img src="./Sequence Diagrams/SD game.png" height='500' align="center"/></a>

> GET /game/{{GAMEID}}/state

Rotta che permette di visualizzare i dati della partita corrente (sulla base del `{{GAMEID}}`). Richiede autenticazione.

- **Restituisce**: un JSON completo delle informazioni della partita.

<a1><img src="./Sequence Diagrams/SD state.png" height='500' align="center"/></a>

> POST /game/{{GAMEID}}/action

Rotta che permette all'utente di effettuare un'azione in gioco. Le azioni possono essere `ATTACK`, `SCAN`, `SHIELD`, o `MOVE`, ogni mossa ha un proprio funzionamento e costo. Richiede autenticazione e che sia il turno del giocatore.

- **Parametri**: `type` con il tipo di mossa, `coordinates`con all'interno le coordinate (`x`, `y`, `z`)

- **Restituisce**: `gameId`, `action`, `status`, `state`, `turn`, `currentPlayer`:(`id`, `type`) `energyRemaining`, `tokensRemaining`.

<a1><img src="./Sequence Diagrams/SD action.png" height='500' align="center"/></a>

> POST /game/{{GAMEID}}/countermeasure

Rotta che permetta all'utente di effettuare una contromossa nel caso la mossa precedente è `ATTACK` o `SCAN`. Richiede autenticazione e che sia il turno del giocatore.

- **Parametri**: `type`

- **Restituisce**: `gameId`, `countermeasure`, `state`, `turn`, `currentPlayer`:(`id`, `type`) `energyRemaining`, `silenceRemaining`, `tokensRemaining`.

<a1><img src="./Sequence Diagrams/SD countermeasure.png" height='500' align="center"/></a>

> POST /game/{{GAMEID}}/pass

Rotta che permette all'utente di passare il turno. Richiede autenticazione e che sia il turno del giocatore.

- **Restituisce**:  `gameId`,  `status`, `result`, `state`, `turn`, `currentPlayer`:(`id`, `type`) `energyRemaining`, `tokensRemaining`.

<a1><img src="./Sequence Diagrams/SD pass.png" height='500' align="center"/></a>

> GET game/{{GAMEID}}/history
Rotta che restituisce lo storico delle mosse della partita in formato CSV

- **Restituisce**: i dati della partita in formato CSV

<a1><img src="./Sequence Diagrams/SD history.png" height='500' align="center"/></a>

# 5. Pattern utilizzati

Nel progetto sono stati utilizzati diversi pattern con l'obiettivo di separare le responsabilità, ridurre l'accoppiamento tra le componenti e rendere più semplice l'estensione della logica di gioco.

I principali pattern utilizzati sono:

- Repository Pattern;
- Service Layer;
- Command Pattern;
- Factory Pattern;
- Singleton Pattern;
- Value Object;
- Chain of Responsibility tramite i middleware Express.

## 5.1 Repository Pattern

Il **Repository Pattern** viene utilizzato per separare la logica applicativa dalle operazioni di accesso al database.

Nel progetto sono presenti principalmente:

```text
authRepository
gameRepository
```

Il service non interagisce direttamente con Sequelize o con le tabelle MySQL, ma utilizza i metodi messi a disposizione dai repository.

Il flusso è quindi:

```text
Service
   |
   v
Repository
   |
   v
Sequelize
   |
   v
MySQL
```

Ad esempio, durante il caricamento di una partita:

```text
GameService
    |
    v
GameRepository.findById()
    |
    v
Sequelize / MySQL
```

`GameRepository` non si limita a effettuare semplici query. Nel progetto svolge anche il mapping tra il modello persistente e il dominio.

Quando viene caricata una partita dal database, il repository recupera i dati relativi a:

- partita;
- giocatori;
- griglia;
- navi;
- posizioni;
- scudi;
- storico;
- eventuale pending action;

e li utilizza per ricostruire un oggetto `Game` utilizzabile dal dominio.

Allo stesso modo:

```ts
GameRepository.update(game, transaction)
```

traduce nuovamente lo stato del dominio nelle corrispondenti informazioni da salvare nel database.

Questo permette alle classi di dominio come `Game`, `Ship` o `GameEngine` di non dipendere direttamente da Sequelize.

---

## 5.2 Service Layer

Il **Service Layer** rappresenta il livello intermedio tra i controller HTTP, il dominio e i repository.

Nel progetto i controller hanno principalmente il compito di:

- ricevere la richiesta;
- leggere parametri e body;
- validare gli input quando necessario;
- chiamare il service;
- restituire la risposta HTTP;
- inoltrare gli errori all'`errorHandler`.

La logica del caso d'uso viene invece coordinata dal service.

Il flusso generale è:

```text
Controller
    |
    v
Service
    |
    +------> GameEngine / Domain
    |
    v
Repository
```

Ad esempio, durante una action:

```text
gameController
    |
    | performAction(...)
    v
GameService
    |
    | carica la partita
    | verifica il partecipante
    | costruisce l'azione
    v
GameEngine
    |
    | modifica il Game
    v
GameRepository
```

Il service è quindi responsabile dell'orchestrazione, mentre le singole regole di gioco rimangono nel dominio.

Questa separazione evita di inserire logica applicativa direttamente nelle route o nei controller.

---

## 5.3 Command Pattern

Il **Command Pattern** è utilizzato per rappresentare le operazioni che possono essere eseguite durante una partita.

Le azioni sono oggetti indipendenti che implementano un'interfaccia comune e incapsulano la propria logica di esecuzione.

Tra le action presenti nel progetto troviamo:

```text
Attack
Scan
Shield
Move
```

e, per le contromisure:

```text
CancelAttack
AlterScan
RadioSilence
```

Il principio è:

```text
GameEngine
    |
    v
IAction
    |
    +--> Attack
    +--> Scan
    +--> Shield
    +--> Move
```

Il `GameEngine` non deve quindi contenere tutta la logica specifica di ogni azione. Riceve un oggetto che rappresenta il comando e ne coordina l'esecuzione.

Ogni action può inoltre definire autonomamente elementi come:

- costo;
- comportamento;
- controlli specifici;
- modifica dello stato del gioco.

Questo rende più semplice aggiungere nuove azioni senza modificare completamente il motore di gioco.

Un ulteriore vantaggio è la testabilità: `Attack`, `Scan`, `Move` e le altre action possono essere testate singolarmente.

---

## 5.4 Factory Pattern

Il **Factory Pattern** viene utilizzato quando la creazione di un oggetto richiede una logica che non è opportuno lasciare direttamente al chiamante.

Nel progetto gli esempi principali sono:

```text
GridFactory
FleetFactory
```

### GridFactory

`GridFactory` centralizza la creazione della griglia.

Il codice che crea una partita non deve conoscere l'implementazione concreta utilizzata:

```text
GameService
    |
    v
GridFactory
    |
    v
Grid
```

In questo modo la costruzione della griglia rimane separata dalla logica del service.

### FleetFactory

`FleetFactory` gestisce la costruzione delle flotte e il posizionamento delle navi.

In particolare permette di centralizzare operazioni come:

- creazione delle navi;
- scelta delle posizioni;
- scelta degli orientamenti;
- verifica dei limiti della griglia;
- verifica delle sovrapposizioni;
- generazione di una configurazione valida.

Il service non deve quindi conoscere nel dettaglio l'algoritmo utilizzato per costruire una flotta.

Nel progetto è presente anche `ErrorFactory`, utilizzata per creare in maniera centralizzata gli errori applicativi:

```ts
ErrorFactory.gameNotFound()
ErrorFactory.forbidden()
ErrorFactory.badRequest(...)
```

Questo permette di mantenere coerenti messaggi e status code utilizzati dal sistema.

---

## 5.5 Singleton Pattern

Il **Singleton Pattern** viene utilizzato per `GameEngine`.

L'istanza del motore viene recuperata tramite:

```ts
GameEngine.getInstance()
```

invece di creare ogni volta un nuovo `GameEngine`.

Il flusso è:

```text
GameService
    |
    v
GameEngine.getInstance()
    |
    v
unica istanza GameEngine
```

`GameEngine` rappresenta infatti l'orchestratore delle regole di gioco e non contiene lo stato specifico di una singola partita.

Lo stato appartiene all'oggetto `Game`, mentre il `GameEngine` applica le operazioni su quel `Game`.

Tra le sue responsabilità troviamo:

- controllo del turno;
- controllo dello stato della partita;
- verifica dell'Energy;
- esecuzione delle action;
- esecuzione delle contromisure;
- gestione delle pending action;
- avanzamento del turno;
- controllo della fine della partita.

L'utilizzo di una singola istanza evita quindi la creazione inutile di più motori equivalenti.

---

## 5.6 Chain of Responsibility nei middleware

La gestione delle richieste HTTP utilizza la catena di middleware di Express, riconducibile al **Chain of Responsibility Pattern**.

Ogni middleware riceve la richiesta, esegue il proprio controllo e decide se:

- passare la richiesta al componente successivo tramite `next()`;
- interrompere la catena generando un errore.

Ad esempio, una rotta protetta segue un flusso simile:

```text
Request
   |
   v
authMiddleware
   |
   v
roleMiddleware("user")
   |
   v
Controller
```

`authMiddleware` verifica il JWT e identifica l'utente.

`roleMiddleware` verifica invece che l'utente possieda il ruolo richiesto.

Se entrambi i controlli hanno successo, la richiesta raggiunge il controller.

In caso di errore:

```text
Middleware / Controller / Service
              |
              v
           next(err)
              |
              v
        errorHandler
              |
              v
        HTTP response
```

Questo permette di applicare autenticazione, autorizzazione e gestione degli errori senza duplicare gli stessi controlli all'interno di ogni controller.

---

Nel complesso i pattern collaborano secondo una struttura di questo tipo:

```text
                  HTTP Request
                       |
                       v
        Chain of Responsibility
              (Middleware)
                       |
                       v
                  Controller
                       |
                       v
                Service Layer
                  /         \
                 v           v
          GameEngine      Repository
          Singleton          |
              |              v
              |           Database
              v
        Command Pattern
        Action / Countermeasure
              |
              v
             Game

Factory Pattern
    |
    +--> GridFactory
    +--> FleetFactory
    +--> ErrorFactory

Value Object
    |
    +--> Coordinates
```

In questo modo ogni componente mantiene una responsabilità ben definita e la logica del dominio rimane separata sia dalla gestione HTTP sia dalla persistenza.

---

# 6. Installazione

## 6.1 Prerequisiti

Per l'esecuzione locale sono necessari:

- Node.js;
- npm;
- Docker e Docker Compose, se si utilizza l'ambiente containerizzato;
- MySQL 8, se si esegue senza Docker.

## 6.2 Clonazione

```bash
git clone https://github.com/chrpccnn/progettoPA_Piccinini_Quattrini.git
cd progettoPA_Piccinini_Quattrini
```

## 6.3 Variabili d'ambiente

Creare un file `.env` nella root del progetto.

Esempio:

```env
MSQLUSR=my_user
MSQLPSW=my_password
MSQLDB=my_db
MSQLROOTPSW=root_password

DB_PORT=3306

JWT_SECRET=change_this_secret

SEED_ADMIN_EMAIL=admin@battleship.local
SEED_ADMIN_PASSWORD=Admin123!
SEED_USER_PASSWORD=Player123!
```

Con Docker, `DB_HOST` viene impostato sul servizio `mysql` dal `docker-compose.yaml`.

## 6.4 Avvio con Docker

```bash
docker compose up --build
```

Il backend viene esposto sulla porta:

```text
http://localhost:3000
```

Per inizializzare gli utenti seed:

```bash
docker compose exec backend npm run seed
```

Per arrestare i container:

```bash
docker compose down
```

Per eliminare anche il volume MySQL e ricreare completamente il database:

```bash
docker compose down -v
```

## 6.5 Avvio senza Docker

Installazione dipendenze:

```bash
npm install
```

Compilazione:

```bash
npm run build
```

Seed in sviluppo:

```bash
npm run seed:dev
```

Avvio sviluppo:

```bash
npm run dev
```

Oppure avvio della versione compilata:

```bash
npm start
```

## 6.6 Script disponibili

```text
npm run build      compila TypeScript
npm start          avvia dist/server.js
npm run dev        avvia il server con nodemon
npm test           esegue Jest
npm run seed       esegue il seed compilato
npm run seed:dev   esegue il seed TypeScript
```

## 6.7 Test

La suite utilizza Jest e Supertest.

```bash
npm test
```

Sono presenti test relativi a:

- griglia e coordinate;
- navi e flotte;
- azioni;
- contromisure;
- `Game`;
- `GameEngine`;
- restore di una partita persistita;
- comportamento base dell'app Express.

## 6.8 CLI di gioco

Il dominio può essere provato anche tramite CLI testuale:

```bash
npx ts-node src/cli/play.ts
```

La CLI consente di verificare le principali meccaniche di gioco indipendentemente dalle API REST.
