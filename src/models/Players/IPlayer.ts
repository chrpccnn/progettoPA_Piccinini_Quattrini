import { Fleet } from "../fleet/Fleet";


export interface IPlayer {
    spendEnergy(amount: number): unknown;
    getId(): string;
    getFleet(): Fleet;
    getEnergy(): number;
    getCredits(): number;
    getUsers(): string[];

    makeMove(): void;
    makeCounterMeasure(): void;
}