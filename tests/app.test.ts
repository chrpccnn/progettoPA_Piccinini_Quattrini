import request from "supertest";
import app from "../src/app";

describe("GET /", () => {
    it("deve restituire 200 e il messaggio corretto", async () => {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Backend funzionante!"
        });
    });
});