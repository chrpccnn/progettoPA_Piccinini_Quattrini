import { ActionContext } from "./ActionContext";  
import { AttackResult } from "./BasicMove/AttackResult";

export interface IAction {
    getCost(): number;
    execute(context: ActionContext): void | AttackResult  ;
}