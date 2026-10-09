/*
 * Configurazione degli Energy Credits di una partita.
 * Default della specifica: 3 iniziali, +2 a turno, massimo 6.
 */
export interface EnergyConfig {
    initial: number;
    max: number;
    regeneration: number;
}

export const DEFAULT_ENERGY_CONFIG: Readonly<EnergyConfig> = {
    initial: 3,
    max: 6,
    regeneration: 2
};

export function validateEnergyConfig(config: EnergyConfig): void {

    const { initial, max, regeneration } = config;

    if (
        !Number.isInteger(initial) ||
        !Number.isInteger(max) ||
        !Number.isInteger(regeneration)
    ) {
        throw new Error("Energy values must be integers.");
    }

    if (max < 1) {
        throw new Error("Maximum energy must be at least 1.");
    }

    if (initial < 0 || initial > max) {
        throw new Error(
            "Initial energy must be between 0 and the maximum."
        );
    }

    if (regeneration < 0) {
        throw new Error("Energy regeneration cannot be negative.");
    }
}