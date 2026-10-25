/*
 * Definisce il contratto comune per le griglie di gioco.
 *
 * Espone i metodi necessari per consultare le dimensioni della griglia,
 * verificare la validità delle coordinate, ottenere le celle e leggere
 * o modificare il loro stato.
 *
 * L'interfaccia separa le operazioni disponibili dalla loro
 * implementazione concreta, consentendo al sistema di utilizzare
 * diverse implementazioni di griglia purché rispettino questo contratto.
 */
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