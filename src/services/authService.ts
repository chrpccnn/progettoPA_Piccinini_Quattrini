import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user";

export class AuthService {
    static async register(email: string, plainPassword: string, role: "user" | "admin") {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error("email already exist!")
        }
        const encryped_ps = await bcrypt.hash(plainPassword, 10)

        const newUser = await User.create({
            email,
            password: encryped_ps,
            role,
        });

        return {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
        };
    }  

    static async login(email: string, plainPassword: string){
        const existingUser = await User.findOne({  where: { email } })
        if(!existingUser){
            throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(plainPassword, existingUser.password);
        if (!isPasswordValid) {
            throw new Error("Invalid credentials")
        }
        
        const token = jwt.sign(
            { id: existingUser.id, email: existingUser.email, role: existingUser.role },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: '2h' }
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