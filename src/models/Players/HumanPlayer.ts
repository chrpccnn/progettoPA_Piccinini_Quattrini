import { IAction } from "../Action/IAction";
import { Countermeasure } from "../Action/Countermeasure";
import { Game } from "../Engine/Game";
import { GameEngine } from "../Engine/GameEngine";
import { Fleet } from "../fleet/Fleet";
import { IPlayer } from "./IPlayer";
import { PlayerType } from "./PlayerType";
import { User } from "../user";

export class HumanPlayer implements IPlayer {

    constructor(
        private readonly id: string,
        private readonly fleet: Fleet,
        private energy: number,
        private credits: number,
        private readonly users: string[],
        private readonly user: User
    ) {}

    public getId(): string {
        return this.id;
    }

    public getFleet(): Fleet {
        return this.fleet;
    }

    public getEnergy(): number {
        return this.energy;
    }

    public getCredits(): number {
        return this.credits;
    }

    public getUsers(): string[] {
        return [...this.users];
    }

    public getType(): PlayerType {
        return PlayerType.HUMAN;
    }

    public getUser(): User {
        return this.user;
    }

    public makeMove(
        game: Game,
        engine: GameEngine,
        action: IAction
    ): void {

        engine.executeAction(
            game,
            this,
            action
        );
    }

    public makeCounterMeasure(
        game: Game,
        engine: GameEngine,
        countermeasure: Countermeasure
    ): void {

        engine.executeCountermeasure(
            game,
            this,
            countermeasure
        );
    }
    public addEnergy(amount: number, max: number): void {
        if (amount < 0) {
            throw new Error(
                "Energy amount cannot be negative."
            );
        }

        this.energy = Math.min(
            this.energy + amount,
            max
        );
    }

    public spendEnergy(amount: number): void {
        if (amount <= 0) {
            throw new Error(
                "Energy amount must be greater than zero."
            );
        }

        if (this.energy < amount) {
            throw new Error(
                "Insufficient energy."
            );
        }

        this.energy -= amount;
    }
}