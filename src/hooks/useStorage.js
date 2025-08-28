// src/hooks/useStorage.js
import { useState, useEffect, useCallback } from 'react';
import i18n from '../i18n';
import { getPreferredLangKey } from '../i18n';

const SITES_STORAGE_KEY = 'savedSitesData_v2';
const SESSION_ACTIVE_KEY = 'isMasterPasswordSessionActive';
const LAST_URL_KEY = 'lastUsedUrl';
const LANGUAGE_STORAGE_KEY = getPreferredLangKey();

const storageGet = (keys) =>
    new Promise((resolve, reject) => {
        if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        } else {
            try {
                const result = {};
                const keysArray = Array.isArray(keys) ? keys : [keys];
                keysArray.forEach(key => {
                    const item = localStorage.getItem(key);
                    result[key] = (key === LANGUAGE_STORAGE_KEY || key === LAST_URL_KEY || key === SESSION_ACTIVE_KEY)
                        ? (item || undefined)
                        : (item ? JSON.parse(item) : undefined);
                });
                resolve(result);
            } catch (e) {
                resolve( (Array.isArray(keys) ? keys : [keys]).reduce((acc, key) => ({...acc, [key]: undefined }), {}))
            }
        }
    });

const storageSet = (items) =>
    new Promise((resolve, reject) => {
        if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set(items, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        } else {
            try {
                Object.entries(items).forEach(([key, value]) => {
                    if (key === LANGUAGE_STORAGE_KEY || key === LAST_URL_KEY || typeof value === 'boolean' || typeof value === 'string') {
                        localStorage.setItem(key, String(value));
                    } else {
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                });
                resolve();
            } catch (e) { reject(e); }
        }
    });

const storageRemove = (keys) =>
    new Promise((resolve, reject) => {
        if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove(keys, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        } else {
            try {
                (Array.isArray(keys) ? keys : [keys]).forEach(key => localStorage.removeItem(key));
                resolve();
            } catch (e) { reject(e); }
        }
    });


export function useAppStorage() {
    const [sites, setSites] = useState({});
    const [isSessionActive, setIsSessionActiveState] = useState(false);
    const [lastUsedUrl, setLastUsedUrlState] = useState('');
    const [storageLoading, setStorageLoading] = useState(true);
    const [currentLanguage, setCurrentLanguageState] = useState(i18n.language?.split('-')[0] || 'tr');


    useEffect(() => {
        async function loadInitialData() {
            try {
                const result = await storageGet([
                    SITES_STORAGE_KEY,
                    SESSION_ACTIVE_KEY,
                    LAST_URL_KEY,
                    LANGUAGE_STORAGE_KEY
                ]);
                if (result[SITES_STORAGE_KEY]) {
                    setSites(result[SITES_STORAGE_KEY]);
                }
                setIsSessionActiveState(result[SESSION_ACTIVE_KEY] === 'true' || result[SESSION_ACTIVE_KEY] === true);
                if (result[LAST_URL_KEY]) {
                    setLastUsedUrlState(result[LAST_URL_KEY]);
                }
                const storedLang = result[LANGUAGE_STORAGE_KEY];
                const initialLang = storedLang && ['en', 'tr'].includes(storedLang) ? storedLang : (i18n.language?.split('-')[0] || 'tr');
                setCurrentLanguageState(initialLang);
                if (i18n.language !== initialLang) {
                    await i18n.changeLanguage(initialLang);
                }
            } catch (e) {
                console.error("Failed to load initial data from storage:", e);
            } finally {
                setStorageLoading(false);
            }
        }
        loadInitialData();

        const handleLanguageChanged = (lng) => {
            setCurrentLanguageState(lng.split('-')[0]);
        };
        i18n.on('languageChanged', handleLanguageChanged);
        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, []);


    const updateCurrentLanguage = useCallback(async (langCode) => {
        const baseLangCode = langCode.split('-')[0];
        if (['en', 'tr'].includes(baseLangCode) && baseLangCode !== currentLanguage) {
            try {
                await i18n.changeLanguage(baseLangCode);
                await storageSet({ [LANGUAGE_STORAGE_KEY]: baseLangCode });
            } catch (error) {
                console.error("Error changing language:", error);
            }
        }
    }, [currentLanguage]);

    const addOrUpdateSiteProfiles = useCallback(async (url, newProfileData) => {
        const urlProfiles = sites[url] ? [...sites[url]] : [];
        const profileWithId = { ...newProfileData, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
        urlProfiles.push(profileWithId);
        const newSitesData = { ...sites, [url]: urlProfiles };
        setSites(newSitesData);
        try { await storageSet({ [SITES_STORAGE_KEY]: newSitesData }); }
        catch (e) { console.error("Error saving sites to storage:", e); }
        return profileWithId;
    }, [sites]);

    const removeSiteProfile = useCallback(async (url, profileId) => {
        if (!sites[url]) return;
        const updatedProfilesForUrl = sites[url].filter(p => p.id !== profileId);
        let newSitesData;
        if (updatedProfilesForUrl.length === 0) {
            newSitesData = { ...sites };
            delete newSitesData[url];
        } else {
            newSitesData = { ...sites, [url]: updatedProfilesForUrl };
        }
        setSites(newSitesData);
        try { await storageSet({ [SITES_STORAGE_KEY]: newSitesData }); }
        catch (e) { console.error("Error removing site profile:", e); }
    }, [sites]);

    const updateSites = useCallback(async (newSitesData) => {
        setSites(newSitesData);
        try { await storageSet({ [SITES_STORAGE_KEY]: newSitesData }); }
        catch (e) { console.error("Error updating sites in storage:", e); }
    }, []);

    const exportSiteData = useCallback(() => {
        try {
            const dataStr = JSON.stringify(sites, null, 2);
            return dataStr;
        } catch (error) {
            console.error("Error exporting site data:", error);
            return null;
        }
    }, [sites]);

    const importSiteData = useCallback(async (jsonString, merge = true) => { // merge=true varsayılan
        try {
            const importedData = JSON.parse(jsonString);
            if (typeof importedData !== 'object' || importedData === null) {
                throw new Error("Imported data is not a valid JSON object.");
            }
            for (const siteUrl in importedData) {
                if (!Array.isArray(importedData[siteUrl])) {
                    throw new Error(`Data for '${siteUrl}' is not in valid format (array expected).`);
                }
            }
            let dataToSet;
            if (merge) {
                dataToSet = { ...sites };
                for (const siteUrl in importedData) {
                    if (dataToSet[siteUrl]) {
                        const existingProfiles = dataToSet[siteUrl];
                        const newProfiles = importedData[siteUrl];
                        const profileMap = new Map(existingProfiles.map(p => [p.id, p]));
                        newProfiles.forEach(pNew => profileMap.set(pNew.id, pNew));
                        dataToSet[siteUrl] = Array.from(profileMap.values());
                    } else {
                        dataToSet[siteUrl] = importedData[siteUrl];
                    }
                }
            } else {
                dataToSet = importedData;
            }
            setSites(dataToSet);
            await storageSet({ [SITES_STORAGE_KEY]: dataToSet });
            return true;
        } catch (error) {
            console.error("Error importing site data:", error);
            throw error;
        }
    }, [sites]);

    const updateIsSessionActive = useCallback(async (isActive) => {
        setIsSessionActiveState(isActive);
        try { await storageSet({ [SESSION_ACTIVE_KEY]: isActive }); }
        catch (e) { console.error("Error saving session state:", e); }
    }, []);

    const updateLastUsedUrl = useCallback(async (url) => {
        setLastUsedUrlState(url);
        try { await storageSet({ [LAST_URL_KEY]: url }); }
        catch (e) { console.error("Error saving last used URL:", e); }
    }, []);

    const clearSessionData = useCallback(async () => {
        setIsSessionActiveState(false);
        try { await storageSet({ [SESSION_ACTIVE_KEY]: false }); }
        catch (e) { console.error("Error clearing session active state from storage:", e); }
    }, []);


    return {
        sites,
        addOrUpdateSiteProfiles,
        removeSiteProfile,
        updateSites,
        exportSiteData,
        importSiteData,
        isSessionActive,
        updateIsSessionActive,
        lastUsedUrl,
        updateLastUsedUrl,
        storageLoading,
        clearSessionData,
        currentLanguage,
        updateCurrentLanguage
    };
}