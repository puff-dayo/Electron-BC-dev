import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'path'

import { AssetCache } from './AssetCache'
import { getCachePath } from './AssetCache/cachePath'
import { MyPrompt } from './MyPrompt'
import { reloadAllMenu } from './reloadAllMenu'
import { BCURLPreference } from '../urlprefer'

let panelWindow: BrowserWindow | null = null
let handlersRegistered = false

interface PanelParent {
  window: BrowserWindow
  i18n: (tag: TextTag) => string
}

interface OpenCachePanelOptions {
  parent: PanelParent
}

function currentBCVersion() {
  // read live
  return BCURLPreference.choice
}

function registerHandlers(options: OpenCachePanelOptions) {
  if (handlersRegistered) return
  handlersRegistered = true

  const { parent } = options

  ipcMain.on('language-change', () => {
    if (panelWindow && !panelWindow.isDestroyed()) {
      panelWindow.webContents.send('cache-panel:language-changed')
    }
  })

  ipcMain.handle('cache-panel:get-i18n', async () => {
    const i18n = parent.i18n
    return {
      title: i18n('CachePanel::Title'),
      statistics: i18n('CachePanel::Statistics'),
      hits: i18n('CachePanel::Hits'),
      misses: i18n('CachePanel::Misses'),
      hitRate: i18n('CachePanel::HitRate'),
      trafficSaved: i18n('CachePanel::TrafficSaved'),
      noData: i18n('CachePanel::NoData'),
      cacheSettings: i18n('CachePanel::CacheSettings'),
      enableCache: i18n('CachePanel::EnableCache'),
      openCacheDir: i18n('CachePanel::OpenCacheDir'),
      relocateCacheDir: i18n('CachePanel::RelocateCacheDir'),
      preloadUI: i18n('CachePanel::PreloadUI'),
      preloadUILoading: i18n('CachePanel::PreloadUI::Loading'),
      cacheSize: i18n('CachePanel::CacheSize'),
      currentSize: i18n('CachePanel::CurrentSize'),
      refresh: i18n('CachePanel::Refresh'),
      clearCache: i18n('CachePanel::ClearCache'),
      clearCacheDone: i18n('CachePanel::ClearCacheDone'),
      statusRelocateStart: i18n('CachePanel::Status::RelocateStart'),
      statusRelocateDone: i18n('CachePanel::Status::RelocateDone'),
      statusPreloadStart: i18n('CachePanel::Status::PreloadStart'),
      statusPreloadDone: i18n('CachePanel::Status::PreloadDone'),
      statusCleared: i18n('CachePanel::Status::Cleared'),
      statusError: i18n('CachePanel::Status::Error'),
      alertClearConfirm: i18n('Alert::Cache::ClearConfirm')
    }
  })

  ipcMain.handle('cache-panel:get-stats', async () => {
    return AssetCache.getStats()
  })

  ipcMain.handle('cache-panel:get-cache-info', async () => {
    let sizeStr = '—'
    try {
      sizeStr = AssetCache.fileSizeStr()
    } catch (error) {
      // directory may not exist yet
      console.error('Failed to read cache size:', error)
    }

    return {
      cacheEnabled: AssetCache.isCacheEnabled(),
      available: AssetCache.available(),
      canPreload: AssetCache.canPreloadCache(),
      sizeStr,
      cacheDir: getCachePath()
    }
  })

  ipcMain.handle(
    'cache-panel:set-cache-enabled',
    async (_event, enabled: boolean) => {
      AssetCache.setCacheEnabled(!!enabled)
      reloadAllMenu()
      return AssetCache.isCacheEnabled()
    }
  )

  ipcMain.handle('cache-panel:open-cache-dir', async () => {
    shell.openPath(AssetCache.cacheDir())
    return true
  })

  ipcMain.handle('cache-panel:relocate-cache-dir', async () => {
    const result = await dialog.showOpenDialog(parent.window, {
      properties: ['openDirectory'],
      defaultPath: getCachePath()
    })

    if (result.canceled) return false

    try {
      await AssetCache.relocate(
        result.filePaths[0],
        () => reloadAllMenu(),
        () =>
          new Promise<boolean>(resolve => {
            MyPrompt.confirmCancel(
              parent,
              parent.i18n('Alert::Cache::RelocateConfirm'),
              () => resolve(true),
              () => resolve(false)
            )
          })
      )
      AssetCache.clearSizeResult()
      reloadAllMenu()
      return true
    } catch (error: any) {
      console.error(error)
      MyPrompt.error(parent, error)
      throw error
    }
  })

  ipcMain.handle('cache-panel:preload-ui', async () => {
    if (!AssetCache.canPreloadCache()) return false
    const bcv = currentBCVersion()
    if (!bcv) return false

    AssetCache.preloadCache(bcv.url, bcv.version).then(() => {
      reloadAllMenu()
      panelWindow?.webContents?.send?.('cache-panel:preload-done')
    })
    reloadAllMenu()
    return true
  })

  ipcMain.handle('cache-panel:refresh-size', async () => {
    AssetCache.clearSizeResult()
    reloadAllMenu()
    return true
  })

  ipcMain.handle('cache-panel:clear-cache', async () => {
    await AssetCache.clearCache()
    AssetCache.clearSizeResult()
    reloadAllMenu()
    return true
  })
}

export function openCachePanel(options: OpenCachePanelOptions) {
  registerHandlers(options)

  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.focus()
    return
  }

  panelWindow = new BrowserWindow({
    parent: options.parent.window,
    width: 720,
    height: 520,
    minWidth: 600,
    minHeight: 440,
    title: options.parent.i18n('CachePanel::Title'),
    webPreferences: {
      preload: path.join(__dirname, 'cachePanelPreload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  panelWindow.removeMenu()

  panelWindow.loadFile(path.join(__dirname, 'cachePanel', 'index.html'))

  panelWindow.on('closed', () => {
    panelWindow = null
  })
}
