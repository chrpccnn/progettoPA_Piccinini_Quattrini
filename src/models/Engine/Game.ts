
import { Grid } from "../grid/Igrid";
import { IPlayer } from "../Players/IPlayer";
import { GameState } from "./GameState";


export class Game {
    private state: GameState;
    private currentPlayerIndex: number;
    private turn: number;

    private winner?: IPlayer;

    constructor(
        private readonly id: string,
        private readonly grid: Grid,
        private readonly players: IPlayer[]
    ) {
        if (players.length !== 2) {
            throw new Error(
                "A game must have exactly two players."
            );
        }

        this.state = GameState.WAITING;
        this.currentPlayerIndex = 0;
        this.turn = 0;
    }

    public getId(): string {
        return this.id;
    }

    public getState(): GameState {
        return this.state;
    }

    public getGrid(): Grid {
        return this.grid;
    }

    public getPlayers(): IPlayer[] {
        return [...this.players];
    }

    public getCurrentPlayer(): IPlayer {
        return this.players[this.currentPlayerIndex];
    }

    public getCurrentPlayerIndex(): number {
        return this.currentPlayerIndex;
    }

    public getTurn(): number {
        return this.turn;
    }

    public start(): void {
        if (this.state !== GameState.WAITING) {
            throw new Error(
                "The game has already started or finished."
            );
        }

        this.state = GameState.RUNNING;
        this.currentPlayerIndex = 0;
        this.turn = 1;
    }

    public nextTurn(): void {
        if (this.state !== GameState.RUNNING) {
            throw new Error(
                "The game is not running."
            );
        }

        this.currentPlayerIndex =
            (this.currentPlayerIndex + 1) %
            this.players.length;

        if (this.currentPlayerIndex === 0) {
            this.turn++;
        }
    }

    public end(winner: IPlayer): void {
        if (!this.players.includes(winner)) {
            throw new Error(
                "The winner must be a player of this game."
            );
        }

        this.winner = winner;
        this.state = GameState.FINISHED;
    }

    public getWinner(): IPlayer | undefined {
        return this.winner;
    }
}