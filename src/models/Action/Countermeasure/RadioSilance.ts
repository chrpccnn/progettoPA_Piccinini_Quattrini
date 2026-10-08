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