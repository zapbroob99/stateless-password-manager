// src/components/NewSiteForm.jsx
import React, { useState, useEffect } from 'react'; // useEffect eklendi
import { useTranslation } from 'react-i18next';

function NewSiteForm({ onGenerateAndSaveProfile, isLoading, currentUrl: propCurrentUrl, /* setCurrentUrl kaldırıldı */ passwordTypeOptions }) {
    const { t } = useTranslation();
    const [localUrl, setLocalUrl] = useState(propCurrentUrl || ''); // Lokal state
    const [profileNameInput, setProfileNameInput] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [passwordType, setPasswordTypeState] = useState('maxSecurity');

    useEffect(() => {
        if (propCurrentUrl !== localUrl) {
            setLocalUrl(propCurrentUrl || '');
        }
    }, [propCurrentUrl]); // Sadece propCurrentUrl değiştiğinde çalışır

    const handleLocalUrlChange = (e) => {
        setLocalUrl(e.target.value);
    };

    const handleSubmit = () => {
        // Form gönderiminde lokal URL kullanılır
        if (!localUrl.trim()) {
        }
        const selectedOption = passwordTypeOptions.find(opt => opt.id === passwordType);
        const selectedTypeLabel = selectedOption ? selectedOption.label : passwordType;

        const defaultBaseName = usernameInput.trim() || t('newSiteForm_profileLabelPlaceholder');
        const profileNameToSave = profileNameInput.trim() || `${defaultBaseName} (${selectedTypeLabel})`;


        onGenerateAndSaveProfile(
            localUrl.trim(),
            profileNameToSave,
            usernameInput.trim(),
            passwordType
        );
    };

    return (
        <div className="tab-content">
            <h3>{t('newSiteForm_title')}</h3>
            <div className="input-group">
                <label htmlFor="newUrl">{t('newSiteForm_urlLabel')}</label>
                <input
                    type="text"
                    id="newUrl"
                    value={localUrl} // Lokal state'e bağlandı
                    placeholder={t('newSiteForm_urlPlaceholder')}
                    onChange={handleLocalUrlChange} // Lokal state'i güncelleyen handler
                    disabled={isLoading}
                />
            </div>
            <div className="input-group">
                <label htmlFor="newProfileName">{t('newSiteForm_profileLabelLabel')}</label>
                <input
                    type="text" id="newProfileName" value={profileNameInput} placeholder={t('newSiteForm_profileLabelPlaceholder')}
                    onChange={(e) => setProfileNameInput(e.target.value)} disabled={isLoading}
                />
            </div>
            <div className="input-group">
                <label htmlFor="newUsername">{t('newSiteForm_usernameLabel')}</label>
                <input
                    type="text" id="newUsername" value={usernameInput} placeholder={t('newSiteForm_usernamePlaceholder')}
                    onChange={(e) => setUsernameInput(e.target.value)} disabled={isLoading}
                />
            </div>
            <div className="input-group">
                <label htmlFor="passwordTypeSelectNew">{t('newSiteForm_passwordTypeLabel')}</label>
                <select
                    id="passwordTypeSelectNew" value={passwordType}
                    onChange={(e) => setPasswordTypeState(e.target.value)} disabled={isLoading}
                >
                    {passwordTypeOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <button onClick={handleSubmit} disabled={isLoading || !localUrl.trim()}>
                {t('newSiteForm_generateAndSaveButton')}
            </button>
        </div>
    );
}
export default NewSiteForm;