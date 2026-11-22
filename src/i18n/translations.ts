import { Language } from '../types';
import enJson from './locales/en.json';
import asJson from './locales/as.json';
import hiJson from './locales/hi.json';
import { FORM_PHRASES_AS, FORM_PHRASES_HI } from './phraseTranslations';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: enJson,
  as: asJson,
  hi: hiJson,
};

export { FORM_PHRASES_AS, FORM_PHRASES_HI };
