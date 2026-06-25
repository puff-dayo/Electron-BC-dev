import { app, shell } from 'electron';
import { MyAppMenuConstructorOption } from './type';


export function aboutMenu({
  BCVersion,
  parent,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions {
  const { i18n } = parent;
  return {
    label: i18n('MenuItem::About'),
    submenu: [
      {
        label: i18n('MenuItem::About::BCVersion'),
        type: 'normal',
        enabled: false,
        sublabel: BCVersion.version,
      },
      {
        label: i18n('MenuItem::About::Version'),
        type: 'normal',
        enabled: false,
        sublabel: app.getVersion(),
      },
      {
        type: 'separator',
      },
      {
        label: i18n('MenuItem::About::ChangeLog'),
        type: 'normal',
        click: () => {
          shell.openExternal('https://gitgud.io/BondageProjects/Bondage-College/-/blob/master/BondageClub/CHANGELOG.md?ref_type=heads');
        },
      },
      {
        label: i18n('MenuItem::About::Suggestions'),
        type: 'normal',
        click: () => {
          shell.openExternal('https://github.com/puff-dayo/Electron-BC-dev/issues');
        },
      },
      {
        label: i18n('MenuItem::About::GitHub'),
        type: 'normal',
        click: () => {
          shell.openExternal('https://github.com/puff-dayo/Electron-BC-dev');
        },
      },
    ],
  };
}
