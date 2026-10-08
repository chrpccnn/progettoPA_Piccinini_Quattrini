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