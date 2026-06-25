import { MyAppMenuConstructorOption } from './type';
import { reloadAllMenu } from '../reloadAllMenu';
import { MyPrompt } from '../MyPrompt';
import {
  getProxyConfig,
  setProxyConfig,
  applyProxyToSession,
  parseProxyUrl,
} from '../proxy';

const proxyUrlWithAuthRegex =
  /^(https?|socks[45]h?):\/\/([^@\s]+@)?[a-zA-Z0-9.-]+(:\d+)?$/;

export function proxyMenu({
  parent,
  refreshPage,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions[] {
  const { i18n } = parent;
  const config = getProxyConfig();

  return [
    {
      label: i18n('MenuItem::Tools::EnableProxy'),
      type: 'checkbox',
      checked: config.enabled,
      click: async () => {
        const current = getProxyConfig();
        const newEnabled = !current.enabled;

        if (newEnabled && !current.url) {
          const result = await MyPrompt.input(parent, {
            title: i18n('MenuItem::Tools::SetProxy::Title'),
            content: i18n('MenuItem::Tools::SetProxy::InvalidUrl'),
            inputType: 'proxyurl',
            inputPlaceholder: i18n('MenuItem::Tools::SetProxy::Placeholder'),
            inputError: i18n('MenuItem::Tools::SetProxy::InvalidUrl'),
          });

          if (result && proxyUrlWithAuthRegex.test(result)) {
            const parsed = parseProxyUrl(result);
            if (parsed?.authUser) {
              // Store auth info
            }
            setProxyConfig({ enabled: true, url: result });
            await applyProxyToSession();
            reloadAllMenu();
            await refreshPage();
          } else if (result) {
            MyPrompt.info(
              parent,
              i18n('MenuItem::Tools::SetProxy::InvalidUrl')
            );
            reloadAllMenu();
            return;
          } else {
            reloadAllMenu();
            return;
          }
        } else {
          setProxyConfig({ enabled: newEnabled });
          await applyProxyToSession();
          reloadAllMenu();
          await refreshPage();
        }
      },
    },
    {
      label: i18n('MenuItem::Tools::SetProxy'),
      type: 'normal',
      sublabel: config.url || i18n('MenuItem::Tools::ProxyStatus::Disabled'),
      click: async () => {
        const result = await MyPrompt.input(parent, {
          title: i18n('MenuItem::Tools::SetProxy::Title'),
          inputType: 'proxyurl',
          inputPlaceholder: i18n('MenuItem::Tools::SetProxy::Placeholder'),
          defaultValue: config.url || '',
          inputError: i18n('MenuItem::Tools::SetProxy::InvalidUrl'),
        });

        if (result !== undefined) {
          if (result === '') {
            // Empty input to clear proxy settings and disable
            const current = getProxyConfig();
            if (current.enabled || current.url) {
              setProxyConfig({ enabled: false, url: '' });
              await applyProxyToSession();
              reloadAllMenu();
              await refreshPage();
            }
          } else if (proxyUrlWithAuthRegex.test(result)) {
            setProxyConfig({ url: result });
            if (getProxyConfig().enabled) {
              await applyProxyToSession();
              reloadAllMenu();
              await refreshPage();
            } else {
              reloadAllMenu();
            }
          } else {
            MyPrompt.info(
              parent,
              i18n('MenuItem::Tools::SetProxy::InvalidUrl')
            );
          }
        }
      },
    },
    {
      label: i18n('MenuItem::Tools::ProxyStatus'),
      type: 'normal',
      enabled: false,
      sublabel: config.enabled && config.url
        ? config.url
        : i18n('MenuItem::Tools::ProxyStatus::Disabled'),
    },
  ];
}
