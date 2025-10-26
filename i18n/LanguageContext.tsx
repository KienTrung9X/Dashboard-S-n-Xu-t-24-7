// i18n/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { en, vi, Translations } from './locales';

type Language = 'en' | 'vi';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: keyof Translations, options?: { [key: string]: string | number }) => string;
}

const translations: Record<Language, Translations> = { en, vi };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const storedLang = localStorage.getItem('language');
        return (storedLang === 'en' || storedLang === 'vi') ? storedLang : 'vi'; // Default to Vietnamese
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = useCallback((key: keyof Translations, options?: { [key: string]: string | number }): string => {
        let translation = translations[language][key] || key;
        if (options) {
            Object.keys(options).forEach(optKey => {
                translation = translation.replace(`{{${optKey}}}`, String(options[optKey]));
            });
        }
        return translation;
    }, [language]);
    
    const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
