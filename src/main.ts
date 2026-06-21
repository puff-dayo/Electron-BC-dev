import { app, powerSaveBlocker } from 'electron';
import { Credential } from './main/credential';
import { MyProtocol } from './main/protocol';
import { ScriptResource } from './main/script/resource';
import { createFetchBCVersionWindow } from './loading';
import { MainWindowProvider } from './main/mainWindow';
import settings from 'electron-settings';
import { AssetCache } from './main/AssetCache';
import { initProxyStartup, initProxy } from './main/proxy';

let mainWindowProvider: MainWindowProvider | undefined;

console.log('Setting file:', settings.file());

initProxyStartup();

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  ScriptResource.init();
  MyProtocol.init();
  Credential.init();
  AssetCache.init();
  await initProxy();

  const results = await createFetchBCVersionWindow();
  if (!results) return;

  MyProtocol.setBCStatus(results);

  mainWindowProvider = new MainWindowProvider();

  mainWindowProvider.createWindow();

  powerSaveBlocker.start('prevent-display-sleep');
});

app.on('second-instance', () => {
  mainWindowProvider?.createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
