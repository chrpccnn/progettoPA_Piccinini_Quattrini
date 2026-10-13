/*
 * Script di seed: inizializza il database con gli utenti di partenza.
 *
 *   npm run seed            (dopo npm run build)
 *   npx ts-node src/seeds/seed.ts
 *
 * E' idempotente: se un utente esiste gia' (stessa email) non viene
 * toccato, quindi rilanciarlo non azzera i TOKEN residui.
 * Il saldo iniziale e' quello richiesto dalla specifica ("valore iniziale
 * impostato nel seed del database").
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import sequelize from "../config/database";

import { UserRole, UserType } from "../models/UserType";
import { User } from "../models/db";

interface SeedUser {
    email: string;
    password: string;
    role: UserRole;
    type: UserType;
    tokens: number;
}

/*
 * Le password rispettano le regole di pwSchema (maiuscola, minuscola,
 * numero e carattere speciale). Possono essere cambiate da .env.
 */
const SEED_USERS: SeedUser[] = [
    {
        email: process.env.SEED_ADMIN_EMAIL || "admin@battleship.local",
        password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
        role: UserRole.ADMIN,
        type: UserType.ADMIN,
        tokens: 100
    },
    {
        email: "player1@battleship.local",
        password: process.env.SEED_USER_PASSWORD || "Player123!",
        role: UserRole.USER,
        type: UserType.PLAYER,
        tokens: 10
    },
    {
        email: "player2@battleship.local",
        password: process.env.SEED_USER_PASSWORD || "Player123!",
        role: UserRole.USER,
        type: UserType.PLAYER,
        tokens: 10
    },
    {
        // senza credito: serve per provare la risposta 401
        email: "broke@battleship.local",
        password: process.env.SEED_USER_PASSWORD || "Player123!",
        role: UserRole.USER,
        type: UserType.PLAYER,
        tokens: 0
    }
];

async function seed(): Promise<void> {

    await sequelize.authenticate();
    await sequelize.sync();

    for (const item of SEED_USERS) {

        const [user, created] = await User.findOrCreate({
            where: { email: item.email },
            defaults: {
                email: item.email,
                password: await bcrypt.hash(item.password, 10),
                role: item.role,
                type: item.type,
                tokens: item.tokens
            }
        });

        console.log(
            `${created ? "creato " : "esiste "} ${user.email} ` +
            `(${user.role}, token ${user.getTokens()})`
        );
    }
}

seed()
    .then(() => sequelize.close())
    .catch(async error => {
        console.error("Seed fallito:", error);
        await sequelize.close();
        process.exit(1);
    });
