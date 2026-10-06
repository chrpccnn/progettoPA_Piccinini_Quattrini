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

    public equals(other: Cell): boolean {
        return this.coordinates.equals(other.coordinates);
    }

    public toString(): string {
        return `Cell${this.coordinates.toString()}`;
    }
}