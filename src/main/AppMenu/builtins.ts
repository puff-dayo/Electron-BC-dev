import { EBCSetting } from "../../settings";
import { reloadAllMenu } from "../reloadAllMenu";
import {
  MOD_MANAGER_PLUS_REPOSITORY_URL,
  openModManagerPlusRepository,
} from "../modManagerPlus";
import { MyAppMenuConstructorOption } from "./type";

export function builtinMenu({
  parent,
  refreshPage,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions {
  const { i18n } = parent;
  return {
    label: i18n("MenuItem::BuiltIns"),
    submenu: [
      {
        label: i18n("MenuItem::BuiltIns::Intro"),
        type: "normal",
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Mod Manager+",
        type: "checkbox",
        sublabel:
          "Inject the mod manager",
        checked: EBCSetting.modManagerPlus.get(),
        click: async () => {
          await EBCSetting.modManagerPlus.toggle();
          reloadAllMenu();
          await refreshPage();
        },
      },
      {
        label: "" + i18n("MenuItem::BuiltIns::CredentialSupport"),
        type: "checkbox",
        sublabel: i18n("MenuItem::BuiltIns::CredentialSupport::Info"),
        checked: EBCSetting.credentialSupport.get(),
        click: async () => {
          await EBCSetting.credentialSupport.toggle();
          reloadAllMenu();
        },
      },
      {
        label: "" + i18n("MenuItem::BuiltIns::AutoRelog"),
        type: "checkbox",
        sublabel: i18n("MenuItem::BuiltIns::AutoRelog::Info"),
        checked: EBCSetting.autoRelogin.get(),
        enabled: EBCSetting.credentialSupport.get(),
        click: async () => {
          await EBCSetting.autoRelogin.toggle();
          reloadAllMenu();
        },
      },
    ],
  };
}
