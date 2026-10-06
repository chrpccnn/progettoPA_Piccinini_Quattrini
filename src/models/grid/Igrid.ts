import { Cell, CellState } from "./Cell";
import { Coordinates } from "./Coordinates";



export interface Grid {
    getWidth(): number;
    getHeight(): number;
    getDepth(): number;

    isValid(coordinates: Coordinates): boolean;

    getCell(coordinates: Coordinates): Cell;

    getCellState(coordinates: Coordinates): CellState;

    setCellState(
        coordinates: Coordinates,
        state: CellState
    ): void;
}