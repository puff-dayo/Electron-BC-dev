import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('profilePanel', {
  getData: () =>
    ipcRenderer.invoke('script-profile-panel:get-data'),

  getI18n: () =>
    ipcRenderer.invoke('script-profile-panel:get-i18n'),

  createProfile: (name: string, mode: string) =>
    ipcRenderer.invoke('script-profile-panel:create-profile', name, mode),

  renameProfile: (oldName: string, newName: string) =>
    ipcRenderer.invoke('script-profile-panel:rename-profile', oldName, newName),

  updateProfile: (profileName: string, enabledScripts: string[]) =>
    ipcRenderer.invoke('script-profile-panel:update-profile', profileName, enabledScripts),

  deleteProfile: (profileName: string) =>
    ipcRenderer.invoke('script-profile-panel:delete-profile', profileName),

  applyProfile: (profileName: string, enabledScripts: string[]) =>
    ipcRenderer.invoke('script-profile-panel:apply-profile', profileName, enabledScripts)
})