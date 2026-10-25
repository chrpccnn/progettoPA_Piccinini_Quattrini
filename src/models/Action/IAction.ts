/*
 * Questa interfaccia definisce il contratto comune a tutte
 * le azioni eseguibili all'interno del gioco.
 *
 * Ogni classe che implementa IAction deve fornire il metodo
 * getCost, che restituisce il costo necessario per eseguire
 * l'azione, e il metodo execute, che ne definisce il
 * comportamento nel contesto della partita.
 *
 * Il metodo execute riceve un ActionContext, utilizzato
 * per accedere alle informazioni relative al gioco e
 * al giocatore che sta eseguendo l'azione.
 *
 *
 * IAction costituisce quindi l'astrazione comune che
 * consente al sistema di trattare in modo uniforme
 * le diverse tipologie di azioni e contromisure.
 */
import { ActionContext } from "./ActionContext";  
import { AttackResult } from "./BasicMove/AttackResult";

export interface IAction {
    getCost(): number;
    execute(context: ActionContext): void | AttackResult  ;
}