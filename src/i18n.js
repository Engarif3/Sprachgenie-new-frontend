import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEn from "./locales/en/common.json";
import homeEn from "./locales/en/home.json";
import commonDe from "./locales/de/common.json";
import homeDe from "./locales/de/home.json";

const resources = {
  en: {
    common: commonEn,
    home: homeEn,
  },
  de: {
    common: commonDe,
    home: homeDe,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    ns: ["common", "home"],
    defaultNS: "common",
  });

// Sync language with localStorage on initialization
const savedLang = localStorage.getItem("language");
if (savedLang) {
  i18n.changeLanguage(savedLang);
}

export default i18n;
