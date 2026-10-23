import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import authMiddleware, { AuthenticatedRequest } from "../src/middleware/authMiddleware";
import { roleMiddleware } from "../src/middleware/roleMiddleware";
import * as jwtKey from "../src/jwtKey";

describe("Middleware", () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });


    describe("authMiddleware", () => {

        test("deve rifiutare una richiesta senza token", () => {

            const req = {
                headers: {}
            } as AuthenticatedRequest;

            const res = {} as Response;

            const next =
                jest.fn() as unknown as NextFunction;

            authMiddleware(
                req,
                res,
                next
            );

            expect(next)
                .toHaveBeenCalledTimes(1);

            const error =
                (next as jest.Mock)
                    .mock.calls[0][0];

            expect(error.statusCode)
                .toBe(401);

            expect(error.message)
                .toBe("Missing token");
        });


        test("deve accettare un JWT valido e salvare l'utente nella request", () => {

            const req = {
                headers: {
                    authorization:
                        "Bearer valid-token"
                }
            } as AuthenticatedRequest;

            const res = {} as Response;

            const next =
                jest.fn() as unknown as NextFunction;

            jest
                .spyOn(
                    jwtKey,
                    "getPublicKey"
                )
                .mockReturnValue(
                    "fake-public-key"
                );

            jest
                .spyOn(
                    jwt,
                    "verify"
                )
                .mockImplementation(
                    () => ({
                        id: 1,
                        email:
                            "test@example.com",
                        role: "user"
                    }) as any
                );

            authMiddleware(
                req,
                res,
                next
            );

            expect(next)
                .toHaveBeenCalledWith();

            expect(req.user)
                .toEqual({
                    id: 1,
                    email:
                        "test@example.com",
                    role: "user"
                });
        });

    });


    describe("roleMiddleware", () => {

        test("deve permettere l'accesso quando il ruolo è corretto", () => {

            const req = {
                user: {
                    id: 1,
                    email:
                        "test@example.com",
                    role: "user"
                }
            } as AuthenticatedRequest;

            const res = {} as Response;

            const next =
                jest.fn() as unknown as NextFunction;

            const middleware =
                roleMiddleware("user");

            middleware(
                req,
                res,
                next
            );

            expect(next)
                .toHaveBeenCalledWith();
        });


        test("deve rifiutare l'accesso quando il ruolo è errato", () => {

            const req = {
                user: {
                    id: 1,
                    email:
                        "test@example.com",
                    role: "user"
                }
            } as AuthenticatedRequest;

            const res = {} as Response;

            const next =
                jest.fn() as unknown as NextFunction;

            const middleware =
                roleMiddleware("admin");

            middleware(
                req,
                res,
                next
            );

            expect(next)
                .toHaveBeenCalledTimes(1);

            const error =
                (next as jest.Mock)
                    .mock.calls[0][0];

            expect(error.statusCode)
                .toBe(403);

            expect(error.message)
                .toBe("Forbidden");
        });

    });

});