// src/components/PasswordOutput.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './PasswordGenerator.css';

function PasswordOutput({
                            generatedPassword,
                            profileData,
                            onCopyPassword,
                            onCopyUsername,
                            currentSiteUrlForAutofill,
                            onAutofillTrigger
                        }) {
    const { t } = useTranslation();


    if (!generatedPassword && !profileData?.username) {
        return null;
    }
    if (!generatedPassword && (!profileData || !profileData.username)) {
        return null;
    }

    const siteUsername = profileData?.username || null;
    const profileName = profileData?.profileName;

    const handleFillPage = () => {
        if (onAutofillTrigger && currentSiteUrlForAutofill) {
            onAutofillTrigger(currentSiteUrlForAutofill, siteUsername, generatedPassword);
        }
    };

    const copyPasswordLabel = t('passwordOutput_copyButton');
    const copyUsernameLabel = t('passwordOutput_copyButton');

    return (
        <div className="output-group">
            <h3>
                {t('passwordOutput_title')}
                {profileName && ` ${t('passwordOutput_profileLabel', { profileName })}`}
            </h3>

            {siteUsername && (
                <div className="info-display-item">
                    <label htmlFor="outputUsername">{t('passwordOutput_usernameLabel')}</label>
                    <div className="value-with-button">
                        <input type="text" id="outputUsername" value={siteUsername} readOnly />
                        <button onClick={onCopyUsername} className="copy-button-small" title={copyUsernameLabel}>{copyUsernameLabel}</button>
                    </div>
                </div>
            )}

            {generatedPassword && (
                <div className="info-display-item">
                    <label htmlFor="outputPassword">{t('passwordOutput_passwordLabel')}</label>
                    <div className="value-with-button">
                        <input type="text" id="outputPassword" value={generatedPassword} readOnly />
                        <button onClick={onCopyPassword} className="copy-button-small" title={copyPasswordLabel}>{copyPasswordLabel}</button>
                    </div>
                </div>
            )}

            {generatedPassword && (
                <button
                    onClick={handleFillPage}
                    disabled={!currentSiteUrlForAutofill || !generatedPassword}
                    title={currentSiteUrlForAutofill
                        ? t('passwordOutput_autofillButton_title', { siteUrl: currentSiteUrlForAutofill })
                        : t('passwordOutput_autofillButton_disabledTitle')}
                    className="autofill-button"
                >
                    {t('passwordOutput_autofillButton')}
                </button>
            )}
        </div>
    );
}

export default PasswordOutput;