import { BrowserWindow } from 'electron';
import path from 'path';
import { fallback, fetchLatestBC } from './fetchLatestBC';
import { packageFile } from '../main/utility';
import { BCURLPreference } from '../urlprefer';
import { sleep } from '../render/utils';
import { ForwardedEvent } from './constant';

function webContentsSend(
  win: BrowserWindow,
  channel: (typeof ForwardedEvent)[number],
  ...args: any[]
) {
  if (win.webContents.isDestroyed()) return;
  win.webContents.send(channel, ...args);
}

export async function createFetchBCVersionWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    resizable: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#2f3542',
    fullscreenable: false,
    skipTaskbar: false,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'loading_preload.js'),
    },
    icon: packageFile('Logo.png'),
  });

  try {
    await win.loadFile('resource/loading.html');
    webContentsSend(win, 'fetching-bc-start');

    const results = await fetchLatestBC();
    const result = BCURLPreference.choose(results);

    webContentsSend(win, 'fetching-bc-done', result);
    win.close();
    return results;
  } catch (error) {
    webContentsSend(
      win,
      'fetching-bc-error',
      error instanceof Error ? error.message : String(error)
    );
  }

  const fb_results = await fallback(progress => {
    switch (progress.type) {
      case 'start':
        webContentsSend(win, 'fetching-bc-fallback-start');
        break;

      case 'try':
        webContentsSend(win, 'fetching-bc-fallback-try', {
          version: progress.version,
        });
        break;

      case 'miss':
        webContentsSend(win, 'fetching-bc-fallback-miss', {
          version: progress.version,
        });
        break;

      case 'hit':
        webContentsSend(win, 'fetching-bc-fallback-hit', {
          version: progress.version,
        });
        break;

      case 'unverified':
        webContentsSend(win, 'fetching-bc-fallback-unverified', {
          version: progress.version,
        });
        break;
    }
  });

  const result = BCURLPreference.choose(fb_results);
  BCURLPreference.isFallback = true;
  webContentsSend(win, 'fetching-bc-fb', result);
  await sleep(2000);
  win.close();
  return fb_results;
}
