// src/components/SavedSitesList.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getFaviconUrl } from '../utils/uiUtils'; // Favicon için utility fonksiyonu

function SavedSitesList({ sites, onGenerateForProfile, isLoading, onRemoveProfile, onAutofill }) {
    const { t } = useTranslation();

    const getSortedSiteUrls = () => {
        return Object.keys(sites).sort((aUrl, bUrl) => {
            // lastUsed tanımsız veya null ise 0 kabul et
            const aLastUsedTime = Math.max(...(sites[aUrl]?.map(p => p.lastUsed || 0).filter(Boolean) || [0]));
            const bLastUsedTime = Math.max(...(sites[bUrl]?.map(p => p.lastUsed || 0).filter(Boolean) || [0]));
            return bLastUsedTime - aLastUsedTime;
        });
    };

    const handleRemoveProfile = (siteUrl, profileId, profileName) => {
        const confirmMessage = t('savedSitesList_confirmDeleteProfile', {
            profileName: profileName || t('newSiteForm_profileLabelPlaceholder'),
            siteUrl: siteUrl
        });
        if (window.confirm(confirmMessage)) {
            onRemoveProfile(siteUrl, profileId);
        }
    };

    const getPasswordTypeLabel = (typeId) => {
        // typeId 'maxSecurity', 'long' etc. olmalı
        return t(`passwordType_${typeId}`, { defaultValue: typeId });
    };

    const handleAutofillClick = (siteUrl, profile) => {
        if (onAutofill) {
            onAutofill(siteUrl, profile);
        }
    };

    const handleFaviconError = (event) => {
        event.target.src = '/icon48.png'; // Varsayılan eklenti ikonu
        event.target.onerror = null; // Sonsuz döngüyü engelle
    };

    return (
        <div className="tab-content">
            <h3 className="text-center mb-3">{t('savedSitesList_title')}</h3>
            <div className="saved-sites-accordion">
                {getSortedSiteUrls().length > 0 ? (
                    getSortedSiteUrls().map((siteUrl) => (
                        <div key={siteUrl} className="site-group">
                            <div className="site-group-header">
                                <img
                                    src={getFaviconUrl(siteUrl)} // Boyut varsayılan olarak 16 (uiUtils'da ayarlandı)
                                    alt="" // Alt text site adı olabilir veya boş
                                    className="site-favicon me-2" // CSS class ve Bootstrap margin
                                    onError={handleFaviconError}
                                    width="16" height="16"
                                    loading="lazy" // Lazy loading for favicons
                                />
                                <h4>{siteUrl} {t('savedSitesList_profilesCount', { count: sites[siteUrl]?.length || 0 })}</h4>
                            </div>
                            <ul className="list-group list-group-flush">
                                {(sites[siteUrl] || []).sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)).map((profile) => (
                                    <li key={profile.id} className="list-group-item">
                                        <div className="profile-info-container">
                                            <div className="profile-name-display">
                                                {profile.profileName || t('newSiteForm_profileLabelPlaceholder')}
                                            </div>
                                            {/* Kullanıcı adı ve parola tipi ayrı div'lerde daha iyi okunabilirlik için */}
                                            {profile.username && (
                                                <div className="username-display-list">
                                                    <span className="meta-label">{t('savedSitesList_usernameLabel_short') || 'K.Adı:'}</span>
                                                    <span className="meta-value">{profile.username}</span>
                                                </div>
                                            )}
                                            <div className="password-type-display-list">
                                                <span className="meta-label">{t('savedSitesList_passwordTypeLabel_short') || 'Tip:'}</span>
                                                <span className="meta-value">{getPasswordTypeLabel(profile.preferredPasswordType)}</span>
                                            </div>
                                        </div>
                                        <div className="profile-actions">
                                            <button
                                                className="btn btn-sm btn-success generate-for-saved-btn"
                                                onClick={() => onGenerateForProfile(siteUrl, profile.id)}
                                                disabled={isLoading}
                                                title={t('savedSitesList_generateButton')}
                                            >
                                                <i className="bi bi-key-fill"></i>
                                            </button>
                                            <button
                                                className="btn btn-sm btn-info autofill-from-list-btn"
                                                onClick={() => handleAutofillClick(siteUrl, profile)}
                                                disabled={isLoading}
                                                title={t('passwordOutput_autofillButton')}
                                            >
                                                <i className="bi bi-magic"></i>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveProfile(siteUrl, profile.id, profile.profileName)}
                                                className="btn btn-sm remove-profile-icon-btn" // Bu özel class CSS'te stil alıyor
                                                title={t('savedSitesList_deleteProfileButton')}
                                                aria-label={t('savedSitesList_deleteProfileButton')}
                                                disabled={isLoading}
                                            >
                                                <i className="bi bi-trash3"></i>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-muted mt-3">{t('savedSitesList_noProfiles')}</p>
                )}
            </div>
        </div>
    );
}
export default SavedSitesList;