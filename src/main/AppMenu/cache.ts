import { MyAppMenuConstructorOption } from "./type";
import { openCachePanel } from "../cachePanel";

export function cacheMenu({
  parent,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions[] {
  const { i18n } = parent;
  return [
    {
      label: i18n("MenuItem::Tools::DiskCache"),
      type: "normal",
      click: () => {
        openCachePanel({ parent });
      },
    },
  ];
}
