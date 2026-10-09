import { Game } from "./Game";
import { IPlayer } from "../Players/IPlayer";

/*
 * Storico della partita in CSV.
 *
 * Con viewer l'esito nascosto da Radio Silence compare come HIDDEN
 * per l'attaccante finché la partita non è finita; senza viewer
 * (debug, admin) compare l'esito reale.
 */
export function historyToCsv(
    game: Game,
    viewer?: IPlayer
): string {

    const rows = [
        "turn,player,action,x,y,z,energyCost,result,timestamp"
    ];

    for (const record of game.getHistory()) {

        const c = record.coordinates;

        rows.push([
            record.turn,
            record.player.getId(),
            record.type,
            c?.x ?? "",
            c?.y ?? "",
            c?.z ?? "",
            record.cost,
            game.getVisibleResult(record, viewer) ?? "",
            record.timestamp.toISOString()
        ].join(","));
    }

    return rows.join("\n");
}