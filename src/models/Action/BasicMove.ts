/*
 * Questa classe astratta definisce la struttura comune
 * a tutte le azioni di movimento di base del gioco.
 *
 * BasicMove implementa l'interfaccia IAction e stabilisce
 * due operazioni che ogni classe concreta deve fornire:
 * getCost, per ottenere il costo dell'azione, ed execute,
 * per eseguire l'azione nel contesto della partita.
 *
 * Il metodo execute riceve un ActionContext, che fornisce
 * le informazioni necessarie per applicare l'azione
 * al giocatore e alla partita correnti.
 *
 * Il metodo può non restituire alcun valore oppure
 * restituire un risultato di tipo AttackResult, consentendo
 * alle azioni che producono un esito specifico, come Attack,
 * di comunicarlo al sistema di gioco.
 *
 */
import { ActionContext } from "./ActionContext";
import { AttackResult } from "./BasicMove/AttackResult";
import { IAction } from "./IAction";

export abstract class BasicMove implements IAction {

    public abstract getCost(): number;

 public abstract execute(
        context: ActionContext
    ): void |AttackResult;
}