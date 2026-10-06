export class Coordinates {
    private static readonly instances = new Map<string, Coordinates>();

    private constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly z: number
    ) {}

    /**
     * Restituisce l'unica istanza di Coordinates
     * associata alla terna x, y, z.
     */
    public static create(
        x: number,
        y: number,
        z: number
    ): Coordinates {
        Coordinates.validate(x, y, z);

        const key = Coordinates.createKey(x, y, z);

        const existing = Coordinates.instances.get(key);

        if (existing !== undefined) {
            return existing;
        }

        const coordinates = new Coordinates(x, y, z);

        Coordinates.instances.set(key, coordinates);

        return coordinates;
    }

    private static createKey(
        x: number,
        y: number,
        z: number
    ): string {
        return `${x}:${y}:${z}`;
    }

    private static validate(
        x: number,
        y: number,
        z: number
    ): void {
        if (!Number.isInteger(x) ||
            !Number.isInteger(y) ||
            !Number.isInteger(z)) {
            throw new Error(
                "Coordinates must be integers."
            );
        }
    }

    public equals(other: Coordinates): boolean {
        return (
            this.x === other.x &&
            this.y === other.y &&
            this.z === other.z
        );
    }

    public toString(): string {
        return `(${this.x}, ${this.y}, ${this.z})`;
    }
}