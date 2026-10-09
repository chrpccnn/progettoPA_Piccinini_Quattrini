import { ShipType } from "./ShipType";

/*
 * Quante navi di ogni tipo schierare in partita.
 * La lunghezza dipende dal tipo, quindi scegliere
 * "quante navi di che lunghezza" significa scegliere
 * quante navi di ciascun tipo.
 */
export type FleetConfig = Record<ShipType, number>;

/* Lunghezza (numero di celle) di ogni tipo di nave. */
export const SHIP_SIZES: Readonly<Record<ShipType, number>> = {
    [ShipType.MOTHER_SHIP]: 5,
    [ShipType.CRUISER]: 4,
    [ShipType.SCOUT]: 2,
    [ShipType.DRONE]: 1
};

/* Numero massimo di navi per tipo che una flotta può contenere. */
export const MAX_SHIPS: Readonly<Record<ShipType, number>> = {
    [ShipType.MOTHER_SHIP]: 3,
    [ShipType.CRUISER]: 3,
    [ShipType.SCOUT]: 4,
    [ShipType.DRONE]: 5
};

export const DEFAULT_FLEET_CONFIG: Readonly<FleetConfig> = {
    [ShipType.MOTHER_SHIP]: 1,
    [ShipType.CRUISER]: 1,
    [ShipType.SCOUT]: 2,
    [ShipType.DRONE]: 2
};

/*
 * Una flotta valida ha almeno una nave per tipo
 * (stessa regola di Fleet.isValid) e non supera i massimi.
 */
export function validateFleetConfig(config: FleetConfig): void {

    for (const type of Object.values(ShipType)) {

        const count = config[type];

        if (!Number.isInteger(count) || count < 1) {
            throw new Error(
                `${type}: serve almeno una nave.`
            );
        }

        if (count > MAX_SHIPS[type]) {
            throw new Error(
                `${type}: massimo ${MAX_SHIPS[type]} navi.`
            );
        }
    }
}