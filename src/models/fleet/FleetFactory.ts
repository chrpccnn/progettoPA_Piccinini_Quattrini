import { Coordinates } from "../grid/Coordinates";
import { Grid } from "../grid/Igrid";
import { Fleet } from "./Fleet";
import {
    FleetConfig,
    SHIP_SIZES,
    validateFleetConfig
} from "./FleetConfig";
import { Orientation } from "./Orientation";
import { Ship } from "./Ship";
import { ShipType } from "./ShipType";

/*
 * Direzione di sviluppo di una nave per ogni orientamento.
 */
const DIRECTIONS: Record<Orientation, [number, number, number]> = {
    [Orientation.HORIZONTAL]: [1, 0, 0],
    [Orientation.VERTICAL]: [0, 1, 0],
    [Orientation.DEPTH]: [0, 0, 1]
};

export class FleetFactory {

    private static readonly MAX_ATTEMPTS = 2000;

    /*
     * Crea una flotta piazzando le navi in modo casuale,
     * senza sovrapposizioni, usando solo gli orientamenti consentiti.
     * Le navi più lunghe vengono piazzate per prime.
     */
    public static create(
        fleetId: string,
        config: FleetConfig,
        grid: Grid,
        allowedOrientations: Orientation[] =
            Object.values(Orientation),
        random: () => number = Math.random
    ): Fleet {

        validateFleetConfig(config);

        if (allowedOrientations.length === 0) {
            throw new Error(
                "Serve almeno un orientamento consentito."
            );
        }

        const types = Object.values(ShipType).sort(
            (a, b) => SHIP_SIZES[b] - SHIP_SIZES[a]
        );

        const totalCells = types.reduce(
            (sum, type) =>
                sum + config[type] * SHIP_SIZES[type],
            0
        );

        const gridCells =
            grid.getWidth() *
            grid.getHeight() *
            grid.getDepth();

        if (totalCells > gridCells) {
            throw new Error(
                "La griglia è troppo piccola per questa flotta."
            );
        }

        const fleet = new Fleet(fleetId);
        const occupied = new Set<Coordinates>();

        for (const type of types) {
            for (let n = 1; n <= config[type]; n++) {

                const placed = FleetFactory.place(
                    `${fleetId}-${type}-${n}`,
                    type,
                    grid,
                    allowedOrientations,
                    occupied,
                    random
                );

                fleet.addShip(placed);
            }
        }

        return fleet;
    }

    private static place(
        id: string,
        type: ShipType,
        grid: Grid,
        orientations: Orientation[],
        occupied: Set<Coordinates>,
        random: () => number
    ): Ship {

        const size = SHIP_SIZES[type];

        for (
            let attempt = 0;
            attempt < FleetFactory.MAX_ATTEMPTS;
            attempt++
        ) {

            const orientation =
                orientations[
                    Math.floor(random() * orientations.length)
                ];

            const [dx, dy, dz] = DIRECTIONS[orientation];

            /*
             * Numero di punti di partenza possibili su ogni asse
             * perché la nave resti dentro la griglia.
             */
            const rangeX = grid.getWidth() - (size - 1) * dx;
            const rangeY = grid.getHeight() - (size - 1) * dy;
            const rangeZ = grid.getDepth() - (size - 1) * dz;

            if (rangeX <= 0 || rangeY <= 0 || rangeZ <= 0) {
                continue;
            }

            const x = Math.floor(random() * rangeX);
            const y = Math.floor(random() * rangeY);
            const z = Math.floor(random() * rangeZ);

            const positions: Coordinates[] = [];

            for (let i = 0; i < size; i++) {
                positions.push(
                    Coordinates.create(
                        x + i * dx,
                        y + i * dy,
                        z + i * dz
                    )
                );
            }

            if (positions.some(p => occupied.has(p))) {
                continue;
            }

            positions.forEach(p => occupied.add(p));

            return new Ship(
                id,
                type,
                size,
                orientation,
                positions
            );
        }

        throw new Error(
            `Impossibile piazzare ${type}: griglia troppo affollata ` +
            `o orientamenti troppo restrittivi.`
        );
    }
}