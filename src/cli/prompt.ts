import * as readline from "node:readline";
import { Coordinates } from "../models/grid/Coordinates";
import { Grid } from "../models/grid/Igrid";

export interface Option<T> {
    label: string;
    value: T;
}

/*
 * Input da terminale con una coda di righe: funziona sia in modo
 * interattivo sia con input da pipe (utile per test automatici).
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
     * Menu numerato. L'opzione 0 e' sempre disponibile se
     * viene passato zeroLabel.
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
     * Legge "x y z" oppure "x,y,z" e controlla che
     * la cella sia dentro la griglia.
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