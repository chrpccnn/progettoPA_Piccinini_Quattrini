
/*
 * CLI di verifica per Space Battleship 3D.
 *
 * Esecuzione:
 *   npx ts-node src/cli/play.ts
 *
 * Responsabilità della CLI:
 * - raccogliere input;
 * - invocare GameEngine e le API dei giocatori;
 * - visualizzare stato, risultati e storico.
 *
 * Le regole sono delegate a Game, GameEngine, AIPlayer e AIStrategy.
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

import {
    DEFAULT_ENERGY_CONFIG,
    EnergyConfig
} from "../models/Engine/EnergyConfig";
import { Game } from "../models/Engine/Game";
import { GameEngine } from "../models/Engine/GameEngine";
import { GameState } from "../models/Engine/GameState";
import { historyToCsv } from "../models/Engine/HistoryCsv";

import { Fleet } from "../models/fleet/Fleet";
import {
    DEFAULT_FLEET_CONFIG,
    FleetConfig,
    MAX_SHIPS,
    SHIP_SIZES,
    validateFleetConfig
} from "../models/fleet/FleetConfig";
import { FleetFactory } from "../models/fleet/FleetFactory";
import { Orientation } from "../models/fleet/Orientation";
import { Ship } from "../models/fleet/Ship";
import { ShipType } from "../models/fleet/ShipType";

import { Coordinates } from "../models/grid/Coordinates";
import { GridFactory } from "../models/grid/GridFactory";
import { Grid } from "../models/grid/Igrid";

import { AIPlayer } from "../models/Players/AIPlayer";
import { AIStrategy } from "../models/Players/AIStrategy";
import { HumanPlayer } from "../models/Players/HumanPlayer";
import { IPlayer } from "../models/Players/IPlayer";
import { PlayerType } from "../models/Players/PlayerType";



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
import { ActionType } from "../models/MoveRecord";
import { User } from "../models/user";
import { UserRole } from "../models/UserType";

const INITIAL_TOKENS = 10;
const ENERGY: EnergyConfig = { ...DEFAULT_ENERGY_CONFIG };

interface Session {
    game: Game;
    engine: GameEngine;
    prompt: Prompt;
    debug: boolean;
    pvp: boolean;
    knowledge: Map<IPlayer, Map<string, string>>;
    notices: Map<IPlayer, string[]>;
    history: string[];
}

// ---------------------------------------------------------------------
// Utilità CLI: log, visualizzazione e input
// ---------------------------------------------------------------------

function log(s: Session, message: string): void {
    const line = `[turno ${s.game.getTurn()}] ${message}`;
    s.history.push(line);

    if (s.debug) {
        console.log(`[DEBUG] ${line}`);
    }
}

function opponentOf(game: Game, player: IPlayer): IPlayer {
    const opponent = game.getPlayers().find(p => p !== player);

    if (!opponent) {
        throw new Error("Impossibile individuare l'avversario.");
    }

    return opponent;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function notify(
    s: Session,
    player: IPlayer,
    message: string
): void {
    const messages = s.notices.get(player) ?? [];
    messages.push(message);
    s.notices.set(player, messages);
}

let nextUserId = 1;

function makeUser(email: string): User {
    return new User({
        id: nextUserId++,
        email,
        password: "cli-password",
        role: "user",
        tokens: INITIAL_TOKENS
    });
}

async function askOrientations(
    prompt: Prompt
): Promise<Orientation[]> {
    while (true) {
        const answer = (
            await prompt.ask(
                "Orientamenti consentiti: H=asse x, V=asse y, " +
                "D=asse z [default HVD]: "
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

// ---------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------

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
        return FleetFactory.create(
            fleetId,
            config,
            grid,
            orientations
        );
    }

    const fleet = new Fleet(fleetId);
    const occupied = new Set<Coordinates>();
    const owner = {
        getFleet: () => fleet
    } as unknown as IPlayer;

    const types = Object.values(ShipType).sort(
        (a, b) => SHIP_SIZES[b] - SHIP_SIZES[a]
    );

    const labels: Record<Orientation, string> = {
        [Orientation.HORIZONTAL]: "H (lungo l'asse x)",
        [Orientation.VERTICAL]: "V (lungo l'asse y)",
        [Orientation.DEPTH]: "D (lungo l'asse z)"
    };

    let allRandom = false;

    for (const type of types) {
        for (let n = 1; n <= config[type]; n++) {
            const id = `${fleetId}-${type}-${n}`;

            const addRandom = (): void => {
                const ship = FleetFactory.placeRandom(
                    id,
                    type,
                    grid,
                    orientations,
                    occupied,
                    Math.random
                );

                ship.getPositions().forEach(p => occupied.add(p));
                fleet.addShip(ship);
            };

            if (allRandom) {
                addRandom();
                continue;
            }

            console.log("\nFlotta posizionata finora");
            console.log(renderLayers(grid, fleetCell(owner)));

            while (true) {
                const how = await prompt.choice(
                    `${type} ${n}/${config[type]} ` +
                    `(lunghezza ${SHIP_SIZES[type]})`,
                    [
                        {
                            label: "Scelgo io la posizione",
                            value: "manual"
                        },
                        {
                            label: "Posiziona a caso questa nave",
                            value: "one"
                        },
                        {
                            label: "Posiziona a caso le rimanenti",
                            value: "all"
                        }
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
                        "Cella di partenza",
                        grid
                    );

                    const orientation =
                        SHIP_SIZES[type] === 1 ||
                        orientations.length === 1
                            ? orientations[0]
                            : await prompt.choice(
                                "Orientamento",
                                orientations.map(o => ({
                                    label: labels[o],
                                    value: o
                                }))
                            );

                    const ship = FleetFactory.shipAt(
                        id,
                        type,
                        start,
                        orientation,
                        grid,
                        occupied
                    );

                    ship.getPositions().forEach(
                        p => occupied.add(p)
                    );

                    fleet.addShip(ship);
                    break;
                } catch (error) {
                    console.log(
                        `\nPosizione non valida: ${errorMessage(error)}`
                    );
                }
            }
        }
    }

    console.log("\nFlotta posizionata");
    console.log(renderLayers(grid, fleetCell(owner)));

    if (pvp && !debug) {
        await prompt.ask(
            "Premi invio per nascondere la schermata..."
        );
        console.log("\n".repeat(40));
    }

    return fleet;
}

async function setup(prompt: Prompt): Promise<Session> {
    console.log("=== SPACE BATTLESHIP 3D (CLI) ===");

    const pvp = await prompt.choice(
        "Modalità di gioco",
        [
            {
                label: "Utente contro utente (stesso terminale)",
                value: true
            },
            {
                label: "Utente contro IA",
                value: false
            }
        ]
    );

    const debug = await prompt.confirm(
        "Modalità debug (flotta avversaria visibile e log)?",
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

        console.log("\n--- Flotta ---");
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

            // La factory valida il posizionamento casuale della flotta.
            aiFleet = FleetFactory.create(
                "fleet-2",
                config,
                grid,
                orientations
            );

            break;
        } catch (error) {
            console.log(
                `\nConfigurazione non valida: ${errorMessage(error)}`
            );
            console.log("Riprova.");
        }
    }

    // Radio Silence è configurabile anche contro l'IA.
    const silence = await prompt.int(
        "Parametro silence",
        0,
        5,
        3
    );

    const user1 = makeUser("giocatore1@cli.local");

    const fleet1 = await placeFleet(
        prompt,
        pvp,
        debug,
        "fleet-1",
        user1.email,
        config,
        grid,
        orientations
    );

    const player1 = new HumanPlayer(
        "p1",
        fleet1,
        ENERGY.initial,
        0,
        [user1.email],
        user1
    );

    let player2: IPlayer;

    if (pvp) {
        const user2 = makeUser("giocatore2@cli.local");

        const fleet2 = await placeFleet(
            prompt,
            pvp,
            debug,
            "fleet-2",
            user2.email,
            config,
            grid,
            orientations
        );

        player2 = new HumanPlayer(
            "p2",
            fleet2,
            ENERGY.initial,
            0,
            [user2.email],
            user2
        );
    } else {
        player2 = new AIPlayer(
            "ai",
            aiFleet!,
            ENERGY.initial,
            0,
            [],
            new AIStrategy()
        );
    }

    const game = new Game(
        "cli-game",
        grid,
        [player1, player2],
        user1,
        silence,
        ENERGY,
        orientations
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
            [player1, new Map<string, string>()],
            [player2, new Map<string, string>()]
        ]),
        notices: new Map(),
        history: []
    };

    log(
        session,
        `Partita creata ${grid.getWidth()}x${grid.getHeight()}x` +
        `${grid.getDepth()}, silence ${silence}, ` +
        `orientamenti ${orientations.join(",")}`
    );

    return session;
}

// ---------------------------------------------------------------------
// Visualizzazione dello stato
// ---------------------------------------------------------------------

function printBoards(s: Session, player: IPlayer): void {
    const game = s.game;
    const grid = game.getGrid();
    const opponent = opponentOf(game, player);

    console.log(
        "\nLa tua flotta (X = colpita, minuscola = scudo, " +
        "# = scudo su cella vuota)"
    );

    console.log(
        renderLayers(
            grid,
            fleetCell(player, game.getShields(player))
        )
    );

    console.log(
        "\nConoscenza dell'avversario (X = colpo, o = mancato, " +
        "? = nascosto, # = scudo)"
    );

    console.log(
        renderLayers(
            grid,
            knowledgeCell(s.knowledge.get(player)!)
        )
    );

    if (s.debug) {
        console.log("\n[DEBUG] Flotta avversaria reale");
        console.log(
            renderLayers(
                grid,
                fleetCell(opponent, game.getShields(opponent))
            )
        );
    }
}

function printHeader(s: Session, player: IPlayer): void {
    const game = s.game;
    const opponent = opponentOf(game, player);

    const tokens = player instanceof HumanPlayer
        ? `  token ${player.getUser().getTokens()}`
        : "";

    console.log("\n" + "=".repeat(60));
    console.log(
        `Turno ${game.getTurn()} - tocca a ${playerName(player)}`
    );
    console.log(
        `Energy ${player.getEnergy()}  ` +
        `silence rimasti ${game.getSilenceRemaining(player)}` +
        tokens
    );
    console.log(
        `Navi avversarie distrutte: ` +
        `${opponent.getFleet().getShips().filter(
            ship => ship.isDestroyed()
        ).length}/${opponent.getFleet().getShips().length}`
    );
    console.log("=".repeat(60));
}

async function handover(
    s: Session,
    player: IPlayer
): Promise<void> {
    if (s.pvp && !s.debug) {
        await s.prompt.ask(
            `\nPassa il terminale a ${playerName(player)} ` +
            "e premi invio..."
        );
        console.log("\n".repeat(40));
    }
}

// ---------------------------------------------------------------------
// Input umano: costruisce le azioni e le delega al motore
// ---------------------------------------------------------------------

async function askMove(
    s: Session,
    player: IPlayer
): Promise<Move | undefined> {
    const movable = player.getFleet().getShips().filter(
        ship =>
            (
                ship.getType() === ShipType.SCOUT ||
                ship.getType() === ShipType.DRONE
            ) &&
            !ship.isHit()
    );

    if (movable.length === 0) {
        console.log(
            "Nessuna nave disponibile per il movimento."
        );
        return undefined;
    }

    const ship = await s.prompt.choice(
        "Quale nave?",
        movable.map(item => ({
            label:
                `${item.getId()} in ` +
                item.getPositions().map(String).join(" "),
            value: item
        }))
    );

    const [dx, dy, dz] =
        await s.prompt.choice<[number, number, number]>(
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

    const origin = ship.getPositions()[0];

    return new Move(
        ship,
        Coordinates.create(
            origin.x + dx,
            origin.y + dy,
            origin.z + dz
        )
    );
}

async function humanTurn(
    s: Session,
    player: HumanPlayer
): Promise<void> {
    await handover(s, player);

    const notices = s.notices.get(player) ?? [];
    s.notices.delete(player);

    printHeader(s, player);
    notices.forEach(message => console.log(`>> ${message}`));
    printBoards(s, player);

    const grid = s.game.getGrid();

    while (true) {
        const action = await s.prompt.choice(
            `Azione (energy ${player.getEnergy()})`,
            [
                { label: "Attacco", value: "attack" },
                { label: "Scansione", value: "scan" },
                { label: "Sposta nave", value: "move" },
                { label: "Scudo", value: "shield" },
                { label: "Salta turno", value: "skip" },
                { label: "Mostra stato completo", value: "dump" },
                { label: "Storico eventi CLI", value: "history" },
                { label: "Storico mosse CSV", value: "csv" },
                { label: "Mostra griglie", value: "boards" }
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
                    console.log(
                        "\n" + (s.history.join("\n") || "(vuoto)")
                    );
                    continue;

                case "csv":
                    console.log(
                        "\n" + historyToCsv(
                            s.game,
                            s.debug ? undefined : player
                        )
                    );
                    continue;

                case "boards":
                    printBoards(s, player);
                    continue;

                case "attack": {
                    const target = await s.prompt.coordinates(
                        "Bersaglio",
                        grid
                    );

                    player.makeMove(
                        s.game,
                        s.engine,
                        new Attack(target)
                    );

                    log(s, `${playerName(player)} invia un attacco`);
                    return;
                }

                case "scan": {
                    const center = await s.prompt.coordinates(
                        "Centro della scansione",
                        grid
                    );

                    player.makeMove(
                        s.game,
                        s.engine,
                        new Scan(center)
                    );

                    log(s, `${playerName(player)} avvia una scansione`);
                    return;
                }

                case "shield": {
                    const cell = await s.prompt.coordinates(
                        "Cella da proteggere",
                        grid
                    );

                    player.makeMove(
                        s.game,
                        s.engine,
                        new Shield(cell)
                    );

                    log(s, `${playerName(player)} attiva uno scudo`);
                    return;
                }

                case "move": {
                    const move = await askMove(s, player);

                    if (!move) {
                        continue;
                    }

                    player.makeMove(s.game, s.engine, move);

                    log(s, `${playerName(player)} richiede un movimento`);
                    return;
                }

                case "skip":
                    s.engine.skipTurn(s.game, player);
                    log(s, `${playerName(player)} salta il turno`);
                    return;
            }
        } catch (error) {
            console.log(`\nAzione rifiutata: ${errorMessage(error)}`);
            log(s, `azione rifiutata: ${errorMessage(error)}`);
        }
    }
}

// ---------------------------------------------------------------------
// IA: nessuna scelta di gioco implementata nella CLI
// ---------------------------------------------------------------------

function aiTurn(s: Session, ai: AIPlayer): void {
    ai.takeStrategicTurn(s.game, s.engine);
    log(s, "Azione IA delegata ad AIStrategy");
}

// ---------------------------------------------------------------------
// Fase delle contromisure
// ---------------------------------------------------------------------

interface Response {
    result: AttackResult | undefined;
    silence: boolean;
    alter: boolean;
}




async function resolvePending(s: Session): Promise<void> {
    const game = s.game;
    const attacker = game.getPendingActionPlayer();
    const pending = game.getPendingAction();

    if (!attacker || !pending) {
        throw new Error("Azione pendente non valida.");
    }

    if (!(pending instanceof Attack) && !(pending instanceof Scan)) {
        throw new Error("Tipo di azione pendente non supportato.");
    }

    const responder = opponentOf(game, attacker);
    let outcome: Response;

    if (responder instanceof HumanPlayer) {
        // humanResponse gestisce già il passaggio del terminale.
        outcome = await humanResponse(
            s,
            responder,
            attacker,
            pending
        );
    } else if (responder instanceof AIPlayer) {
        // La scelta e la risoluzione restano delegate all'IA e al motore.
        responder.respondToPendingAction(game, s.engine);
        log(s, "Risposta IA delegata ad AIStrategy");

        // Recupera l'esito registrato dal motore per questa azione.
        const target = pending instanceof Attack
            ? pending.getCoordinates()
            : pending.getCenter();

        const history = game.getHistory();

        const actionRecord = history.slice().reverse().find(record =>
            record.player === attacker &&
            record.coordinates?.toString() === target.toString() &&
            (
                record.type === ActionType.ATTACK ||
                record.type === ActionType.SCAN
            )
        );

        const responseRecord = history.slice().reverse().find(record =>
            record.player === responder &&
            (
                record.type === ActionType.CANCEL_ATTACK ||
                record.type === ActionType.RADIO_SILENCE ||
                record.type === ActionType.ALTER_SCAN
            )
        );

        const rawResult = actionRecord?.result;
        const result = Object.values(AttackResult).includes(
            rawResult as AttackResult
        )
            ? rawResult as AttackResult
            : undefined;

        outcome = {
            result,
            silence: responseRecord?.type === ActionType.RADIO_SILENCE,
            alter: responseRecord?.type === ActionType.ALTER_SCAN
        };
    } else {
        throw new Error("Tipo di giocatore non supportato.");
    }

    // Mostra l'esito dopo che il motore ha risolto la contromisura.
    await announce(
        s,
        attacker,
        pending,
        outcome.result,
        outcome.silence,
        outcome.alter
    );
}


async function humanResponse(
    s: Session,
    responder: HumanPlayer,
    attacker: IPlayer,
    pending: Attack | Scan
): Promise<Response> {
    await handover(s, responder);

    if (pending instanceof Attack) {
        console.log(
            `\n${playerName(attacker)} ha attaccato ` +
            `${pending.getCoordinates()}`
        );
    } else {
        console.log(
            `\n${playerName(attacker)} ha scansionato ` +
            `${pending.getCenter()}`
        );
    }

    const candidates: Countermeasure[] =
        pending instanceof Scan
            ? [new AlterScan(pending)]
            : [
                new CancelAttack(pending),
                new RadioSilence(pending)
            ];

    const available = candidates.filter(candidate => {
        const silenceAvailable =
            !(candidate instanceof RadioSilence) ||
            s.game.canUseSilence(responder);

        return silenceAvailable &&
            responder.getEnergy() >= candidate.getCost();
    });

    if (available.length === 0) {
        console.log(
            "Nessuna contromisura disponibile. Passaggio al motore."
        );

        const result = s.engine.pass(s.game, responder);

        log(s, "Passaggio della fase contromisure");
        return {
            result,
            silence: false,
            alter: false
        };
    }

    while (true) {
        const chosen = await s.prompt.choice(
            `Contromisura (energy ${responder.getEnergy()}, ` +
            `silence rimasti ` +
            `${s.game.getSilenceRemaining(responder)})`,
            [
                { label: "Passa", value: null },
                ...available.map(candidate => ({
                    label:
                        `${candidate.constructor.name} ` +
                        `(costo ${candidate.getCost()})`,
                    value: candidate
                }))
            ]
        );

        try {
            if (chosen === null) {
                const result = s.engine.pass(s.game, responder);
                log(s, "Passaggio della fase contromisure");

                return {
                    result,
                    silence: false,
                    alter: false
                };
            }

            const result = s.engine.executeCountermeasure(
                s.game,
                responder,
                chosen
            );

            log(
                s,
                `Contromisura eseguita: ${chosen.constructor.name}`
            );

            return {
                result,
                silence: chosen instanceof RadioSilence,
                alter: chosen instanceof AlterScan
            };
        } catch (error) {
            console.log(
                `\nContromisura rifiutata: ${errorMessage(error)}`
            );
            log(s, `contromisura rifiutata: ${errorMessage(error)}`);
        }
    }
}

// ---------------------------------------------------------------------
// Presentazione degli esiti
// ---------------------------------------------------------------------

async function announce(
    s: Session,
    attacker: IPlayer,
    pending: Attack | Scan,
    result: AttackResult | undefined,
    silence: boolean,
    altered: boolean
): Promise<void> {
    if (pending instanceof Scan) {
        const message = altered
            ? `Scansione su ${pending.getCenter()}: ` +
              "risultato modificato dalla contromisura."
            : `Scansione su ${pending.getCenter()}: ` +
              `${pending.getOccupiedCells()} celle occupate`;

        console.log(`\n${message}`);
        log(s, message);
        return;
    }

    const target = pending.getCoordinates();
    const knowledge = s.knowledge.get(attacker)!;

    if (result === AttackResult.BLOCKER) {
        const message = `Attacco su ${target} annullato.`;

        console.log(`\n${message}`);
        notify(s, attacker, message);
        log(s, message);
        return;
    }

    if (silence) {
        knowledge.set(target.toString(), "?");

        const message =
            `Radio Silence: esito dell'attacco su ${target} nascosto.`;

        console.log(`\n${message}`);
        notify(s, attacker, message);
        log(s, message);
        return;
    }

    if (result === AttackResult.SHIELDED) {
        knowledge.set(target.toString(), "#");
    } else if (result === AttackResult.MISS) {
        knowledge.set(target.toString(), "o");
    } else if (
        result === AttackResult.HIT ||
        result === AttackResult.GAME_OVER
    ) {
        knowledge.set(target.toString(), "X");
    }

    const message =
        `Esito dell'attacco su ${target}: ${result ?? "non disponibile"}`;

    console.log(`\n${message}`);
    log(s, message);
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

async function main(): Promise<void> {
    const prompt = new Prompt();

    try {
        const s = await setup(prompt);

        while (s.game.getState() === GameState.RUNNING) {
            try {
                if (s.game.hasPendingAction()) {
                    await resolvePending(s);
                    continue;
                }

                const player = s.game.getCurrentPlayer();

                if (player instanceof AIPlayer) {
                    printHeader(s, player);
                    aiTurn(s, player);
                } else if (player instanceof HumanPlayer) {
                    await humanTurn(s, player);
                } else {
                    throw new Error("Tipo di giocatore non supportato.");
                }
            } catch (error) {
                console.log(`\nERRORE: ${errorMessage(error)}`);

                if (s.debug) {
                    console.log(error);
                }

                throw error;
            }
        }

        const winner = s.game.getWinner();

        console.log("\n" + "=".repeat(60));
        console.log(
            `PARTITA FINITA. Vincitore: ${
                winner ? playerName(winner) : "-"
            }`
        );
        console.log("=".repeat(60));

        for (const player of s.game.getPlayers()) {
            console.log(`\nFlotta di ${playerName(player)}`);
            console.log(
                renderLayers(
                    s.game.getGrid(),
                    fleetCell(player, s.game.getShields(player))
                )
            );
            console.log(fleetSummary(player));
        }

        const hidden = hiddenResults(s.game);

        if (hidden.length > 0) {
            console.log("\nEsiti nascosti da Radio Silence:");

            for (const record of hidden) {
                console.log(
                    `  turno ${record.turn} ` +
                    `${playerName(record.player)} ` +
                    `su ${record.coordinates}: ${record.result}`
                );
            }
        }

        console.log("\n" + dumpState(s.game));
        console.log("\nStorico mosse CSV:");
        console.log(historyToCsv(s.game));
    } catch (error) {
        console.error(`\nCLI terminata: ${errorMessage(error)}`);
        process.exitCode = 1;
    } finally {
        prompt.close();
    }
}

main();
