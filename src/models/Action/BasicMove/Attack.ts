/*
 * Questa classe implementa l'azione di attacco di una nave
 * all'interno del gioco Space Battleship 3D.
 *
 * Attack estende BasicMove e rappresenta un'azione associata
 * a una specifica coordinata della griglia. Il costo
 * dell'azione è pari a 1.
 *
 * Durante l'esecuzione, viene individuato il giocatore
 * avversario e verificato se la coordinata scelta è protetta
 * da uno scudo. Se lo scudo è presente, assorbe il colpo
 * e viene consumato, senza provocare danni alla nave.
 *
 * Se la cella non è protetta, l'azione controlla le posizioni
 * delle navi avversarie per determinare l'esito dell'attacco.
 * In base al risultato, restituisce MISS se non viene colpita
 * alcuna nave, HIT se una nave viene colpita, DESTROYED se
 * una nave viene distrutta oppure GAME_OVER se tutte le navi
 * della flotta avversaria risultano distrutte.
 *
 * Se non viene trovato un avversario, viene sollevata
 * un'eccezione.
 */
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