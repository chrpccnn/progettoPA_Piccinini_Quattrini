/*
 * Rappresenta una cella della griglia di gioco.
 *
 * Ogni cella è identificata dalle proprie coordinate tridimensionali
 * e viene gestita tramite un meccanismo di istanziazione unica:
 * il metodo statico create restituisce sempre la stessa istanza
 * per coordinate equivalenti.
 *
 * Lo stato della cella (vuota, occupata, colpita o mancata) è gestito
 * separatamente dalla classe Cell, attraverso CellState e dalla
 * struttura dati utilizzata dalla griglia.
 */

import { Coordinates } from "./Coordinates";

export enum CellState {
    EMPTY = "EMPTY",
    OCCUPIED = "OCCUPIED",
    HIT = "HIT",
    MISS = "MISS"
}

export class Cell {
    private static readonly instances = new Map<string, Cell>();

    private constructor(
        public readonly coordinates: Coordinates
    ) {}

    /**
     * Restituisce l'unica Cell associata
     * alle coordinate specificate.
     */
    public static create(
        coordinates: Coordinates
    ): Cell {
        const key = coordinates.toString();

        const existing = Cell.instances.get(key);

        if (existing !== undefined) {
            return existing;
        }

        const cell = new Cell(coordinates);

        Cell.instances.set(key, cell);

        return cell;
    }

    public toString(): string {
        return `Cell${this.coordinates.toString()}`;
    }
}