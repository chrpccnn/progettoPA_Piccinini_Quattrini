import { CancelAttack } from "../src/models/Action/Countermeasure/CancelAttack";
import { AlterScan } from "../src/models/Action/Countermeasure/AlterScan";

import { CountermeasureType } from "../src/models/Action/Countermeasure/CountermeasureType";
import { Attack } from "../src/models/Action/BasicMove/Attack";
import { AttackResult } from "../src/models/Action/BasicMove/AttackResult";
import { Scan } from "../src/models/Action/BasicMove/Scan";
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
import { RadioSilence } from "../src/models/Action/Countermeasure/RadioSilance";

function createUser(id: number, tokens = 10): User {
    return User.build({
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
    fleet?: Fleet
): HumanPlayer {
    return new HumanPlayer(
        id,
        fleet ?? new Fleet(`fleet-${id}`),
        3,
        0,
        [],
        user
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

describe("Countermeasures", () => {

    describe("CancelAttack", () => {

        it("deve avere il tipo CANCEL_ATTACK", () => {
            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const countermeasure =
                new CancelAttack(attack);

            expect(countermeasure.getType())
                .toBe(CountermeasureType.CANCEL_ATTACK);
        });

        it("deve avere costo 2", () => {
            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const countermeasure =
                new CancelAttack(attack);

            expect(countermeasure.getCost())
                .toBe(2);
        });

        it("deve mantenere il riferimento all'Attack", () => {
            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const countermeasure =
                new CancelAttack(attack);

            expect(countermeasure.getAttack())
                .toBe(attack);
        });

        it("deve produrre BLOCKER", () => {
            const owner = createUser(1);

            const p1 = createPlayer(
                "p1",
                owner
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = new Game(
                "game-1",
                GridFactory.create(10, 10, 5),
                [p1, p2],
                owner,
                3
            );

            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const result =
                countermeasureExecute(
                    new CancelAttack(attack),
                    game,
                    p2
                );

            expect(result)
                .toBe(AttackResult.BLOCKER);
        });

    });

    describe("AlterScan", () => {

        it("deve avere il tipo ALTER_SCAN", () => {
            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            const countermeasure =
                new AlterScan(scan);

            expect(countermeasure.getType())
                .toBe(CountermeasureType.ALTER_SCAN);
        });

        it("deve avere costo 1", () => {
            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            const countermeasure =
                new AlterScan(scan);

            expect(countermeasure.getCost())
                .toBe(1);
        });

        it("deve mantenere il riferimento alla Scan", () => {
            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            const countermeasure =
                new AlterScan(scan);

            expect(countermeasure.getScan())
                .toBe(scan);
        });

        it("deve diminuire di 1 un risultato maggiore di zero", () => {
            const owner = createUser(1);

            const p1 = createPlayer(
                "p1",
                owner
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = new Game(
                "game-1",
                GridFactory.create(10, 10, 5),
                [p1, p2],
                owner,
                3
            );

            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            scan.setOccupiedCells(5);

            const countermeasure =
                new AlterScan(scan);

            countermeasure.execute({
                game,
                player: p2
            });

            expect(
                scan.getOccupiedCells()
            ).toBe(4);
        });

        it("deve trasformare zero in uno secondo l'implementazione attuale", () => {
            const owner = createUser(1);

            const p1 = createPlayer(
                "p1",
                owner
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2)
            );

            const game = new Game(
                "game-1",
                GridFactory.create(10, 10, 5),
                [p1, p2],
                owner,
                3
            );

            const scan = new Scan(
                Coordinates.create(5, 5, 2)
            );

            scan.setOccupiedCells(0);

            const countermeasure =
                new AlterScan(scan);

            countermeasure.execute({
                game,
                player: p2
            });

            expect(
                scan.getOccupiedCells()
            ).toBe(1);
        });

    });

    describe("RadioSilence", () => {

        it("deve avere il tipo RADIO_SILENCE", () => {
            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const countermeasure =
                new RadioSilence(attack);

            expect(countermeasure.getType())
                .toBe(CountermeasureType.RADIO_SILENCE);
        });

        it("deve avere costo 2", () => {
            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const countermeasure =
                new RadioSilence(attack);

            expect(countermeasure.getCost())
                .toBe(2);
        });

        it("deve mantenere il riferimento all'Attack", () => {
            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const countermeasure =
                new RadioSilence(attack);

            expect(countermeasure.getAttack())
                .toBe(attack);
        });

        it("deve salvare il risultato dell'Attack", () => {
            const owner = createUser(1);

            const fleet = new Fleet("fleet-2");

            fleet.addShip(
                createDrone(
                    "drone-1",
                    5,
                    5,
                    2
                )
            );

            const p1 = createPlayer(
                "p1",
                owner
            );

            const p2 = createPlayer(
                "p2",
                createUser(1, 2),
                fleet
            );

            const game = new Game(
                "game-1",
                GridFactory.create(10, 10, 5),
                [p1, p2],
                owner,
                3
            );

            const attack = new Attack(
                Coordinates.create(5, 5, 2)
            );

            const countermeasure =
                new RadioSilence(attack);

            countermeasure.execute({
                game,
                player: p1
            });

            expect(
                countermeasure.getResult()
            ).toBe(AttackResult.GAME_OVER);
        });

        it("prima di execute deve non avere risultato", () => {
            const attack = new Attack(
                Coordinates.create(1, 1, 1)
            );

            const countermeasure =
                new RadioSilence(attack);

            expect(
                countermeasure.getResult()
            ).toBeUndefined();
        });

    });

});

function countermeasureExecute(
    countermeasure: CancelAttack,
    game: Game,
    player: HumanPlayer
): AttackResult | void {
    return countermeasure.execute({
        game,
        player
    });
}