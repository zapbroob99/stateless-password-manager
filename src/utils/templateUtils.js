// src/utils/templateUtils.js

export const PASSWORD_TEMPLATES = {
    maxSecurity: [
        "anoxxxxxxxxxxxxxxxxx",
        "axxxxxxxxxxxxxxxxxno",
        "xoxxxxxxxxxxxxxxxxxo"
    ],
    long: [
        "CvcvnoCvcvCvcv",
        "CvcvCvcvnoCvcv",
        "CvcvCvcvCvcvno"
    ],
    medium: [
        "CvcnoCvc",
        "CvcCvcno"
    ],
    basic: [
        "aaanaaan",
        "aannaaan",
        "aaannaaa"
    ],
    short: [
        "cvcn"
    ],
    pin: [
        "nnnn"
    ],
    shortChars: [
        "cvccvcvcv"
    ]
};

export const PASSWORD_TYPE_OPTIONS = [
    { id: 'maxSecurity', labelFallback: "Maximum Security (20 chars)" },
    { id: 'long', labelFallback: "Long (14 chars)" },
    { id: 'medium', labelFallback: "Medium (8 chars)" },
    { id: 'basic', labelFallback: "Basic (Letter+Num, 8 chars)" },
    { id: 'short', labelFallback: "Short (4 chars)" },
    { id: 'pin', labelFallback: "PIN (4 Digits)" },
    { id: 'shortChars', labelFallback: "Short (Letters Only, 9 chars)" }
];

export function selectTemplateBySiteKey(siteKey, passwordType) {
    // passwordType burada 'maxSecurity', 'long' gibi bir ID olmalı
    const templates = PASSWORD_TEMPLATES[passwordType];
    if (!templates || templates.length === 0) {
        console.warn(`No templates found for passwordType: ${passwordType}. Falling back to maxSecurity.`);
        return PASSWORD_TEMPLATES.maxSecurity[0];
    }

    let sum = 0;
    for (let i = 0; i < siteKey.length; i += 2) {
        sum += siteKey[i];
    }

    const selectedIndex = sum % templates.length;
    return templates[selectedIndex];
}