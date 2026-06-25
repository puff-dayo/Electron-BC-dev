import { shell } from "electron";

export const MOD_MANAGER_PLUS_USER_SCRIPT_URL =
  "https://bondage-studio.github.io/bc-mod-manager/bmm.user.js";

export const MOD_MANAGER_PLUS_REPOSITORY_URL =
  "https://github.com/bondage-studio/bc-mod-manager";

const MOD_MANAGER_PLUS_SCRIPT_ID = "electron-bc-mod-manager-plus";

export async function injectModManagerPlus(webContents: Electron.WebContents) {
  const scriptUrl = JSON.stringify(MOD_MANAGER_PLUS_USER_SCRIPT_URL);
  const scriptId = JSON.stringify(MOD_MANAGER_PLUS_SCRIPT_ID);

  await webContents.executeJavaScript(
    `(() => {
      const scriptId = ${scriptId};
      if (document.getElementById(scriptId) || window.__bmmLoaderBootstrapped) return;

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = ${scriptUrl};
      script.async = true;
      script.crossOrigin = 'anonymous';
      (document.head || document.documentElement || document.body).appendChild(script);
    })();`,
    true
  );
}

export function openModManagerPlusRepository() {
  shell.openExternal(MOD_MANAGER_PLUS_REPOSITORY_URL);
}
