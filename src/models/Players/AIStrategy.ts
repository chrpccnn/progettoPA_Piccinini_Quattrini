
import { IAction } from "../Action/IAction";
import { Attack } from "../Action/BasicMove/Attack";
import { Move } from "../Action/BasicMove/Move";
import { Scan } from "../Action/BasicMove/Scan";
import { Shield } from "../Action/BasicMove/Shield";
import { AlterScan } from "../Action/Countermeasure/AlterScan";
import { CancelAttack } from "../Action/Countermeasure/CancelAttack";
import { Game } from "../Engine/Game";
import { GameEngine } from "../Engine/GameEngine";
import { GameState } from "../Engine/GameState";
import { IPlayer } from "./IPlayer";
import { Ship } from "../fleet/Ship";
import { ShipType } from "../fleet/ShipType";
import { Coordinates } from "../grid/Coordinates";
import { ActionType } from "../MoveRecord";

type MoveCategory = "attack" | "scan" | "move" | "shield";

interface WeightedMove {
    category: MoveCategory;
    weight: number;
    actions: IAction[];
}

export class AIStrategy {
    public takeTurn(
        game: Game,
        engine: GameEngine,
        player: IPlayer
    ): void {
        if (game.getState() !== GameState.RUNNING) {
            throw new Error("The game is not running.");
        }

        if (game.getCurrentPlayer() !== player) {
            throw new Error("It is not the AI's turn.");
        }

        if (game.hasPendingAction()) {
            throw new Error(
                "Resolve the pending action before taking a turn."
            );
        }

        const categories = this.buildMoves(game, player);
        const action = this.selectWeighted(categories);

        if (action === undefined) {
            engine.skipTurn(game, player);
            return;
        }

        player.makeMove(game, engine, action);
    }

    private buildMoves(
        game: Game,
        player: IPlayer
    ): WeightedMove[] {
        const grid = game.getGrid();
        const energy = player.getEnergy();
        const config = game.getEnergyConfig();

        const attacks: IAction[] = [];
        const scans: IAction[] = [];
        const moves: IAction[] = [];
        const shields: IAction[] = [];

        const attempted = new Set<string>();

        for (const record of game.getHistory()) {
            if (
                record.player === player &&
                record.type === ActionType.ATTACK &&
                record.coordinates !== undefined
            ) {
                attempted.add(this.coordinateKey(record.coordinates));
            }
        }

        if (energy >= 1) {
            for (let x = 0; x < grid.getWidth(); x++) {
                for (let y = 0; y < grid.getHeight(); y++) {
                    for (let z = 0; z < grid.getDepth(); z++) {
                        const coordinates = Coordinates.create(x, y, z);

                        if (
                            !attempted.has(this.coordinateKey(coordinates))
                        ) {
                            attacks.push(new Attack(coordinates));
                        }
                    }
                }
            }
        }

        if (energy >= 2) {
            for (let x = 1; x < grid.getWidth() - 1; x++) {
                for (let y = 1; y < grid.getHeight() - 1; y++) {
                    for (let z = 1; z < grid.getDepth() - 1; z++) {
                        scans.push(
                            new Scan(Coordinates.create(x, y, z))
                        );
                    }
                }
            }

            const existingShields = game.getShields(player);

            for (const ship of player.getFleet().getShips()) {
                for (const position of ship.getPositions()) {
                    const alreadyShielded = existingShields.some(
                        shield => shield.equals(position)
                    );

                    if (!alreadyShielded && grid.isValid(position)) {
                        shields.push(new Shield(position));
                    }
                }
            }

            for (const ship of player.getFleet().getShips()) {
                if (
                    ship.getType() !== ShipType.SCOUT &&
                    ship.getType() !== ShipType.DRONE
                ) {
                    continue;
                }

                if (ship.isHit()) {
                    continue;
                }

                const positions = ship.getPositions();

                if (positions.length === 0) {
                    continue;
                }

                const origin = positions[0];

                const offsets: Array<[number, number, number]> = [
                    [1, 0, 0],
                    [-1, 0, 0],
                    [0, 1, 0],
                    [0, -1, 0],
                    [0, 0, 1],
                    [0, 0, -1]
                ];

                for (const [dx, dy, dz] of offsets) {
                    const destination = Coordinates.create(
                        origin.x + dx,
                        origin.y + dy,
                        origin.z + dz
                    );

                    if (
                        this.isValidDestination(
                            game,
                            player,
                            ship,
                            destination
                        )
                    ) {
                        moves.push(new Move(ship, destination));
                    }
                }
            }
        }

        const lowEnergy = energy < config.max * 0.4;

        const weightedMoves: WeightedMove[] = [
        {
            category: "attack",
            weight: 50,
            actions: attacks
        },
        {
            category: "scan",
            weight: lowEnergy ? 5 : 20,
            actions: scans
        },
        {
            category: "move",
            weight: lowEnergy ? 5 : 12,
            actions: moves
        },
        {
            category: "shield",
            weight: lowEnergy ? 5 : 18,
            actions: shields
        }
    ];

    return weightedMoves.filter(item => item.actions.length > 0);
}

    private selectWeighted(
        categories: WeightedMove[]
    ): IAction | undefined {
        const totalWeight = categories.reduce(
            (total, item) => total + item.weight,
            0
        );

        if (totalWeight <= 0) {
            return undefined;
        }

        let random = Math.random() * totalWeight;

        for (const item of categories) {
            random -= item.weight;

            if (random < 0) {
                const index = Math.floor(
                    Math.random() * item.actions.length
                );

                return item.actions[index];
            }
        }

        return undefined;
    }

    private isValidDestination(
        game: Game,
        player: IPlayer,
        ship: Ship,
        destination: Coordinates
    ): boolean {
        const grid = game.getGrid();

        if (!grid.isValid(destination) || ship.isHit()) {
            return false;
        }

        const positions = ship.getPositions();

        if (positions.length === 0) {
            return false;
        }

        const origin = positions[0];

        const dx = destination.x - origin.x;
        const dy = destination.y - origin.y;
        const dz = destination.z - origin.z;

        if (
            Math.abs(dx) +
            Math.abs(dy) +
            Math.abs(dz) !== 1
        ) {
            return false;
        }

        const newPositions = positions.map(position =>
            Coordinates.create(
                position.x + dx,
                position.y + dy,
                position.z + dz
            )
        );

        if (newPositions.some(position => !grid.isValid(position))) {
            return false;
        }

        for (const other of player.getFleet().getShips()) {
            if (other.getId() === ship.getId()) {
                continue;
            }

            for (const position of newPositions) {
                if (
                    other.getPositions().some(
                        occupied => occupied.equals(position)
                    )
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    private coordinateKey(coordinates: Coordinates): string {
        return `${coordinates.x},${coordinates.y},${coordinates.z}`;
    }

    public respondToPendingAction(
        game: Game,
        engine: GameEngine,
        player: IPlayer
    ): void {
        if (game.getState() !== GameState.RUNNING) {
            return;
        }

        const pending = game.getPendingAction();

        if (!pending) {
            throw new Error("There is no pending action.");
        }

        if (game.getPendingActionPlayer() === player) {
            throw new Error("The AI cannot counter its own action.");
        }

        const energy = player.getEnergy();

        if (pending instanceof Attack) {
            if (energy >= 2 && Math.random() < 0.45) {
                player.makeCounterMeasure(
                    game,
                    engine,
                    new CancelAttack(pending)
                );
                return;
            }
        }

        if (pending instanceof Scan && energy >= 1) {
            if (Math.random() < 0.55) {
                player.makeCounterMeasure(
                    game,
                    engine,
                    new AlterScan(pending)
                );
                return;
            }
        }

        engine.pass(game, player);
    }
}
