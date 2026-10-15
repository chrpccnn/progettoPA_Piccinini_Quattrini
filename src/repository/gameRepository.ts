import { Op, Transaction } from "sequelize";

import "../models/db";
import {
    GameModel,
    GamePlayerModel,
    GridCellModel,
    GridModel,
    MoveModel,
    ShieldModel,
    ShipModel,
    ShipPositionModel
} from "../models/db";

import { Attack } from "../models/Action/BasicMove/Attack";
import { Scan } from "../models/Action/BasicMove/Scan";
import { IAction } from "../models/Action/IAction";
import { Game, GameRestoreData } from "../models/Engine/Game";
import { GameState } from "../models/Engine/GameState";
import { Fleet } from "../models/fleet/Fleet";
import { Orientation } from "../models/fleet/Orientation";
import { Ship } from "../models/fleet/Ship";
import { CellState } from "../models/grid/Cell";
import { Coordinates } from "../models/grid/Coordinates";
import { Grid } from "../models/grid/Igrid";
import { GridFactory } from "../models/grid/GridFactory";
import { MoveRecord } from "../models/MoveRecord";
import { AIPlayer } from "../models/Players/AIPlayer";
import { HumanPlayer } from "../models/Players/HumanPlayer";
import { IPlayer } from "../models/Players/IPlayer";
import { PlayerType } from "../models/Players/PlayerType";
import { User } from "../models/user";
import { GameMode } from "../models/UserType";

/*
 * Salva e ricarica le partite su MySQL.
 *
 * Il dominio (Game, Fleet, Ship, ...) non conosce Sequelize: questo
 * repository traduce tra gli oggetti di dominio e le righe delle tabelle.
 * La logica di gioco resta nel GameEngine, qui non c'e' nessuna regola.
 *
 * Tutti i metodi che scrivono vogliono una transazione, cosi' il Service
 * puo' rendere atomico "stato della partita + saldo TOKEN degli utenti".
 */
class GameRepository {

    // -----------------------------------------------------------------
    // Scrittura
    // -----------------------------------------------------------------

    /*
     * Inserisce una partita appena creata: riga della partita, giocatori,
     * flotte, griglia e stato iniziale. Salva anche i saldi TOKEN degli
     * utenti coinvolti (il costo di creazione e' gia' stato addebitato).
     */
    async insert(game: Game, transaction: Transaction): Promise<void> {

        const players = game.getPlayers();
        const energy = game.getEnergyConfig();

        await GameModel.create(
            {
                id: game.getId(),
                mode: this.modeOf(players),
                state: game.getState(),
                turn: game.getTurn(),
                currentPlayerSlot: game.getCurrentPlayerIndex(),
                winnerSlot: null,
                creatorId: game.getTokenOwner().id,
                silence: game.getSilence(),
                energyInitial: energy.initial,
                energyMax: energy.max,
                energyRegeneration: energy.regeneration,
                allowedOrientations: game.getAllowedOrientations(),
                pendingType: null,
                pendingPlayerSlot: null,
                pendingX: null,
                pendingY: null,
                pendingZ: null,
                pendingOccupiedCells: null
            },
            { transaction }
        );

        for (let slot = 0; slot < players.length; slot++) {
            const player = players[slot];

            const row = await GamePlayerModel.create(
                {
                    gameId: game.getId(),
                    slot,
                    playerKey: player.getId(),
                    fleetId: player.getFleet().getId(),
                    type: player.getType(),
                    userId: this.userOf(player)?.id ?? null,
                    energy: player.getEnergy(),
                    silenceUsed: game.getSilenceUsed(player)
                },
                { transaction }
            );

            for (const ship of player.getFleet().getShips()) {
                const shipRow = await ShipModel.create(
                    {
                        gamePlayerId: row.id,
                        shipKey: ship.getId(),
                        type: ship.getType(),
                        size: ship.getSize(),
                        orientation: ship.getOrientation(),
                        status: ship.getStatus()
                    },
                    { transaction }
                );

                await this.writePositions(ship, shipRow.id, transaction);
            }
        }

        const grid = game.getGrid();

        const gridRow = await GridModel.create(
            {
                gameId: game.getId(),
                width: grid.getWidth(),
                height: grid.getHeight(),
                depth: grid.getDepth()
            },
            { transaction }
        );

        await this.writeCells(grid, gridRow.id, transaction);
        await this.writeShields(game, transaction);
        await this.appendMoves(game, transaction);
        await this.saveUsers(game, transaction);
    }

    /*
     * Allinea il database allo stato corrente della partita. Va chiamato
     * dopo ogni azione, contromossa o PASS, nella stessa transazione in cui
     * la partita e' stata letta con findById(..., true).
     */
    async update(game: Game, transaction: Transaction): Promise<void> {

        const players = game.getPlayers();
        const pending = game.getPendingAction();
        const pendingPlayer = game.getPendingActionPlayer();
        const winner = game.getWinner();

        await GameModel.update(
            {
                state: game.getState(),
                turn: game.getTurn(),
                currentPlayerSlot: game.getCurrentPlayerIndex(),
                winnerSlot:
                    winner === undefined ? null : players.indexOf(winner),
                ...this.pendingColumns(game, pending, pendingPlayer)
            },
            { where: { id: game.getId() }, transaction }
        );

        const playerRows = await GamePlayerModel.findAll({
            where: { gameId: game.getId() },
            transaction
        });

        for (const row of playerRows) {
            const player = players[row.slot];

            await row.update(
                {
                    energy: player.getEnergy(),
                    silenceUsed: game.getSilenceUsed(player)
                },
                { transaction }
            );

            await this.updateShips(player, row.id, transaction);
        }

        const gridRow = await GridModel.findOne({
            where: { gameId: game.getId() },
            transaction
        });

        if (gridRow !== null) {
            await GridCellModel.destroy({
                where: { gridId: gridRow.id },
                transaction
            });

            await this.writeCells(game.getGrid(), gridRow.id, transaction);
        }

        await this.writeShields(game, transaction);
        await this.appendMoves(game, transaction);
        await this.saveUsers(game, transaction);
    }

    // -----------------------------------------------------------------
    // Lettura
    // -----------------------------------------------------------------

    /*
     * Ricostruisce la partita dal database.
     *
     * Con forUpdate = true la riga della partita viene bloccata fino al
     * commit: due richieste sulla stessa partita vengono eseguite una
     * dopo l'altra e non si sovrascrivono (serve per azioni e contromosse).
     */
    async findById(
        id: string,
        transaction?: Transaction,
        forUpdate: boolean = false
    ): Promise<Game | undefined> {

        if (forUpdate && transaction === undefined) {
            throw new Error( "A transaction is required to lock the game." );
        }

        const gameRow = await GameModel.findByPk(id, {
            transaction,
            lock:
                forUpdate && transaction !== undefined
                    ? transaction.LOCK.UPDATE
                    : undefined
        });

        if (gameRow === null) {
            return undefined;
        }

        const playerRows = await GamePlayerModel.findAll({
            where: { gameId: id },
            include: [{ model: User, as: "user" }],
            order: [["slot", "ASC"]],
            transaction
        });

        const playerIds = playerRows.map(row => row.id);

        const shipRows = await ShipModel.findAll({
            where: { gamePlayerId: playerIds },
            include: [{ model: ShipPositionModel, as: "positions" }],
            order: [
                ["id", "ASC"],
                [{ model: ShipPositionModel, as: "positions" }, "idx", "ASC"]
            ],
            transaction
        });

        const shieldRows = await ShieldModel.findAll({
            where: { gamePlayerId: playerIds },
            transaction
        });

        const gridRow = await GridModel.findOne({
            where: { gameId: id },
            include: [{ model: GridCellModel, as: "cells" }],
            transaction
        });

        if (gridRow === null) {
            throw new Error(`Game ${id} has no grid.`);
        }

        const moveRows = await MoveModel.findAll({
            where: { gameId: id },
            order: [["seq", "ASC"]],
            transaction
        });

        /*
         * Un solo oggetto User per utente: il creatore della partita e il
         * suo HumanPlayer devono condividere la stessa istanza, altrimenti
         * i TOKEN addebitati sull'una non risulterebbero sull'altra.
         */
        const users = new Map<number, User>();

        for (const row of playerRows) {
            if (row.user !== undefined && row.user !== null) {
                users.set(row.user.id, row.user);
            }
        }

        let creator = users.get(gameRow.creatorId);

        if (creator === undefined) {
            const found = await User.findByPk(gameRow.creatorId, {
                transaction
            });

            if (found === null) {
                throw new Error(
                    `Creator of game ${id} not found.`
                );
            }

            creator = found;
        }

        // griglia
        const grid = GridFactory.create(
            gridRow.width,
            gridRow.height,
            gridRow.depth
        );

        for (const cell of gridRow.cells ?? []) {
            grid.setCellState(
                Coordinates.create(cell.x, cell.y, cell.z),
                cell.state
            );
        }

        // giocatori e flotte
        const energy = {
            initial: gameRow.energyInitial,
            max: gameRow.energyMax,
            regeneration: gameRow.energyRegeneration
        };

        const players: IPlayer[] = [];
        const playerBySlot = new Map<number, IPlayer>();
        const playerByRowId = new Map<number, IPlayer>();

        for (const row of playerRows) {

            const fleet = new Fleet(row.fleetId);

            for (const shipRow of shipRows) {
                if (shipRow.gamePlayerId === row.id) {
                    fleet.addShip(this.toShip(shipRow));
                }
            }

            let player: IPlayer;

            if (row.type === PlayerType.HUMAN) {
                const user = users.get(row.userId ?? -1);

                if (user === undefined) {
                    throw new Error(
                        `User of player ${row.playerKey} not found.`
                    );
                }

                player = new HumanPlayer(
                    row.playerKey, fleet, row.energy, 0, [], user
                );
            } else {
                player = new AIPlayer(
                    row.playerKey, fleet, row.energy, 0, []
                );
            }

            players.push(player);
            playerBySlot.set(row.slot, player);
            playerByRowId.set(row.id, player);
        }

        // stato da ripristinare
        const silenceUsed = new Map<IPlayer, number>();
        const shields = new Map<IPlayer, Coordinates[]>();

        for (const row of playerRows) {
            const player = playerBySlot.get(row.slot)!;
            silenceUsed.set(player, row.silenceUsed);
            shields.set(player, []);
        }

        for (const shield of shieldRows) {
            shields
                .get(playerByRowId.get(shield.gamePlayerId)!)!
                .push(Coordinates.create(shield.x, shield.y, shield.z));
        }

        const history: MoveRecord[] = moveRows.map(move => ({
            turn: move.turn,
            player: playerByRowId.get(move.gamePlayerId)!,
            type: move.type,
            coordinates:
                move.x === null || move.y === null || move.z === null
                    ? undefined
                    : Coordinates.create(move.x, move.y, move.z),
            cost: move.cost,
            result: move.result ?? undefined,
            hidden: move.hidden,
            timestamp: move.playedAt
        }));

        const restore: GameRestoreData = {
            state: gameRow.state,
            currentPlayerIndex: gameRow.currentPlayerSlot,
            turn: gameRow.turn,
            winner:
                gameRow.winnerSlot === null
                    ? undefined
                    : playerBySlot.get(gameRow.winnerSlot),
            silenceUsed,
            shields,
            history,
            pendingAction: this.toPendingAction(gameRow),
            pendingActionPlayer:
                gameRow.pendingPlayerSlot === null
                    ? undefined
                    : playerBySlot.get(gameRow.pendingPlayerSlot)
        };

        return new Game(
            gameRow.id,
            grid,
            players,
            creator,
            gameRow.silence,
            energy,
            this.parseOrientations(gameRow.allowedOrientations),
            restore
        );
    }

    /*
     * Vero se l'utente partecipa a una partita non ancora finita.
     * Da specifica un utente puo' giocare una sola partita alla volta.
     */
    async hasActiveGame(
        userId: number,
        transaction?: Transaction
    ): Promise<boolean> {

        const count = await GamePlayerModel.count({
            where: { userId },
            include: [{
                model: GameModel,
                as: "game",
                required: true,
                where: { state: { [Op.ne]: GameState.FINISHED } }
            }],
            transaction
        });

        return count > 0;
    }

    // -----------------------------------------------------------------
    // Funzioni di supporto
    // -----------------------------------------------------------------

    private modeOf(players: IPlayer[]): GameMode {
        return players.every(p => p.getType() === PlayerType.HUMAN)
            ? GameMode.USER
            : GameMode.AI;
    }

    private userOf(player: IPlayer): User | undefined {
        return player instanceof HumanPlayer
            ? player.getUser()
            : undefined;
    }

    private pendingColumns(
        game: Game,
        pending: IAction | undefined,
        pendingPlayer: IPlayer | undefined
    ) {
        const none = {
            pendingType: null,
            pendingPlayerSlot: null,
            pendingX: null,
            pendingY: null,
            pendingZ: null,
            pendingOccupiedCells: null
        };

        if (pending === undefined || pendingPlayer === undefined) {
            return none;
        }

        const slot = game.getPlayers().indexOf(pendingPlayer);

        if (pending instanceof Attack) {
            const c = pending.getCoordinates();

            return {
                ...none,
                pendingType: "ATTACK" as const,
                pendingPlayerSlot: slot,
                pendingX: c.x,
                pendingY: c.y,
                pendingZ: c.z
            };
        }

        if (pending instanceof Scan) {
            const c = pending.getCenter();

            return {
                ...none,
                pendingType: "SCAN" as const,
                pendingPlayerSlot: slot,
                pendingX: c.x,
                pendingY: c.y,
                pendingZ: c.z,
                pendingOccupiedCells: pending.getOccupiedCells()
            };
        }

        throw new Error(
            "Only Attack and Scan can be pending actions."
        );
    }

    private toPendingAction(row: GameModel): IAction | undefined {

        if (
            row.pendingType === null ||
            row.pendingX === null ||
            row.pendingY === null ||
            row.pendingZ === null
        ) {
            return undefined;
        }

        const c = Coordinates.create(
            row.pendingX, row.pendingY, row.pendingZ
        );

        if (row.pendingType === "ATTACK") {
            return new Attack(c);
        }

        const scan = new Scan(c);
        scan.setOccupiedCells(row.pendingOccupiedCells ?? 0);

        return scan;
    }

    private toShip(row: ShipModel): Ship {

        const positionRows = [...(row.positions ?? [])]
            .sort((a, b) => a.idx - b.idx);

        const positions = positionRows.map(
            p => Coordinates.create(p.x, p.y, p.z)
        );

        const ship = new Ship(
            row.shipKey,
            row.type,
            row.size,
            row.orientation,
            positions
        );

        // lo stato (DAMAGED / DESTROYED) si ricalcola dai colpi
        positionRows.forEach((p, i) => {
            if (p.hit) {
                ship.hit(positions[i]);
            }
        });

        return ship;
    }

    /*
     * MariaDB restituisce le colonne JSON come stringa, MySQL come array.
     */
    private parseOrientations(value: unknown): Orientation[] {
        const parsed =
            typeof value === "string" ? JSON.parse(value) : value;

        return parsed as Orientation[];
    }

    private async writePositions(
        ship: Ship,
        shipRowId: number,
        transaction: Transaction
    ): Promise<void> {

        const hits = new Set(ship.getHitPositions());

        await ShipPositionModel.bulkCreate(
            ship.getPositions().map((p, idx) => ({
                shipId: shipRowId,
                idx,
                x: p.x,
                y: p.y,
                z: p.z,
                hit: hits.has(p)
            })),
            { transaction }
        );
    }

    /*
     * Dopo un colpo o uno spostamento cambiano stato e posizioni delle navi:
     * le posizioni (poche celle per nave) vengono riscritte per intero.
     */
    private async updateShips(
        player: IPlayer,
        gamePlayerId: number,
        transaction: Transaction
    ): Promise<void> {

        const shipRows = await ShipModel.findAll({
            where: { gamePlayerId },
            transaction
        });

        for (const ship of player.getFleet().getShips()) {

            const shipRow = shipRows.find(
                r => r.shipKey === ship.getId()
            );

            if (shipRow === undefined) {
                throw new Error(
                    `Ship ${ship.getId()} is not stored.`
                );
            }

            await shipRow.update(
                { status: ship.getStatus() },
                { transaction }
            );

            await ShipPositionModel.destroy({
                where: { shipId: shipRow.id },
                transaction
            });

            await this.writePositions(ship, shipRow.id, transaction);
        }
    }

    /*
     * Scrive solo le celle diverse da EMPTY. Per ogni cella della griglia
     * si chiede lo stato attraverso l'interfaccia Grid, cosi' il repository
     * non dipende da MapGrid.
     */
    private async writeCells(
        grid: Grid,
        gridId: number,
        transaction: Transaction
    ): Promise<void> {

        const rows: {
            gridId: number;
            x: number;
            y: number;
            z: number;
            state: CellState;
        }[] = [];

        for (let x = 0; x < grid.getWidth(); x++) {
            for (let y = 0; y < grid.getHeight(); y++) {
                for (let z = 0; z < grid.getDepth(); z++) {

                    const state = grid.getCellState(
                        Coordinates.create(x, y, z)
                    );

                    if (state !== CellState.EMPTY) {
                        rows.push({ gridId, x, y, z, state });
                    }
                }
            }
        }

        if (rows.length > 0) {
            await GridCellModel.bulkCreate(rows, { transaction });
        }
    }

    private async writeShields(
        game: Game,
        transaction: Transaction
    ): Promise<void> {

        const playerRows = await GamePlayerModel.findAll({
            where: { gameId: game.getId() },
            transaction
        });

        await ShieldModel.destroy({
            where: { gamePlayerId: playerRows.map(r => r.id) },
            transaction
        });

        const players = game.getPlayers();
        const rows: {
            gamePlayerId: number;
            x: number;
            y: number;
            z: number;
        }[] = [];

        for (const row of playerRows) {
            for (const c of game.getShields(players[row.slot])) {
                rows.push({
                    gamePlayerId: row.id,
                    x: c.x,
                    y: c.y,
                    z: c.z
                });
            }
        }

        if (rows.length > 0) {
            await ShieldModel.bulkCreate(rows, { transaction });
        }
    }

    /*
     * Lo storico e' di sola aggiunta: si inseriscono solo le mosse
     * che nel database non ci sono ancora.
     */
    private async appendMoves(
        game: Game,
        transaction: Transaction
    ): Promise<void> {

        const history = game.getHistory();

        const stored = await MoveModel.count({
            where: { gameId: game.getId() },
            transaction
        });

        if (history.length <= stored) {
            return;
        }

        const playerRows = await GamePlayerModel.findAll({
            where: { gameId: game.getId() },
            transaction
        });

        const players = game.getPlayers();

        const rows = history.slice(stored).map((record, i) => {

            const slot = players.indexOf(record.player);
            const playerRow = playerRows.find(r => r.slot === slot);

            if (playerRow === undefined) {
                throw new Error(
                    "The player of a move does not belong to the game."
                );
            }

            return {
                gameId: game.getId(),
                seq: stored + i,
                turn: record.turn,
                gamePlayerId: playerRow.id,
                type: record.type,
                x: record.coordinates?.x ?? null,
                y: record.coordinates?.y ?? null,
                z: record.coordinates?.z ?? null,
                cost: record.cost,
                result: record.result ?? null,
                hidden: record.hidden,
                playedAt: record.timestamp
            };
        });

        await MoveModel.bulkCreate(rows, { transaction });
    }

    /*
     * Il saldo TOKEN cambia insieme allo stato della partita (creazione,
     * mosse, PASS): si salva nella stessa transazione.
     */
    private async saveUsers(
        game: Game,
        transaction: Transaction
    ): Promise<void> {

        const users = new Set<User>([game.getTokenOwner()]);

        for (const player of game.getPlayers()) {
            const user = this.userOf(player);

            if (user !== undefined) {
                users.add(user);
            }
        }

        for (const user of users) {
            await user.save({ transaction });
        }
    }
}

export default new GameRepository();
