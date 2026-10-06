import { Ship } from "../../fleet/Ship";
import { Coordinates } from "../../grid/Coordinates";

import { BasicMove } from "../BasicMove";

export class Move extends BasicMove {

    constructor(
        private readonly ship: Ship,
        private readonly destination: Coordinates
    ) {
        super();
    }

    public getShip(): Ship {
        return this.ship;
    }

    public getDestination(): Coordinates {
        return this.destination;
    }

    public getCost(): number {
        return 2;
    }

    public execute(): void {
        // L'esecuzione viene gestita dal GameEngine.
    }
}