import { ActionContext } from "./ActionContext";
import { IAction } from "./IAction";

export abstract class Countermeasure implements IAction {
    getCost(): number {
        throw new Error("Method not implemented.");
    }
    public abstract execute(context: ActionContext): void;
}