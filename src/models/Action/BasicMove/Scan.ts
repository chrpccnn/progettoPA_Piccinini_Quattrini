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

        const opponent = context.game
            .getPlayers()
            .find(
                player => player !== context.player
            );

        if (opponent === undefined) {
            throw new Error(
                "Opponent not found."
            );
        }

        let occupiedCells = 0;

        for (const ship of opponent.getFleet().getShips()) {

            for (const position of ship.getPositions()) {

                if (
                    Math.abs(position.x - this.center.x) <= 1 &&
                    Math.abs(position.y - this.center.y) <= 1 &&
                    Math.abs(position.z - this.center.z) <= 1
                ) {
                    occupiedCells++;
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