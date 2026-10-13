/*
 * CLI per giocare e fare debug.
 *
 *   npx ts-node src/cli/play.ts
 *
 * Modalità debug: mostra la flotta avversaria, l'esito reale
 * delle radio silence e un log di tutto quello che fa il motore.
 */
import { Attack } from "../models/Action/BasicMove/Attack";
import { AttackResult } from "../models/Action/BasicMove/AttackResult";
import { Move } from "../models/Action/BasicMove/Move";
import { Scan } from "../models/Action/BasicMove/Scan";
import { Shield } from "../models/Action/BasicMove/Shield";
import { AlterScan } from "../models/Action/Countermeasure/AlterScan";
import { CancelAttack } from "../models/Action/Countermeasure/CancelAttack";
import { RadioSilence } from "../models/Action/Countermeasure/RadioSilance";
import { Countermeasure } from "../models/Action/Countermeasure";
import { DEFAULT_ENERGY_CONFIG, EnergyConfig } from "../models/Engine/EnergyConfig";
import { Game } from "../models/Engine/Game";
import { historyToCsv } from "../models/Engine/HistoryCsv";
import { GameEngine } from "../models/Engine/GameEngine";
import { GameState } from "../models/Engine/GameState";
import { Fleet } from "../models/fleet/Fleet";
import {
    DEFAULT_FLEET_CONFIG,
    FleetConfig,
    MAX_SHIPS,
    SHIP_SIZES
} from "../models/fleet/FleetConfig";
import { FleetFactory } from "../models/fleet/FleetFactory";
import { validateFleetConfig } from "../models/fleet/FleetConfig";
import { Orientation } from "../models/fleet/Orientation";
import { Ship } from "../models/fleet/Ship";
import { ShipType } from "../models/fleet/ShipType";
import { Coordinates } from "../models/grid/Coordinates";
import { GridFactory } from "../models/grid/GridFactory";
import { Grid } from "../models/grid/Igrid";
import { AIPlayer } from "../models/Players/AIPlayer";
import { HumanPlayer } from "../models/Players/HumanPlayer";
import { IPlayer } from "../models/Players/IPlayer";
import { PlayerType } from "../models/Players/PlayerType";
import { User, UserCreationAttributes } from "../models/user";
import { UserRole } from "../models/UserType";
import { Prompt } from "./prompt";
import {
    dumpState,
    fleetCell,
    fleetSummary,
    hiddenResults,
    knowledgeCell,
    playerName,
    renderLayers
} from "./render";

/*
 * Valori fissi della CLI: i token iniziali simulano il valore del seed
 * del database, gli Energy Credits usano i default della specifica.
 */
const INITIAL_TOKENS = 10;
const ENERGY: EnergyConfig = { ...DEFAULT_ENERGY_CONFIG };

interface Session {
    game: Game;
    engine: GameEngine;
    prompt: Prompt;
    debug: boolean;
    pvp: boolean;
    /* Cosa ogni giocatore sa della flotta avversaria. */
    knowledge: Map<IPlayer, Map<string, string>>;
    /* Messaggi privati consegnati all'inizio del turno del destinatario. */
    notices: Map<IPlayer, string[]>;
    history: string[];
    aiTried: Set<string>;
}

// ---------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------

function log(s: Session, message: string): void {
    const line = `[turno ${s.game.getTurn()}] ${message}`;
    s.history.push(line);
    if (s.debug) {
        console.log(`[DEBUG] ${line}`);
    }
}

function opponentOf(game: Game, player: IPlayer): IPlayer {
    return game.getPlayers().find(p => p !== player)!;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function notify(s: Session, player: IPlayer, message: string): void {
    const list = s.notices.get(player) ?? [];
    list.push(message);
    s.notices.set(player, list);
}

function actionCosts(): Record<string, number> {
    const origin = Coordinates.create(0, 0, 0);
    const dummy = new Ship(
        "dummy", ShipType.DRONE, 1, Orientation.HORIZONTAL, [origin]
    );
    return {
        attack: new Attack(origin).getCost(),
        scan: new Scan(origin).getCost(),
        move: new Move(dummy, origin).getCost(),
        shield: new Shield(origin).getCost()
    };
}

// ---------------------------------------------------------------------
// Setup della partita
// ---------------------------------------------------------------------

function makeUser(email: string): User {
    return User.build({
        email,
        password: "cli-password",
        role: UserRole.USER,
        tokens: INITIAL_TOKENS
    } as unknown as UserCreationAttributes);
}

async function askOrientations(prompt: Prompt): Promise<Orientation[]> {

    while (true) {

        const answer = (
            await prompt.ask(
                "Orientamenti consentiti: H=asse x, V=asse y, D=asse z " +
                "[default HVD]: "
            )
        ).toUpperCase() || "HVD";

        const map: Record<string, Orientation> = {
            H: Orientation.HORIZONTAL,
            V: Orientation.VERTICAL,
            D: Orientation.DEPTH
        };

        const chosen = [...new Set(answer.split(""))]
            .filter(letter => map[letter] !== undefined)
            .map(letter => map[letter]);

        if (chosen.length > 0) {
            return chosen;
        }

        console.log("Scegli almeno una tra H, V, D.");
    }
}

/*
 * Posizionamento della flotta di un giocatore umano.
 * Per ogni nave si sceglie cella di partenza e orientamento,
 * oppure la si piazza a caso (anche tutte le rimanenti).
 */
async function placeFleet(
    prompt: Prompt,
    pvp: boolean,
    debug: boolean,
    fleetId: string,
    who: string,
    config: FleetConfig,
    grid: Grid,
    orientations: Orientation[]
): Promise<Fleet> {

    if (pvp && !debug) {
        await prompt.ask(
            `\nPassa il terminale a ${who} e premi invio...`
        );
        console.log("\n".repeat(40));
    }

    console.log(`\n--- Posizionamento della flotta di ${who} ---`);

    const mode = await prompt.choice(
        "Come vuoi posizionare le navi?",
        [
            { label: "Manualmente", value: "manual" },
            { label: "Casualmente", value: "random" }
        ]
    );

    if (mode === "random") {
        return FleetFactory.create(fleetId, config, grid, orientations);
    }

    const fleet = new Fleet(fleetId);
    const occupied = new Set<Coordinates>();
    const owner = { getFleet: () => fleet } as unknown as IPlayer;

    const types = Object.values(ShipType).sort(
        (a, b) => SHIP_SIZES[b] - SHIP_SIZES[a]
    );

    let allRandom = false;

    const labels: Record<Orientation, string> = {
        [Orientation.HORIZONTAL]: "H (lungo l'asse x)",
        [Orientation.VERTICAL]: "V (lungo l'asse y)",
        [Orientation.DEPTH]: "D (lungo l'asse z)"
    };

    for (const type of types) {
        for (let n = 1; n <= config[type]; n++) {

            const id = `${fleetId}-${type}-${n}`;

            const addRandom = (): void => {
                const ship = FleetFactory.placeRandom(
                    id, type, grid, orientations, occupied, Math.random
                );
                fleet.addShip(ship);
            };

            if (allRandom) {
                addRandom();
                continue;
            }

            console.log("\nFlotta posizionata finora (lettera = nave)");
            console.log(renderLayers(grid, fleetCell(owner)));

            while (true) {

                const how = await prompt.choice(
                    `${type} ${n}/${config[type]} ` +
                    `(lunghezza ${SHIP_SIZES[type]})`,
                    [
                        { label: "Scelgo io la posizione", value: "manual" },
                        { label: "Posiziona a caso questa nave", value: "one" },
                        { label: "Posiziona a caso tutte le rimanenti", value: "all" }
                    ]
                );

                try {

                    if (how === "all") {
                        allRandom = true;
                        addRandom();
                        break;
                    }

                    if (how === "one") {
                        addRandom();
                        break;
                    }

                    const start = await prompt.coordinates(
                        "Cella di partenza", grid
                    );

                    const orientation =
                        SHIP_SIZES[type] === 1 || orientations.length === 1
                            ? orientations[0]
                            : await prompt.choice(
                                "Orientamento",
                                orientations.map(o => ({
                                    label: labels[o],
                                    value: o
                                }))
                            );

                    const ship = FleetFactory.shipAt(
                        id, type, start, orientation, grid, occupied
                    );

                    ship.getPositions().forEach(p => occupied.add(p));
                    fleet.addShip(ship);
                    break;

                } catch (error) {
                    console.log(`\nPosizione non valida: ${errorMessage(error)}`);
                }
            }
        }
    }

    console.log("\nLa tua flotta");
    console.log(renderLayers(grid, fleetCell(owner)));

    if (pvp && !debug) {
        await prompt.ask("Premi invio per nascondere la schermata...");
        console.log("\n".repeat(40));
    }

    return fleet;
}

async function setup(prompt: Prompt): Promise<Session> {

    console.log("=== SPACE BATTLESHIP 3D (CLI) ===");

    const pvp = await prompt.choice(
        "Modalità di gioco",
        [
            { label: "Utente contro utente (stesso terminale)", value: true },
            { label: "Utente contro IA", value: false }
        ]
    );

    const debug = await prompt.confirm(
        "Modalità debug (flotta avversaria visibile e log del motore)?",
        true
    );

    let grid!: Grid;
    let config = {} as FleetConfig;
    let orientations: Orientation[];
    let aiFleet: Fleet | undefined;

    while (true) {

        console.log("\n--- Griglia ---");
        const width = await prompt.int("Larghezza", 3, 20, 10);
        const height = await prompt.int("Altezza", 3, 20, 10);
        const depth = await prompt.int("Profondità", 3, 20, 5);

        console.log("\n--- Flotta (uguale per i due giocatori) ---");
        config = {} as FleetConfig;

        for (const type of Object.values(ShipType)) {
            config[type] = await prompt.int(
                `${type} (lunghezza ${SHIP_SIZES[type]}, ` +
                `max ${MAX_SHIPS[type]})`,
                1,
                MAX_SHIPS[type],
                DEFAULT_FLEET_CONFIG[type]
            );
        }

        orientations = await askOrientations(prompt);

        try {
            validateFleetConfig(config);
            grid = GridFactory.create(width, height, depth);

            /*
             * Prova di piazzamento casuale: serve a scartare
             * configurazioni che non entrano nella griglia.
             * Nelle partite contro l'IA è anche la flotta dell'IA.
             */
            aiFleet = FleetFactory.create(
                "fleet-2", config, grid, orientations
            );
            break;
        } catch (error) {
            console.log(`\nConfigurazione non valida: ${errorMessage(error)}`);
            console.log("Riprova.");
        }
    }

    const silence = pvp
        ? await prompt.int("Parametro silence", 0, 5, 3)
        : 0;

    const user1 = makeUser("giocatore1@cli.local");

    const fleet1 = await placeFleet(
        prompt, pvp, debug, "fleet-1", user1.email,
        config, grid, orientations
    );

    const player1 = new HumanPlayer(
        "p1", fleet1, ENERGY.initial, 0, [user1.email], user1
    );

    let player2: IPlayer;

    if (pvp) {
        const user2 = makeUser("giocatore2@cli.local");
        const fleet2 = await placeFleet(
            prompt, pvp, debug, "fleet-2", user2.email,
            config, grid, orientations
        );
        player2 = new HumanPlayer(
            "p2", fleet2, ENERGY.initial, 0, [user2.email], user2
        );
    } else {
        player2 = new AIPlayer(
            "ai", aiFleet!, ENERGY.initial, 0, []
        );
    }

    const game = new Game(
        "cli-game", grid, [player1, player2], user1, silence,
        ENERGY, orientations
    );

    game.payCreationCost();
    game.start();

    const session: Session = {
        game,
        engine: GameEngine.getInstance(),
        prompt,
        debug,
        pvp,
        knowledge: new Map([
            [player1, new Map()],
            [player2, new Map()]
        ]),
        notices: new Map(),
        history: [],
        aiTried: new Set()
    };

    log(session,
        `Partita creata ${grid.getWidth()}x${grid.getHeight()}x` +
        `${grid.getDepth()}, silence ${silence}, ` +
        `orientamenti ${orientations.join(",")}`);

    return session;
}

// ---------------------------------------------------------------------
// Visualizzazione
// ---------------------------------------------------------------------

function printBoards(s: Session, player: IPlayer): void {

    const grid = s.game.getGrid();
    const opponent = opponentOf(s.game, player);

    console.log("\nLa tua flotta (lettera = nave, X = colpita, minuscola = nave con scudo, # = scudo su cella vuota)");
    console.log(renderLayers(grid, fleetCell(player, s.game.getShields(player))));

    console.log("Cosa sai dell'avversario (X colpo, o mancato, ? nascosto, # scudo)");
    console.log(
        renderLayers(grid, knowledgeCell(s.knowledge.get(player)!))
    );

    if (s.debug) {
        console.log("[DEBUG] Flotta avversaria reale");
        console.log(renderLayers(grid, fleetCell(opponent, s.game.getShields(opponent))));
    }
}

function printHeader(s: Session, player: IPlayer): void {

    const game = s.game;
    const opponent = opponentOf(game, player);

    const tokens =
        player instanceof HumanPlayer
            ? `  token ${player.getUser().getTokens()}`
            : "";

    console.log("\n" + "=".repeat(60));
    console.log(
        `Turno ${game.getTurn()} - tocca a ${playerName(player)}`
    );
    console.log(
        `Energy ${player.getEnergy()}  ` +
        `silence rimasti ${game.getSilenceRemaining(player)}${tokens}`
    );
    console.log(
        `Navi avversarie distrutte: ` +
        `${opponent.getFleet().getShips().filter(x => x.isDestroyed()).length}` +
        `/${opponent.getFleet().getShips().length}`
    );
    console.log("=".repeat(60));
}

// ---------------------------------------------------------------------
// Turno di un umano
// ---------------------------------------------------------------------

async function handover(s: Session, player: IPlayer): Promise<void> {

    if (s.pvp && !s.debug) {
        await s.prompt.ask(
            `\nPassa il terminale a ${playerName(player)} ` +
            `e premi invio...`
        );
        console.log("\n".repeat(40));
    }
}

async function humanTurn(s: Session, player: HumanPlayer): Promise<void> {

    await handover(s, player);

    const notices = s.notices.get(player) ?? [];
    s.notices.delete(player);

    printHeader(s, player);
    notices.forEach(n => console.log(`>> ${n}`));
    printBoards(s, player);

    const costs = actionCosts();
    const grid = s.game.getGrid();

    while (true) {

        const action = await s.prompt.choice(
            `Azione (energy ${player.getEnergy()})`,
            [
                { label: `Attacco (costo ${costs.attack})`, value: "attack" },
                { label: `Scansione 3x3x3 (costo ${costs.scan})`, value: "scan" },
                { label: `Sposta nave (costo ${costs.move})`, value: "move" },
                { label: `Scudo (costo ${costs.shield})`, value: "shield" },
                { label: "Salta il turno", value: "skip" },
                { label: "Mostra stato completo", value: "dump" },
                { label: "Storico eventi (log CLI)", value: "history" },
                { label: "Storico mosse (CSV)", value: "csv" },
                { label: "Mostra di nuovo le griglie", value: "boards" }
            ],
            { label: "Esci", value: "quit" }
        );

        try {

            switch (action) {

                case "quit":
                    s.prompt.close();
                    process.exit(0);
                    return;

                case "dump":
                    console.log("\n" + dumpState(s.game));
                    continue;

                case "history":
                    console.log("\n" + (s.history.join("\n") || "(vuoto)"));
                    continue;

                case "csv":
                    console.log("\n" + historyToCsv(
                        s.game, s.debug ? undefined : player
                    ));
                    continue;

                case "boards":
                    printBoards(s, player);
                    continue;

                case "attack": {
                    const target = await s.prompt.coordinates("Bersaglio", grid);
                    player.makeMove(s.game, s.engine, new Attack(target));
                    log(s, `${playerName(player)} attacca ${target}`);
                    return;
                }

                case "scan": {
                    const center = await s.prompt.coordinates(
                        "Centro della scansione", grid
                    );
                    player.makeMove(s.game, s.engine, new Scan(center));
                    log(s, `${playerName(player)} scansiona ${center}`);
                    return;
                }

                case "shield": {
                    const cell = await s.prompt.coordinates("Cella da proteggere", grid);
                    player.makeMove(s.game, s.engine, new Shield(cell));
                    log(s, `${playerName(player)} attiva lo scudo su ${cell}`);
                    return;
                }

                case "move": {
                    const move = await askMove(s, player);
                    if (move === undefined) {
                        continue;
                    }
                    player.makeMove(s.game, s.engine, move);
                    log(s,
                        `${playerName(player)} sposta ` +
                        `${move.getShip().getId()} -> ${move.getDestination()}`);
                    return;
                }

                case "skip":
                    s.engine.skipTurn(s.game, player);
                    log(s, `${playerName(player)} salta il turno`);
                    return;
            }

        } catch (error) {
            console.log(`\nMossa rifiutata: ${errorMessage(error)}`);
            log(s, `rifiutata: ${errorMessage(error)}`);
        }
    }
}

async function askMove(
    s: Session,
    player: IPlayer
): Promise<Move | undefined> {

    const movable = player
        .getFleet()
        .getShips()
        .filter(ship =>
            (ship.getType() === ShipType.SCOUT ||
                ship.getType() === ShipType.DRONE) &&
            !ship.isHit()
        );

    if (movable.length === 0) {
        console.log("Nessuna nave può muoversi (solo Scout e Drone non colpiti).");
        return undefined;
    }

    const ship = await s.prompt.choice(
        "Quale nave?",
        movable.map(x => ({
            label: `${x.getId()} in ${x.getPositions().map(String).join(" ")}`,
            value: x
        })),
        undefined
    );

    const [dx, dy, dz] = await s.prompt.choice<[number, number, number]>(
        "Direzione (una cella)",
        [
            { label: "x+", value: [1, 0, 0] },
            { label: "x-", value: [-1, 0, 0] },
            { label: "y+", value: [0, 1, 0] },
            { label: "y-", value: [0, -1, 0] },
            { label: "z+", value: [0, 0, 1] },
            { label: "z-", value: [0, 0, -1] }
        ]
    );

    /*
     * Move si aspetta la nuova posizione della prima cella
     * della nave.
     */
    const origin = ship.getPositions()[0];

    return new Move(
        ship,
        Coordinates.create(origin.x + dx, origin.y + dy, origin.z + dz)
    );
}

// ---------------------------------------------------------------------
// Turno dell'IA
// ---------------------------------------------------------------------

function aiTurn(s: Session, ai: AIPlayer): void {

    const grid = s.game.getGrid();
    const costs = actionCosts();

    if (ai.getEnergy() < costs.attack) {
        s.engine.skipTurn(s.game, ai);
        log(s, "IA salta il turno (energy insufficiente)");
        return;
    }

    /*
     * Mossa casuale: attacco su una cella non ancora provata.
     */
    let target: Coordinates;

    do {
        target = Coordinates.create(
            Math.floor(Math.random() * grid.getWidth()),
            Math.floor(Math.random() * grid.getHeight()),
            Math.floor(Math.random() * grid.getDepth())
        );
    } while (s.aiTried.has(target.toString()));

    s.aiTried.add(target.toString());

    ai.makeMove(s.game, s.engine, new Attack(target));

    log(s, `IA attacca ${target}`);
}

// ---------------------------------------------------------------------
// Risoluzione dell'azione pending (fase contromisure)
// ---------------------------------------------------------------------

async function resolvePending(s: Session): Promise<void> {

    const game = s.game;
    const attacker = game.getPendingActionPlayer()!;
    const pending = game.getPendingAction()!;
    const responder = opponentOf(game, attacker);

    let result: AttackResult | undefined;
    let usedSilence = false;
    let usedAlterScan = false;

    if (responder.getType() === PlayerType.AI) {

        result = s.engine.pass(game, responder);
        log(s, "IA passa la fase contromisure");

    } else {

        const outcome = await humanResponse(
            s, responder as HumanPlayer, attacker, pending
        );

        result = outcome.result;
        usedSilence = outcome.silence;
        usedAlterScan = outcome.alter;
    }

    announce(s, attacker, pending, result, usedSilence, usedAlterScan);
}

interface Response {
    result: AttackResult | undefined;
    silence: boolean;
    alter: boolean;
}

async function humanResponse(
    s: Session,
    responder: HumanPlayer,
    attacker: IPlayer,
    pending: object
): Promise<Response> {

    const game = s.game;

    await handover(s, responder);

    if (pending instanceof Attack) {
        console.log(
            `\n${playerName(attacker)} attacca ${pending.getCoordinates()}`
        );
    } else if (pending instanceof Scan) {
        console.log(
            `\n${playerName(attacker)} scansiona attorno a ${pending.getCenter()}`
        );
    }

    const available: { label: string; value: Countermeasure | null }[] = [];

    const candidates: Countermeasure[] =
        pending instanceof Scan
            ? [new AlterScan(pending)]
            : pending instanceof Attack
                ? [new CancelAttack(pending), new RadioSilence(pending)]
                : [];

    for (const candidate of candidates) {

        const affordable =
            (!(candidate instanceof RadioSilence) ||
                game.canUseSilence(responder)) &&
            responder.getEnergy() >= candidate.getCost();

        if (affordable) {
            available.push({
                label:
                    `${candidate.constructor.name} ` +
                    `(costo ${candidate.getCost()})`,
                value: candidate
            });
        }
    }

    /*
     * Senza contromisure disponibili si passa in automatico.
     */
    if (available.length === 0) {

        console.log(
            `Nessuna contromisura disponibile ` +
            `(energy ${responder.getEnergy()}): passi.`
        );

        const result = s.engine.pass(game, responder);
        log(s, `${playerName(responder)} passa (nessuna contromisura)`);

        return { result, silence: false, alter: false };
    }

    while (true) {

        const chosen = await s.prompt.choice(
            `Contromisura (energy ${responder.getEnergy()}, ` +
            `silence rimasti ${game.getSilenceRemaining(responder)})`,
            [{ label: "Passa", value: null }, ...available]
        );

        try {

            if (chosen === null) {
                const result = s.engine.pass(game, responder);
                log(s, `${playerName(responder)} passa`);
                return { result, silence: false, alter: false };
            }

            const result = s.engine.executeCountermeasure(
                game, responder, chosen
            );

            log(s,
                `${playerName(responder)} usa ` +
                `${chosen.constructor.name}, esito ${result ?? "-"}`);

            return {
                result,
                silence: chosen instanceof RadioSilence,
                alter: chosen instanceof AlterScan
            };

        } catch (error) {
            console.log(`\nContromisura rifiutata: ${errorMessage(error)}`);
            log(s, `contromisura rifiutata: ${errorMessage(error)}`);
        }
    }
}

async function announce(
    s: Session,
    attacker: IPlayer,
    pending: object,
    result: AttackResult | undefined,
    silence: boolean,
    altered: boolean
): Promise<void> {

   
if (pending instanceof Scan) {
    const text =
        `Scansione di ${pending.getCenter()}: ` +
        `${pending.getOccupiedCells()} celle occupate` +
        (altered && s.debug ? " (risultato alterato)" : "");

    if (attacker.getType() === PlayerType.HUMAN) {
        if (s.pvp && !s.debug) {
            await handover(s, attacker);
        }

        console.log(`\n${text}`);
    }

    log(s, text);
    return;
}

    if (!(pending instanceof Attack)) {
        return;
    }

    const target = pending.getCoordinates();
    const known = s.knowledge.get(attacker)!;
    const who = playerName(attacker);

    if (result === AttackResult.BLOCKER) {
        console.log(`\nAttacco di ${who} su ${target} annullato.`);
        notify(s, attacker, `Il tuo attacco su ${target} è stato annullato.`);
        log(s, `attacco su ${target} annullato`);
        return;
    }

    if (silence) {
        known.set(target.toString(), "?");
        console.log(
            `\nRadio silence: l'esito dell'attacco su ${target} non viene comunicato.`
        );
        notify(s, attacker,
            `Esito dell'attacco su ${target} nascosto da radio silence.`);
        log(s, `attacco su ${target} sotto radio silence, esito reale ${result}`);
        return;
    }

    if (result === AttackResult.SHIELDED) {
        known.set(target.toString(), "#");
        console.log(
            `\nEsito dell'attacco di ${who} su ${target}: SHIELDED ` +
            `(la cella era protetta, lo scudo è stato rimosso)`
        );
        log(s, `attacco su ${target}: SHIELDED`);
        return;
    }

    known.set(target.toString(), result === AttackResult.MISS ? "o" : "X");

    console.log(`\nEsito dell'attacco di ${who} su ${target}: ${result}`);
    log(s, `attacco su ${target}: ${result}`);
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

async function main(): Promise<void> {

    const prompt = new Prompt();
    const s = await setup(prompt);

    while (s.game.getState() === GameState.RUNNING) {

        try {

            if (s.game.hasPendingAction()) {
                await resolvePending(s);
                continue;
            }

            const player = s.game.getCurrentPlayer();

            if (player.getType() === PlayerType.AI) {
                aiTurn(s, player as AIPlayer);
            } else {
                await humanTurn(s, player as HumanPlayer);
            }

        } catch (error) {
            console.log(`\nERRORE: ${errorMessage(error)}`);
            if (s.debug) {
                console.log(error);
            }
            prompt.close();
            process.exit(1);
        }
    }

    const winner = s.game.getWinner();

    console.log("\n" + "=".repeat(60));
    console.log(
        `PARTITA FINITA. Vincitore: ${
            winner === undefined ? "-" : playerName(winner)
        }`
    );
    console.log("=".repeat(60));

    for (const player of s.game.getPlayers()) {
        console.log(`\nFlotta di ${playerName(player)}`);
        console.log(renderLayers(s.game.getGrid(), fleetCell(player, s.game.getShields(player))));
        console.log(fleetSummary(player));
    }

    const hidden = hiddenResults(s.game);

    if (hidden.length > 0) {
        console.log("\nEsiti nascosti da Radio Silence:");
        for (const record of hidden) {
            console.log(
                `  turno ${record.turn} ${playerName(record.player)} ` +
                `su ${record.coordinates}: ${record.result}`
            );
        }
    }

    console.log("\n" + dumpState(s.game));

    prompt.close();
}

main();