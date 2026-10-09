import { Coordinates } from "./grid/Coordinates";
import { IPlayer } from "./Players/IPlayer";


export enum ActionType {
    ATTACK = "ATTACK",
    SCAN = "SCAN",
    SHIELD = "SHIELD",
    MOVE = "MOVE",
    CANCEL_ATTACK = "CANCEL_ATTACK",
    ALTER_SCAN = "ALTER_SCAN",
    RADIO_SILENCE = "RADIO_SILENCE"
}

/*
 * Una riga dello storico della partita.
 *
 * result contiene l'esito reale (per la Scan il numero di celle).
 * hidden vale true per un attacco sotto Radio Silence: l'attaccante
 * non vede l'esito fino alla fine della partita.
 */
export interface MoveRecord {
    turn: number;
    player: IPlayer;
    type: ActionType;
    coordinates?: Coordinates;
    cost: number;
    result?: string;
    hidden: boolean;
    timestamp: Date;
}