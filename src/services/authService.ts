import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserRepository from "../repository/authRepository";
import { ErrorFactory } from "../errors/ErrorFactory";
import { getPrivateKey } from "../jwtKey";

export class AuthService {
    static async register(email: string, plainPassword: string) {
        const existingUser = await UserRepository.findByEmail(email);
        if (existingUser) {
            throw ErrorFactory.userAlreadyExists();
        }
        const encrypted_ps = await bcrypt.hash(plainPassword, 10)

        const newUser = await UserRepository.createNewUser(email, encrypted_ps)

        return {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
        };
    }  

    static async login(email: string, plainPassword: string){
        const existingUser = await UserRepository.findByEmail(email);
        if(!existingUser){
            throw ErrorFactory.invalidCredentials();
        }

        const isPasswordValid = await bcrypt.compare(plainPassword, existingUser.password);
        if (!isPasswordValid) {
            throw ErrorFactory.invalidCredentials();
        }
        
        const token = jwt.sign(
        {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role
        },
        getPrivateKey(),
        {
            algorithm: "RS256",
            expiresIn: "2h"
        }
        );

        return {
        token,
        user: {
            id: existingUser.id,
            email: existingUser.email,
            role: existingUser.role,
        },
    };

    }
}