import { Ship } from "./Ship";
import { MAX_SHIPS } from "./FleetConfig";
import { ShipType } from "./ShipType";

export class Fleet {

    private readonly ships: Ship[] = [];

    constructor(
        private readonly id: string
    ) {}

    public getId(): string {
        return this.id;
    }

    public getShips(): Ship[] {
        return [...this.ships];
    }

    public addShip(ship: Ship): void {

        if (
            this.getShipById(ship.getId()) !== undefined
        ) {
            throw new Error(
                `Ship with id ${ship.getId()} already exists.`
            );
        }

        if (!this.isValidShipType(ship)) {
            throw new Error(
                `Maximum number of ${ship.getType()} ships reached.`
            );
        }

        this.ships.push(ship);
    }

    public removeShip(shipId: string): void {

        const index = this.ships.findIndex(
            ship => ship.getId() === shipId
        );

        if (index === -1) {
            throw new Error(
                `Ship with id ${shipId} not found.`
            );
        }

        this.ships.splice(index, 1);
    }

    public getShipById(
        shipId: string
    ): Ship | undefined {

        return this.ships.find(
            ship => ship.getId() === shipId
        );
    }

    public isValid(): boolean {

        /*
         * Una flotta valida deve contenere
         * almeno una nave per ogni categoria.
         */
        return (
            this.countShips(ShipType.MOTHER_SHIP) >= 1 &&
            this.countShips(ShipType.CRUISER) >= 1 &&
            this.countShips(ShipType.SCOUT) >= 1 &&
            this.countShips(ShipType.DRONE) >= 1
        );
    }

    public isAllDestroyed(): boolean {

        return (
            this.ships.length > 0 &&
            this.ships.every(
                ship => ship.isDestroyed()
            )
        );
    }

    public countShipType(
        type: ShipType
    ): number {

        return this.countShips(type);
    }

    private countShips(
        type: ShipType
    ): number {

        return this.ships.filter(
            ship => ship.getType() === type
        ).length;
    }

    private isValidShipType(
        ship: Ship
    ): boolean {

        const type = ship.getType();

        return this.countShips(type) < MAX_SHIPS[type];
    }
}