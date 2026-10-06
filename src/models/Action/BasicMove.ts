import { ActionContext } from "./ActionContext";
import { AttackResult } from "./BasicMove/AttackResult";
import { IAction } from "./IAction";

export abstract class BasicMove implements IAction {

    public abstract getCost(): number;

 public abstract execute(
        context: ActionContext
    ): void |AttackResult;
}