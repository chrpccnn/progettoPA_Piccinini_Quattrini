/*
 * Questa classe implementa la contromisura RadioSilence,
 * associata a una specifica azione di attacco.
 *
 * RadioSilence estende Countermeasure e riceve nel
 * costruttore il riferimento all'azione Attack interessata.
 * Il costo della contromisura è pari a 2 e il tipo restituito
 * è CountermeasureType.RADIO_SILENCE.
 *
 * Durante l'esecuzione, la classe esegue l'attacco associato
 * tramite il metodo execute dell'oggetto Attack e ne salva
 * il risultato nell'attributo result.
 *
 * Il risultato può essere recuperato successivamente
 * attraverso il metodo getResult, che restituisce un valore
 * di tipo AttackResult oppure undefined se non è ancora
 * stato registrato alcun risultato.
 *
 * Questa struttura consente di mantenere un riferimento
 * all'esito dell'attacco associato alla contromisura.
 */
import { ActionContext } from "../ActionContext";
import { Attack } from "../BasicMove/Attack";
import { AttackResult } from "../BasicMove/AttackResult";
import { Countermeasure } from "../Countermeasure";
import { CountermeasureType } from "./CountermeasureType";

export class RadioSilence extends Countermeasure {

    private result?: AttackResult;

    constructor(
        private readonly attack: Attack
    ) {
        super();
    }

    public getAttack(): Attack {
        return this.attack;
    }

    public getType(): CountermeasureType {
        return CountermeasureType.RADIO_SILENCE;
    }

    public getCost(): number {
        return 2;
    }

    public execute(
        context: ActionContext
    ): void {
        this.result = this.attack.execute(context);
    }

    public getResult(): AttackResult | undefined {
        return this.result;
    }
}