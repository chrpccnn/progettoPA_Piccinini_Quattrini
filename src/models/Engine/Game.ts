import { TokenCost } from "../../TokenCost";
import type { IAction } from "../Action/IAction";
import { Grid } from "../grid/Igrid";
import { IPlayer } from "../Players/IPlayer";
import { PlayerType } from "../Players/PlayerType";
import { User } from "../user";
import { GameState } from "./GameState";

export class Game {

    private static readonly DEFAULT_SILENCE = 3;
    private static readonly MAX_SILENCE = 5;

    private state: GameState;
    private currentPlayerIndex: number;
    private turn: number;

    private winner?: IPlayer;

    private readonly silence: number;

    private readonly silenceUsed: Map<IPlayer, number> = new Map();

    private pendingAction?: IAction;
    private pendingActionPlayer?: IPlayer;

    constructor(
        private readonly id: string,
        private readonly grid: Grid,
        private readonly players: IPlayer[],
        private readonly tokenOwner: User,
        silence: number = Game.DEFAULT_SILENCE
    ) {
        if (players.length !== 2) {
            throw new Error(
                "A game must have exactly two players."
            );
        }

        /*
         * Il creator deve possedere almeno 0.30 TOKEN
         * per poter creare la partita.
         *
         * Il saldo NON viene modificato nel costruttore.
         */
        if (
            tokenOwner.getTokens() <
            TokenCost.GAME_CREATION
        ) {
            throw new Error(
                "Insufficient tokens to create the game."
            );
        }

        if (
            !Number.isInteger(silence) ||
            silence < 0 ||
            silence > Game.MAX_SILENCE
        ) {
            throw new Error(
                "Silence must be an integer between 0 and 5."
            );
        }

        const isUserVsUser =
            players.every(
                player =>
                    player.getType() === PlayerType.HUMAN
            );

        if (!isUserVsUser && silence > 0) {
            throw new Error(
                "Silence can only be used in a user versus user game."
            );
        }

        this.silence = silence;

        for (const player of players) {
            this.silenceUsed.set(player, 0);
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

    public getTokenOwner(): User {
        return this.tokenOwner;
    }

    /*
     * Addebita il costo di creazione della partita.
     *
     * Il controllo del saldo viene fatto prima dell'addebito.
     * Questo metodo deve essere chiamato una sola volta
     * quando la partita viene creata.
     */
    public payCreationCost(): void {
        if (
            this.tokenOwner.getTokens() <
            TokenCost.GAME_CREATION
        ) {
            throw new Error(
                "Insufficient tokens to create the game."
            );
        }

        this.tokenOwner.spendTokens(
            TokenCost.GAME_CREATION
        );
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

    const nextPlayer =
        this.players[this.currentPlayerIndex];

    nextPlayer.addEnergy(2);
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

    // -------------------------
    // SILENCE
    // -------------------------

    public getSilence(): number {
        return this.silence;
    }

    public getSilenceUsed(
        player: IPlayer
    ): number {
        return this.silenceUsed.get(player) ?? 0;
    }

    public getSilenceRemaining(
        player: IPlayer
    ): number {
        return (
            this.silence -
            this.getSilenceUsed(player)
        );
    }

    public canUseSilence(
        player: IPlayer
    ): boolean {
        return (
            this.getSilenceRemaining(player) > 0
        );
    }

    public useSilence(
        player: IPlayer
    ): void {
        if (!this.players.includes(player)) {
            throw new Error(
                "The player does not belong to this game."
            );
        }

        if (!this.canUseSilence(player)) {
            throw new Error(
                "No silence uses remaining."
            );
        }

        this.silenceUsed.set(
            player,
            this.getSilenceUsed(player) + 1
        );
    }

    // -------------------------
    // PENDING ACTION
    // -------------------------

    public setPendingAction(
        player: IPlayer,
        action: IAction
    ): void {
        if (this.pendingAction !== undefined) {
            throw new Error(
                "There is already an action waiting for resolution."
            );
        }

        this.pendingAction = action;
        this.pendingActionPlayer = player;
    }

    public getPendingAction(): IAction | undefined {
        return this.pendingAction;
    }

    public getPendingActionPlayer(): IPlayer | undefined {
        return this.pendingActionPlayer;
    }

    public hasPendingAction(): boolean {
        return this.pendingAction !== undefined;
    }

    public clearPendingAction(): void {
        this.pendingAction = undefined;
        this.pendingActionPlayer = undefined;
    }
}