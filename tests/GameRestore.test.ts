import { Game, GameRestoreData } from "../src/models/Engine/Game";
import { GameState } from "../src/models/Engine/GameState";
import { Fleet } from "../src/models/fleet/Fleet";
import { GridFactory } from "../src/models/grid/GridFactory";
import { Coordinates } from "../src/models/grid/Coordinates";
import { Attack } from "../src/models/Action/BasicMove/Attack";
import { HumanPlayer } from "../src/models/Players/HumanPlayer";
import { ActionType } from "../src/models/MoveRecord";
import { User } from "../src/models/user";

function createUser(id: number, tokens: number): User {
    return User.build({
        id,
        email: `user${id}@test.com`,
        password: "password",
        role: "user",
        tokens,
    });
}

function createPlayer(id: string, user: User): HumanPlayer {
    return new HumanPlayer(id, new Fleet(`fleet-${id}`), 3, 0, [], user);
}

/*
 * Game costruito con il parametro "restore": e' il percorso usato da
 * GameRepository per ricaricare dal database una partita gia' iniziata.
 */
describe("Game restore", () => {

    function restoreData(
        p1: HumanPlayer,
        p2: HumanPlayer
    ): GameRestoreData {
        const attack = new Attack(Coordinates.create(1, 2, 3));

        return {
            state: GameState.RUNNING,
            currentPlayerIndex: 0,
            turn: 4,
            silenceUsed: new Map([[p1, 1], [p2, 0]]),
            shields: new Map([
                [p1, [Coordinates.create(2, 2, 2)]],
                [p2, []]
            ]),
            history: [{
                turn: 3,
                player: p2,
                type: ActionType.SHIELD,
                cost: 2,
                result: "OK",
                hidden: false,
                timestamp: new Date()
            }],
            pendingAction: attack,
            pendingActionPlayer: p1
        };
    }

    it("deve ripristinare turno, silence, scudi, storico e azione pending", () => {
        const owner = createUser(1, 5);
        const p1 = createPlayer("p1", owner);
        const p2 = createPlayer("p2", createUser(2, 5));

        const game = new Game(
            "game-1", GridFactory.create(10, 10, 5), [p1, p2],
            owner, 3, undefined, undefined, restoreData(p1, p2)
        );

        expect(game.getState()).toBe(GameState.RUNNING);
        expect(game.getTurn()).toBe(4);
        expect(game.getSilenceUsed(p1)).toBe(1);
        expect(game.getSilenceRemaining(p1)).toBe(2);
        expect(game.hasShield(p1, Coordinates.create(2, 2, 2))).toBe(true);
        expect(game.getHistory()).toHaveLength(1);
        expect(game.hasPendingAction()).toBe(true);
        expect(game.getPendingActionPlayer()).toBe(p1);
    });

    it("non deve controllare il saldo del creatore su una partita gia' esistente", () => {
        const owner = createUser(1, 0);
        const p1 = createPlayer("p1", owner);
        const p2 = createPlayer("p2", createUser(2, 5));

        expect(() =>
            new Game(
                "game-1", GridFactory.create(10, 10, 5), [p1, p2],
                owner, 0, undefined, undefined, restoreData(p1, p2)
            )
        ).not.toThrow();
    });

    it("deve rifiutare un giocatore di turno non valido", () => {
        const owner = createUser(1, 5);
        const p1 = createPlayer("p1", owner);
        const p2 = createPlayer("p2", createUser(2, 5));

        expect(() =>
            new Game(
                "game-1", GridFactory.create(10, 10, 5), [p1, p2],
                owner, 0, undefined, undefined,
                { ...restoreData(p1, p2), currentPlayerIndex: 2 }
            )
        ).toThrow("Invalid current player in the saved game.");
    });
});
