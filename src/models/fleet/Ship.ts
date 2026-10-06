import { ShipType } from "./ShipType";
import { Orientation } from "./Orientation";
import { ShipStatus } from "./ShipStatus";
import { Coordinates } from "../grid/Coordinates";

export class Ship {

    private readonly hitPositions: Set<Coordinates>;

    constructor(
        private readonly id: string,
        private readonly type: ShipType,
        private readonly size: number,
        private readonly orientation: Orientation,
        private readonly positions: Coordinates[],
        private status: ShipStatus = ShipStatus.INTACT
    ) {
        this.validateSize();
        this.validatePositions();

        this.hitPositions = new Set<Coordinates>();
    }

    public getId(): string {
        return this.id;
    }

    public getType(): ShipType {
        return this.type;
    }

    public getSize(): number {
        return this.size;
    }

    public getOrientation(): Orientation {
        return this.orientation;
    }

    public getPositions(): Coordinates[] {
        return [...this.positions];
    }

    public getStatus(): ShipStatus {
        return this.status;
    }

    public getHitPositions(): Coordinates[] {
        return [...this.hitPositions];
    }

    public isHit(): boolean {
        return this.hitPositions.size > 0;
    }

    public isDestroyed(): boolean {
        return this.status === ShipStatus.DESTROYED;
    }

    public hit(position: Coordinates): void {

        if (!this.positions.some(
            currentPosition =>
                currentPosition.equals(position)
        )) {
            throw new Error(
                "The position does not belong to this ship."
            );
        }

        if (this.status === ShipStatus.DESTROYED) {
            return;
        }

        if (this.hitPositions.has(position)) {
            return;
        }

        this.hitPositions.add(position);

        if (
            this.hitPositions.size ===
            this.positions.length
        ) {
            this.status = ShipStatus.DESTROYED;
            return;
        }

        this.status = ShipStatus.DAMAGED;
    }

    public moveTo(
        positions: Coordinates[]
    ): void {

        if (positions.length !== this.size) {
            throw new Error(
                "The number of positions must match the ship size."
            );
        }

        const uniquePositions =
            new Set(positions);

        if (
            uniquePositions.size !==
            positions.length
        ) {
            throw new Error(
                "A ship cannot occupy the same position more than once."
            );
        }

        this.positions.splice(
            0,
            this.positions.length,
            ...positions
        );
    }

    private validateSize(): void {

        const expectedSize =
            Ship.getSizeForType(this.type);

        if (this.size !== expectedSize) {
            throw new Error(
                `Ship type ${this.type} must have size ${expectedSize}.`
            );
        }
    }

    private validatePositions(): void {

        if (this.positions.length !== this.size) {
            throw new Error(
                "The number of positions must match the ship size."
            );
        }

        const uniquePositions =
            new Set(this.positions);

        if (
            uniquePositions.size !==
            this.positions.length
        ) {
            throw new Error(
                "A ship cannot occupy the same position more than once."
            );
        }
    }

    private static getSizeForType(
        type: ShipType
    ): number {

        const sizes: Record<ShipType, number> = {

            [ShipType.MOTHER_SHIP]: 5,

            [ShipType.CRUISER]: 4,

            [ShipType.SCOUT]: 2,

            [ShipType.DRONE]: 1
        };

        return sizes[type];
    }
}