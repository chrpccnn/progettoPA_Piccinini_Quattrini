/*
 * Servizio applicativo responsabile della ricarica dei TOKEN
 * associati a un utente.
 *
 * Recupera l'utente tramite email, segnala un errore se non esiste
 * e delega al repository l'incremento del saldo.
 *
 * Se l'aggiornamento va a buon fine, restituisce un messaggio
 * di conferma insieme all'email e al nuovo saldo dell'utente.
 *
 * La classe separa la logica applicativa della ricarica
 * dall'accesso diretto ai dati persistenti.
 */
import { ErrorFactory } from "../errors/ErrorFactory";
import UserRepository from "../repository/authRepository";
import { MailSchema } from "../Zod/zodSchemas";

export class RefillService {

    static async refill(
        email: MailSchema,
        tokens: number
    ) {
        const user = await UserRepository.findByEmail(email);

        if (!user) {
            throw ErrorFactory.userNotFound();
        }

        const updated = await UserRepository.incrementTokens(
            user.id,
            tokens
        );

        if (!updated) {
            throw ErrorFactory.userNotFound();
        }

        return {
            message: "Tokens refilled successfully",
            user: {
                email: updated.email,
                tokens: updated.getTokens()
            }
        };
    }
}
