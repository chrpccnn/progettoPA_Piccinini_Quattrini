import { Game } from "../models/Engine/Game";
import { Coordinates } from "../models/grid/Coordinates";
import { Grid } from "../models/grid/Igrid";
import { ShipType } from "../models/fleet/ShipType";
import { IPlayer } from "../models/Players/IPlayer";
import { HumanPlayer } from "../models/Players/HumanPlayer";
import { MoveRecord } from "../models/MoveRecord";

export const SHIP_LETTER: Record<ShipType, string> = {
    [ShipType.MOTHER_SHIP]: "M",
    [ShipType.CRUISER]: "C",
    [ShipType.SCOUT]: "S",
    [ShipType.DRONE]: "D"
};

function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
}

/*
 * Un livello z della griglia: righe = y, colonne = x.
 */
function layerBlock(
    grid: Grid,
    z: number,
    cell: (c: Coordinates) => string
): string[] {

    const width = 3 + 2 * grid.getWidth();

    const lines = [
        `z=${z}`.padEnd(width),
        "   " + range(grid.getWidth())
            .map(x => String(x).padStart(2))
            .join("")
    ];

    for (let y = 0; y < grid.getHeight(); y++) {
        lines.push(
            String(y).padStart(2) + " " +
            range(grid.getWidth())
                .map(x => " " + cell(Coordinates.create(x, y, z)))
                .join("")
        );
    }

    return lines;
}

/*
 * Disegna tutti i livelli z, affiancati finché entrano
 * in maxWidth colonne.
 */
export function renderLayers(
    grid: Grid,
    cell: (c: Coordinates) => string,
    maxWidth: number = 110
): string {

    const blocks = range(grid.getDepth())
        .map(z => layerBlock(grid, z, cell));

    const blockWidth = blocks[0][0].length;
    const perRow = Math.max(
        1,
        Math.floor((maxWidth + 3) / (blockWidth + 3))
    );

    const out: string[] = [];

    for (let i = 0; i < blocks.length; i += perRow) {

        const chunk = blocks.slice(i, i + perRow);

        for (let line = 0; line < chunk[0].length; line++) {
            out.push(chunk.map(b => b[line]).join("   "));
        }

        out.push("");
    }

    return out.join("\n");
}

/*
 * Celle di una flotta: lettera della nave, X se colpita.
 */
export function fleetCell(
    player: IPlayer,
    shields: Coordinates[] = []
): (c: Coordinates) => string {

    const shielded = new Set(shields.map(c => c.toString()));

    const cells = new Map<string, string>();

    for (const ship of player.getFleet().getShips()) {

        const hits = new Set(
            ship.getHitPositions().map(p => p.toString())
        );

        for (const position of ship.getPositions()) {
            cells.set(
                position.toString(),
                hits.has(position.toString())
                    ? "X"
                    : SHIP_LETTER[ship.getType()]
            );
        }
    }

    /*
     * Cella con scudo: # se vuota, lettera minuscola se c'è una nave.
     */
    return c => {
        const key = c.toString();
        const base = cells.get(key);

        if (!shielded.has(key)) {
            return base ?? ".";
        }

        return base === undefined || base === "X"
            ? "#"
            : base.toLowerCase();
    };
}

/*
 * Cio' che un giocatore sa della flotta avversaria:
 * X colpo, o mancato, ? esito nascosto da radio silence.
 */
export function knowledgeCell(
    known: Map<string, string>
): (c: Coordinates) => string {

    return c => known.get(c.toString()) ?? ".";
}

export function playerName(player: IPlayer): string {

    if (player instanceof HumanPlayer) {
        return player.getUsers()[0] ?? player.getId();
    }

    return "IA";
}

export function fleetSummary(player: IPlayer): string {

    const lines: string[] = [];

    for (const ship of player.getFleet().getShips()) {

        const hits = ship.getHitPositions().length;
        const positions = ship
            .getPositions()
            .map(p => p.toString())
            .join(" ");

        lines.push(
            `  ${SHIP_LETTER[ship.getType()]} ` +
            `${ship.getId()} ${ship.getStatus()} ` +
            `colpi ${hits}/${ship.getSize()} ` +
            `${ship.getOrientation()} ${positions}`
        );
    }

    return lines.join("\n");
}

/*
 * Foto completa dello stato, per il debug.
 */
export function dumpState(game: Game): string {

    const lines: string[] = [
        `--- STATO PARTITA ${game.getId()} ---`,
        `stato: ${game.getState()}  turno: ${game.getTurn()}  ` +
        `di turno: ${playerName(game.getCurrentPlayer())}`
    ];

    const pending = game.getPendingAction();
    const pendingPlayer = game.getPendingActionPlayer();

    lines.push(
        pending === undefined || pendingPlayer === undefined
            ? "azione pending: nessuna"
            : `azione pending: ${pending.constructor.name} ` +
              `di ${playerName(pendingPlayer)}`
    );

    lines.push(
        `silence totale: ${game.getSilence()}  ` +
        `winner: ${
            game.getWinner() === undefined
                ? "-"
                : playerName(game.getWinner()!)
        }`
    );

    for (const player of game.getPlayers()) {

        const tokens =
            player instanceof HumanPlayer
                ? `  token ${player.getUser().getTokens()}`
                : "";

        lines.push(
            `\n${playerName(player)} [${player.getType()}]  ` +
            `energy ${player.getEnergy()}  ` +
            `silence usati ${game.getSilenceUsed(player)}/` +
            `${game.getSilence()}${tokens}`
        );

        lines.push(fleetSummary(player));

        const shields = game.getShields(player);

        lines.push(
            `  scudi attivi: ${
                shields.length === 0
                    ? "nessuno"
                    : shields.map(String).join(" ")
            }`
        );
    }

    const energy = game.getEnergyConfig();

    lines.push(
        `\nenergy: iniziale ${energy.initial}, massimo ${energy.max}, ` +
        `+${energy.regeneration} a turno  ` +
        `orientamenti: ${game.getAllowedOrientations().join(",")}  ` +
        `mosse registrate: ${game.getHistory().length}`
    );

    return lines.join("\n");
}

/*
 * Esiti reali degli attacchi nascosti da Radio Silence.
 */
export function hiddenResults(game: Game): MoveRecord[] {
    return game.getHistory().filter(r => r.hidden);
}