import { TokenCost } from "../../TokenCost";
import { Orientation } from "../fleet/Orientation";
import { Coordinates } from "../grid/Coordinates";
import type { IAction } from "../Action/IAction";
import { Grid } from "../grid/Igrid";
import { IPlayer } from "../Players/IPlayer";
import { PlayerType } from "../Players/PlayerType";
import { User } from "../user";
import { GameState } from "./GameState";
import { MoveRecord } from "../MoveRecord";
import { EnergyConfig, DEFAULT_ENERGY_CONFIG, validateEnergyConfig } from "./EnergyConfig";

/*
 * Stato di una partita gia' iniziata, letto dal database.
 * Serve solo a GameRepository per ricostruire la partita: il costruttore
 * parte sempre da WAITING e non permetterebbe di rimettere turno, scudi,
 * silence usati, storico e azione in attesa.
 */
export interface GameRestoreData {
    state: GameState;
    currentPlayerIndex: number;
    turn: number;
    winner?: IPlayer;
    silenceUsed: Map<IPlayer, number>;
    shields: Map<IPlayer, Coordinates[]>;
    history: MoveRecord[];
    pendingAction?: IAction;
    pendingActionPlayer?: IPlayer;
}

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

    /* Scudi attivi di ogni giocatore (sulle sue celle). */
    private readonly shields: Map<IPlayer, Set<Coordinates>> =
        new Map();

    private readonly history: MoveRecord[] = [];

    constructor(
        private readonly id: string,
        private readonly grid: Grid,
        private readonly players: IPlayer[],
        private readonly tokenOwner: User,
        silence: number = Game.DEFAULT_SILENCE,
        private readonly energyConfig: EnergyConfig =
            { ...DEFAULT_ENERGY_CONFIG },
        private readonly allowedOrientations: Orientation[] =
            Object.values(Orientation),
        restore?: GameRestoreData
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
            restore === undefined &&
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

        validateEnergyConfig(energyConfig);

        if (allowedOrientations.length === 0) {
            throw new Error(
                "At least one orientation must be allowed."
            );
        }

        this.silence = silence;

        for (const player of players) {
            this.silenceUsed.set(player, 0);
            this.shields.set(player, new Set());
        }

        this.state = GameState.WAITING;
        this.currentPlayerIndex = 0;
        this.turn = 0;

        if (restore !== undefined) {
            this.applyRestore(restore);
        }
    }

    /*
     * Rimette la partita nello stato salvato. Il saldo del creatore non
     * viene controllato: la partita esiste gia' e, da specifica, prosegue
     * anche se i TOKEN sono finiti.
     */
    private applyRestore(data: GameRestoreData): void {
        if (
            !Number.isInteger(data.currentPlayerIndex) ||
            data.currentPlayerIndex < 0 ||
            data.currentPlayerIndex >= this.players.length
        ) {
            throw new Error(
                "Invalid current player in the saved game."
            );
        }

        this.state = data.state;
        this.currentPlayerIndex = data.currentPlayerIndex;
        this.turn = data.turn;
        this.winner = data.winner;

        for (const player of this.players) {
            this.silenceUsed.set(
                player,
                data.silenceUsed.get(player) ?? 0
            );

            this.shields.set(
                player,
                new Set(data.shields.get(player) ?? [])
            );
        }

        this.history.push(...data.history);

        if (data.pendingAction !== undefined) {
            this.pendingAction = data.pendingAction;
            this.pendingActionPlayer = data.pendingActionPlayer;
        }
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

    nextPlayer.addEnergy(
        this.energyConfig.regeneration,
        this.energyConfig.max
    );
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

    // -------------------------
    // CONFIG
    // -------------------------

    public getEnergyConfig(): EnergyConfig {
        return { ...this.energyConfig };
    }

    public getAllowedOrientations(): Orientation[] {
        return [...this.allowedOrientations];
    }

    // -------------------------
    // SHIELD
    // -------------------------

    public addShield(
        player: IPlayer,
        coordinates: Coordinates
    ): void {
        const cells = this.shields.get(player);

        if (cells === undefined) {
            throw new Error(
                "The player does not belong to this game."
            );
        }

        if (!this.grid.isValid(coordinates)) {
            throw new Error(
                "Shield coordinates are outside the grid."
            );
        }

        if (cells.has(coordinates)) {
            throw new Error(
                "This cell is already shielded."
            );
        }

        cells.add(coordinates);
    }

    public hasShield(
        player: IPlayer,
        coordinates: Coordinates
    ): boolean {
        return this.shields.get(player)?.has(coordinates) ?? false;
    }

    /*
     * Rimuove lo scudo se presente.
     * Ritorna true se lo scudo ha assorbito il colpo.
     */
    public consumeShield(
        player: IPlayer,
        coordinates: Coordinates
    ): boolean {
        return this.shields.get(player)?.delete(coordinates) ?? false;
    }

    public getShields(player: IPlayer): Coordinates[] {
        return [...(this.shields.get(player) ?? [])];
    }

    // -------------------------
    // HISTORY
    // -------------------------

    public recordMove(
        entry: Omit<MoveRecord, "turn" | "timestamp">
    ): void {
        this.history.push({
            ...entry,
            turn: this.turn,
            timestamp: new Date()
        });
    }

    public getHistory(): MoveRecord[] {
        return [...this.history];
    }

    /*
     * Esito di una mossa come lo vede viewer.
     * Un attacco sotto Radio Silence resta nascosto
     * all'attaccante fino alla fine della partita.
     * Senza viewer si ottiene l'esito reale.
     */
    public getVisibleResult(
        record: MoveRecord,
        viewer?: IPlayer
    ): string | undefined {
        if (
            record.hidden &&
            viewer === record.player &&
            this.state !== GameState.FINISHED
        ) {
            return "HIDDEN";
        }

        return record.result;
    }
}