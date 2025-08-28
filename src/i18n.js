import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en.json';
import translationTR from './locales/tr.json';

const resources = {
    en: {
        translation: translationEN
    },
    tr: {
        translation: translationTR
    }
};

const PREFERRED_LANG_KEY = 'preferredLanguage_v1';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: PREFERRED_LANG_KEY,
            caches: ['localStorage']
        }
    });

export const getPreferredLangKey = () => PREFERRED_LANG_KEY;
export default i18n;