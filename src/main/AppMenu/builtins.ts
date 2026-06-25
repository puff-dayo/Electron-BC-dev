import { EBCSetting } from '../../settings';
import { reloadAllMenu } from '../reloadAllMenu';
import { BCURLPreference } from '../../urlprefer';
import { MyPrompt } from '../MyPrompt';
import { MyAppMenuConstructorOption } from './type';

export function builtinMenu({
  BCVersion,
  parent,
  refreshPage,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions {
  const { i18n } = parent;
  return {
    label: i18n('MenuItem::BuiltIns'),
    submenu: [
      {
        label: i18n('MenuItem::About::ChooseBCURL'),
        type: 'submenu',
        submenu: [
          {
            label: i18n('MenuItem::About::ChooseBCURLInfo1'),
            sublabel: i18n('MenuItem::About::ChooseBCURLInfo2'),
            type: 'normal',
            enabled: false,
          },
          { type: 'separator' },
          ...((BCURLPreference.isFallback
            ? [
                {
                  label: i18n('MenuItem::About::FallbackBCURL'),
                  type: 'normal',
                  enabled: false,
                },
              ]
            : []) as Electron.MenuItemConstructorOptions[]),
          ...(BCURLPreference.choices.map(v => ({
            label: v.url,
            type: 'radio',
            checked: v.url === BCVersion.url,
            click: async () => {
              console.log(`Setting preferred prefix to ${v.url}`);
              BCURLPreference.setPreferredPrefix(v);
              await refreshPage();
            },
          })) as Electron.MenuItemConstructorOptions[]),
          { type: 'separator' },
          {
            label: i18n('MenuItem::About::InputURL'),
            sublabel: i18n('MenuItem::About::InputURLInfo'),
            type: 'normal',
            click: async () => {
              const result = await MyPrompt.input(parent, {
                title: i18n('MenuItem::About::InputURL'),
                content: i18n('MenuItem::About::InputURLInfo'),
                inputError: i18n('Alert::LoadUrl::PleaseInputCorrectUrl'),
                inputPlaceholder: BCURLPreference.choice.url,
              });
              if (result) {
                BCURLPreference.setCustomURL(result);
                await refreshPage();
              }
            },
          },
        ],
      },
      {
        label:i18n('MenuItem::BuiltIns::BMM'),
        type: 'checkbox',
        sublabel: i18n('MenuItem::BuiltIns::BMMInfo'),
        checked: EBCSetting.modManagerPlus.get(),
        click: async () => {
          await EBCSetting.modManagerPlus.toggle();
          reloadAllMenu();
          await refreshPage();
        },
      },
      {
        label: '' + i18n('MenuItem::BuiltIns::CredentialSupport'),
        type: 'checkbox',
        sublabel: i18n('MenuItem::BuiltIns::CredentialSupport::Info'),
        checked: EBCSetting.credentialSupport.get(),
        click: async () => {
          await EBCSetting.credentialSupport.toggle();
          reloadAllMenu();
        },
      },
      {
        label: '' + i18n('MenuItem::BuiltIns::AutoRelog'),
        type: 'checkbox',
        sublabel: i18n('MenuItem::BuiltIns::AutoRelog::Info'),
        checked: EBCSetting.autoRelogin.get(),
        enabled: EBCSetting.credentialSupport.get(),
        click: async () => {
          await EBCSetting.autoRelogin.toggle();
          reloadAllMenu();
        },
      },
    ],
  };
}
