
/**
 *
 * SCOPO
 * Verificare il comportamento della classe Game, che rappresenta
 * una partita e ne gestisce i giocatori, lo stato, i turni e il costo
 * di creazione espresso in TOKEN.
 *
 *
 * CREAZIONE DELLA PARTITA
 * I test verificano che:
 * - sia possibile creare una partita user-vs-user;
 * - sia possibile creare una partita user-vs-AI;
 * - la partita contenga esattamente due giocatori;
 * - la creazione venga rifiutata con meno o più di due giocatori;
 * - sia necessario disporre di almeno 0,30 TOKEN;
 * - il saldo esattamente pari a 0,30 TOKEN venga accettato.
 *
 * COSTO DI CREAZIONE
 * I test verificano che:
 * - payCreationCost() sottragga 0,30 TOKEN dal saldo del proprietario;
 * - il costo non venga sottratto automaticamente dal costruttore.
 *
 * STATO DELLA PARTITA
 * I test verificano che:
 * - una nuova partita inizi nello stato WAITING;
 * - il metodo start() porti la partita nello stato RUNNING;
 * - l'avvio inizializzi correttamente il turno e il giocatore corrente.
 *
 * GESTIONE DEI TURNI
 * I test verificano che:
 * - nextTurn() passi il controllo al giocatore successivo;
 * - il numero del turno aumenti quando il controllo torna
 *   al primo giocatore.
 *
 * SILENCE
 * Un test controlla che sia possibile creare una partita user-vs-user
 * specificando un numero iniziale di utilizzi di silence.
 *
 */

import { Game } from "../src/models/Engine/Game";
import { GameState } from "../src/models/Engine/GameState";
import { Fleet } from "../src/models/fleet/Fleet";
import { GridFactory } from "../src/models/grid/GridFactory";
import { AIPlayer } from "../src/models/Players/AIPlayer";
import { AIStrategy } from "../src/models/Players/AIStrategy";
import { HumanPlayer } from "../src/models/Players/HumanPlayer";
import { User } from "../src/models/user";
import { TokenCost } from "../src/TokenCost";

function createUser(id: number, tokens = 1): User {
    return new User({
        id,
        email: `user${id}@test.com`,
        password: "password",
        role: "user",
        tokens,
    });
}

function createHumanPlayer(
    id: number,
    user: User,
    energy = 3
): HumanPlayer {
    const playerId = String(id);

    return new HumanPlayer(
        playerId,
        new Fleet(playerId),
        energy,
        0,
        [],
        user
    );
}

function createAIPlayer(
    id: number,
    energy: number = 3,
    fleet?: Fleet
): AIPlayer {
    const playerId = String(id);

    return new AIPlayer(
        playerId,
        fleet ?? new Fleet(`fleet-${playerId}`),
        energy,
        0,
        [],
        new AIStrategy()
    );
}

function createGame(
    players: (HumanPlayer | AIPlayer)[],
    owner: User,
    silence = 0
): Game {
    const grid = GridFactory.create(10, 10, 5);

    return new Game(
        "game-1",
        grid,
        players,
        owner,
        silence
    );
}

describe("Game", () => {

    describe("creazione", () => {

        it("deve creare una partita user-vs-user", () => {
            const user1 = createUser(1);
            const user2 = createUser(2);

            const player1 = createHumanPlayer(1, user1);
            const player2 = createHumanPlayer(2, user2);

            const game = createGame(
                [player1, player2],
                user1
            );

            expect(game.getState()).toBe(GameState.WAITING);
            expect(game.getPlayers()).toHaveLength(2);
            expect(game.getCurrentPlayer()).toBe(player1);
            expect(game.getTurn()).toBe(0);
        });

        it("deve creare una partita user-vs-AI", () => {
            const user = createUser(1);

            const player = createHumanPlayer(1, user);
            const ai = createAIPlayer(2);

            const game = createGame(
                [player, ai],
                user
            );

            expect(game.getState()).toBe(GameState.WAITING);
            expect(game.getPlayers()).toHaveLength(2);
            expect(game.getCurrentPlayer()).toBe(player);
        });

        it("deve rifiutare la creazione con meno di 2 giocatori", () => {
            const user = createUser(1);
            const player = createHumanPlayer(1, user);

            expect(() =>
                createGame([player], user)
            ).toThrow("A game must have exactly two players.");
        });

        it("deve rifiutare la creazione con più di 2 giocatori", () => {
            const user = createUser(1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));
            const player3 = createHumanPlayer(3, createUser(3));

            expect(() =>
                createGame(
                    [player1, player2, player3],
                    user
                )
            ).toThrow("A game must have exactly two players.");
        });

        it("deve rifiutare la creazione senza almeno 0.30 TOKEN", () => {
            const user = createUser(1, 0.299);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            expect(() =>
                createGame(
                    [player1, player2],
                    user
                )
            ).toThrow("Insufficient tokens to create the game.");
        });

        it("deve permettere la creazione con esattamente 0.30 TOKEN", () => {
            const user = createUser(1, 0.30);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            expect(() =>
                createGame(
                    [player1, player2],
                    user
                )
            ).not.toThrow();

            expect(user.getTokens()).toBe(0.30);
        });
    });

    describe("costo di creazione", () => {

        it("deve scalare 0.30 TOKEN quando viene pagato il costo di creazione", () => {
            const user = createUser(1, 1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            const game = createGame(
                [player1, player2],
                user
            );

            expect(user.getTokens()).toBe(1);

            game.payCreationCost();

            expect(user.getTokens()).toBe(
                Number(
                    (1 - TokenCost.GAME_CREATION).toFixed(3)
                )
            );

            expect(user.getTokens()).toBe(0.70);
        });

        it("non deve scalare TOKEN nel costruttore", () => {
            const user = createUser(1, 1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            createGame(
                [player1, player2],
                user
            );

            expect(user.getTokens()).toBe(1);
        });
    });

    describe("stato della partita", () => {

        it("deve partire in WAITING", () => {
            const user = createUser(1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            const game = createGame(
                [player1, player2],
                user
            );

            expect(game.getState()).toBe(GameState.WAITING);
        });

        it("deve passare da WAITING a RUNNING con start", () => {
            const user = createUser(1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            const game = createGame(
                [player1, player2],
                user
            );

            game.start();

            expect(game.getState()).toBe(GameState.RUNNING);
            expect(game.getTurn()).toBe(1);
            expect(game.getCurrentPlayer()).toBe(player1);
        });
    });

    describe("turni", () => {

        it("deve cambiare giocatore con nextTurn", () => {
            const user = createUser(1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            const game = createGame(
                [player1, player2],
                user
            );

            game.start();

            expect(game.getCurrentPlayer()).toBe(player1);

            game.nextTurn();

            expect(game.getCurrentPlayer()).toBe(player2);
        });

        it("deve incrementare il turno quando torna al primo giocatore", () => {
            const user = createUser(1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            const game = createGame(
                [player1, player2],
                user
            );

            game.start();

            expect(game.getTurn()).toBe(1);

            game.nextTurn();

            expect(game.getTurn()).toBe(1);

            game.nextTurn();

            expect(game.getTurn()).toBe(2);
            expect(game.getCurrentPlayer()).toBe(player1);
        });
    });

    describe("silence", () => {

        it("deve permettere silence in una partita user-vs-user", () => {
            const user = createUser(1);

            const player1 = createHumanPlayer(1, user);
            const player2 = createHumanPlayer(2, createUser(2));

            expect(() =>
                createGame(
                    [player1, player2],
                    user,
                    3
                )
            ).not.toThrow();
        });

    });
});