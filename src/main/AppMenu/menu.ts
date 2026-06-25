import { Menu, app } from 'electron';
import { scriptMenu } from './script';
import { MyAppMenuConstructorOption } from './type';
import { builtinMenu } from './builtins';
import { aboutMenu } from './about';
import { proxyMenu } from './proxy';
import { DoH } from '../DoH';
import { openCachePanel } from '../cachePanel';
import { EBCSetting } from '../../settings';

export function makeMenu(options: MyAppMenuConstructorOption) {
  const {
    refreshPage,
    parent,
    interfaceLanguageOverride,
    setInterfaceLanguageOverride,
  } = options;
  const { window, i18n } = parent;
  const currentInterfaceLanguageOverride = interfaceLanguageOverride();
  window.title = `Bondage Club - ${options.BCVersion.url}`;
  const template: Electron.MenuItemConstructorOptions[] = [];

  if (process.platform === 'darwin') {
    template.push({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  template.push(
    {
      label: i18n('MenuItem::Tools'),
      id: 'tools' as AppMenuIds,
      submenu: [
        {
          label: i18n('MenuItem::Tools::Refresh'),
          type: 'normal',
          accelerator: 'F5',
          click: () => refreshPage(),
        },
        {
          label: i18n('MenuItem::Tools::FullScreen'),
          type: 'normal',
          accelerator: 'F11',
          click: () => window.setFullScreen(!window.isFullScreen()),
        },
        {
          label: i18n('MenuItem::Tools::DevTools'),
          type: 'normal',
          accelerator: 'F12',
          click: () => window.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        {
          label: i18n('MenuItem::Tools::Language'),
          type: 'submenu',
          submenu: [
            {
              label: i18n('MenuItem::Tools::Language::Follow'),
              type: 'radio',
              checked: currentInterfaceLanguageOverride === 'follow',
              click: () => setInterfaceLanguageOverride('follow'),
            },
            {
              label: 'English (US)',
              type: 'radio',
              checked: currentInterfaceLanguageOverride === 'EN',
              click: () => setInterfaceLanguageOverride('EN'),
            },
            {
              label: '简体中文（中国）',
              type: 'radio',
              checked: currentInterfaceLanguageOverride === 'CN',
              click: () => setInterfaceLanguageOverride('CN'),
            },
          ],
        },
        { type: 'separator' },
        {
          label: i18n('MenuItem::Tools::Exit'),
          type: 'normal',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: i18n('MenuItem::Edit'),
      submenu: [
        {
          label: i18n('Edit::Copy'),
          role: 'copy',
          accelerator: 'CmdOrCtrl+C',
        },
        {
          label: i18n('Edit::Paste'),
          role: 'paste',
          accelerator: 'CmdOrCtrl+V',
        },
        {
          label: i18n('Edit::SelectAll'),
          role: 'selectAll',
          accelerator: 'CmdOrCtrl+A',
        },
      ],
    },
    ...(EBCSetting.modManagerPlus.get() ? [] : [scriptMenu(options)]),
    builtinMenu(options),
    {
      label: i18n('MenuItem::Network'),
      submenu: [
        {
          label: i18n('MenuItem::Network::Proxy'),
          type: 'submenu',
          submenu: proxyMenu(options),
        },
        {
          label: i18n('MenuItem::Network::DoH'),
          type: 'normal',
          click: () => DoH.openConfigFile(),
        },
        {
          label: i18n('MenuItem::Network::DiskCache'),
          type: 'normal',
          click: () => openCachePanel({ parent }),
        },
      ],
    },
    aboutMenu(options)
  );

  return Menu.buildFromTemplate(template);
}

export function popupMenu(
  id: AppMenuIds,
  menu: Electron.Menu,
  window: Electron.BrowserWindow
) {
  const targetMenu = menu.getMenuItemById(id);
  if (!targetMenu) return;
  targetMenu.submenu?.popup({
    window,
    x: menu.items.indexOf(targetMenu) * 25,
    y: 0,
  });
}
