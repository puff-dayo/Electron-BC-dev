import settings  from 'electron-settings'
import { ProfileSettingTag, SettingTag } from './constants'
import { ScriptConfigItem, ScriptProfile, ScriptProfileState } from './types'

let config_storage: Map<string, ScriptConfigItem> | null = null
let profile_storage: ScriptProfileState | null = null

const defaultProfileName = 'Default'

type SettingsValue =
  | string
  | number
  | boolean
  | null
  | SettingsValue[]
  | { [key: string]: SettingsValue }

function toSettingsValue(value: ScriptProfileState): SettingsValue {
  return {
    activeProfile: value.activeProfile,
    profiles: value.profiles.map(profile => ({
      name: profile.name,
      enabledScripts: profile.enabledScripts,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    }))
  }
}

function config() {
  if (config_storage) return config_storage

  config_storage = new Map<string, ScriptConfigItem>(
    ((settings.getSync(SettingTag) as ScriptConfigItem[] | null) || []).map(
      c => [c.name, c] as [string, ScriptConfigItem]
    )
  )

  return config_storage
}

async function saveConfig() {
  return settings.set(
    SettingTag,
    Array.from(config().values(), v => ({
      name: v.name,
      setting: {
        enabled: v.setting.enabled,
        url: v.setting.url,
        lastUpdate: v.setting.lastUpdate
      }
    }))
  )
}

function getEnabledScriptNames() {
  return Array.from(config().values())
    .filter(item => item.setting.enabled)
    .map(item => item.name)
}

function cloneEnabledScriptsFromProfile(name: string) {
  return [...(findProfile(name)?.enabledScripts ?? [])]
}

function allScriptNames() {
  return Array.from(config().keys())
}

function uniqueProfileName(baseName: string) {
  const state = profileState()
  const used = new Set(state.profiles.map(profile => profile.name))

  let name = normalizeProfileName(baseName)
  if (!name) name = 'New Profile'

  if (!used.has(name)) return name

  let index = 2
  while (used.has(`${name} ${index}`)) index++

  return `${name} ${index}`
}

function profileState(): ScriptProfileState {
  if (profile_storage) return profile_storage

  const stored = settings.getSync(ProfileSettingTag) as ScriptProfileState | null
  if (stored?.profiles?.length) {
    profile_storage = stored
    return profile_storage
  }

  const now = Date.now()
  profile_storage = {
    activeProfile: defaultProfileName,
    profiles: [
      {
        name: defaultProfileName,
        enabledScripts: getEnabledScriptNames(),
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  settings.set(ProfileSettingTag, toSettingsValue(profile_storage))
  return profile_storage
}

async function saveProfiles() {
  return settings.set(ProfileSettingTag, toSettingsValue(profileState()))
}

function normalizeProfileName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '_')
}

function findProfile(name: string) {
  return profileState().profiles.find(profile => profile.name === name)
}

function applyEnabledScripts(enabledScripts: string[]) {
  const enabled = new Set(enabledScripts)

  config().forEach(item => {
    item.setting.enabled = enabled.has(item.name)
  })

  return saveConfig()
}

export const ScriptConfig = {
  shrinkConfig: (names: string[]) => {
    const unused = [] as string[]

    config().forEach((v, k) => {
      if (!names.includes(k)) unused.push(k)
    })

    unused.forEach(k => config().delete(k))

    const existing = new Set(names)
    profileState().profiles.forEach(profile => {
      profile.enabledScripts = profile.enabledScripts.filter(name => existing.has(name))
    })

    saveConfig()
    saveProfiles()
  },

  saveConfig: async (item: ScriptConfigItem) => {
    config().set(item.name, item)
    await saveConfig()
  },

  getConfig: (name: string, url: string | null = null): ScriptConfigItem => {
    let ret = config().get(name)
    if (ret) return ret

    ret = {
      name,
      setting: {
        enabled: true,
        url,
        lastUpdate: Date.now()
      }
    }

    config().set(name, ret)
    saveConfig()

    const active = findProfile(profileState().activeProfile)
    if (active && !active.enabledScripts.includes(name)) {
      active.enabledScripts.push(name)
      active.updatedAt = Date.now()
      saveProfiles()
    }

    return ret
  },

  profiles: () => profileState().profiles,

  activeProfile: () => profileState().activeProfile,

  saveCurrentAsProfile: async (rawName: string) => {
    const name = normalizeProfileName(rawName)
    if (!name) throw new Error('Profile name is empty')

    const state = profileState()
    const now = Date.now()
    const enabledScripts = getEnabledScriptNames()
    const existing = findProfile(name)

    if (existing) {
      existing.enabledScripts = enabledScripts
      existing.updatedAt = now
    } else {
      state.profiles.push({
        name,
        enabledScripts,
        createdAt: now,
        updatedAt: now
      })
    }

    state.activeProfile = name
    await saveProfiles()

    return name
  },

  createProfile: async (
    rawName: string,
    mode: 'empty' | 'clone-active' | 'all-enabled' | 'all-disabled' = 'clone-active'
  ) => {
    const state = profileState()
    const now = Date.now()
    const name = uniqueProfileName(rawName)

    let enabledScripts: string[] = []

    if (mode === 'clone-active') {
      enabledScripts = cloneEnabledScriptsFromProfile(state.activeProfile)
    }

    if (mode === 'all-enabled') {
      enabledScripts = allScriptNames()
    }

    if (mode === 'all-disabled') {
      enabledScripts = []
    }

    state.profiles.push({
      name,
      enabledScripts,
      createdAt: now,
      updatedAt: now
    })

    await saveProfiles()
    return name
  },

  renameProfile: async (oldName: string, rawNewName: string) => {
    const state = profileState()
    const profile = findProfile(oldName)
    if (!profile) throw new Error(`Profile not found: ${oldName}`)

    const newName = uniqueProfileName(rawNewName)
    profile.name = newName
    profile.updatedAt = Date.now()

    if (state.activeProfile === oldName) {
      state.activeProfile = newName
    }

    await saveProfiles()
    return newName
  },

  updateProfileScripts: async (profileName: string, enabledScripts: string[]) => {
    const profile = findProfile(profileName)
    if (!profile) throw new Error(`Profile not found: ${profileName}`)

    const existingScripts = new Set(allScriptNames())

    profile.enabledScripts = enabledScripts.filter(name => existingScripts.has(name))
    profile.updatedAt = Date.now()

    await saveProfiles()
  },

  getProfileState: () => profileState(),

  switchProfile: async (name: string) => {
    const profile = findProfile(name)
    if (!profile) throw new Error(`Profile not found: ${name}`)

    profileState().activeProfile = profile.name
    await applyEnabledScripts(profile.enabledScripts)
    await saveProfiles()
  },

  deleteProfile: async (name: string) => {
    const state = profileState()
    if (name === defaultProfileName) return

    state.profiles = state.profiles.filter(profile => profile.name !== name)

    if (state.activeProfile === name) {
      state.activeProfile = defaultProfileName
      const fallback = findProfile(defaultProfileName)
      if (fallback) await applyEnabledScripts(fallback.enabledScripts)
    }

    await saveProfiles()
  },

  updateActiveProfileFromCurrentConfig: async () => {
    const active = findProfile(profileState().activeProfile)
    if (!active) return

    active.enabledScripts = getEnabledScriptNames()
    active.updatedAt = Date.now()
    await saveProfiles()
  }
}