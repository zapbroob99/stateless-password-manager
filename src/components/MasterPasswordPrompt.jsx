// src/components/MasterPasswordPrompt.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkPasswordPwned } from '../utils/securityUtils';

function MasterPasswordPrompt({ onSetMasterPassword, initialMessageKey, existingError }) {
    const { t } = useTranslation();
    const [tempMasterPassword, setTempMasterPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [warningMessage, setWarningMessage] = useState('');

    // existingError prop'u değiştiğinde localError'u güncelle
    useEffect(() => {
        if (existingError) {
            setLocalError(existingError); // Hata zaten çevrilmiş olabilir veya burada çevrilmeli
        }
    }, [existingError]);

    const handleSubmit = async (proceedOverride = false) => {
        if (!tempMasterPassword) {
            setLocalError(t('masterPasswordPrompt_error_enterPassword'));
            setWarningMessage('');
            return;
        }

        setIsLoading(true);
        setLocalError('');
        if (!proceedOverride) {
            setWarningMessage('');
        }


        try {
            // Sadece uyarı yoksa veya proceedOverride ile geliniyorsa pwned kontrolü yap
            // veya her zaman yapıp, proceedOverride'de sonucu yoksay.
            // Şimdilik: Eğer uyarı yoksa veya farklı bir parola girilmişse kontrol et.
            let isPwned = false;
            if (!warningMessage || proceedOverride) {
                isPwned = await checkPasswordPwned(tempMasterPassword);
            }


            if (isPwned && !proceedOverride) {
                setWarningMessage(
                    `${t('masterPasswordPrompt_pwnedWarning_intro')} ${t('masterPasswordPrompt_pwnedWarning_recommendation')} ${t('masterPasswordPrompt_pwnedWarning_question')}`
                );
            } else {
                // Sızdırılmamışsa, veya kullanıcı "Yine de Devam Et" dediyse (proceedOverride),
                // veya kontrol başarısızsa (güvenli tarafta kalıp) devam et
                onSetMasterPassword(tempMasterPassword);
            }
        } catch (error) {
            setLocalError(t('masterPasswordPrompt_error_generic'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceedWithPwnedPassword = () => {
        setWarningMessage(''); // Uyarıyı temizle
        handleSubmit(true); // proceedOverride = true ile gönder
    };

    const initialMessageText = initialMessageKey ? t(initialMessageKey) : t('masterPasswordPrompt_title');
    const descriptionTextKey = initialMessageKey === "masterPasswordPrompt_title_verify"
        ? "masterPasswordPrompt_verifyDescription"
        : "masterPasswordPrompt_description";

    return (
        <div className="master-password-prompt">
            <h2>{initialMessageText}</h2>
            <p>{t(descriptionTextKey)}</p>

            {localError && !warningMessage && <p className="message error">{localError}</p>}
            {warningMessage && (
                <div className="message warning">
                    <p>{warningMessage}</p>
                    <button onClick={handleProceedWithPwnedPassword} disabled={isLoading} className="proceed-button">
                        {t('button_proceedAnyway')}
                    </button>
                    <button onClick={() => {
                        setTempMasterPassword('');
                        setWarningMessage('');
                        setLocalError(t('masterPasswordPrompt_error_changePassword'));
                    }} disabled={isLoading} className="change-button">
                        {t('button_changePassword')}
                    </button>
                </div>
            )}

            {!warningMessage && (
                <>
                    <div className="input-group">
                        <label htmlFor="sessionMasterPasswordInput">{t('masterPasswordPrompt_placeholder')}:</label>
                        <input
                            type="password"
                            id="sessionMasterPasswordInput"
                            value={tempMasterPassword}
                            onChange={(e) => {
                                setTempMasterPassword(e.target.value);
                                if (localError) setLocalError('');
                                // Eğer kullanıcı yeni bir şey yazmaya başlarsa ve pwned uyarısı varsa,
                                // bu uyarıyı temizleyebiliriz ki yeni parola için tekrar kontrol edilsin.
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
                            placeholder={t('masterPasswordPrompt_placeholder')}
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                    <button onClick={() => handleSubmit()} disabled={isLoading || !tempMasterPassword}>
                        {isLoading
                            ? t('button_loading')
                            : (initialMessageKey === "masterPasswordPrompt_title_verify"
                                ? t('button_verifyAndContinue')
                                : t('button_setMasterPassword'))
                        }
                    </button>
                </>
            )}
        </div>
    );
}

export default MasterPasswordPrompt;