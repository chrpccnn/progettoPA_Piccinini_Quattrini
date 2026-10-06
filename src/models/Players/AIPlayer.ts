import { Fleet } from "../fleet/Fleet";
import { IPlayer } from "./IPlayer";


export class AIPlayer implements IPlayer {
    constructor(
        private readonly id: string,
        private readonly fleet: Fleet,
        private energy: number,
        private credits: number,
        private readonly users: string[]
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
        return this.users;
    }

    public makeMove(): void {
        // TODO: implementare con le classi Action
    }

    public makeCounterMeasure(): void {
        // TODO: implementare con le classi Action
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