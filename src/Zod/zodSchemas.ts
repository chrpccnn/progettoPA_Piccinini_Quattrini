import * as z from "zod";
import {
    DEFAULT_ENERGY_CONFIG
} from "../models/Engine/EnergyConfig";

import {
    DEFAULT_FLEET_CONFIG,
    MAX_SHIPS
} from "../models/fleet/FleetConfig";

import { ShipType } from "../models/fleet/ShipType";
import { Orientation } from "../models/fleet/Orientation";

import { CountermeasureType } from "../models/Action/Countermeasure/CountermeasureType";


export const emailSchema = z
    .string("email must be a string")
    .trim()
    .nonempty("email must be non-empty")
    .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "invalid email"
    )
    .transform(val => val.toLowerCase());

export const pwSchema = z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(128, "password must be shorter than 128 characters")
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "password must contain uppercase, lowercase, number and special character"
    );

export const authSchema = z.object({
    email: emailSchema,
    password: pwSchema
}).strict();

export const role = z.enum(["admin", "user"]);
export const type = z.enum(["admin", "player"]);
export const modeSchema = z.enum(["ai", "user"]);

export const id = z
    .number()
    .int()
    .positive();

export const jwtPayloadSchema = z.object({
    id: z
        .number()
        .int()
        .positive(),

    email: emailSchema,

    role: z.enum([
        "user",
        "admin"
    ])
});

export const gameParamsSchema = z.object({
    gameId: z
        .string()
        .trim()
        .min(1, "gameId is required")
}).strict();

export const gridValueSchema = z
    .number()
    .int()
    .min(5)
    .max(20);

export const gridSchema = z.object({
    // X e Y
    grid_base: gridValueSchema
        .default(10),

    // Z
    grid_height: gridValueSchema
        .default(5)

}).strict();

export const shipSchema = z.object({

    motherShip: z
        .number()
        .int()
        .min(1)
        .max(MAX_SHIPS[ShipType.MOTHER_SHIP])
        .default(
            DEFAULT_FLEET_CONFIG[ShipType.MOTHER_SHIP]),

    cruiser: z
        .number()
        .int()
        .min(1)
        .max(MAX_SHIPS[ShipType.CRUISER])
        .default(
            DEFAULT_FLEET_CONFIG[ShipType.CRUISER]),

    scout: z
        .number()
        .int()
        .min(1)
        .max(MAX_SHIPS[ShipType.SCOUT])
        .default(
            DEFAULT_FLEET_CONFIG[ShipType.SCOUT]),

    drone: z
        .number()
        .int()
        .min(1)
        .max(MAX_SHIPS[ShipType.DRONE])
        .default(
            DEFAULT_FLEET_CONFIG[ShipType.DRONE])

}).strict();

export const shipPositionSchema = z.object({

    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    z: z.number().int().nonnegative(),

    orientation: z.enum(Orientation)

}).strict();

export const orientationSchema = z
    .array(
        z.enum(Orientation)
    )
    .min(
        1,
        "at least one orientation must be allowed"
    )
    .default([
        Orientation.HORIZONTAL,
        Orientation.VERTICAL,
        Orientation.DEPTH
    ]);

export const coordinatesSchema = z.object({
    x: z.number().int(),
    y: z.number().int(),
    z: z.number().int()
}).strict();

export const shipPlacementSchema = z.object({

    motherShip: z
        .array(shipPositionSchema)
        .default([]),

    cruiser: z
        .array(shipPositionSchema)
        .default([]),

    scout: z
        .array(shipPositionSchema)
        .default([]),

    drone: z
        .array(shipPositionSchema)
        .default([])

}).strict();

export const actionSchema = z.discriminatedUnion(
    "type",
    [
        z.object({
            type: z.literal("ATTACK"),
            coordinates: coordinatesSchema
        }).strict(),

        z.object({
            type: z.literal("SCAN"),
            coordinates: coordinatesSchema
        }).strict(),

        z.object({
            type: z.literal("SHIELD"),
            coordinates: coordinatesSchema
        }).strict(),

        z.object({
            type: z.literal("MOVE"),
            shipId: z.string().trim().min(1),
            axis: z.enum([
                "X",
                "Y",
                "Z"
            ]),

            direction: z.union([
                z.literal(1),
                z.literal(-1)
            ])
        }).strict()
    ]
);

export const energySchema = z.object({

    initial: z
        .number()
        .int()
        .min(0)
        .default(
            DEFAULT_ENERGY_CONFIG.initial
        ),

    max: z
        .number()
        .int()
        .min(1)
        .default(
            DEFAULT_ENERGY_CONFIG.max
        ),

    regeneration: z
        .number()
        .int()
        .min(0)
        .default(
            DEFAULT_ENERGY_CONFIG.regeneration
        )

})
    .strict()
    .refine(
        energy => energy.initial <= energy.max,
        {
            message:
                "initial energy cannot exceed max energy",
            path: ["initial"]
        }
    );

export const silenceSchema = z
    .number()
    .int()
    .min(0)
    .max(5)
    .default(3);

export const commonGameSchema = z.object({

    grid: gridSchema.prefault({}),

    ships: shipSchema.prefault({}),

    placements: shipPlacementSchema.prefault({}),

    orientation: orientationSchema,

    energy: energySchema.prefault({})

}).superRefine((data, ctx) => {

    if (
        data.placements.motherShip.length >
        data.ships.motherShip
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["placements", "motherShip"],
            message:
                `Cannot place more than ${data.ships.motherShip} MotherShip`
        });
    }

    if (
        data.placements.cruiser.length >
        data.ships.cruiser
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["placements", "cruiser"],
            message:
                `Cannot place more than ${data.ships.cruiser} Cruiser`
        });
    }

    if (
        data.placements.scout.length >
        data.ships.scout
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["placements", "scout"],
            message:
                `Cannot place more than ${data.ships.scout} Scout`
        });
    }

    if (
        data.placements.drone.length >
        data.ships.drone
    ) {
        ctx.addIssue({
            code: "custom",
            path: ["placements", "drone"],
            message:
                `Cannot place more than ${data.ships.drone} Drone`
        });
    }
})

export const gameSchema = z.discriminatedUnion(
    "mode",
    [
        commonGameSchema.safeExtend({
            // mode user
            mode: z.literal(modeSchema.enum.user),
            opponentEmail: emailSchema,
            silence: silenceSchema
        }).strict(),

        commonGameSchema.safeExtend({
            // mode ai
            mode: z.literal(modeSchema.enum.ai)
        }).strict()
    ]
);

export const tokenAmountSchema = z
    .number()
    .positive();

export const refillSchema = z.object({
    email: emailSchema,
    tokens: tokenAmountSchema
}).strict();

export const countermeasureSchema = z.object({
    type: z.enum(CountermeasureType)
}).strict();


export type GameInput = z.infer<typeof gameSchema>;

export type GameParams = z.infer<typeof gameParamsSchema>;

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

export type MailSchema = z.infer<typeof emailSchema>;

export type PasswordSchema = z.infer<typeof pwSchema>;

export type RoleSchema = z.infer<typeof role>;

export type TypeSchema = z.infer<typeof type>;

export type IdSchema = z.infer<typeof id>;

export type RefillInput = z.infer<typeof refillSchema>;

export type ActionInput = z.infer<typeof actionSchema>;

export type CountermeasureInput = z.infer<typeof countermeasureSchema>;