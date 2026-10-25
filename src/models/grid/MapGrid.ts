/*
 * Implementazione concreta dell'interfaccia Grid per una griglia
 * tridimensionale di dimensioni definite al momento della costruzione.
 *
 * La classe verifica che le dimensioni siano positive e intere, controlla
 * che le coordinate utilizzate per accedere alle celle rientrino
 * nei limiti della griglia.
 *
 * Gli stati delle celle vengono memorizzati in una mappa. Le celle
 * non ancora registrate sono considerate vuote, mentre gli stati
 * esplicitamente impostati vengono restituiti dalle operazioni di lettura.
 *
 * Le istanze Cell vengono ottenute tramite Cell.create, così da
 * mantenere un'identità condivisa per celle associate alle stesse
 * coordinate.
 */
import { Cell, CellState } from "./Cell";
import { Coordinates } from "./Coordinates";
import { Grid } from "./Igrid";

export class MapGrid implements Grid {
    private readonly cells: Map<Cell, CellState>;

    constructor(
        private readonly width: number,
        private readonly height: number,
        private readonly depth: number
    ) {
        if (
    !Number.isInteger(width) || width <= 0 ||
    !Number.isInteger(height) || height <= 0 ||
    !Number.isInteger(depth) || depth <= 0
) {
    throw new Error(
        "Grid dimensions must be positive integers."
    );
}

        this.cells = new Map<Cell, CellState>();
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public getDepth(): number {
        return this.depth;
    }

    public isValid(
        coordinates: Coordinates
    ): boolean {
        return (
            coordinates.x >= 0 &&
            coordinates.x < this.width &&

            coordinates.y >= 0 &&
            coordinates.y < this.height &&

            coordinates.z >= 0 &&
            coordinates.z < this.depth
        );
    }

    public getCell(
        coordinates: Coordinates
    ): Cell {
        this.validateCoordinates(coordinates);

        return Cell.create(coordinates);
    }

    public getCellState(
        coordinates: Coordinates
    ): CellState {
        this.validateCoordinates(coordinates);

        const cell = this.getCell(coordinates);

        return this.cells.get(cell) ?? CellState.EMPTY;
    }

    public setCellState(
        coordinates: Coordinates,
        state: CellState
    ): void {
        this.validateCoordinates(coordinates);

        const cell = this.getCell(coordinates);

        this.cells.set(cell, state);
    }

    private validateCoordinates(
        coordinates: Coordinates
    ): void {
        if (!this.isValid(coordinates)) {
            throw new Error(
                `Coordinates ${coordinates.toString()} ` +
                `are outside the grid.`
            );
        }
    }
}