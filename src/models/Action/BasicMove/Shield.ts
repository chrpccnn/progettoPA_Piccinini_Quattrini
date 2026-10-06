import { Coordinates } from "../../grid/Coordinates";
import { ActionContext } from "../ActionContext";
import { BasicMove } from "../BasicMove";

export class Shield extends BasicMove {

    private active: boolean = false;

    constructor(
        private readonly coordinates: Coordinates
    ) {
        super();
    }

    public getCoordinates(): Coordinates {
        return this.coordinates;
    }

    public getCost(): number {
        return 2;
    }

    public execute(
        context: ActionContext
    ): void {

        const grid = context.game.getGrid();

        if (!grid.isValid(this.coordinates)) {
            throw new Error(
                "Shield coordinates are outside the grid."
            );
        }

        this.active = true;
    }

    public isActive(): boolean {
        return this.active;
    }
}