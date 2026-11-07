import crypto from "crypto";
import config from "../config/config.js";

export function generateApiKey(length: number) : string {
    const apiKey = "key_live_" + crypto.randomBytes(32).toString("hex");
    return apiKey;
}

function getEncryptionKey(){
    const key = Buffer.from(config.ENCRYPTION_KEY, "hex");
    if(key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
    return key;
}

export function encryptApiKey(apiKey: string){
    const iv = crypto.randomBytes(12);

    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encryptedKey = cipher.update(apiKey, "utf-8", "hex");
    encryptedKey += cipher.final("hex");

    const auth_tag = cipher.getAuthTag();
    return {
        encrypted_key: encryptedKey, 
        iv: iv.toString("hex"),
        auth_tag: auth_tag.toString("hex")
    }
}

export function decryptApiKey(encrypted_key: string, iv: string, auth_tag: string) : string {
    const iv_raw = Buffer.from(iv, "hex");

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv_raw);
    decipher.setAuthTag(Buffer.from(auth_tag, "hex"));

    let decryptedKey = decipher.update(encrypted_key, "hex", "utf-8");
    decryptedKey += decipher.final("utf-8");

    return decryptedKey;
}