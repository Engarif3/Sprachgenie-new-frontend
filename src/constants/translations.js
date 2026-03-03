export const translations = {
  en: {
    // Navbar
    home: "Home",
    vocabulary: "Vocabulary",
    dashboard: "Dashboard",
    favorites: "Favorites",
    login: "Log In",
    logout: "Log Out",
    profile: "Profile",
    language: "Language",
    german: "Deutsch",
    english: "English",

    // Home Page
    heroTitle: "Master German with",
    heroTitleHighlight: "AI-Powered",
    heroTitleEnd: "Learning",
    heroDescription:
      "From vocabulary to conversations, grammar to stories - your complete German learning journey starts here",
    bannerMessage:
      "to unleash AI-powered magic and step into the future of learning!",
    loginPrompt:
      "Log in to unleash AI-powered magic and step into the future of learning!",
    loginToUnlock: "Log In",
    featuresUnlocked: "Features You'll Unlock When You Log In",
    exploreVocabulary: "Explore 4500+ Vocabulary Words",
    startLearning: "Start Learning Now",
    startLearningSubtitle:
      "Sign up today and begin your German learning journey",

    // Feature Cards
    favoriteWords: "Favorite Words",
    favoriteWordsDesc: "Save words to your personal collection",
    aiPoweredLearning: "AI-Powered Learning",
    aiPoweredLearningDesc: "Personalized lessons adapted to your level",
    translationFeatures: "Translation Features",
    translationFeaturesDesc: "Instant German to English translation",
    personalDashboard: "Personal Dashboard",
    personalDashboardDesc: "All features in one place",
    progressTracking: "Progress Tracking",
    progressTrackingDesc: "Track your progress and achievements",
    muchMore: "Much More",
    muchMoreDesc: "Exclusive features to boost your learning",

    // How It Works
    howItWorks: "How It Works",
    stepOne: "Select a topic and difficulty level",
    stepTwo: "AI generates personalized learning materials",
    stepThree: "Learn, practice, and track your progress",
    stepFour: "Achieve linguistic fluency with AI guidance",

    // Contact
    getInTouch: "Get In Touch",
    contactForm: "Contact Us",
    email: "Email",
    message: "Message",
    send: "Send",
    sendingMessage: "Sending message...",
    messageSent: "Message sent successfully!",
    tryAgain: "Try again",

    // Footer
    allRightsReserved: "All Rights Reserved",
    company: "Company",
    about: "About",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    support: "Support",
    contact: "Contact Us",
  },
  de: {
    // Navbar
    home: "Startseite",
    vocabulary: "Vokabeln",
    dashboard: "Dashboard",
    favorites: "Favoriten",
    login: "Anmelden",
    logout: "Abmelden",
    profile: "Profil",
    language: "Sprache",
    german: "Deutsch",
    english: "English",

    // Home Page
    heroTitle: "Beherrsche Deutsch mit",
    heroTitleHighlight: "KI-gestütztem",
    heroTitleEnd: "Lernen",
    heroDescription:
      "Von Vokabeln bis zu Gesprächen, Grammatik bis zu Geschichten - deine komplette Reise zum Deutschlernen beginnt hier",
    bannerMessage:
      "um die KI-gestützte Magie zu entfesseln und trete in die Zukunft des Lernens ein!",
    loginPrompt:
      "Melde dich an, um die KI-gestützte Magie zu entfesseln und trete in die Zukunft des Lernens ein!",
    loginToUnlock: "Anmelden",
    featuresUnlocked:
      "Funktionen, die du freigeschaltet hast, wenn du dich anmeldest",
    exploreVocabulary: "Erkunde 4500+ Vokabelwörter",
    startLearning: "Jetzt mit dem Lernen beginnen",
    startLearningSubtitle:
      "Melde dich heute an und beginne deine Deutschlernreise",

    // Feature Cards
    favoriteWords: "Lieblingswörter",
    favoriteWordsDesc: "Speichere Wörter in deiner persönlichen Sammlung",
    aiPoweredLearning: "KI-gestütztes Lernen",
    aiPoweredLearningDesc: "Personalisierte Lektionen angepasst an dein Niveau",
    translationFeatures: "Übersetzungsfunktionen",
    translationFeaturesDesc: "Sofortige Übersetzung von Deutsch zu Englisch",
    personalDashboard: "Persönliches Dashboard",
    personalDashboardDesc: "Alle Funktionen an einem Ort",
    progressTracking: "Fortschrittsverfolgung",
    progressTrackingDesc: "Verfolge deinen Fortschritt und deine Erfolge",
    muchMore: "Noch viel mehr",
    muchMoreDesc: "Exklusive Funktionen zur Verbesserung deines Lernens",

    // How It Works
    howItWorks: "So funktioniert es",
    stepOne: "Wähle ein Thema und Schwierigkeitsstufe",
    stepTwo: "KI generiert personalisierte Lernmaterialien",
    stepThree: "Lerne, übe und verfolge deinen Fortschritt",
    stepFour: "Erreiche sprachliche Flüssigkeit mit KI-Anleitung",

    // Contact
    getInTouch: "Kontaktiere uns",
    contactForm: "Kontakt",
    email: "E-Mail",
    message: "Nachricht",
    send: "Senden",
    sendingMessage: "Nachricht wird gesendet...",
    messageSent: "Nachricht erfolgreich versendet!",
    tryAgain: "Versuche es erneut",

    // Footer
    allRightsReserved: "Alle Rechte vorbehalten",
    company: "Unternehmen",
    about: "Über",
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutz",
    support: "Unterstützung",
    contact: "Kontakt",
  },
};

export const getTranslation = (key, language = "en") => {
  return translations[language]?.[key] || translations.en[key] || key;
};
