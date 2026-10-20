import { IAction } from "../Action/IAction";
import { ActionContext } from "../Action/ActionContext";
import { Countermeasure } from "../Action/Countermeasure";
import { AlterScan } from "../Action/Countermeasure/AlterScan";
import { CancelAttack } from "../Action/Countermeasure/CancelAttack";
import { RadioSilence } from "../Action/Countermeasure/RadioSilance";
import { IPlayer } from "../Players/IPlayer";
import { HumanPlayer } from "../Players/HumanPlayer";
import { Game } from "./Game";
import { GameState } from "./GameState";
import { Attack } from "../Action/BasicMove/Attack";
import { AttackResult } from "../Action/BasicMove/AttackResult";
import { Scan } from "../Action/BasicMove/Scan";
import { Move } from "../Action/BasicMove/Move";
import { Shield } from "../Action/BasicMove/Shield";
import { Coordinates } from "../grid/Coordinates";
import { TokenCost } from "../../TokenCost";
import { ActionType } from "../MoveRecord";

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

        const context: ActionContext = {
            game,
            player
        };

        /*
         * ATTACK
         *
         * Non viene eseguito subito: resta pending fino a
         * PASS o countermeasure. Le coordinate vanno controllate
         * subito, altrimenti l'errore uscirebbe solo alla risoluzione.
         */
        if (action instanceof Attack) {

            if (!game.getGrid().isValid(action.getCoordinates())) {
                throw new Error(
                    "Attack coordinates are outside the grid."
                );
            }

            this.charge(game, player, action.getCost());

            game.setPendingAction(player, action);

            return;
        }

        /*
         * SCAN
         *
         * Viene eseguita subito perché AlterScan deve poter
         * modificare il risultato, e resta pending per permettere
         * all'avversario di rispondere. Execute viene prima del
         * costo: se la scan è invalida non si paga nulla.
         */
        if (action instanceof Scan) {

            action.execute(context);

            this.charge(game, player, action.getCost());

            game.setPendingAction(player, action);

            return;
        }

        /*
         * Tutte le altre azioni vengono eseguite subito.
         * Anche qui execute viene prima del costo, così una
         * Move rifiutata non consuma energy e token.
         */
        action.execute(context);

        this.charge(game, player, action.getCost());

        game.recordMove({
            player,
            type: action instanceof Move
                ? ActionType.MOVE
                : ActionType.SHIELD,
            coordinates: this.coordinatesOf(action),
            cost: action.getCost(),
            result: "OK",
            hidden: false
        });

        game.nextTurn();
    }

    /*
     * Il giocatore di turno rinuncia ad agire.
     * Serve quando non ha abbastanza energy per nessuna azione.
     */
    public skipTurn(
        game: Game,
        player: IPlayer
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

        game.nextTurn();
    }

    /*
     * Ritorna l'esito della countermeasure:
     * BLOCKER per CancelAttack, l'esito reale dell'attacco
     * per RadioSilence (che l'attaccante non deve vedere),
     * undefined per AlterScan.
     */
    public executeCountermeasure(
        game: Game,
        player: IPlayer,
        countermeasure: Countermeasure
    ): AttackResult | undefined {

        // Prima vengono effettuate tutte le validazioni
        this.validateCountermeasure(
            game,
            player,
            countermeasure
        );

        const pendingPlayer = game.getPendingActionPlayer();

        if (pendingPlayer === undefined) {
            throw new Error(
                "There is no action to counter."
            );
        }

        this.charge(game, player, countermeasure.getCost());

        // Solo la Radio Silence consuma un utilizzo di silence
        if (countermeasure instanceof RadioSilence) {
            game.useSilence(player);
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

        let result: AttackResult | undefined;

        if (countermeasure instanceof RadioSilence) {
            result = countermeasure.getResult();
        } else if (countermeasure instanceof CancelAttack) {
            result = AttackResult.BLOCKER;
        }

        this.recordResolution(
            game,
            pendingPlayer,
            game.getPendingAction()!,
            result,
            countermeasure instanceof RadioSilence
        );

        game.recordMove({
            player,
            type: this.typeOfCountermeasure(countermeasure),
            coordinates: this.coordinatesOf(
                game.getPendingAction()!
            ),
            cost: countermeasure.getCost(),
            hidden: false
        });

        // L'azione pending è stata risolta
        game.clearPendingAction();

        this.advance(game, pendingPlayer, result);

        return result;
    }

    /*
     * Ritorna l'esito dell'attacco risolto,
     * undefined se l'azione pending era una Scan.
     */
    public pass(
        game: Game,
        player: IPlayer
    ): AttackResult | undefined {

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

        const pendingAction =
            game.getPendingAction();

        if (pendingAction === undefined) {
            throw new Error(
                "There is no action waiting for resolution."
            );
        }

        // PASS costa TOKEN solo se effettuato da Human
        this.chargeHumanToken(player);

        let result: AttackResult | undefined;

        /*
         * La Scan è già stata eseguita in executeAction():
         * rieseguirla cancellerebbe l'effetto di AlterScan.
         */
        if (!(pendingAction instanceof Scan)) {

            const context: ActionContext = {
                game,
                player: pendingPlayer
            };

            result = pendingAction.execute(context) as
                AttackResult | undefined;
        }

        this.recordResolution(
            game,
            pendingPlayer,
            pendingAction,
            result,
            false
        );

        // Risoluzione della pending action
        game.clearPendingAction();

       this.advance(game, pendingPlayer, result);

        return result;
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

        if (game.getPendingActionPlayer() === player) {
            throw new Error(
                "A countermeasure can only be used by the opponent."
            );
        }

        if (
            this.getTarget(countermeasure) !==
            game.getPendingAction()
        ) {
            throw new Error(
                "The countermeasure does not target the pending action."
            );
        }

        if (
            countermeasure instanceof RadioSilence &&
            !game.canUseSilence(player)
        ) {
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

    /*
     * Dopo la risoluzione di un'azione: se l'attacco ha distrutto
     * l'ultima nave la partita finisce, altrimenti passa il turno.
     */
    
private advance(
    game: Game,
    actor: IPlayer,
    result: AttackResult | undefined
): void {
    if (result === AttackResult.GAME_OVER) {
        game.end(actor);
        return;
    }

    if (game.getState() !== GameState.RUNNING) {
        return;
    }

    // Dopo la risoluzione, il turno passa al giocatore
    // che ha risposto all'azione pendente.
    game.nextTurn();
}


    private getTarget(
        countermeasure: Countermeasure
    ): IAction | undefined {

        if (countermeasure instanceof AlterScan) {
            return countermeasure.getScan();
        }

        if (
            countermeasure instanceof CancelAttack ||
            countermeasure instanceof RadioSilence
        ) {
            return countermeasure.getAttack();
        }

        return undefined;
    }

    /*
     * Registra nello storico l'azione pending risolta.
     * Un attacco sotto Radio Silence viene segnato come nascosto.
     */
    private recordResolution(
        game: Game,
        actor: IPlayer,
        action: IAction,
        result: AttackResult | undefined,
        hidden: boolean
    ): void {

        if (action instanceof Attack) {
            game.recordMove({
                player: actor,
                type: ActionType.ATTACK,
                coordinates: action.getCoordinates(),
                cost: action.getCost(),
                result,
                hidden
            });
        } else if (action instanceof Scan) {
            game.recordMove({
                player: actor,
                type: ActionType.SCAN,
                coordinates: action.getCenter(),
                cost: action.getCost(),
                result: String(action.getOccupiedCells()),
                hidden: false
            });
        }
    }

    private coordinatesOf(
        action: IAction
    ): Coordinates | undefined {

        if (action instanceof Attack || action instanceof Shield) {
            return action.getCoordinates();
        }

        if (action instanceof Scan) {
            return action.getCenter();
        }

        if (action instanceof Move) {
            return action.getDestination();
        }

        return undefined;
    }

    private typeOfCountermeasure(
        countermeasure: Countermeasure
    ): ActionType {

        if (countermeasure instanceof AlterScan) {
            return ActionType.ALTER_SCAN;
        }

        if (countermeasure instanceof CancelAttack) {
            return ActionType.CANCEL_ATTACK;
        }

        return ActionType.RADIO_SILENCE;
    }

    private charge(
        game: Game,
        player: IPlayer,
        energyCost: number
    ): void {

        // Il costo in TOKEN viene sempre addebitato a un utente
        this.chargeToken(game, player);

        // Il costo in ENERGY dipende dall'azione
        this.consumeEnergy(player, energyCost);
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

    /*
     * Ogni azione costa TOKEN: la paga l'utente che la esegue,
     * oppure, per le azioni dell'IA, l'utente che ha creato la partita.
     */
    private chargeToken(
        game: Game,
        player: IPlayer
    ): void {

        const payer =
            player instanceof HumanPlayer
                ? player.getUser()
                : game.getTokenOwner();

        payer.spendTokens(TokenCost.GAME_MOVE);
    }

    /*
     * Il PASS costa TOKEN solo se lo fa un Human.
     */
    private chargeHumanToken(
        player: IPlayer
    ): void {

        if (player instanceof HumanPlayer) {
            player
                .getUser()
                .spendTokens(TokenCost.GAME_MOVE);
        }
    }
}