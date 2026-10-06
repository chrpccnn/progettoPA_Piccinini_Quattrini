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