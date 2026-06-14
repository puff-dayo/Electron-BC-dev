import settings from "electron-settings";

const SettingTag = "AssetCacheEnabled";

export function isCacheEnabled() {
  const value = settings.getSync(SettingTag);

  if (typeof value !== "boolean") {
    settings.setSync(SettingTag, true);
    return true;
  }

  return value;
}

export function setCacheEnabled(enabled: boolean) {
  settings.setSync(SettingTag, enabled);
  return enabled;
}

export function toggleCacheEnabled() {
  return setCacheEnabled(!isCacheEnabled());
}