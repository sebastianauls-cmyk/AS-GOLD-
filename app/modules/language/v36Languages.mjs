// Compatibility facade. Active code must treat languageRegistry.mjs as the single language source.
export {
  LANGUAGE_CATALOG,
  supportedLanguages,
  rtlLanguages,
  localeForLanguage,
  outputLanguageNames,
  pageTranslations,
  languageByKey,
  isSupportedLanguage
} from './languageRegistry.mjs'
