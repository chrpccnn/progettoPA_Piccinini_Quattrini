import { CellState } from "../../grid/Cell";
import { Coordinates } from "../../grid/Coordinates";
import { ActionContext } from "../ActionContext";
import { BasicMove } from "../BasicMove";

export class Scan extends BasicMove {

    private occupiedCells: number = 0;

    constructor(
        private readonly center: Coordinates
    ) {
        super();
    }

    public getCenter(): Coordinates {
        return this.center;
    }

    public getCost(): number {
        return 2;
    }

    public getOccupiedCells(): number {
        return this.occupiedCells;
    }

    public execute(
        context: ActionContext
    ): void {

        const grid = context.game.getGrid();

        if (!grid.isValid(this.center)) {
            throw new Error(
                "Scan center is outside the grid."
            );
        }

        /*
         * Il centro deve essere almeno una cella
         * distante da ogni bordo per poter creare
         * un cubo completo 3x3x3.
         */
        if (
            this.center.x <= 0 ||
            this.center.x >= grid.getWidth() - 1 ||
            this.center.y <= 0 ||
            this.center.y >= grid.getHeight() - 1 ||
            this.center.z <= 0 ||
            this.center.z >= grid.getDepth() - 1
        ) {
            throw new Error(
                "Scan center must be at least one cell away from every grid edge."
            );
        }

        let occupiedCells = 0;

        for (
            let x = this.center.x - 1;
            x <= this.center.x + 1;
            x++
        ) {
            for (
                let y = this.center.y - 1;
                y <= this.center.y + 1;
                y++
            ) {
                for (
                    let z = this.center.z - 1;
                    z <= this.center.z + 1;
                    z++
                ) {

                    const coordinates =
                        Coordinates.create(x, y, z);

                    const state =
                        grid.getCellState(coordinates);

                    if (
                        state === CellState.OCCUPIED ||
                        state === CellState.HIT
                    ) {
                        occupiedCells++;
                    }
                }
            }
        }

        this.occupiedCells = occupiedCells;
    }
    public setOccupiedCells(
    occupiedCells: number
): void {
    this.occupiedCells = occupiedCells;
}
}