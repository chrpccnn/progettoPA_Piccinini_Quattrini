import { Coordinates } from "../../grid/Coordinates";
import { ActionContext } from "../ActionContext";
import { BasicMove } from "../BasicMove";
import { AttackResult } from "./AttackResult";

export class Attack extends BasicMove {

    constructor(
        private readonly coordinates: Coordinates
    ) {
        super();
    }

    public getCoordinates(): Coordinates {
        return this.coordinates;
    }

    public getCost(): number {
        return 1;
    }

    public execute(
        context: ActionContext
    ): AttackResult {

        const players = context.game.getPlayers();

        const opponent = players.find(
            player => player !== context.player
        );

        if (opponent === undefined) {
            throw new Error("Opponent not found.");
        }

        /*
         * Uno scudo sulla cella assorbe il primo colpo (nessun danno
         * alla nave) e poi viene rimosso.
         */
        if (context.game.consumeShield(opponent, this.coordinates)) {
            return AttackResult.SHIELDED;
        }

        const fleet = opponent.getFleet();

        for (const ship of fleet.getShips()) {

            const positions = ship.getPositions();

            const isOccupied = positions.some(
                position => position.equals(this.coordinates)
            );

            if (!isOccupied) {
                continue;
            }

            ship.hit(this.coordinates);

            if (ship.isDestroyed()) {

                if (fleet.isAllDestroyed()) {
                    return AttackResult.GAME_OVER;
                }

                return AttackResult.DESTROYED;
            }

            return AttackResult.HIT;
        }

        return AttackResult.MISS;
    }
}