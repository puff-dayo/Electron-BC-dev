import { PromptParent } from "../../prompt/types";
import { ScriptState } from "../script/state";
import { InterfaceLanguageOverride } from "./interfaceLanguage";

export interface MyAppMenuConstructorOption {
  BCVersion: { url: string; version: string };
  refreshPage: () => Promise<unknown>;
  scriptState: ScriptState;
  parent: PromptParent;
  interfaceLanguageOverride: () => InterfaceLanguageOverride;
  setInterfaceLanguageOverride: (
    value: InterfaceLanguageOverride
  ) => Promise<unknown>;
}
