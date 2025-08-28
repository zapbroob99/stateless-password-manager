// src/components/PasswordGenerator.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStorage } from '../hooks/useStorage';
import MasterPasswordPrompt from './MasterPasswordPrompt';
import NewSiteForm from './NewSiteForm';
import SavedSitesList from './SavedSitesList';
import PasswordOutput from './PasswordOutput';
import {
    deriveKeyFromMasterPassword,
    generateSiteKey,
    generatePasswordFromSiteKeyWithPaperTemplate,
    DEFAULT_COUNTER
} from '../crypto/cryptoUtils';
import { selectTemplateBySiteKey, PASSWORD_TYPE_OPTIONS } from '../utils/templateUtils';
import './PasswordGenerator.css';

const PROTOTYPE_SALT_FOR_MASTER_KEY = "your_unique_master_key_salt_v3_multi_profile_autofill_fixed";

function PasswordGenerator() {
    const { t, i18n } = useTranslation();
    const {
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
    } = useAppStorage();

    const [sessionMasterPassword, setSessionMasterPassword] = useState('');
    const [currentUrlForNewSite, setCurrentUrlForNewSite] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [generatedProfileData, setGeneratedProfileData] = useState(null);
    const [urlForAutofill, setUrlForAutofill] = useState('');
    const [isLoading, setIsLoadingState] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('new');

    const fileInputRef = useRef(null);

    const getTranslatedPasswordTypeOptions = useCallback(() => {
        return PASSWORD_TYPE_OPTIONS.map(opt => ({
            id: opt.id, 
            label: t(`passwordType_${opt.id}`, { defaultValue: opt.labelFallback })
        }));
    }, [t]);

    const getPasswordTypeLabel = useCallback((typeId) => {
        return t(`passwordType_${typeId}`, { defaultValue: typeId });
    }, [t]);


    const fetchAndUpdateCurrentUrl = useCallback(async (forceUpdate = false) => {
        if (chrome.tabs && chrome.tabs.query) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    console.warn("Error querying tabs:", chrome.runtime.lastError.message);
                    if ((activeTab === 'new' || (activeTab === 'saved' && !Object.keys(sites).length) || activeTab === 'settings') && (forceUpdate || !currentUrlForNewSite.trim()) && lastUsedUrl) {
                        setCurrentUrlForNewSite(lastUsedUrl);
                    }
                    return;
                }
                if (tabs && tabs.length > 0 && tabs[0].url) {
                    try {
                        const urlObject = new URL(tabs[0].url);
                        if (urlObject.protocol === "http:" || urlObject.protocol === "https:") {
                            const hostname = urlObject.hostname.startsWith('www.')
                                ? urlObject.hostname.substring(4)
                                : urlObject.hostname;
                            if (activeTab === 'new' && (forceUpdate || !currentUrlForNewSite.trim())) {
                                setCurrentUrlForNewSite(hostname);
                            }
                            updateLastUsedUrl(hostname);
                        } else if (((activeTab === 'new' || (activeTab === 'saved' && !Object.keys(sites).length)) || activeTab === 'settings') && (forceUpdate || !currentUrlForNewSite.trim()) && lastUsedUrl) {
                            setCurrentUrlForNewSite(lastUsedUrl);
                        }
                    } catch (e) {
                        console.warn("URL parse error for active tab:", e);
                        if (((activeTab === 'new' || (activeTab === 'saved' && !Object.keys(sites).length)) || activeTab === 'settings') && (forceUpdate || !currentUrlForNewSite.trim()) && lastUsedUrl) {
                            setCurrentUrlForNewSite(lastUsedUrl);
                        }
                    }
                } else if (((activeTab === 'new' || (activeTab === 'saved' && !Object.keys(sites).length)) || activeTab === 'settings') && lastUsedUrl) {
                    if (forceUpdate || !currentUrlForNewSite.trim()) {
                        setCurrentUrlForNewSite(lastUsedUrl);
                    }
                }
            });
        } else if (((activeTab === 'new' || (activeTab === 'saved' && !Object.keys(sites).length)) || activeTab === 'settings') && lastUsedUrl) {
            if (forceUpdate || !currentUrlForNewSite.trim()) {
                setCurrentUrlForNewSite(lastUsedUrl);
            }
        }
    }, [activeTab, currentUrlForNewSite, updateLastUsedUrl, lastUsedUrl, sites]);

    useEffect(() => {
        if (isSessionActive && sessionMasterPassword && !storageLoading) {
            fetchAndUpdateCurrentUrl(true);
        }
    }, [isSessionActive, sessionMasterPassword, storageLoading, fetchAndUpdateCurrentUrl]);

    useEffect(() => {
        if (activeTab === 'new' && isSessionActive && sessionMasterPassword && !storageLoading && !currentUrlForNewSite.trim() && lastUsedUrl) {
            setCurrentUrlForNewSite(lastUsedUrl);
        }
    }, [activeTab, isSessionActive, sessionMasterPassword, storageLoading, currentUrlForNewSite, lastUsedUrl]);

    const handleSetMasterPassword = (mp) => {
        setSessionMasterPassword(mp);
        updateIsSessionActive(true);
        setError('');
        const successMessage = t('message_sessionActive');
        setMessage(successMessage);
        setActiveTab('new');
        setTimeout(() => {
            setMessage(prev => prev === successMessage ? '' : prev);
        }, 3000);
    };

    const handleLogout = async () => {
        setSessionMasterPassword('');
        setGeneratedPassword('');
        setGeneratedProfileData(null);
        setUrlForAutofill('');
        const endedMessage = t('message_sessionEnded');
        setMessage(endedMessage);
        setError('');
        setCurrentUrlForNewSite('');
        await clearSessionData();
        setTimeout(() => {
            setMessage(prev => prev === endedMessage ? '' : prev);
        }, 3000);
    };

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setError('');
        if (tabName !== 'settings') { n
            setGeneratedPassword('');
            setGeneratedProfileData(null);
            setUrlForAutofill('');
        } else {
            // Ayarlar sekmesine geçildiğinde, diğer sekmelerdeki geçici mesajları temizle
            if (message && (message.includes(t('message_copiedToClipboard',{type:''}).split(' ')[0]) || message.includes(t('message_autofillAttempted')))) {
                setMessage('');
            }
        }
        if (tabName === 'new' && !currentUrlForNewSite.trim() && lastUsedUrl) {
            setCurrentUrlForNewSite(lastUsedUrl);
        }
    };

    const generateAndStorePassword = async (siteNameForGeneration, profileName, username, selectedPasswordType) => {
        if (!sessionMasterPassword || !isSessionActive) {
            setError(t('error_masterPasswordRequired'));
            return;
        }
        if (!siteNameForGeneration) {
            setError(t('error_urlRequired')); return;
        }
        setIsLoadingState(true);
        setError(''); setMessage(''); setGeneratedPassword(''); setGeneratedProfileData(null); setUrlForAutofill('');
        try {
            const actualCounter = DEFAULT_COUNTER;
            const derivedKey = await deriveKeyFromMasterPassword(sessionMasterPassword, PROTOTYPE_SALT_FOR_MASTER_KEY);
            const siteKey = await generateSiteKey(derivedKey, siteNameForGeneration, actualCounter);
            const chosenTemplateString = selectTemplateBySiteKey(siteKey, selectedPasswordType); // selectedPasswordType 'maxSecurity' gibi olmalı
            if (!chosenTemplateString) throw new Error(t('error_templateSelection'));
            const password = generatePasswordFromSiteKeyWithPaperTemplate(siteKey, chosenTemplateString);
            setGeneratedPassword(password);

            const defaultProfileName = username
                ? `${username} (${getPasswordTypeLabel(selectedPasswordType)})`
                : `${t('newSiteForm_profileLabelPlaceholder')} (${getPasswordTypeLabel(selectedPasswordType)})`;

            const newProfileData = {
                profileName: profileName || defaultProfileName,
                username: username || undefined,
                preferredPasswordType: selectedPasswordType,
                lastUsed: Date.now(),
            };
            const savedProfileWithId = await addOrUpdateSiteProfiles(siteNameForGeneration, newProfileData);
            setGeneratedProfileData(savedProfileWithId);
            setUrlForAutofill(siteNameForGeneration);
            const successMsg = t('message_profileCreatedAndPdwGenerated', { profileName: savedProfileWithId.profileName, siteName: siteNameForGeneration });
            setMessage(successMsg);
            await updateLastUsedUrl(siteNameForGeneration);
            setCurrentUrlForNewSite('');
            setTimeout(() => { setMessage(prev => prev === successMsg ? '' : prev); }, 3500);
        } catch (err) {
            console.error("New profile generation failed:", err);
            const errorMsg = t('error_profileGeneration', { errorMessage: err.message || t('error_unknown') });
            setError(errorMsg);
            setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3500);
        } finally {
            setIsLoadingState(false);
        }
    };

    const handleGenerateForExistingProfile = async (url, profileId) => {
        if (!sessionMasterPassword || !isSessionActive) {
            setError(t('error_masterPasswordRequired'));
            return;
        }
        if (!url || !profileId || !sites[url]) { setError(t('error_invalidSiteOrProfile')); return; }
        const profileToUse = sites[url].find(p => p.id === profileId);
        if (!profileToUse) { setError(t('error_profileNotFound')); return; }
        setIsLoadingState(true);
        setError(''); setMessage(''); setGeneratedPassword(''); setGeneratedProfileData(null); setUrlForAutofill('');
        try {
            const actualCounter = DEFAULT_COUNTER;
            const derivedKey = await deriveKeyFromMasterPassword(sessionMasterPassword, PROTOTYPE_SALT_FOR_MASTER_KEY);
            const siteKey = await generateSiteKey(derivedKey, url, actualCounter);
            const chosenTemplateString = selectTemplateBySiteKey(siteKey, profileToUse.preferredPasswordType);
            if (!chosenTemplateString) throw new Error(t('error_templateSelection'));
            const password = generatePasswordFromSiteKeyWithPaperTemplate(siteKey, chosenTemplateString);
            setGeneratedPassword(password);
            setGeneratedProfileData(profileToUse);
            setUrlForAutofill(url);
            const successMsg = t('message_passwordGenerated', { profileName: profileToUse.profileName, siteName: url });
            setMessage(successMsg);
            const updatedProfileWithLastUsed = { ...profileToUse, lastUsed: Date.now() };
            const updatedProfilesForUrl = sites[url].map(p =>
                p.id === profileId ? updatedProfileWithLastUsed : p
            );
            const updatedSitesData = { ...sites, [url]: updatedProfilesForUrl };
            await updateSites(updatedSitesData);
            await updateLastUsedUrl(url);
            setTimeout(() => { setMessage(prev => prev === successMsg ? '' : prev); }, 3500);
        } catch (err) {
            console.error("Existing profile generation failed:", err);
            const errorMsg = t('error_passwordGeneration', { errorMessage: err.message || t('error_unknown') });
            setError(errorMsg);
            setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3500);
        } finally {
            setIsLoadingState(false);
        }
    };

    const handleRemoveProfileCallback = async (siteUrl, profileId) => {
        setIsLoadingState(true);
        setError(''); setMessage('');
        try {
            await removeSiteProfile(siteUrl, profileId);
            const successMsg = t('message_profileDeleted');
            setMessage(successMsg);
            if (generatedProfileData && generatedProfileData.id === profileId && urlForAutofill === siteUrl) {
                setGeneratedPassword('');
                setGeneratedProfileData(null);
                setUrlForAutofill('');
            }
            setTimeout(() => { setMessage(prev => prev === successMsg ? '' : prev); }, 3000);
        } catch (error) {
            console.error("Error removing profile in PasswordGenerator:", error);
            const errorMsg = t('error_profileDeletion', { errorMessage: error.message || t('error_unknown') });
            setError(errorMsg);
            setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3000);
        } finally {
            setIsLoadingState(false);
        }
    };

    const handleAutofillTrigger = async (targetSiteUrl, usernameToFill, passwordToFill) => {
        if (!chrome.tabs || !chrome.scripting) {
            setError(t('error_autofillApiNotFound'));
            return;
        }
        const attemptMsg = t('message_autofillAttempted');
        setMessage(attemptMsg); // Önce mesajı set et
        setError('');
        try {
            const [activeTabInfo] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTabInfo || !activeTabInfo.id) {
                setError(t('error_activeTabNotFound'));
                setMessage(''); // Hata varsa mesajı temizle
                return;
            }
            const usernameArg = usernameToFill || null;
            const passwordArg = passwordToFill || "";
            await chrome.scripting.executeScript({
                target: { tabId: activeTabInfo.id },
                func: (username, password) => {
                    const findUsernameFieldOnPage = () => {
                        let field = document.querySelector('input[type="email"]:not([disabled]):not([readonly])');
                        if (field && field.offsetParent !== null) return field;
                        const commonNames = ['username', 'login', 'user', 'email', 'userid', 'auth-username', 'auth-login', 'identifier'];
                        for (const name of commonNames) {
                            field = document.querySelector(`input[name*="${name}"i]:not([disabled]):not([readonly]), input[id*="${name}"i]:not([disabled]):not([readonly])`);
                            if (field && field.offsetParent !== null && field.type !== 'hidden') return field;
                        }
                        const textInputs = document.querySelectorAll('input[type="text"]:not([disabled]):not([readonly]), input:not([type]):not([disabled]):not([readonly])');
                        for (let input of textInputs) {
                            if (input.offsetParent !== null && input.type !== 'hidden') {
                                const placeholder = (input.placeholder || '').toLowerCase();
                                const nameAttr = (input.name || '').toLowerCase();
                                const idAttr = (input.id || '').toLowerCase();
                                if (placeholder.includes('user') || placeholder.includes('mail') || placeholder.includes('kullanıcı') ||
                                    nameAttr.includes('user') || nameAttr.includes('mail') || nameAttr.includes('kullanıcı') ||
                                    idAttr.includes('user') || idAttr.includes('mail') || idAttr.includes('kullanıcı')) {
                                    return input;
                                }
                            }
                        }
                        const allVisibleTextInputs = Array.from(document.querySelectorAll('input[type="text"]:not([disabled]):not([readonly]), input[type="email"]:not([disabled]):not([readonly]), input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="password"]):not([disabled]):not([readonly])'))
                            .filter(el => el.offsetParent !== null);
                        const passField = document.querySelector('input[type="password"]:not([disabled]):not([readonly])');
                        if (passField && passField.offsetParent !== null) {
                            const passFieldIndex = allVisibleTextInputs.indexOf(passField);
                            if (passFieldIndex > 0 && allVisibleTextInputs[passFieldIndex -1]) return allVisibleTextInputs[passFieldIndex -1];
                        }
                        return allVisibleTextInputs.length > 0 ? allVisibleTextInputs[0] : null;
                    };
                    const findPasswordFieldOnPage = () => {
                        const fields = document.querySelectorAll('input[type="password"]:not([disabled]):not([readonly])');
                        for (let field of fields) {
                            if (field.offsetParent !== null && field.type !== 'hidden') return field;
                        }
                        return null;
                    };
                    const usernameField = findUsernameFieldOnPage();
                    const passwordField = findPasswordFieldOnPage();
                    if (usernameField && username) {
                        usernameField.value = username;
                        usernameField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        usernameField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    }
                    if (passwordField && password) {
                        passwordField.value = password;
                        passwordField.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        passwordField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    }
                },
                args: [usernameArg, passwordArg]
            });
            setTimeout(() => { setMessage(prev => prev === attemptMsg ? '' : prev); }, 3500);
        } catch (e) {
            console.error("Autofill error in PasswordGenerator:", e);
            const errorMsg = t('error_autofillError', { errorMessage: e.message || t('error_unknown') });
            setError(errorMsg);
            setMessage(''); // Hata varsa mesajı temizle
            setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3500);
        }
    };

    const handleAutofillFromList = async (siteUrl, profileToUse) => {
        if (!sessionMasterPassword || !isSessionActive) {
            setError(t('error_masterPasswordRequired'));
            return;
        }
        if (!siteUrl || !profileToUse || !profileToUse.id || !profileToUse.preferredPasswordType) {
            setError(t('error_invalidSiteOrProfile'));
            return;
        }
        setIsLoadingState(true);
        setError('');
        try {
            const actualCounter = DEFAULT_COUNTER;
            const derivedKey = await deriveKeyFromMasterPassword(sessionMasterPassword, PROTOTYPE_SALT_FOR_MASTER_KEY);
            const siteKey = await generateSiteKey(derivedKey, siteUrl, actualCounter);
            const chosenTemplateString = selectTemplateBySiteKey(siteKey, profileToUse.preferredPasswordType);
            if (!chosenTemplateString) throw new Error(t('error_templateSelection'));
            const password = generatePasswordFromSiteKeyWithPaperTemplate(siteKey, chosenTemplateString);

            await handleAutofillTrigger(siteUrl, profileToUse.username, password);

            const updatedProfileWithLastUsed = { ...profileToUse, lastUsed: Date.now() };
            const updatedProfilesForUrl = sites[siteUrl]?.map(p =>
                p.id === profileToUse.id ? updatedProfileWithLastUsed : p
            ) || [];
            if (sites[siteUrl]) {
                const updatedSitesData = { ...sites, [siteUrl]: updatedProfilesForUrl };
                await updateSites(updatedSitesData);
            }
        } catch (err) {
            console.error("Autofill from list failed:", err);
            const errorMsg = t('error_autofillError', { errorMessage: err.message || t('error_unknown') });
            setError(errorMsg);
            setMessage(''); // Hata varsa mesajı temizle
            setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3500);
        } finally {
            setIsLoadingState(false);
        }
    };


    const handleCopy = (textToCopy, typeKey) => {
        const typeLabel = t(typeKey).replace(':', '');
        if (textToCopy === null || typeof textToCopy === 'undefined' || textToCopy === "") {
            const nothingMsg = t('message_nothingToCopy', { type: typeLabel.toLowerCase() });
            setMessage(nothingMsg);
            setTimeout(() => { setMessage(prev => prev === nothingMsg ? '' : prev);}, 2000);
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const copiedMsg = t('message_copiedToClipboard', { type: typeLabel });
                    setMessage(copiedMsg);
                    setTimeout(() => { setMessage(prev => prev === copiedMsg ? '' : prev);}, 2000);
                })
                .catch((err) => {
                    console.error(`${typeLabel} copy failed: `, err);
                    const failedMsg = t('error_copyFailed', { type: typeLabel.toLowerCase() });
                    setError(failedMsg);
                    setTimeout(() => { setError(prev => prev === failedMsg ? '' : prev); }, 3000);
                });
        } else {
            const unsupportedMsg = t('error_clipboardUnsupported');
            setError(unsupportedMsg);
            setTimeout(() => { setError(prev => prev === unsupportedMsg ? '' : prev); }, 3000);
        }
    };

    const handleExportData = () => {
        setIsLoadingState(true);
        setError('');
        const dataStr = exportSiteData();
        if (dataStr) {
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "password_manager_data_export.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            const successMsg = t('message_dataExported');
            setMessage(successMsg);
            setTimeout(() => { setMessage(prev => prev === successMsg ? '' : prev); }, 3000);
        } else {
            const errorMsg = t('error_dataExport');
            setError(errorMsg);
            setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3000);
        }
        setIsLoadingState(false);
    };

    const handleImportDataChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!window.confirm(t('settings_importData_confirm'))) {
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setIsLoadingState(true);
        setError(''); setMessage('');
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonString = e.target.result;
                const success = await importSiteData(jsonString, true); // merge=true
                if (success) {
                    const successMsg = t('message_dataImported');
                    setMessage(successMsg);
                    setTimeout(() => { setMessage(prev => prev === successMsg ? '' : prev); }, 3000);
                }
            } catch (err) {
                const errorMsg = t('error_dataImport', { errorMessage: err.message || t('error_invalidFileFormat') });
                setError(errorMsg);
                setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3000);
            } finally {
                setIsLoadingState(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.onerror = () => {
            const errorMsg = t('error_fileRead');
            setError(errorMsg);
            setIsLoadingState(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setTimeout(() => { setError(prev => prev === errorMsg ? '' : prev); }, 3000);
        };
        reader.readAsText(file);
    };

    const handleLanguageChange = (event) => {
        updateCurrentLanguage(event.target.value);
    };


    if (storageLoading) {
        return <div className="container-sm p-4 text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">{t('storageLoading')}</span></div><p className="mt-2">{t('storageLoading')}</p></div>;
    }

    if (!isSessionActive || !sessionMasterPassword) {
        return (
            <MasterPasswordPrompt
                onSetMasterPassword={handleSetMasterPassword}
                initialMessageKey={isSessionActive && !sessionMasterPassword ? "masterPasswordPrompt_title_verify" : "masterPasswordPrompt_title"}
                existingError={error}
            />
        );
    }

    return (
        <>
            <nav className="fixed-top-navbar" role="banner" aria-label={t('appTitle')}>
                <div className="navbar-left">
                    <img src="/ontheflylogo.png" alt={t('appTitle')} className="navbar-logo" />
                </div>
                <div className="navbar-center">
                    <span className="navbar-title">{t('appTitle')}</span>
                </div>
                <div className="navbar-right">
                    <button
                        onClick={handleLogout}
                        className="btn btn-sm btn-outline-danger logout-button-top"
                        title={t('sessionControls_logout')}
                        aria-label={t('sessionControls_logout')}
                    >
                        <i className="bi bi-box-arrow-right"></i>
                    </button>
                </div>
            </nav>

            <div
                className="password-generator-container container-sm"
                style={{ marginTop: '70px', marginBottom: '70px' }}
            >
                {message && !error && <div className="alert alert-success" role="alert">{message}</div>}
                {error && <div className="alert alert-danger" role="alert">{error}</div>}

                {activeTab === "new" && (
                    <NewSiteForm
                        onGenerateAndSaveProfile={generateAndStorePassword}
                        isLoading={isLoading}
                        currentUrl={currentUrlForNewSite}
                        setCurrentUrl={setCurrentUrlForNewSite}
                        passwordTypeOptions={getTranslatedPasswordTypeOptions()}
                    />
                )}
                {activeTab === "saved" && (
                    <SavedSitesList
                        sites={sites}
                        onGenerateForProfile={handleGenerateForExistingProfile}
                        isLoading={isLoading}
                        onRemoveProfile={handleRemoveProfileCallback}
                        onAutofill={handleAutofillFromList} // Yeni prop
                    />
                )}
                {activeTab === "settings" && (
                    <div className="tab-content settings-tab">
                        <h3 className="mb-4">{t('settings_title')}</h3>
                        <div className="settings-section mb-3">
                            <h4 className="h6">{t('settings_language_title')}</h4>
                            <div className="input-group">
                                <label htmlFor="language-select" className="form-label">{t('settings_language_selectLabel')}</label>
                                <select
                                    id="language-select"
                                    value={currentLanguage}
                                    onChange={handleLanguageChange}
                                    disabled={isLoading}
                                    className="form-select"
                                >
                                    <option value="tr">Türkçe</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>
                        <div className="settings-section mb-3">
                            <h4 className="h6">{t('settings_exportData_title')}</h4>
                            <p>{t('settings_exportData_description')}</p>
                            <button
                                onClick={handleExportData}
                                disabled={isLoading || Object.keys(sites).length === 0}
                                className="btn btn-info settings-button"
                            >
                                {t('settings_exportData_button')}
                            </button>
                            {Object.keys(sites).length === 0 && <div className="alert alert-info mt-2">{t('settings_exportData_noData')}</div>}
                        </div>
                        <div className="settings-section">
                            <h4 className="h6">{t('settings_importData_title')}</h4>
                            <p>{t('settings_importData_description')}</p>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportDataChange}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                id="import-file-input"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                disabled={isLoading}
                                className="btn btn-info settings-button"
                            >
                                {t('settings_importData_button')}
                            </button>
                        </div>
                    </div>
                )}

                {(activeTab === "new" || activeTab === "saved") && (generatedPassword || generatedProfileData) && (
                    <PasswordOutput
                        generatedPassword={generatedPassword}
                        profileData={generatedProfileData}
                        onCopyPassword={() => handleCopy(generatedPassword, "passwordOutput_passwordLabel")}
                        onCopyUsername={() => handleCopy(generatedProfileData?.username, "passwordOutput_usernameLabel")}
                        currentSiteUrlForAutofill={urlForAutofill}
                        onAutofillTrigger={handleAutofillTrigger}
                    />
                )}
            </div>

            <nav className="fixed-bottom-tabbar" role="navigation" aria-label={t('appTitle') + " Tabs"}>
                <div className="left-buttons">
                    <button
                        className={activeTab === "new" ? "active" : ""}
                        onClick={() => handleTabChange("new")}
                        title={t('tab_newProfile')}
                        aria-label={t('tab_newProfile')}
                    >
                        <i className="bi bi-plus-circle"></i>
                        <span>{t('tab_newProfile')}</span>
                    </button>
                    <button
                        className={activeTab === "saved" ? "active" : ""}
                        onClick={() => handleTabChange("saved")}
                        title={t('tab_savedProfiles')}
                        aria-label={t('tab_savedProfiles')}
                    >
                        <i className="bi bi-list-stars"></i>
                        <span>{t('tab_savedProfiles')}</span>
                    </button>
                    <button
                        className={activeTab === "settings" ? "active" : ""}
                        onClick={() => handleTabChange("settings")}
                        title={t('tab_settings')}
                        aria-label={t('tab_settings')}
                    >
                        <i className="bi bi-gear"></i>
                        <span>{t('tab_settings')}</span>
                    </button>
                </div>
            </nav>
        </>
    );
}

export default PasswordGenerator;