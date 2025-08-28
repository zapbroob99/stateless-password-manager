// src/crypto/cryptoUtils.js
import { Argon2, Argon2Mode } from '@sphereon/isomorphic-argon2';

export const DEFAULT_COUNTER = 2;

export async function deriveKeyFromMasterPassword(masterPassword, salt = "default_salt_please_change") {
    const options = {
        hashLength: 32,
        memory: 65536,
        parallelism: 4,
        iterations: 3,
        mode: Argon2Mode.Argon2d,
    };
    try {
        const result = await Argon2.hash(masterPassword, salt, options);
        if (result.rawHash && result.rawHash instanceof Uint8Array) {
            return result.rawHash;
        } else if (result.hex) {
            const hex = result.hex;
            const rawHash = new Uint8Array(hex.length / 2);
            for (let i = 0; i < hex.length; i += 2) {
                rawHash[i / 2] = parseInt(hex.substring(i, i + 2), 16);
            }
            return rawHash;
        }
        throw new Error("Could not get raw hash from isomorphic-argon2 result");
    } catch (error) {
        console.error("Argon2 key derivation error:", error);
        throw error;
    }
}

export async function generateSiteKey(derivedKey, siteName, counter, salt = "site_specific_salt") {
    const siteIdentifier = `${siteName.length}${siteName}${counter}${salt}`;
    try {
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            derivedKey,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const encoder = new TextEncoder();
        const dataToSign = encoder.encode(siteIdentifier);
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
        return new Uint8Array(signature);
    } catch (error) {
        console.error("HMAC-SHA256 site key generation error:", error);
        throw error;
    }
}


const CHAR_SETS = {
    'v': "aeiou",
    'V': "AEIOU",
    'c': "bcdfghjklmnpqrstvwxyz",
    'C': "BCDFGHJKLMNPQRSTVWXYZ",
    'n': "0123456789",
    'o': "@&%?,=[]:-+$#!'.;()/", // Özel karakterler (makaledeki gibi)
    'x': "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@&%?,=[]:-+$#!'.;()/", // Hepsi
    'a': "abcdefghijklmnopqrstuvwxyz0123456789" // Küçük harf + rakam (basic için)
};

export function generatePasswordFromSiteKeyWithPaperTemplate(siteKey, templateString) {
    if (!templateString) {
        console.error("Template string is undefined or null");
        return "Error:TemplateMissing";
    }
    let password = "";
    let siteKeyIndex = 0;

    for (let i = 0; i < templateString.length; i++) {
        const templateChar = templateString[i];
        const charSet = CHAR_SETS[templateChar];

        if (charSet) {
            const charSetIndex = siteKey[siteKeyIndex % siteKey.length] % charSet.length;
            password += charSet[charSetIndex];
            siteKeyIndex++;
        } else {
            password += templateChar;
            console.warn(`Unknown template character: ${templateChar}`);
        }
    }
    return password;
}