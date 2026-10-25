/*
 * Questa classe implementa la contromisura AlterScan,
 * che modifica il risultato di un'azione di scansione
 * effettuata tramite la classe Scan.
 *
 * AlterScan estende Countermeasure e riceve nel costruttore
 * il riferimento alla scansione da alterare. Il costo della
 * contromisura è pari a 1 e il tipo restituito è
 * CountermeasureType.ALTER_SCAN.
 *
 * Durante l'esecuzione, viene letto il numero di celle
 * occupate rilevato dalla scansione. Se il risultato
 * originale è zero, viene modificato in uno; in caso
 * contrario, il valore viene diminuito di una unità.
 *
 * Il risultato modificato viene salvato direttamente
 * nell'oggetto Scan attraverso il metodo setOccupiedCells,
 * rendendo così visibile la modifica quando si consulta
 * successivamente il risultato della scansione.
 *
 * Il metodo getScan consente di recuperare il riferimento
 * alla scansione associata alla contromisura.
 */
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