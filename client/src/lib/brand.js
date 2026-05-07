const BRAND_KEY = (import.meta.env.VITE_CLIENT_BRAND ?? 'khanash').toLowerCase();

export const BRANDS = {
  lux: {
    key: 'lux',
    name: 'LUX Dental Marketing',
    shortName: 'LUX',
    descriptor: 'Revenue Cycle Workspace',
    aiAssistantName: 'LUX AI Assistant',
    defaultTheme: 'lux',
    demoEmailDomain: 'luxdental.com',
    documentTitle: 'Lux Dental Marketing - RCM Portal',
    description: 'Lux Dental Marketing revenue cycle management portal',
    themes: [
      { id: 'clinical', label: 'Clinical' },
      { id: 'lux', label: 'Lux Brand' },
    ],
  },
  khanash: {
    key: 'khanash',
    name: 'Khanash Consultancy',
    shortName: 'Khanash',
    descriptor: 'Revenue Cycle Workspace',
    aiAssistantName: 'Khanash AI Assistant',
    defaultTheme: 'khanash',
    demoEmailDomain: 'khanashconsultancy.com',
    documentTitle: 'Khanash Consultancy - RCM Portal',
    description: 'Khanash Consultancy revenue cycle management portal',
    themes: [{ id: 'khanash', label: 'Khanash' }],
  },
};

export const BRAND = BRANDS[BRAND_KEY] ?? BRANDS.khanash;
export const THEMES = BRAND.themes;
export const THEME_IDS = new Set(THEMES.map((theme) => theme.id));
