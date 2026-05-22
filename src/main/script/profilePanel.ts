import { BrowserWindow, ipcMain } from 'electron'
import path from 'path'

import { reloadAllMenu } from '../reloadAllMenu'
import { ScriptConfig } from './config'
import { ScriptState } from './state'

let panelWindow: BrowserWindow | null = null
let handlersRegistered = false

type CreateMode = 'empty' | 'clone-active' | 'all-enabled' | 'all-disabled'

interface PanelParent {
  window: BrowserWindow
  i18n: (tag: TextTag) => string
}

interface OpenProfilePanelOptions {
  parent: PanelParent
  scriptState: ScriptState
  refreshPage: () => void | Promise<void>
}

function scriptPanelData(scriptState: ScriptState) {
  const state = ScriptConfig.getProfileState()

  return {
    activeProfile: state.activeProfile,
    profiles: state.profiles,
    scripts: scriptState.scripts.map(script => ({
      name: script.meta.name,
      author: script.meta.author,
      version: script.meta.version,
      url: script.setting.url
    }))
  }
}

function registerHandlers(options: OpenProfilePanelOptions) {
  if (handlersRegistered) return
  handlersRegistered = true

  ipcMain.handle('script-profile-panel:get-data', async () => {
    return scriptPanelData(options.scriptState)
  })

  ipcMain.handle('script-profile-panel:get-i18n', async () => {
    return {
      title: options.parent.i18n('MenuItem::Script::ProfileManager::Title'),
      profiles: options.parent.i18n('MenuItem::Script::ProfileManager::Profiles'),
      newEmpty: options.parent.i18n('MenuItem::Script::ProfileManager::NewEmpty'),
      cloneActive: options.parent.i18n('MenuItem::Script::ProfileManager::CloneActive'),
      rename: options.parent.i18n('MenuItem::Script::ProfileManager::Rename'),
      delete: options.parent.i18n('MenuItem::Script::ProfileManager::Delete'),
      searchMods: options.parent.i18n('MenuItem::Script::ProfileManager::SearchMods'),
      enableAll: options.parent.i18n('MenuItem::Script::ProfileManager::EnableAll'),
      disableAll: options.parent.i18n('MenuItem::Script::ProfileManager::DisableAll'),
      invert: options.parent.i18n('MenuItem::Script::ProfileManager::Invert'),
      save: options.parent.i18n('MenuItem::Script::ProfileManager::Save'),
      applyReload: options.parent.i18n('MenuItem::Script::ProfileManager::ApplyReload'),
      unsavedChanges: options.parent.i18n('MenuItem::Script::ProfileManager::UnsavedChanges'),
      profileName: options.parent.i18n('MenuItem::Script::ProfileManager::ProfileName'),
      newProfileName: options.parent.i18n('MenuItem::Script::ProfileManager::NewProfileName'),
      deleteProfile: options.parent.i18n('MenuItem::Script::ProfileManager::DeleteProfile'),
      cancel: options.parent.i18n('MenuItem::Script::ProfileManager::Cancel'),
      ok: options.parent.i18n('MenuItem::Script::ProfileManager::OK')
    }
  })

  ipcMain.handle(
    'script-profile-panel:create-profile',
    async (_event, name: string, mode: CreateMode) => {
      await ScriptConfig.createProfile(name, mode)
      return scriptPanelData(options.scriptState)
    }
  )

  ipcMain.handle(
    'script-profile-panel:rename-profile',
    async (_event, oldName: string, newName: string) => {
      await ScriptConfig.renameProfile(oldName, newName)
      return scriptPanelData(options.scriptState)
    }
  )

  ipcMain.handle(
    'script-profile-panel:update-profile',
    async (_event, profileName: string, enabledScripts: string[]) => {
      await ScriptConfig.updateProfileScripts(profileName, enabledScripts)
      return scriptPanelData(options.scriptState)
    }
  )

  ipcMain.handle(
    'script-profile-panel:delete-profile',
    async (_event, profileName: string) => {
      await ScriptConfig.deleteProfile(profileName)
      await options.scriptState.reloadScriptResource()
      reloadAllMenu()
      return scriptPanelData(options.scriptState)
    }
  )

  ipcMain.handle(
    'script-profile-panel:apply-profile',
    async (_event, profileName: string, enabledScripts: string[]) => {
      await ScriptConfig.updateProfileScripts(profileName, enabledScripts)
      await ScriptConfig.switchProfile(profileName)
      await options.scriptState.reloadScriptResource()
      reloadAllMenu()
      await options.refreshPage()
      return scriptPanelData(options.scriptState)
    }
  )
}

export function openScriptProfilePanel(options: OpenProfilePanelOptions) {
  registerHandlers(options)

  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.focus()
    return
  }

  panelWindow = new BrowserWindow({
    parent: options.parent.window,
    width: 980,
    height: 680,
    minWidth: 760,
    minHeight: 520,
    title: options.parent.i18n('MenuItem::Script::ProfileManager::Title'),
    webPreferences: {
      preload: path.join(__dirname, 'profilePanelPreload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  panelWindow.removeMenu()

  panelWindow.loadFile(
    path.join(__dirname, 'profilePanel', 'index.html')
  )

  panelWindow.on('closed', () => {
    panelWindow = null
  })
}