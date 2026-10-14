import { GameInput } from "../Zod/zodSchemas";
import { ErrorFactory } from "../errors/ErrorFactory";
import UserRepository from "../repository/authRepository";
import GameRepository from "../repository/gameRepository";
import { withTransaction } from "../repository/transaction";

import { GridFactory } from "../models/grid/GridFactory";
import { Fleet } from "../models/fleet/Fleet";
import { FleetConfig } from "../models/fleet/FleetConfig";
import { FleetFactory } from "../models/fleet/FleetFactory";
import { ShipType } from "../models/fleet/ShipType";
import { HumanPlayer } from "../models/Players/HumanPlayer";
import { AIPlayer } from "../models/Players/AIPlayer";
import { IPlayer } from "../models/Players/IPlayer";
import { PlayerType } from "../models/Players/PlayerType";
import { Game } from "../models/Engine/Game";
import { historyToCsv } from "../models/Engine/HistoryCsv";
import { Attack } from "../models/Action/BasicMove/Attack";
import { Scan } from "../models/Action/BasicMove/Scan";
import { GameMode } from "../models/UserType";

import { TokenCost } from "../TokenCost";
import { ActionInput, CountermeasureInput } from "../Zod/zodSchemas";
import { IAction } from "../models/Action/IAction";
import { GameEngine } from "../models/Engine/GameEngine";
import { Shield } from "../models/Action/BasicMove/Shield";
import { Move } from "../models/Action/BasicMove/Move";
import { Coordinates } from "../models/grid/Coordinates";
import { DbTransaction } from "../repository/transaction";

import { Countermeasure } from "../models/Action/Countermeasure";
import { CancelAttack } from "../models/Action/Countermeasure/CancelAttack";
import { AlterScan } from "../models/Action/Countermeasure/AlterScan";
import { RadioSilence } from "../models/Action/Countermeasure/RadioSilance";
import { CountermeasureType } from "../models/Action/Countermeasure/CountermeasureType";

export class GameService {

    /*
     * Crea e avvia una partita. Tutto avviene in una transazione:
     * se un passaggio fallisce non resta ne' la partita ne' l'addebito.
     */
    static async createGame(
        userId: number,
        body: GameInput
    ) {
        return withTransaction(async transaction => {

            // Avversario (solo partite tra utenti): serve il suo id per il blocco
            let opponentId: number | undefined;

            if (body.mode === "user") {
                const found = await UserRepository.findByEmail(
                    body.opponentEmail,
                    transaction
                );

                if (!found) {
                    throw ErrorFactory.userNotFound();
                }

                if (found.id === userId) {
                    throw ErrorFactory.badRequest(
                        "You cannot play against yourself"
                    );
                }

                opponentId = found.id;
            }

            /*
             * Si bloccano le righe degli utenti coinvolti fino al commit:
             * due creazioni simultanee non possono far partecipare lo
             * stesso utente a due partite, e il saldo non viene letto
             * mentre un'altra richiesta lo sta modificando.
             */
            const locked = await UserRepository.lockByIds(
                opponentId === undefined
                    ? [userId]
                    : [userId, opponentId],
                transaction
            );

            const user = locked.find(u => u.id === userId);

            if (!user) {
                throw ErrorFactory.userNotFound();
            }

            if (user.getTokens() < TokenCost.GAME_CREATION) {
                throw ErrorFactory.insufficientTokens();
            }

            if (await GameRepository.hasActiveGame(user.id, transaction)) {
                throw ErrorFactory.userAlreadyInGame();
            }

            const opponent =
                opponentId === undefined
                    ? undefined
                    : locked.find(u => u.id === opponentId);

            if (
                opponent !== undefined &&
                await GameRepository.hasActiveGame(opponent.id, transaction)
            ) {
                throw ErrorFactory.opponentAlreadyInGame();
            }

            const grid = GridFactory.create(
                body.grid.grid_base,
                body.grid.grid_base,
                body.grid.grid_height
            );

            const gameId = "game-" + user.id + "-" + Date.now();

            /*
             * Le flotte vengono piazzate a caso alla creazione (specifica),
             * con la stessa composizione per i due giocatori.
             */
            const fleetConfig: FleetConfig = {
                [ShipType.MOTHER_SHIP]: body.ships.motherShip,
                [ShipType.CRUISER]: body.ships.cruiser,
                [ShipType.SCOUT]: body.ships.scout,
                [ShipType.DRONE]: body.ships.drone
            };

            const placeFleet = (fleetId: string): Fleet => {
                try {
                    return FleetFactory.create(
                        fleetId,
                        fleetConfig,
                        grid,
                        body.orientation
                    );
                } catch (error) {
                    throw ErrorFactory.badRequest(
                        error instanceof Error
                            ? error.message
                            : "Invalid fleet configuration"
                    );
                }
            };

            const creatorPlayer = new HumanPlayer(
                "player-" + user.id + "-" + gameId,
                placeFleet("fleet-" + user.id + "-" + gameId),
                body.energy.initial,
                0,
                [],
                user
            );

            let game: Game;

            if (body.mode === "ai") {
                const aiPlayer = new AIPlayer(
                    "player-ai-" + gameId,
                    placeFleet("fleet-ai-" + gameId),
                    body.energy.initial,
                    0,
                    []
                );

                game = new Game(
                    gameId,
                    grid,
                    [creatorPlayer, aiPlayer],
                    user,
                    0,
                    body.energy,
                    body.orientation
                );
            }
            else {
                const opponentPlayer = new HumanPlayer(
                    "player-" + opponent!.id + "-" + gameId,
                    placeFleet("fleet-" + opponent!.id + "-" + gameId),
                    body.energy.initial,
                    0,
                    [],
                    opponent!
                );

                game = new Game(
                    gameId,
                    grid,
                    [creatorPlayer, opponentPlayer],
                    user,
                    body.silence,
                    body.energy,
                    body.orientation
                );
            }

            game.payCreationCost();
            game.start();

            // salva partita, flotte, griglia e il nuovo saldo del creatore
            await GameRepository.insert(game, transaction);

            return {
                gameId: game.getId(),

                mode: body.mode,

                state: game.getState(),

                turn: game.getTurn(),

                creator: {
                    id: user.id,
                    email: user.email
                },

                currentPlayer: {
                    id: game.getCurrentPlayer().getId(),
                    type: game.getCurrentPlayer().getType()
                },

                grid: {
                    width: game.getGrid().getWidth(),
                    height: game.getGrid().getHeight(),
                    depth: game.getGrid().getDepth()
                },

                players: game.getPlayers().map(
                    player => ({
                        id: player.getId(),
                        type: player.getType(),
                        energy: player.getEnergy()
                    })
                ),

                tokensRemaining: user.getTokens()
            };
        });
    }

    /*
     * Stato della partita: di chi e' il turno, se e' finita, vincitore,
     * Energy residua e stato delle navi. Le posizioni delle navi si vedono
     * solo per la propria flotta.
     */
    static async getGameState(
        gameId: string,
        userId: number
    ) {
        const game = await GameService.loadForParticipant(gameId, userId);
        const me = GameService.playerOfUser(game, userId)!;

        const pending = game.getPendingAction();
        const pendingPlayer = game.getPendingActionPlayer();
        const winner = game.getWinner();

        let pendingAction: object | null = null;

        if (pending !== undefined && pendingPlayer !== undefined) {
            const target =
                pending instanceof Attack
                    ? pending.getCoordinates()
                    : pending instanceof Scan
                        ? pending.getCenter()
                        : undefined;

            pendingAction = {
                type: pending.constructor.name.toUpperCase(),
                playerId: pendingPlayer.getId(),
                coordinates: target === undefined
                    ? null
                    : { x: target.x, y: target.y, z: target.z }
            };
        }

        return {
            gameId: game.getId(),
            mode: GameService.modeOf(game),
            state: game.getState(),
            turn: game.getTurn(),
            currentPlayer: {
                id: game.getCurrentPlayer().getId(),
                type: game.getCurrentPlayer().getType()
            },
            finished: game.getState() === "FINISHED",
            winner: winner === undefined
                ? null
                : { id: winner.getId(), type: winner.getType() },
            pendingAction,
            grid: {
                width: game.getGrid().getWidth(),
                height: game.getGrid().getHeight(),
                depth: game.getGrid().getDepth()
            },
            players: game.getPlayers().map(player => ({
                id: player.getId(),
                type: player.getType(),
                you: player === me,
                energy: player.getEnergy(),
                silenceRemaining: game.getSilenceRemaining(player),
                ships: player.getFleet().getShips().map(ship => ({
                    id: ship.getId(),
                    type: ship.getType(),
                    size: ship.getSize(),
                    status: ship.getStatus(),
                    hits: ship.getHitPositions().length,
                    positions: player === me
                        ? ship.getPositions().map(
                            p => ({ x: p.x, y: p.y, z: p.z })
                        )
                        : undefined
                }))
            })),
            tokensRemaining: (me instanceof HumanPlayer)
                ? me.getUser().getTokens()
                : undefined
        };
    }

    /*
     * Azioni, contromosse e PASS: da collegare nel prossimo passo.
     * Il pattern e' quello di createGame: withTransaction, lettura con
     * GameRepository.findById(id, transaction, true), GameEngine,
     * GameRepository.update(game, transaction).
     */
    static async performAction(
        gameId: string,
        userId: number,
        body: ActionInput
    ) {
        return withTransaction(
            async transaction => {

                const game =
                    await GameRepository.findById(
                        gameId,
                        transaction,
                        true
                    );

                if (!game) {
                    throw ErrorFactory.gameNotFound();
                }

                const player =
                    GameService.playerOfUser(
                        game,
                        userId
                    );

                if (!player) {
                    throw ErrorFactory.forbidden();
                }

                const action =
                    GameService.buildAction(
                        body,
                        player
                    );

                const engine =
                    GameEngine.getInstance();

                try {
                    engine.executeAction(
                        game,
                        player,
                        action
                    );
                }
                catch (error) {

                    if (
                        error instanceof Error &&
                        error.message ===
                        "Insufficient energy."
                    ) {
                        throw ErrorFactory
                            .insufficientEnergy();
                    }

                    if (error instanceof Error) {
                        throw ErrorFactory.badRequest(
                            error.message
                        );
                    }

                    throw error;
                }

                await GameRepository.update(
                    game,
                    transaction
                );

                return {
                    gameId: game.getId(),

                    action: body.type,

                    status: game.hasPendingAction()
                        ? "PENDING_COUNTERMEASURE"
                        : "EXECUTED",

                    state: game.getState(),

                    turn: game.getTurn(),

                    currentPlayer: {
                        id: game
                            .getCurrentPlayer()
                            .getId(),

                        type: game
                            .getCurrentPlayer()
                            .getType()
                    },

                    energyRemaining:
                        player.getEnergy(),

                    tokensRemaining:
                        player instanceof HumanPlayer
                            ? player
                                .getUser()
                                .getTokens()
                            : undefined
                };
            }
        );
    }

    private static buildCountermeasure(
        game: Game,
        body: CountermeasureInput
    ): Countermeasure {

        const pending =
            game.getPendingAction();

        if (!pending) {
            throw ErrorFactory.badRequest(
                "There is no action to counter"
            );
        }

        switch (body.type) {

            case CountermeasureType.CANCEL_ATTACK:

                if (!(pending instanceof Attack)) {
                    throw ErrorFactory.badRequest(
                        "CancelAttack can only counter an Attack"
                    );
                }

                return new CancelAttack(pending);


            case CountermeasureType.RADIO_SILENCE:

                if (!(pending instanceof Attack)) {
                    throw ErrorFactory.badRequest(
                        "RadioSilence can only counter an Attack"
                    );
                }

                return new RadioSilence(pending);


            case CountermeasureType.ALTER_SCAN:

                if (!(pending instanceof Scan)) {
                    throw ErrorFactory.badRequest(
                        "AlterScan can only counter a Scan"
                    );
                }

                return new AlterScan(pending);
        }
    }

    static async performCountermeasure(
        gameId: string,
        userId: number,
        body: CountermeasureInput
    ) {
        return withTransaction(
            async transaction => {

                const game =
                    await GameService.loadForParticipant(
                        gameId,
                        userId,
                        transaction,
                        true
                    );

                const player =
                    GameService.playerOfUser(
                        game,
                        userId
                    )!;

                const countermeasure =
                    GameService.buildCountermeasure(
                        game,
                        body
                    );

                const engine =
                    GameEngine.getInstance();

                try {
                    engine.executeCountermeasure(
                        game,
                        player,
                        countermeasure
                    );
                }
                catch (error) {

                    if (
                        error instanceof Error &&
                        error.message ===
                        "Insufficient energy."
                    ) {
                        throw ErrorFactory.insufficientEnergy();
                    }

                    if (error instanceof Error) {
                        throw ErrorFactory.badRequest(
                            error.message
                        );
                    }

                    throw error;
                }

                await GameRepository.update(
                    game,
                    transaction
                );

                return {
                    gameId: game.getId(),

                    countermeasure: body.type,

                    state: game.getState(),

                    turn: game.getTurn(),

                    currentPlayer: {
                        id: game
                            .getCurrentPlayer()
                            .getId(),

                        type: game
                            .getCurrentPlayer()
                            .getType()
                    },

                    energyRemaining:
                        player.getEnergy(),

                    silenceRemaining:
                        game.getSilenceRemaining(
                            player
                        ),

                    tokensRemaining:
                        player instanceof HumanPlayer
                            ? player
                                .getUser()
                                .getTokens()
                            : undefined
                };
            }
        );
    }

    static async passCountermeasure(
        gameId: string,
        userId: number
    ) {
        return withTransaction(
            async transaction => {

                const game =
                    await GameService.loadForParticipant(
                        gameId,
                        userId,
                        transaction,
                        true
                    );

                const player =
                    GameService.playerOfUser(
                        game,
                        userId
                    )!;

                const engine =
                    GameEngine.getInstance();

                let result;

                try {
                    result = engine.pass(
                        game,
                        player
                    );
                }
                catch (error) {

                    if (error instanceof Error) {
                        throw ErrorFactory.badRequest(
                            error.message
                        );
                    }

                    throw error;
                }

                await GameRepository.update(
                    game,
                    transaction
                );

                return {
                    gameId: game.getId(),

                    status: "EXECUTED",

                    result: result ?? null,

                    state: game.getState(),

                    turn: game.getTurn(),

                    currentPlayer: {
                        id: game
                            .getCurrentPlayer()
                            .getId(),

                        type: game
                            .getCurrentPlayer()
                            .getType()
                    },

                    energyRemaining:
                        player.getEnergy(),

                    tokensRemaining:
                        player instanceof HumanPlayer
                            ? player
                                .getUser()
                                .getTokens()
                            : undefined
                };
            }
        );
    }

    /*
     * Storico in CSV. L'esito di un attacco sotto Radio Silence compare
     * come HIDDEN per l'attaccante fino alla fine della partita.
     */
    static async getGameHistory(
        gameId: string,
        userId: number
    ) {
        const game = await GameService.loadForParticipant(gameId, userId);

        return historyToCsv(
            game,
            GameService.playerOfUser(game, userId)
        );
    }

    // -----------------------------------------------------------------

    /*
     * Carica la partita e verifica che l'utente ne sia un giocatore.
     */
    private static async loadForParticipant(
        gameId: string,
        userId: number,
        transaction?: DbTransaction,
        forUpdate: boolean = false
    ): Promise<Game> {

        const game = await GameRepository.findById(
            gameId,
            transaction,
            forUpdate
        );

        if (!game) {
            throw ErrorFactory.gameNotFound();
        }

        if (
            GameService.playerOfUser(
                game,
                userId
            ) === undefined
        ) {
            throw ErrorFactory.forbidden();
        }

        return game;
    }

    private static playerOfUser(
        game: Game,
        userId: number
    ): IPlayer | undefined {
        return game.getPlayers().find(
            player =>
                player instanceof HumanPlayer &&
                player.getUser().id === userId
        );
    }

    private static modeOf(game: Game): GameMode {
        return game.getPlayers().every(
            p => p.getType() === PlayerType.HUMAN
        )
            ? GameMode.USER
            : GameMode.AI;
    }

    private static buildAction(
        body: ActionInput,
        player: IPlayer
    ): IAction {

        switch (body.type) {

            case "ATTACK":
                return new Attack(
                    Coordinates.create(
                        body.coordinates.x,
                        body.coordinates.y,
                        body.coordinates.z
                    )
                );

            case "SCAN":
                return new Scan(
                    Coordinates.create(
                        body.coordinates.x,
                        body.coordinates.y,
                        body.coordinates.z
                    )
                );

            case "SHIELD":
                return new Shield(
                    Coordinates.create(
                        body.coordinates.x,
                        body.coordinates.y,
                        body.coordinates.z
                    )
                );

            case "MOVE": {
                const ship =
                    player
                        .getFleet()
                        .getShipById(body.shipId);

                if (!ship) {
                    throw ErrorFactory.badRequest(
                        "Ship not found in player's fleet"
                    );
                }

                return new Move(
                    ship,
                    Coordinates.create(
                        body.destination.x,
                        body.destination.y,
                        body.destination.z
                    )
                );
            }
        }
    }
}
