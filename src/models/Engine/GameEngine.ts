import { IAction } from "../Action/IAction";
import { ActionContext } from "../Action/ActionContext";
import { Countermeasure } from "../Action/Countermeasure";
import { IPlayer } from "../Players/IPlayer";
import { HumanPlayer } from "../Players/HumanPlayer";
import { Game } from "./Game";
import { GameState } from "./GameState";
import { Attack } from "../Action/BasicMove/Attack";
import { Scan } from "../Action/BasicMove/Scan";
import { TokenCost } from "../../TokenCost";

export class GameEngine {

    private static instance: GameEngine;

    private constructor() {}

    public static getInstance(): GameEngine {
        if (GameEngine.instance === undefined) {
            GameEngine.instance = new GameEngine();
        }

        return GameEngine.instance;
    }

    public executeAction(
        game: Game,
        player: IPlayer,
        action: IAction
    ): void {

        this.validateMove(game, player, action);

        // Il costo in TOKEN viene applicato solo agli Human
        this.consumeToken(player);

        // Il costo in ENERGY dipende dall'azione
        this.consumeEnergy(
            player,
            action.getCost()
        );

        /*
         * SCAN
         *
         * La Scan deve essere eseguita immediatamente perché
         * AlterScan deve poter modificare il risultato ottenuto.
         *
         * Rimane comunque pending per permettere all'avversario
         * di utilizzare una countermeasure.
         */
        if (action instanceof Scan) {

            const context: ActionContext = {
                game,
                player
            };

            action.execute(context);

            game.setPendingAction(
                player,
                action
            );

            return;
        }

        /*
         * ATTACK
         *
         * L'Attack non viene eseguito subito.
         * Rimane pending fino a PASS o countermeasure.
         */
        if (action instanceof Attack) {

            game.setPendingAction(
                player,
                action
            );

            return;
        }

        /*
         * Tutte le altre azioni vengono eseguite immediatamente.
         */
        const context: ActionContext = {
            game,
            player
        };

        action.execute(context);

        game.nextTurn();
    }

    public executeCountermeasure(
        game: Game,
        player: IPlayer,
        countermeasure: Countermeasure
    ): void {

        // Prima vengono effettuate tutte le validazioni
        this.validateCountermeasure(
            game,
            player,
            countermeasure
        );

        // Costo TOKEN della countermeasure
        this.consumeToken(player);

        // Costo ENERGY della countermeasure
        const energyCost = countermeasure.getCost();

        this.consumeEnergy(
            player,
            energyCost
        );

        // Consuma un utilizzo di Radio Silence
        game.useSilence(player);

        const pendingAction = game.getPendingAction();
        const pendingPlayer = game.getPendingActionPlayer();

        if (
            pendingAction === undefined ||
            pendingPlayer === undefined
        ) {
            throw new Error(
                "There is no action to counter."
            );
        }

        /*
         * La countermeasure viene eseguita sull'azione
         * del giocatore che l'ha generata.
         */
        const context: ActionContext = {
            game,
            player: pendingPlayer
        };

        countermeasure.execute(context);

        // L'azione pending è stata risolta
        game.clearPendingAction();

        /*
         * Dopo la countermeasure si passa al giocatore successivo,
         * se la partita è ancora in esecuzione.
         */
        if (game.getState() === GameState.RUNNING) {
            game.nextTurn();
        }
    }

    public pass(
        game: Game,
        player: IPlayer
    ): void {

        if (game.getState() !== GameState.RUNNING) {
            throw new Error(
                "The game is not running."
            );
        }

        if (!game.hasPendingAction()) {
            throw new Error(
                "There is no action waiting for resolution."
            );
        }

        const pendingPlayer =
            game.getPendingActionPlayer();

        if (pendingPlayer === undefined) {
            throw new Error(
                "The pending action has no player."
            );
        }

        if (pendingPlayer === player) {
            throw new Error(
                "The player who performed the action cannot pass the countermeasure phase."
            );
        }

        // PASS costa TOKEN solo se effettuato da Human
        this.consumeToken(player);

        const pendingAction =
            game.getPendingAction();

        if (pendingAction === undefined) {
            throw new Error(
                "There is no action waiting for resolution."
            );
        }

        /*
         * La Scan è già stata eseguita in executeAction().
         *
         * Non dobbiamo eseguirla una seconda volta,
         * altrimenti AlterScan perderebbe il risultato
         * modificato oppure verrebbe ricalcolato.
         */
        if (!(pendingAction instanceof Scan)) {

            const context: ActionContext = {
                game,
                player: pendingPlayer
            };

            pendingAction.execute(context);
        }

        // Risoluzione della pending action
        game.clearPendingAction();

        if (game.getState() === GameState.RUNNING) {
            game.nextTurn();
        }
    }

    public validateMove(
        game: Game,
        player: IPlayer,
        action: IAction
    ): void {

        if (game.getState() !== GameState.RUNNING) {
            throw new Error(
                "The game is not running."
            );
        }

        if (game.getCurrentPlayer() !== player) {
            throw new Error(
                "It is not this player's turn."
            );
        }

        if (game.hasPendingAction()) {
            throw new Error(
                "The current action must be resolved first."
            );
        }

        if (player.getEnergy() < action.getCost()) {
            throw new Error(
                "Insufficient energy."
            );
        }
    }

    public validateCountermeasure(
        game: Game,
        player: IPlayer,
        countermeasure: Countermeasure
    ): void {

        if (game.getState() !== GameState.RUNNING) {
            throw new Error(
                "The game is not running."
            );
        }

        if (!game.hasPendingAction()) {
            throw new Error(
                "There is no action to counter."
            );
        }

        if (game.getCurrentPlayer() === player) {
            throw new Error(
                "A countermeasure can only be used by the opponent."
            );
        }

        if (!game.canUseSilence(player)) {
            throw new Error(
                "No silence uses remaining."
            );
        }

        if (player.getEnergy() < countermeasure.getCost()) {
            throw new Error(
                "Insufficient energy."
            );
        }
    }

    private consumeEnergy(
        player: IPlayer,
        amount: number
    ): void {

        if (player.getEnergy() < amount) {
            throw new Error(
                "Insufficient energy."
            );
        }

        player.spendEnergy(amount);
    }

    private consumeToken(
        player: IPlayer
    ): void {

        /*
         * Le AI non possiedono User e quindi
         * non pagano TOKEN.
         */
        if (!(player instanceof HumanPlayer)) {
            return;
        }

        player
            .getUser()
            .spendTokens(TokenCost.GAME_MOVE);
    }
}