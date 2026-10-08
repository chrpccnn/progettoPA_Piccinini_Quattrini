import { Ship } from "../../fleet/Ship";
import { ShipType } from "../../fleet/ShipType";
import { Coordinates } from "../../grid/Coordinates";
import { ActionContext } from "../ActionContext";
import { BasicMove } from "../BasicMove";

export class Move extends BasicMove {

    constructor(
        private readonly ship: Ship,
        private readonly destination: Coordinates
    ) {
        super();
    }

    public getShip(): Ship {
        return this.ship;
    }

    public getDestination(): Coordinates {
        return this.destination;
    }

    public getCost(): number {
        return 2;
    }

    public execute(
        context: ActionContext
    ): void {

        const game = context.game;
        const grid = game.getGrid();
        const player = context.player;

        /*
         * La destinazione deve essere dentro il grid.
         */
        if (!grid.isValid(this.destination)) {
            throw new Error(
                "Destination is outside the grid."
            );
        }

        /*
         * Solo Scout e Drone possono muoversi.
         */
        const type = this.ship.getType();

        if (
            type !== ShipType.SCOUT &&
            type !== ShipType.DRONE
        ) {
            throw new Error(
                "Only Scout and Drone ships can move."
            );
        }

        /*
         * La nave deve appartenere al giocatore
         * che sta eseguendo la Move.
         */
        const playerShip = player
            .getFleet()
            .getShipById(this.ship.getId());

        if (playerShip === undefined) {
            throw new Error(
                "The ship does not belong to the player."
            );
        }

        /*
         * Una nave già colpita non può muoversi.
         */
        if (this.ship.isHit()) {
            throw new Error(
                "A ship that has been hit cannot move."
            );
        }

        const currentPositions =
            this.ship.getPositions();

        if (currentPositions.length === 0) {
            throw new Error(
                "The ship has no positions."
            );
        }

        /*
         * La destinazione rappresenta lo spostamento
         * dell'intera nave di una cella.
         */
        const origin = currentPositions[0];

        const deltaX =
            this.destination.x - origin.x;

        const deltaY =
            this.destination.y - origin.y;

        const deltaZ =
            this.destination.z - origin.z;

        /*
         * Deve essere un movimento di una sola cella
         * lungo uno dei tre assi.
         */
        const distance =
            Math.abs(deltaX) +
            Math.abs(deltaY) +
            Math.abs(deltaZ);

        if (distance !== 1) {
            throw new Error(
                "A ship can move only one cell at a time."
            );
        }

        /*
         * Manteniamo la stessa forma della nave
         * spostando tutte le sue coordinate dello
         * stesso delta.
         */
        const newPositions =
            currentPositions.map(position =>
                Coordinates.create(
                    position.x + deltaX,
                    position.y + deltaY,
                    position.z + deltaZ
                )
            );

        /*
         * Controlliamo che tutte le nuove posizioni
         * siano dentro il grid.
         */
        for (const position of newPositions) {

            if (!grid.isValid(position)) {
                throw new Error(
                    "The ship cannot move outside the grid."
                );
            }
        }

        /*
         * Controlliamo le collisioni con le altre navi
         * della flotta.
         */
        const ships =
            player.getFleet().getShips();

        for (const otherShip of ships) {

            if (otherShip.getId() === this.ship.getId()) {
                continue;
            }

            const otherPositions =
                otherShip.getPositions();

            for (const newPosition of newPositions) {

                const collision =
                    otherPositions.some(
                        position =>
                            position.equals(newPosition)
                    );

                if (collision) {
                    throw new Error(
                        "The destination is occupied by another ship."
                    );
                }
            }
        }

        /*
         * Se tutti i controlli sono passati,
         * spostiamo realmente la nave.
         */
        this.ship.moveTo(newPositions);
    }
}