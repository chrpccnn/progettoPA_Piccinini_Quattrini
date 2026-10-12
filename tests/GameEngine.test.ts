import { Game } from "../src/models/Engine/Game";
import { GameEngine } from "../src/models/Engine/GameEngine";
import { Attack } from "../src/models/Action/BasicMove/Attack";
import { Scan } from "../src/models/Action/BasicMove/Scan";
import { Shield } from "../src/models/Action/BasicMove/Shield";
import { Move } from "../src/models/Action/BasicMove/Move";
import { CancelAttack } from "../src/models/Action/Countermeasure/CancelAttack";
import { AlterScan } from "../src/models/Action/Countermeasure/AlterScan";

import { Fleet } from "../src/models/fleet/Fleet";
import { Ship } from "../src/models/fleet/Ship";
import { ShipType } from "../src/models/fleet/ShipType";
import { Orientation } from "../src/models/fleet/Orientation";
import { HumanPlayer } from "../src/models/Players/HumanPlayer";
import { AIPlayer } from "../src/models/Players/AIPlayer";

import { GridFactory } from "../src/models/grid/GridFactory";
import { Coordinates } from "../src/models/grid/Coordinates";
import { CellState } from "../src/models/grid/Cell";
import { User } from "../src/models/user";
import { RadioSilence } from "../src/models/Action/Countermeasure/RadioSilance";

function createUser(id: number, tokens = 1): User {
    return User.build({
        id,
        email: `user${id}@test.com`,
        password: "password",
        role: "user",
        tokens,
    });
}

function createHuman(
    id: string,
    user: User,
    energy: number = 3,
    fleet?: Fleet
): HumanPlayer {
    return new HumanPlayer(
        id,
        fleet ?? new Fleet(`fleet-${id}`),
        energy,
        0,
        [],
        user
    );
}

function createAI(
    id: string,
    energy: number = 3,
    fleet?: Fleet
): AIPlayer {
    return new AIPlayer(
        id,
        fleet ?? new Fleet(`fleet-${id}`),
        energy,
        0,
        []
    );
}

function createGame(
    p1: HumanPlayer | AIPlayer,
    p2: HumanPlayer | AIPlayer,
    owner: User,
    silence: number = 0
): Game {
    return new Game(
        "game-1",
        GridFactory.create(10, 10, 5),
        [p1, p2],
        owner,
        silence
    );
}

function createDrone(
    id: string,
    x: number,
    y: number,
    z: number
): Ship {
    return new Ship(
        id,
        ShipType.DRONE,
        1,
        Orientation.HORIZONTAL,
        [
            Coordinates.create(x, y, z)
        ]
    );
}

function createScout(
    id: string,
    x: number,
    y: number,
    z: number
): Ship {
    return new Ship(
        id,
        ShipType.SCOUT,
        2,
        Orientation.HORIZONTAL,
        [
            Coordinates.create(x, y, z),
            Coordinates.create(x + 1, y, z)
        ]
    );
}

describe("GameEngine", () => {

    const engine = GameEngine.getInstance();

    describe("singleton", () => {

        it("deve restituire sempre la stessa istanza", () => {
            expect(
                GameEngine.getInstance()
            ).toBe(engine);
        });

    });

    describe("executeAction", () => {

        it("deve rifiutare un'azione quando la partita non è running", () => {
            const user = createUser(1);

            const p1 = createHuman(
                "p1",
                user
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                user
            );

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            expect(() => {
                engine.executeAction(
                    game,
                    p1,
                    attack
                );
            }).toThrow(
                "The game is not running."
            );
        });

        it("deve rifiutare una mossa del giocatore sbagliato", () => {
            const user = createUser(1);

            const p1 = createHuman("p1", user);
            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                user
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            expect(() => {
                engine.executeAction(
                    game,
                    p2,
                    attack
                );
            }).toThrow(
                "It is not this player's turn."
            );
        });

        it("deve rifiutare un'azione quando l'Energy è insufficiente", () => {
            const user = createUser(1);

            const p1 = createHuman(
                "p1",
                user,
                0
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                user
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            expect(() => {
                engine.executeAction(
                    game,
                    p1,
                    attack
                );
            }).toThrow(
                "Insufficient energy."
            );

            expect(p1.getEnergy())
                .toBe(0);

            expect(user.getTokens())
                .toBe(1);

            expect(game.getCurrentPlayer())
                .toBe(p1);
        });

        it("deve consumare 1 Energy per Attack", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner,
                3
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            expect(p1.getEnergy())
                .toBe(2);
        });

        it("deve consumare 2 Energy per Scan", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner,
                3
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            engine.executeAction(
                game,
                p1,
                scan
            );

            expect(p1.getEnergy())
                .toBe(1);
        });

        it("deve consumare 2 Energy per Shield", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner,
                3
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const shield = new Shield(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                shield
            );

            expect(p1.getEnergy())
                .toBe(1);

            expect(shield.isActive())
                .toBe(true);

            expect(game.getCurrentPlayer())
                .toBe(p2);
        });

        it("deve consumare 2 Energy per Move", () => {
            const fleet = new Fleet("fleet-1");

            const drone = createDrone(
                "drone-1",
                2,
                2,
                2
            );

            fleet.addShip(drone);

            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner,
                3,
                fleet
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const move = new Move(
                drone,
                Coordinates.create(3, 2, 2)
            );

            engine.executeAction(
                game,
                p1,
                move
            );

            expect(p1.getEnergy())
                .toBe(1);

            expect(
                drone.getPositions()[0]
            ).toBe(
                Coordinates.create(3, 2, 2)
            );
        });

        it("deve consumare 0.015 TOKEN per una mossa Human", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner,
                3
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const shield = new Shield(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                shield
            );

            expect(owner.getTokens())
                .toBe(0.985);
        });

        it("deve consumare 0 TOKEN per una mossa AI", () => {
            const owner = createUser(1);

            const human = createHuman(
                "human",
                owner
            );

            const ai = createAI(
                "ai"
            );

            const game = createGame(
                ai,
                human,
                owner
            );

            game.start();

            const shield = new Shield(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                ai,
                shield
            );

            expect(owner.getTokens())
                .toBe(0.985);
        });

        it("Attack deve creare una pending action", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            expect(game.hasPendingAction())
                .toBe(true);

            expect(game.getPendingAction())
                .toBe(attack);

            expect(game.getPendingActionPlayer())
                .toBe(p1);

            expect(game.getCurrentPlayer())
                .toBe(p1);
        });

        it("non deve permettere una seconda azione durante una pending action", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            const shield = new Shield(
                Coordinates.create(1, 1, 1)
            );

            expect(() => {
                engine.executeAction(
                    game,
                    p1,
                    shield
                );
            }).toThrow(
                "The current action must be resolved first."
            );
        });

    });

    describe("PASS", () => {

        it("deve risolvere l'Attack senza countermeasure", () => {
            const owner = createUser(1);

            const fleet = new Fleet("fleet-2");

            const drone = createDrone(
                "drone-1",
                5,
                5,
                2
            );

            fleet.addShip(drone);
            fleet.addShip(createDrone("drone-2", 7, 7, 2));

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2),
                3,
                fleet
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(5, 5, 2)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            engine.pass(
                game,
                p2
            );

            expect(
                drone.isDestroyed()
            ).toBe(true);

            expect(
                game.hasPendingAction()
            ).toBe(false);

            expect(
                game.getCurrentPlayer()
            ).toBe(p2);

            expect(
                p1.getEnergy()
            ).toBe(2);
        });

        it("PASS deve costare 0.015 TOKEN a un Human", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2User = createUser(
                1,
                1
            );

            const p2 = createHuman(
                "p2",
                p2User
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            engine.executeAction(
                game,
                p1,
                new Attack(
                    Coordinates.create(1, 1, 1)
                )
            );

            engine.pass(
                game,
                p2
            );

            expect(p2User.getTokens())
                .toBe(0.985);
        });

        it("PASS deve costare 0 TOKEN all'AI", () => {
            const owner = createUser(1);

            const human = createHuman(
                "human",
                owner
            );

            const ai = createAI(
                "ai"
            );

            const game = createGame(
                human,
                ai,
                owner
            );

            game.start();

            engine.executeAction(
                game,
                human,
                new Attack(
                    Coordinates.create(1, 1, 1)
                )
            );

            engine.pass(
                game,
                ai
            );

            expect(owner.getTokens())
                .toBe(0.985);
        });

        it("il giocatore che ha creato l'azione non può fare PASS", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner
            );

            game.start();

            engine.executeAction(
                game,
                p1,
                new Attack(
                    Coordinates.create(1, 1, 1)
                )
            );

            expect(() => {
                engine.pass(
                    game,
                    p1
                );
            }).toThrow(
                "The player who performed the action cannot pass the countermeasure phase."
            );
        });

    });

    describe("countermeasure", () => {

        it("CancelAttack deve annullare realmente l'Attack", () => {
            const owner = createUser(1);

            const fleet = new Fleet("fleet-2");

            const drone = createDrone(
                "drone-1",
                5,
                5,
                2
            );

            fleet.addShip(drone);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2),
                3,
                fleet
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(5, 5, 2)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            const countermeasure =
                new CancelAttack(attack);

            engine.executeCountermeasure(
                game,
                p2,
                countermeasure
            );

            expect(
                drone.isDestroyed()
            ).toBe(false);

            expect(
                drone.getHitPositions()
            ).toHaveLength(0);

            expect(
                game.hasPendingAction()
            ).toBe(false);
        });

        it("CancelAttack deve costare 2 Energy", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2),
                3
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            const spendEnergySpy =
                jest.spyOn(p2, "spendEnergy");

            try {
                engine.executeCountermeasure(
                    game,
                    p2,
                    new CancelAttack(attack)
                );

                expect(
                    spendEnergySpy
                ).toHaveBeenCalledWith(2);

                // 3 - 2 + 2 = 3
                // Il +2 è il recupero del nuovo turno.
                expect(
                    p2.getEnergy()
                ).toBe(3);

            } finally {
                spendEnergySpy.mockRestore();
            }
        });

        it("deve consumare un silence per una countermeasure", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2),
                3
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            engine.executeCountermeasure(game, p2, new RadioSilence(attack));
            expect(
                game.getSilenceUsed(p2)
            ).toBe(1);

            expect(
                game.getSilenceRemaining(p2)
            ).toBe(2);
        });

        it("RadioSilence deve eseguire l'Attack e salvare il risultato", () => {
            const owner = createUser(1);

            const fleet = new Fleet("fleet-2");

            const drone = createDrone(
                "drone-1",
                5,
                5,
                2
            );

            fleet.addShip(drone);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2),
                3,
                fleet
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(5, 5, 2)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            const radio =
                new RadioSilence(attack);

            engine.executeCountermeasure(
                game,
                p2,
                radio
            );

            expect(
                drone.isDestroyed()
            ).toBe(true);

            expect(
                radio.getResult()
            ).toBeDefined();

            expect(
                game.hasPendingAction()
            ).toBe(false);
        });

        it("AlterScan deve modificare il risultato della Scan", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2Fleet = new Fleet("fleet-2");

            const p2 = createHuman(
                "p2",
                createUser(1, 2),
                3,
                p2Fleet
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            game.getGrid().setCellState(
                Coordinates.create(5, 5, 2),
                CellState.OCCUPIED
            );

            game.start();

            engine.executeAction(
                game,
                p1,
                scan
            );

            expect(
                scan.getOccupiedCells()
            ).toBe(1);

            const alter =
                new AlterScan(scan);

            engine.executeCountermeasure(
                game,
                p2,
                alter
            );

            expect(
                scan.getOccupiedCells()
            ).toBe(0);

            expect(
                game.hasPendingAction()
            ).toBe(false);
        });

        it("AlterScan non deve produrre valori negativi", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2),
                3
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            game.start();

            engine.executeAction(
                game,
                p1,
                scan
            );

            expect(
                scan.getOccupiedCells()
            ).toBe(0);

            engine.executeCountermeasure(
                game,
                p2,
                new AlterScan(scan)
            );

            expect(
                scan.getOccupiedCells()
            ).toBe(1);
        });

        it("deve rifiutare una countermeasure del giocatore corrente", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            expect(() => {
                engine.executeCountermeasure(
                    game,
                    p1,
                    new CancelAttack(attack)
                );
            }).toThrow(
                "A countermeasure can only be used by the opponent."
            );
        });

        it("deve rifiutare una countermeasure senza pending action", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner,
                3
            );

            game.start();

            expect(() => {
                engine.executeCountermeasure(
                    game,
                    p2,
                    new CancelAttack(
                        new Attack(
                            Coordinates.create(1, 1, 1)
                        )
                    )
                );
            }).toThrow(
                "There is no action to counter."
            );
        });

        it("deve rifiutare una countermeasure quando il silence è esaurito", () => {
            const owner = createUser(1);

            const p1 = createHuman(
                "p1",
                owner
            );

            const p2 = createHuman(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2,
                owner,
                0
            );

            game.start();

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            engine.executeAction(
                game,
                p1,
                attack
            );

            expect(() => {
                engine.executeCountermeasure(game, p2, new RadioSilence(attack));
            }).toThrow(
                "No silence uses remaining."
            );
        });

    });

});