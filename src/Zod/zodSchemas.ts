import * as z from "zod";

export const emailSchema = z
    .string("email must be a string")
    .trim()
    .nonempty("email must be non-empty")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .transform(val=>val.toLowerCase());

export const pwSchema = z
    .string()
    .nonempty()
    .min(5, "password must be longer than 5 character")
    .max(128, "password must be shorter than 128 character")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);

export const modeSchema = z.enum(["ai", "user"]);
export const role = z.enum(["admin", "user"]);


export const gridValueSchema = z
    // valore base per creare la griglia
    .number()
    .int()
    .positive()
    .min(5)
    .max(20)

export const shipSchema = z.object({
    // numero di ogni tipologia di nave
    motherShip: z
    .number()
    .int()
    .min(1)
    .max(3)
    .default(1),

    cruiser: z
    .number()
    .int()
    .min(1)
    .max(3)
    .default(1),

    scout: z
    .number()
    .int()
    .min(1)
    .max(3)
    .default(2),

    drone: z
    .number()
    .int()
    .min(1)
    .max(3)
    .default(2),
}).strict();

export const energyCredits =  z
    // numero di crediti energy iniziali
    .number()
    .int()
    .min(1)
    .max(6)
    .default(3)

export const TurnCredits = z
    // numero di crediti ricaricati ad ogni turno
    .number()
    .int()
    .min(1)
    .max(5)
    .default(2)

export const silenceCredits = z
    // numero di crediti silence
    .number()
    .int()
    .min(1)
    .max(5)
    .default(5)

export const measuresSchema = z.object({
    // costo mosse
    attack: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(1),

    scan: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(2),

    shield: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(2), 

    move: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(2)
}).strict();

export const countermeasuresSchema = z.object({
    // Costo contro mosse
    cancelAttack: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(3),

    RadioSilence: z // da capire se lasciarli o meno
    .number()
    .int()
    .min(1)
    .max(4)
    .default(3),

    AlterScan: z
    .number()
    .int()
    .min(1)
    .max(4)
    .default(3),
}).strict();

const gridSchema = z.object({
    // schema per impostare le dimensioni della griglia
    grid_base: gridValueSchema.default(10),
    grid_height: gridValueSchema.default(5)
}).strict();;

export const actionsSchema = z.object({
    measures: measuresSchema.prefault({}),
    countermeasures: countermeasuresSchema.prefault({})
}).strict();

// parti dello schema in comune tra entrambe le modalità
export const commonSchema = z.object({
    grid: gridSchema.prefault({}),
    ships: shipSchema.prefault({}),
    energy: energyCredits,
    turnCredits: TurnCredits,
    actions: actionsSchema.prefault({}),
})

// schema specifico per modalità
export const gameSchema = z.discriminatedUnion("mode", [
  commonSchema.extend({
    // Caso utente
    mode: z.literal(modeSchema.enum.user),
    email: emailSchema,
    silence: silenceCredits
  }),

  commonSchema.extend({
    //Caso AI
    mode: z.literal(modeSchema.enum.ai)
  }).strict()
]);

export type GameInput = z.infer<typeof gameSchema>;
export type mailSchema = z.infer<typeof emailSchema>;
export type passwordSchema = z.infer<typeof pwSchema>;
export type roleSchema = z.infer<typeof role>;