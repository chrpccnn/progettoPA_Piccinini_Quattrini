import { ActionContext } from "../ActionContext";
import { Scan } from "../BasicMove/Scan";
import { Countermeasure } from "../Countermeasure";
import { CountermeasureType } from "./CountermeasureType";


export class AlterScan extends Countermeasure {

    constructor(
        private readonly scan: Scan
    ) {
        super();
    }

    public getScan(): Scan {
        return this.scan;
    }
       public getType(): CountermeasureType {
        return CountermeasureType.ALTER_SCAN;
    }

    public getCost(): number {
        return 1;
    }

    public execute(context: ActionContext): void {

        const occupiedCells =
            this.scan.getOccupiedCells();

        const alteredResult =
            occupiedCells === 0
                ? 1
                : occupiedCells - 1;

        this.scan.setOccupiedCells(alteredResult);
    }
}