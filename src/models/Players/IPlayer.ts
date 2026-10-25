/*
 * Definisce il contratto comune per tutti i giocatori della partita,
 * indipendentemente dal fatto che siano controllati da un utente
 * umano o dall'intelligenza artificiale.
 *
 * Espone le operazioni per consultare identità, tipo, flotta e risorse,
 * modificare l'energia e delegare al motore di gioco l'esecuzione
 * delle mosse e delle contromisure.
 *
 * Consente a GameEngine e alle altre componenti del sistema di lavorare
 * con un'astrazione comune senza dipendere dalla classe concreta
 * del giocatore.
 */
import { IAction } from "../Action/IAction";
import { Countermeasure } from "../Action/Countermeasure";
import { Fleet } from "../fleet/Fleet";
import { Game } from "../Engine/Game";
import { GameEngine } from "../Engine/GameEngine";
import { PlayerType } from "./PlayerType";

export interface IPlayer {
    getId(): string;
    getType(): PlayerType;
    getFleet(): Fleet;
    getEnergy(): number;
    getCredits(): number;
    getUsers(): string[];

    spendEnergy(amount: number): void;
    addEnergy(amount: number, max: number): void;

    makeMove(
        game: Game,
        engine: GameEngine,
        action: IAction
    ): void;

    makeCounterMeasure(
        game: Game,
        engine: GameEngine,
        countermeasure: Countermeasure
    ): void;
}