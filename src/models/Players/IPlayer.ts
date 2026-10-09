import { IAction } from "../Action/IAction";
import { Countermeasure } from "../Action/Countermeasure";
import { Fleet } from "../fleet/Fleet";
import { Game } from "../Engine/Game";
import { GameEngine } from "../Engine/GameEngine";
import { PlayerType } from "./PlayerType";

export interface IPlayer {
    getId(): string;
    getType(): PlayerType;
    getFleet(): Fleet;
    getEnergy(): number;
    getCredits(): number;
    getUsers(): string[];

    spendEnergy(amount: number): void;
    addEnergy(amount: number, max: number): void;

    makeMove(
        game: Game,
        engine: GameEngine,
        action: IAction
    ): void;

    makeCounterMeasure(
        game: Game,
        engine: GameEngine,
        countermeasure: Countermeasure
    ): void;
}