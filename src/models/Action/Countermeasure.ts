import { ActionContext } from "./ActionContext";
import { IAction } from "./IAction";

export abstract class Countermeasure implements IAction {
    public abstract getCost(): number;
    public abstract execute(context: ActionContext): void;
}