
import { Cell, CellState } from "../src/models/grid/Cell";
import { Coordinates } from "../src/models/grid/Coordinates";
import { GridFactory } from "../src/models/grid/GridFactory";

describe("Grid", () => {

    describe("creazione", () => {

        it("deve creare una griglia con le dimensioni specificate", () => {
            const grid = GridFactory.create(10, 10, 5);

            expect(grid.getWidth()).toBe(10);
            expect(grid.getHeight()).toBe(10);
            expect(grid.getDepth()).toBe(5);
        });

        it("deve rifiutare dimensioni non valide", () => {
            expect(() => {
                GridFactory.create(0, 10, 5);
            }).toThrow();

            expect(() => {
                GridFactory.create(10, -1, 5);
            }).toThrow();

            expect(() => {
                GridFactory.create(10, 10, 0);
            }).toThrow();
        });

    });

    describe("coordinate", () => {

        const grid = GridFactory.create(10, 10, 5);

        it("deve riconoscere coordinate valide", () => {
            expect(
                grid.isValid(Coordinates.create(0, 0, 0))
            ).toBe(true);

            expect(
                grid.isValid(Coordinates.create(9, 9, 4))
            ).toBe(true);
        });

        it("deve riconoscere coordinate non valide", () => {
            expect(
                grid.isValid(Coordinates.create(-1, 0, 0))
            ).toBe(false);

            expect(
                grid.isValid(Coordinates.create(10, 0, 0))
            ).toBe(false);

            expect(
                grid.isValid(Coordinates.create(0, 10, 0))
            ).toBe(false);

            expect(
                grid.isValid(Coordinates.create(0, 0, 5))
            ).toBe(false);
        });

    });

    describe("celle", () => {

        it("deve restituire la stessa istanza per le stesse coordinate", () => {
            const grid = GridFactory.create(10, 10, 5);

            const cell1 = grid.getCell(
                Coordinates.create(2, 3, 1)
            );

            const cell2 = grid.getCell(
                Coordinates.create(2, 3, 1)
            );

            expect(cell1).toBe(cell2);
        });

        it("deve creare 500 celle per una griglia 10x10x5", () => {
            const grid = GridFactory.create(10, 10, 5);

            const cells = new Set<Cell>();

            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 10; y++) {
                    for (let z = 0; z < 5; z++) {
                        const coordinates = Coordinates.create(x, y, z);
                        const cell = grid.getCell(coordinates);

                        cells.add(cell);
                    }
                }
            }

            expect(cells.size).toBe(500);
        });

    });

    describe("stato delle celle", () => {

        it("deve avere stato EMPTY inizialmente", () => {
            const grid = GridFactory.create(10, 10, 5);

            const coordinates = Coordinates.create(2, 3, 1);

            expect(
                grid.getCellState(coordinates)
            ).toBe(CellState.EMPTY);
        });

        it("deve permettere di modificare lo stato di una cella", () => {
            const grid = GridFactory.create(10, 10, 5);

            const coordinates = Coordinates.create(2, 3, 1);

            grid.setCellState(
                coordinates,
                CellState.OCCUPIED
            );

            expect(
                grid.getCellState(coordinates)
            ).toBe(CellState.OCCUPIED);
        });

        it("deve mantenere stati indipendenti per celle diverse", () => {
            const grid = GridFactory.create(10, 10, 5);

            const cellA = Coordinates.create(1, 1, 1);
            const cellB = Coordinates.create(2, 1, 1);

            grid.setCellState(
                cellA,
                CellState.OCCUPIED
            );

            expect(
                grid.getCellState(cellA)
            ).toBe(CellState.OCCUPIED);

            expect(
                grid.getCellState(cellB)
            ).toBe(CellState.EMPTY);
        });

    });

});