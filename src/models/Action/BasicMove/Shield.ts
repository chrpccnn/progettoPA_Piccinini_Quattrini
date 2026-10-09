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

        /*
         * Lo scudo protegge la cella del giocatore che lo attiva
         * finché non assorbe un colpo. Al massimo uno per cella.
         */
        context.game.addShield(
            context.player,
            this.coordinates
        );

        this.active = true;
    }

    public isActive(): boolean {
        return this.active;
    }
}