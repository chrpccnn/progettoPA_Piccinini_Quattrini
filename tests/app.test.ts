/*
 * Questo gruppo di test verifica il corretto funzionamento
 * della route principale GET / dell'applicazione Express.
 *
 * In particolare, viene controllato che una richiesta HTTP
 * GET all'endpoint principale venga gestita correttamente,
 * restituendo lo status code 200 e un oggetto JSON contenente
 * il messaggio di conferma, il metodo HTTP utilizzato e
 * l'URL della richiesta.
 *
 */
import request from "supertest";
import app from "../src/app";

describe("GET /", () => {
    it("deve restituire 200 e il messaggio corretto", async () => {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            message: "Backend funzionante!",
            method: "GET",
            url: "/"
        });
    });
});