import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('cachePanel', {
  getI18n: () => ipcRenderer.invoke('cache-panel:get-i18n'),

  getStats: () => ipcRenderer.invoke('cache-panel:get-stats'),

  getCacheInfo: () => ipcRenderer.invoke('cache-panel:get-cache-info'),

  setCacheEnabled: (enabled: boolean) =>
    ipcRenderer.invoke('cache-panel:set-cache-enabled', enabled),

  openCacheDir: () => ipcRenderer.invoke('cache-panel:open-cache-dir'),

  relocateCacheDir: () => ipcRenderer.invoke('cache-panel:relocate-cache-dir'),
  exportCache: () => ipcRenderer.invoke('cache-panel:export-cache'),
  importCache: () => ipcRenderer.invoke('cache-panel:import-cache'),

  preloadUI: () => ipcRenderer.invoke('cache-panel:preload-ui'),

  refreshSize: () => ipcRenderer.invoke('cache-panel:refresh-size'),

  clearCache: () => ipcRenderer.invoke('cache-panel:clear-cache'),

  onLanguageChanged: (callback: () => void) =>
    ipcRenderer.on('cache-panel:language-changed', () => callback()),
})
