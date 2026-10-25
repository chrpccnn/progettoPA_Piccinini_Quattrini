/*
 * Questa classe astratta definisce la struttura comune
 * alle contromisure disponibili nel gioco.
 *
 * Countermeasure implementa l'interfaccia IAction e richiede
 * a ogni classe concreta di specificare il costo della
 * contromisura attraverso getCost e il comportamento
 * da eseguire attraverso execute.
 *
 * Il metodo execute riceve un ActionContext, che contiene
 * il contesto della partita e il giocatore che sta
 * eseguendo l'azione.
 *
 * La classe fornisce una struttura comune alle diverse
 * contromisure, come CancelAttack, AlterScan e RadioSilence,
 * lasciando a ciascuna implementazione la responsabilità
 * di definire il proprio effetto specifico.
 */
import { ActionContext } from "./ActionContext";
import { IAction } from "./IAction";

export abstract class Countermeasure implements IAction {
    public abstract getCost(): number;
    public abstract execute(context: ActionContext): void;
}