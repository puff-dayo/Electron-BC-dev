import { ipcMain } from "electron";
import settings from "electron-settings";

const settingsKey = ["credentialSupport", "autoRelogin", "modManagerPlus"] as const;
export type SettingsKey = (typeof settingsKey)[number];

class Setting {
  key: string;
  defaultValue: boolean;

  constructor(key: SettingsKey) {
    this.key = `settings.${key}`;
    this.defaultValue = key === "modManagerPlus";
    settings.has(this.key).then((hasKey) => {
      if (!hasKey) settings.set(this.key, this.defaultValue);
    });
  }

  get() {
    const value = settings.getSync(this.key);
    return typeof value === "boolean" ? value : this.defaultValue;
  }

  set(value: boolean) {
    return settings.set(this.key, value);
  }

  toggle() {
    return settings
      .get(this.key)
      .then((value) =>
        settings.set(
          this.key,
          !(typeof value === "boolean" ? value : this.defaultValue)
        )
      )
      .then(() => Promise.resolve());
  }
}

export const EBCSetting: Record<SettingsKey, Setting> = settingsKey.reduce(
  (acc, key) => {
    acc[key] = new Setting(key);
    return acc;
  },
  {} as Record<SettingsKey, Setting>
);

ipcMain.handle("settings-test", (event, key: SettingsKey) => {
  return Promise.resolve(EBCSetting[key].get());
});
