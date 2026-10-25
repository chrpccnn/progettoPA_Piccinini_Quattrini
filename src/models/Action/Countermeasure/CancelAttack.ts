/*
 * Questa classe implementa la contromisura CancelAttack,
 * progettata per annullare l'effetto di un'azione di attacco.
 *
 * CancelAttack estende Countermeasure e riceve nel
 * costruttore il riferimento all'azione Attack da annullare.
 * Il costo della contromisura è pari a 2 e il tipo restituito
 * è CountermeasureType.CANCEL_ATTACK.
 *
 * Quando la contromisura viene eseguita, non viene eseguito
 * direttamente l'attacco associato. Viene invece restituito
 * il risultato AttackResult.BLOCKER, che rappresenta
 * l'annullamento dell'attacco.
 *
 * Il metodo getAttack permette di recuperare l'azione
 * Attack a cui la contromisura è associata.
 */
import { ActionContext } from "../ActionContext";
import { Countermeasure } from "../Countermeasure";
import { AttackResult } from "../BasicMove/AttackResult";
import { Attack } from "../BasicMove/Attack";
import { CountermeasureType } from "./CountermeasureType";

export class CancelAttack extends Countermeasure {

    constructor(
        private readonly attack: Attack
    ) {
        super();
    }

    public getAttack(): Attack {
        return this.attack;
    }

    public getType(): CountermeasureType {
        return CountermeasureType.CANCEL_ATTACK;
    }

    public getCost(): number {
        return 2;
    }

    public execute(
        context: ActionContext
    ): AttackResult {
        return AttackResult.BLOCKER;
    }
}