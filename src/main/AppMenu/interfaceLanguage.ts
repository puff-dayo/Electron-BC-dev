import settings from 'electron-settings';

export type InterfaceLanguageOverride = 'follow' | 'EN' | 'CN' | 'TW';

const interfaceLanguageOverrideKey = 'settings.interfaceLanguageOverride';

function normalizeInterfaceLanguageOverride(
  value: unknown
): InterfaceLanguageOverride {
  if (value === 'EN' || value === 'CN' || value === 'TW') return value;
  return 'follow';
}

export function getInterfaceLanguageOverride(): InterfaceLanguageOverride {
  return normalizeInterfaceLanguageOverride(
    settings.getSync(interfaceLanguageOverrideKey)
  );
}

export function setInterfaceLanguageOverride(
  value: InterfaceLanguageOverride
) {
  return settings.set(interfaceLanguageOverrideKey, value);
}

export function resolveInterfaceLanguage(
  gameLanguage: string,
  override: InterfaceLanguageOverride
) {
  if (override === 'follow') return gameLanguage;
  return override;
}
