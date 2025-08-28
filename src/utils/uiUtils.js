// src/utils/uiUtils.js
export function getFaviconUrl(domain, size = 16) {
    if (!domain) return '/icon48.png';
    try {
        let cleanDomain = domain.replace(/^https?:\/\//, '');
        cleanDomain = cleanDomain.replace(/^www\./, '');
        cleanDomain = cleanDomain.split('/')[0];
        cleanDomain = cleanDomain.split('?')[0];

        if (!cleanDomain) return '/icon48.png';

        return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=${size}`;
    } catch (e) {
        console.warn("Error processing domain for favicon:", domain, e);
        return '/icon48.png';
    }
}