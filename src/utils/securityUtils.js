// src/utils/securityUtils.js
export async function checkPasswordPwned(password) {
    if (!password) {
        return false;
    }
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        const prefix = hexHash.substring(0, 5);
        const suffixToMatch = hexHash.substring(5);

        const apiUrl = `https://api.pwnedpasswords.com/range/${prefix}`;
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
            }
        });

        if (!response.ok) {
            if (response.status === 404) { // Hash prefix'i bulunamadı, yani sızdırılmamış
                return false;
            }
            console.warn(`Pwned Passwords API request failed with status: ${response.status}`);
            return false; // Hata durumunda sızdırılmamış kabul et (güvenli varsayım)
        }

        const textData = await response.text();
        const hashes = textData.split('\r\n');

        for (const line of hashes) {
            const [pwnedSuffix] = line.split(':');
            if (pwnedSuffix === suffixToMatch) {
                return true; // Sızdırılmış!
            }
        }
        return false; // Sızdırılmamış
    } catch (error) {
        console.error("Error checking pwned password:", error);
        return false; // Hata durumunda sızdırılmamış kabul et
    }
}