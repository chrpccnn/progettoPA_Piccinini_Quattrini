import fs from "fs";
import path from "path";

export function getPrivateKey(): string {
    const key = process.env.JWT_PRIVATE_KEY;

    if (!key) {
        throw new Error("JWT private key not configured");
    }

    return key.replace(/\\n/g, "\n");
}

export function getPublicKey(): string {
    const publicKeyPath = path.resolve(
        process.cwd(),
        "jwtRS256.key.pub"
    );

    return fs.readFileSync(publicKeyPath, "utf8");
}