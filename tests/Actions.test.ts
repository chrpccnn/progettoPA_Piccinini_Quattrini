import { Attack } from "../src/models/Action/BasicMove/Attack";
import { AttackResult } from "../src/models/Action/BasicMove/AttackResult";
import { Scan } from "../src/models/Action/BasicMove/Scan";
import { Shield } from "../src/models/Action/BasicMove/Shield";
import { Move } from "../src/models/Action/BasicMove/Move";
import { Game } from "../src/models/Engine/Game";
import { Fleet } from "../src/models/fleet/Fleet";
import { Ship } from "../src/models/fleet/Ship";
import { ShipType } from "../src/models/fleet/ShipType";
import { Orientation } from "../src/models/fleet/Orientation";
import { HumanPlayer } from "../src/models/Players/HumanPlayer";
import { GridFactory } from "../src/models/grid/GridFactory";
import { Coordinates } from "../src/models/grid/Coordinates";
import { CellState } from "../src/models/grid/Cell";
import { User } from "../src/models/user";

function createUser(id: number, tokens = 1): User {
    return new User({
        id,
        email: `user${id}@test.com`,
        password: "password",
        role: "user",
        tokens,
    });
}

function createPlayer(
    id: string,
    user: User,
    fleet?: Fleet,
    energy: number = 3
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

function createGame(
    p1: HumanPlayer,
    p2: HumanPlayer
): Game {
    return new Game(
        "game-1",
        GridFactory.create(10, 10, 5),
        [p1, p2],
        p1.getUser(),
        0
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

describe("Actions", () => {

    describe("Attack", () => {

        it("deve avere costo 1", () => {
            const attack = new Attack(
                Coordinates.create(1, 2, 3)
            );

            expect(attack.getCost())
                .toBe(1);
        });

        it("deve restituire MISS su una cella vuota", () => {
            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const result = attack.execute({
                game,
                player: p1
            });

            expect(result)
                .toBe(AttackResult.MISS);
        });

        it("deve restituire HIT quando colpisce una nave non distrutta", () => {
            const fleet = new Fleet("fleet-2");

            const scout = createScout(
                "scout-1",
                5,
                5,
                2
            );

            fleet.addShip(scout);

            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2),
                fleet
            );

            const game = createGame(
                p1,
                p2
            );

            const attack = new Attack(
                Coordinates.create(5, 5, 2)
            );

            const result = attack.execute({
                game,
                player: p1
            });

            expect(result)
                .toBe(AttackResult.HIT);

            expect(
                scout.getHitPositions()
            ).toHaveLength(1);

            expect(
                scout.isDestroyed()
            ).toBe(false);
        });

        it("deve restituire DESTROYED quando distrugge una nave ma non tutta la flotta", () => {
            const fleet = new Fleet("fleet-2");

            const scout = createScout(
                "scout-1",
                5,
                5,
                2
            );

            const secondShip = createDrone(
                "drone-1",
                7,
                7,
                2
            );

            fleet.addShip(scout);
            fleet.addShip(secondShip);

            scout.hit(
                Coordinates.create(5, 5, 2)
            );

            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2),
                fleet
            );

            const game = createGame(
                p1,
                p2
            );

            const attack = new Attack(
                Coordinates.create(6, 5, 2)
            );

            const result = attack.execute({
                game,
                player: p1
            });

            expect(result)
                .toBe(AttackResult.DESTROYED);

            expect(
                scout.isDestroyed()
            ).toBe(true);

            expect(
                fleet.isAllDestroyed()
            ).toBe(false);
        });

        it("deve restituire GAME_OVER quando distrugge l'ultima nave", () => {
            const fleet = new Fleet("fleet-2");

            const drone = createDrone(
                "drone-1",
                5,
                5,
                2
            );

            fleet.addShip(drone);

            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2),
                fleet
            );

            const game = createGame(
                p1,
                p2
            );

            const attack = new Attack(
                Coordinates.create(5, 5, 2)
            );

            const result = attack.execute({
                game,
                player: p1
            });

            expect(result)
                .toBe(AttackResult.GAME_OVER);

            expect(
                fleet.isAllDestroyed()
            ).toBe(true);
        });

        it("deve rifiutare un Attack senza avversario", () => {
            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const game = new Game(
                "game-1",
                GridFactory.create(10, 10, 5),
                [p1, p1],
                p1.getUser(),
                0
            );

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            expect(() => {
                attack.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "Opponent not found."
            );
        });

    });

    describe("Scan", () => {

        it("deve avere costo 2", () => {
            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            expect(scan.getCost())
                .toBe(2);
        });

        it("deve contare le celle occupate della flotta avversaria nel cubo 3x3x3", () => {

            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const fleet = new Fleet("fleet-p2");

            const scout = createScout(
                "scout-1",
                4,
                5,
                2
            );

            const drone = createDrone(
                "drone-1",
                6,
                6,
                3
            );

            fleet.addShip(scout);
            fleet.addShip(drone);

            const p2 = createPlayer(
                "p2",
                createUser(2),
                fleet
            );

            const game = createGame(
                p1,
                p2
            );

            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            scan.execute({
                game,
                player: p1
            });

            expect(
                scan.getOccupiedCells()
            ).toBe(3);
        });

        it("deve contare anche una cella di nave già colpita", () => {

            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const fleet = new Fleet("fleet-p2");

            const drone = createDrone(
                "drone-1",
                5,
                5,
                2
            );

            fleet.addShip(drone);

            drone.hit(
                Coordinates.create(5, 5, 2)
            );

            const p2 = createPlayer(
                "p2",
                createUser(2),
                fleet
            );

            const game = createGame(
                p1,
                p2
            );

            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            scan.execute({
                game,
                player: p1
            });

            expect(
                scan.getOccupiedCells()
            ).toBe(1);
        });

        it("deve rifiutare un centro sul bordo", () => {
            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const scan = new Scan(
                Coordinates.create(0, 5, 2)
            );

            expect(() => {
                scan.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "Scan center must be at least one cell away from every grid edge."
            );
        });

        it("deve rifiutare un centro fuori dalla griglia", () => {
            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const scan = new Scan(
                Coordinates.create(20, 5, 2)
            );

            expect(() => {
                scan.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "Scan center is outside the grid."
            );
        });

    });

    describe("Shield", () => {

        it("deve avere costo 2", () => {
            const shield = new Shield(
                Coordinates.create(2, 2, 2)
            );

            expect(shield.getCost())
                .toBe(2);
        });

        it("deve diventare attivo dopo execute", () => {
            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const shield = new Shield(
                Coordinates.create(2, 2, 2)
            );

            expect(shield.isActive())
                .toBe(false);

            shield.execute({
                game,
                player: p1
            });

            expect(shield.isActive())
                .toBe(true);
        });

        it("deve rifiutare coordinate fuori dalla griglia", () => {
            const p1 = createPlayer(
                "p1",
                createUser(1)
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const shield = new Shield(
                Coordinates.create(20, 2, 2)
            );

            expect(() => {
                shield.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "Shield coordinates are outside the grid."
            );
        });

    });

    describe("Move", () => {

        it("deve avere costo 2", () => {
            const drone = createDrone(
                "drone-1",
                2,
                2,
                2
            );

            const move = new Move(
                drone,
                Coordinates.create(3, 2, 2)
            );

            expect(move.getCost())
                .toBe(2);
        });

        it("deve spostare una Drone di una cella", () => {
            const fleet = new Fleet("fleet-1");

            const drone = createDrone(
                "drone-1",
                2,
                2,
                2
            );

            fleet.addShip(drone);

            const p1 = createPlayer(
                "p1",
                createUser(1),
                fleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                drone,
                Coordinates.create(3, 2, 2)
            );

            move.execute({
                game,
                player: p1
            });

            expect(
                drone.getPositions()
            ).toEqual([
                Coordinates.create(3, 2, 2)
            ]);
        });

        it("deve mantenere la forma della Scout durante lo spostamento", () => {
            const fleet = new Fleet("fleet-1");

            const scout = createScout(
                "scout-1",
                2,
                2,
                2
            );

            fleet.addShip(scout);

            const p1 = createPlayer(
                "p1",
                createUser(1),
                fleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                scout,
                Coordinates.create(2, 3, 2)
            );

            move.execute({
                game,
                player: p1
            });

            expect(
                scout.getPositions()
            ).toEqual([
                Coordinates.create(2, 3, 2),
                Coordinates.create(3, 3, 2)
            ]);
        });

        it("deve rifiutare il movimento di una nave non Scout o Drone", () => {
            const fleet = new Fleet("fleet-1");

            const cruiser = new Ship(
                "cruiser-1",
                ShipType.CRUISER,
                4,
                Orientation.HORIZONTAL,
                [
                    Coordinates.create(2, 2, 2),
                    Coordinates.create(3, 2, 2),
                    Coordinates.create(4, 2, 2),
                    Coordinates.create(5, 2, 2)
                ]
            );

            fleet.addShip(cruiser);

            const p1 = createPlayer(
                "p1",
                createUser(1),
                fleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                cruiser,
                Coordinates.create(2, 3, 2)
            );

            expect(() => {
                move.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "Only Scout and Drone ships can move."
            );
        });

        it("deve rifiutare una destinazione fuori dalla griglia", () => {
            const fleet = new Fleet("fleet-1");

            const drone = createDrone(
                "drone-1",
                2,
                2,
                2
            );

            fleet.addShip(drone);

            const p1 = createPlayer(
                "p1",
                createUser(1),
                fleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                drone,
                Coordinates.create(10, 2, 2)
            );

            expect(() => {
                move.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "Destination is outside the grid."
            );
        });

        it("deve rifiutare un movimento di più di una cella", () => {
            const fleet = new Fleet("fleet-1");

            const drone = createDrone(
                "drone-1",
                2,
                2,
                2
            );

            fleet.addShip(drone);

            const p1 = createPlayer(
                "p1",
                createUser(1),
                fleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                drone,
                Coordinates.create(4, 2, 2)
            );

            expect(() => {
                move.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "A ship can move only one cell at a time."
            );
        });

        it("deve rifiutare una collisione con un'altra nave", () => {
            const fleet = new Fleet("fleet-1");

            const drone = createDrone(
                "drone-1",
                2,
                2,
                2
            );

            const other = createDrone(
                "drone-2",
                3,
                2,
                2
            );

            fleet.addShip(drone);
            fleet.addShip(other);

            const p1 = createPlayer(
                "p1",
                createUser(1),
                fleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                drone,
                Coordinates.create(3, 2, 2)
            );

            expect(() => {
                move.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "The destination is occupied by another ship."
            );
        });

        it("deve rifiutare il movimento di una nave colpita", () => {
            const fleet = new Fleet("fleet-1");

            const scout = createScout(
                "scout-1",
                2,
                2,
                2
            );

            fleet.addShip(scout);

            scout.hit(
                Coordinates.create(2, 2, 2)
            );

            const p1 = createPlayer(
                "p1",
                createUser(1),
                fleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                scout,
                Coordinates.create(2, 3, 2)
            );

            expect(() => {
                move.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "A ship that has been hit cannot move."
            );
        });

        it("deve rifiutare una nave che non appartiene al giocatore", () => {
            const playerFleet = new Fleet("fleet-1");
            const otherFleet = new Fleet("fleet-2");

            const drone = createDrone(
                "drone-1",
                2,
                2,
                2
            );

            playerFleet.addShip(
                createDrone(
                    "other-drone",
                    7,
                    7,
                    2
                )
            );

            otherFleet.addShip(drone);

            const p1 = createPlayer(
                "p1",
                createUser(1),
                playerFleet
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2),
                otherFleet
            );

            const game = createGame(
                p1,
                p2
            );

            const move = new Move(
                drone,
                Coordinates.create(3, 2, 2)
            );

            expect(() => {
                move.execute({
                    game,
                    player: p1
                });
            }).toThrow(
                "The ship does not belong to the player."
            );
        });

    });

});