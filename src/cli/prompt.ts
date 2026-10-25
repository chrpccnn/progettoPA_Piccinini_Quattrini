import * as readline from "node:readline";
import { Coordinates } from "../models/grid/Coordinates";
import { Grid } from "../models/grid/Igrid";

export interface Option<T> {
    label: string;
    value: T;
}

/*
 * Gestisce l'acquisizione e la validazione degli input da terminale.
 *
 * Mantiene in coda le righe ricevute prima che una richiesta
 * sia in attesa, così da supportare sia l'interazione diretta
 * sia l'input reindirizzato da pipe nei test automatici.
 *
 * Fornisce metodi per leggere stringhe, numeri interi, conferme,
 * scelte da menu e coordinate valide rispetto a una griglia.
 */
export class Prompt {

    private readonly rl: readline.Interface;
    private readonly lines: string[] = [];
    private waiting?: (line: string) => void;

    constructor() {

        this.rl = readline.createInterface({
            input: process.stdin
        });

        this.rl.on("line", line => {
            if (this.waiting !== undefined) {
                const resolve = this.waiting;
                this.waiting = undefined;
                resolve(line);
            } else {
                this.lines.push(line);
            }
        });

        this.rl.on("close", () => {
            if (this.waiting !== undefined) {
                console.log("\nInput terminato, esco.");
                process.exit(0);
            }
        });
    }

    public async ask(question: string): Promise<string> {

        process.stdout.write(question);

        const next = this.lines.shift();

        if (next !== undefined) {
            return next.trim();
        }

        const line = await new Promise<string>(resolve => {
            this.waiting = resolve;
        });

        return line.trim();
    }

    public async int(
        question: string,
        min: number,
        max: number,
        def?: number
    ): Promise<number> {

        const hint =
            def !== undefined
                ? ` [${min}-${max}, default ${def}]`
                : ` [${min}-${max}]`;

        while (true) {

            const answer = await this.ask(`${question}${hint}: `);

            if (answer === "" && def !== undefined) {
                return def;
            }

            const value = Number(answer);

            if (
                answer !== "" &&
                Number.isInteger(value) &&
                value >= min &&
                value <= max
            ) {
                return value;
            }

            console.log(
                `Inserisci un numero intero tra ${min} e ${max}.`
            );
        }
    }

    public async confirm(
        question: string,
        def: boolean
    ): Promise<boolean> {

        while (true) {

            const answer = (
                await this.ask(
                    `${question} [${def ? "S/n" : "s/N"}]: `
                )
            ).toLowerCase();

            if (answer === "") {
                return def;
            }

            if (["s", "si", "sì", "y", "yes"].includes(answer)) {
                return true;
            }

            if (["n", "no"].includes(answer)) {
                return false;
            }
        }
    }

    /*
    * Mostra un menu numerato e restituisce il valore associato
    * all'opzione selezionata.
    *
    * Se viene fornito il parametro zero, aggiunge una scelta
    * speciale identificata dal numero 0.
 */
    public async choice<T>(
        title: string,
        options: Option<T>[],
        zero?: Option<T>
    ): Promise<T> {

        console.log(`\n${title}`);

        options.forEach((option, index) => {
            console.log(`  ${index + 1}) ${option.label}`);
        });

        if (zero !== undefined) {
            console.log(`  0) ${zero.label}`);
        }

        while (true) {

            const answer = await this.ask("> ");
            const value = Number(answer);

            if (
                zero !== undefined &&
                answer === "0"
            ) {
                return zero.value;
            }

            if (
                Number.isInteger(value) &&
                value >= 1 &&
                value <= options.length
            ) {
                return options[value - 1].value;
            }

            console.log("Scelta non valida.");
        }
    }

 /*
 * Legge tre coordinate intere separate da spazi, virgole
 * o punti e virgola e verifica che la posizione risultante
 * appartenga alla griglia.
 *
 * Se l'input non è valido, richiede nuovamente le coordinate.
 */
    public async coordinates(
        question: string,
        grid: Grid
    ): Promise<Coordinates> {

        const hint =
            `x 0-${grid.getWidth() - 1}, ` +
            `y 0-${grid.getHeight() - 1}, ` +
            `z 0-${grid.getDepth() - 1}`;

        while (true) {

            const answer = await this.ask(
                `${question} (${hint}) come "x y z": `
            );

            const parts = answer
                .split(/[\s,;]+/)
                .filter(part => part !== "")
                .map(Number);

            if (
                parts.length === 3 &&
                parts.every(Number.isInteger)
            ) {
                const coordinates = Coordinates.create(
                    parts[0],
                    parts[1],
                    parts[2]
                );

                if (grid.isValid(coordinates)) {
                    return coordinates;
                }
            }

            console.log("Coordinate non valide.");
        }
    }

    public close(): void {
        this.rl.close();
    }
}