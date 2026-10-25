
/**
 * 
 *
 * SCOPO
 * Verificare il comportamento di FleetFactory durante la creazione
 * e il posizionamento delle navi sulla griglia tridimensionale.
 *
 * POSIZIONAMENTO MANUALE
 * I test verificano che:
 * - una nave venga posizionata nelle coordinate specificate;
 * - le posizioni occupate corrispondano alla lunghezza della nave
 *   e al suo orientamento;
 * - venga mantenuto l'orientamento richiesto;
 * - il posizionamento venga rifiutato se la nave uscirebbe dalla griglia;
 * - il posizionamento venga rifiutato se le celle sono già occupate.
 *
 * COMPLETAMENTO CASUALE DELLA FLOTTA
 * Un ulteriore test verifica che, dopo aver posizionato manualmente
 * una nave, sia possibile collocarne un'altra casualmente senza
 * sovrapporla alle celle già occupate.
 *
 * Il Set di coordinate occupate viene utilizzato per registrare
 * le posizioni già assegnate e impedire collisioni tra le navi.
 *
 */

import { FleetFactory } from "../src/models/fleet/FleetFactory";
import { GridFactory } from "../src/models/grid/GridFactory";
import { Coordinates } from "../src/models/grid/Coordinates";
import { Orientation } from "../src/models/fleet/Orientation";
import { ShipType } from "../src/models/fleet/ShipType";

describe("FleetFactory manual placement", () => {

    test("deve posizionare manualmente una nave nelle coordinate corrette", () => {

        const grid = GridFactory.create(10, 10, 5);

        const ship = FleetFactory.shipAt(
            "mother-1",
            ShipType.MOTHER_SHIP,
            Coordinates.create(0, 0, 0),
            Orientation.HORIZONTAL,
            grid,
            new Set()
        );

        expect(ship.getPositions()).toEqual([
            Coordinates.create(0, 0, 0),
            Coordinates.create(1, 0, 0),
            Coordinates.create(2, 0, 0),
            Coordinates.create(3, 0, 0),
            Coordinates.create(4, 0, 0)
        ]);

        expect(ship.getOrientation())
            .toBe(Orientation.HORIZONTAL);
    });


    test("deve rifiutare una nave che uscirebbe dalla griglia", () => {

        const grid = GridFactory.create(10, 10, 5);

        expect(() =>
            FleetFactory.shipAt(
                "mother-1",
                ShipType.MOTHER_SHIP,
                Coordinates.create(8, 0, 0),
                Orientation.HORIZONTAL,
                grid,
                new Set()
            )
        ).toThrow(
            "La nave uscirebbe dalla griglia."
        );
    });


    test("deve rifiutare la sovrapposizione con una nave già posizionata", () => {

        const grid = GridFactory.create(10, 10, 5);

        const occupied = new Set<Coordinates>([
            Coordinates.create(2, 0, 0)
        ]);

        expect(() =>
            FleetFactory.shipAt(
                "mother-1",
                ShipType.MOTHER_SHIP,
                Coordinates.create(0, 0, 0),
                Orientation.HORIZONTAL,
                grid,
                occupied
            )
        ).toThrow(
            "La nave si sovrapporrebbe a un'altra nave."
        );
    });


    test("deve permettere di completare casualmente una flotta dopo un placement manuale", () => {

        const grid = GridFactory.create(10, 10, 5);

        const occupied = new Set<Coordinates>();

        const manualShip = FleetFactory.shipAt(
            "scout-1",
            ShipType.SCOUT,
            Coordinates.create(0, 0, 0),
            Orientation.HORIZONTAL,
            grid,
            occupied
        );

        manualShip.getPositions().forEach(
            position => occupied.add(position)
        );

        const randomShip =
            FleetFactory.placeRandom(
                "drone-1",
                ShipType.DRONE,
                grid,
                [Orientation.HORIZONTAL],
                occupied,
                () => 0.5
            );

        expect(randomShip.getPositions()).toHaveLength(1);

        expect(
            manualShip
                .getPositions()
                .some(position =>
                    randomShip
                        .getPositions()
                        .some(randomPosition =>
                            randomPosition.equals(position)
                        )
                )
        ).toBe(false);
    });

});