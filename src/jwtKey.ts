/*
 * Fornisce le funzioni di accesso alle chiavi crittografiche
 * utilizzate per la gestione dei token JWT.
 *
 * La chiave privata viene letta dalla variabile d'ambiente
 * JWT_PRIVATE_KEY, mentre la chiave pubblica viene caricata
 * dal file jwtRS256.key.pub nella directory di lavoro del processo.
 *
 * Se la chiave privata non è configurata, la funzione genera
 * un errore. Eventuali problemi di lettura del file della chiave
 * pubblica vengono propagati dal modulo fs.
 */
import fs from "fs";
import path from "path";

export function getPrivateKey(): string {
    const key = process.env.JWT_PRIVATE_KEY;

    if (!key) {
        throw new Error("JWT private key not configured");
    }

    return key.replace(/\\n/g, "\n");
}

export function getPublicKey(): string {
    const publicKeyPath = path.resolve(
        process.cwd(),
        "jwtRS256.key.pub"
    );

    return fs.readFileSync(publicKeyPath, "utf8");
}