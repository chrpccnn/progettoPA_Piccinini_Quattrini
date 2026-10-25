/*
 * Questa classe implementa l'azione di attivazione di uno
 * scudo su una specifica cella della griglia di gioco.
 *
 * Shield estende BasicMove e riceve nel costruttore
 * le coordinate da proteggere. Il costo dell'azione è pari
 * a 2.
 *
 * Durante l'esecuzione, viene verificato che le coordinate
 * siano valide all'interno della griglia. Se il controllo
 * viene superato, lo scudo viene aggiunto alla partita
 * per proteggere la cella indicata del giocatore che
 * ha eseguito l'azione.
 *
 * Lo scudo è progettato per assorbire un singolo attacco
 * sulla cella protetta, dopodiché viene consumato dalla
 * logica di gestione degli scudi della partita.
 *
 * L'attributo active registra se l'azione è stata eseguita
 * correttamente e lo scudo è stato attivato. Il suo stato
 * può essere consultato attraverso il metodo isActive.
 *
 * Se le coordinate non appartengono alla griglia, viene
 * sollevata un'eccezione e lo scudo non viene attivato.
 */
import { Coordinates } from "../../grid/Coordinates";
import { ActionContext } from "../ActionContext";
import { BasicMove } from "../BasicMove";

export class Shield extends BasicMove {

    private active: boolean = false;

    constructor(
        private readonly coordinates: Coordinates
    ) {
        super();
    }

    public getCoordinates(): Coordinates {
        return this.coordinates;
    }

    public getCost(): number {
        return 2;
    }

    public execute(
        context: ActionContext
    ): void {

        const grid = context.game.getGrid();

        if (!grid.isValid(this.coordinates)) {
            throw new Error(
                "Shield coordinates are outside the grid."
            );
        }

        /*
         * Lo scudo protegge la cella del giocatore che lo attiva
         * finché non assorbe un colpo. Al massimo uno per cella.
         */
        context.game.addShield(
            context.player,
            this.coordinates
        );

        this.active = true;
    }

    public isActive(): boolean {
        return this.active;
    }
}