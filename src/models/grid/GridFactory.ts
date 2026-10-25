/*
 * Factory responsabile della creazione delle griglie di gioco.
 *
 * Il metodo statico create riceve le dimensioni lungo i tre assi
 * e restituisce un oggetto conforme all'interfaccia Grid.
 *
 * La costruzione concreta viene delegata a MapGrid, permettendo
 * al resto dell'applicazione di utilizzare l'astrazione Grid
 * senza dipendere direttamente dalla sua implementazione.
 */
import { Grid } from "./Igrid";
import { MapGrid } from "./MapGrid";

export class GridFactory {
    public static create(
        width: number,
        height: number,
        depth: number
    ): Grid {
        return new MapGrid(
            width,
            height,
            depth
        );
    }
}