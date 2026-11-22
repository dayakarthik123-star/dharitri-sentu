import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { UI_DICTIONARY } from './dictionary';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyOrPhrase: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('dharitri_lang');
      if (saved === 'as' || saved === 'hi' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem('dharitri_lang', lang);
    } catch {}
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dharitri-language-changed', { detail: { language: lang } }));
    }
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dharitri_lang' && (e.newValue === 'as' || e.newValue === 'hi' || e.newValue === 'en')) {
        setLanguageState(e.newValue as Language);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = (keyOrPhrase: string): string => {
    if (!keyOrPhrase) return '';
    const clean = keyOrPhrase.trim();
    if (language === 'en') return clean;
    const dict = UI_DICTIONARY[language] || {};
    if (dict[clean]) return dict[clean];
    const match = Object.keys(dict).find((k) => k.toLowerCase() === clean.toLowerCase());
    if (match && dict[match]) return dict[match];
    return clean;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (s: string) => s,
    };
  }
  return context;
};
