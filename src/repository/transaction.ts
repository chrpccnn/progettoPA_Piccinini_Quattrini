import { Transaction } from "sequelize";
import sequelize from "../config/database";

export type DbTransaction = Transaction;

/*
 * Esegue "work" in una transazione: se la funzione termina senza errori
 * si fa commit, se lancia un'eccezione si fa rollback e l'errore risale.
 *
 * Serve ai Service per rendere atomiche operazioni che toccano piu'
 * tabelle (es. addebito dei TOKEN + creazione della partita) senza dover
 * importare direttamente Sequelize.
 */
export function withTransaction<T>(
    work: (transaction: DbTransaction) => Promise<T>
): Promise<T> {
    return sequelize.transaction(work);
}
