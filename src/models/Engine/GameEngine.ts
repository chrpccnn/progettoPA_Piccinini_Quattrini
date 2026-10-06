import { IAction } from "../Action/IAction";
import { ActionContext } from "../Action/ActionContext";
import { Countermeasure } from "../Action/Countermeasure";
import { IPlayer } from "../Players/IPlayer";
import { Game } from "./Game";
import { GameState } from "./GameState";

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

        this.validateMove(
            game,
            player,
            action
        );

        this.consumeEnergy(
            player,
            action.getCost()
        );

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

        this.validateCountermeasure(
            game,
            player,
            countermeasure
        );

        const context: ActionContext = {
            game,
            player
        };

        countermeasure.execute(context);
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

        if (game.getCurrentPlayer() === player) {
            throw new Error(
                "A countermeasure can only be used during the opponent's turn."
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
}