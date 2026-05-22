export interface ScriptSetting {
  enabled: boolean;
  url: string | null;
  lastUpdate: number;
}

export interface ScriptMeta {
  name: string;
  author?: string;
  version?: string;
}

export interface ScriptResourceItem {
  setting: ScriptSetting;
  file: string;
  meta: ScriptMeta;
  content: string;
}

export interface ScriptConfigItem {
  name: string;
  setting: ScriptSetting;
}

export interface ScriptMenuItem {
  id: number;
  scriptName: string;
  menuName: string;
}

export interface ScriptProfile {
  name: string
  enabledScripts: string[]
  createdAt: number
  updatedAt: number
}

export interface ScriptProfileState {
  activeProfile: string
  profiles: ScriptProfile[]
}

export interface ScriptProfilePanelScript {
  name: string
  author?: string
  version?: string
  url?: string | null
}

export interface ScriptProfilePanelData {
  activeProfile: string
  profiles: ScriptProfile[]
  scripts: ScriptProfilePanelScript[]
}