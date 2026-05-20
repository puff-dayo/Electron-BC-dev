import { app, session } from 'electron';
import settings from 'electron-settings';

const PROXY_SETTINGS_KEY = 'settings.proxy';

export interface ProxyConfig {
  enabled: boolean;
  url: string; // e.g. "http://127.0.0.1:7890" or "socks5://user:pass@host:port"
}

const defaultProxyConfig: ProxyConfig = {
  enabled: false,
  url: '',
};

export function getProxyConfig(): ProxyConfig {
  const stored = settings.getSync(PROXY_SETTINGS_KEY);
  if (stored && typeof stored === 'object') {
    return { ...defaultProxyConfig, ...(stored as Partial<ProxyConfig>) };
  }
  return { ...defaultProxyConfig };
}

export function setProxyConfig(config: Partial<ProxyConfig>): ProxyConfig {
  const current = getProxyConfig();
  const updated = { ...current, ...config };
  settings.setSync(PROXY_SETTINGS_KEY, updated);
  return updated;
}

let proxyAuthUser: string | undefined;
let proxyAuthPass: string | undefined;

function storeProxyAuth(user: string, password: string) {
  proxyAuthUser = decodeURIComponent(user);
  proxyAuthPass = decodeURIComponent(password);
}

export function parseProxyUrl(
  proxyUrl: string
): { host: string; port: string; type: 'http' | 'socks4' | 'socks5'; authUser?: string; authPass?: string } | null {
  try {
    const parsed = new URL(proxyUrl);
    const protocol = parsed.protocol.toLowerCase();

    let type: 'http' | 'socks4' | 'socks5';
    if (protocol === 'socks5:' || protocol === 'socks5h:') {
      type = 'socks5';
    } else if (protocol === 'socks4:') {
      type = 'socks4';
    } else {
      type = 'http';
    }

    return {
      host: parsed.hostname,
      port: parsed.port || (type === 'http' && protocol === 'https:' ? '443' : type === 'http' ? '80' : '1080'),
      type,
      authUser: parsed.username || undefined,
      authPass: parsed.password || undefined,
    };
  } catch {
    return null;
  }
}

function buildProxyRules(proxyUrl: string): string | null {
  const parsed = parseProxyUrl(proxyUrl);
  if (!parsed) return null;

  const addr = `${parsed.host}:${parsed.port}`;

  if (parsed.type === 'socks4' || parsed.type === 'socks5') {
    return `socks=${addr}`;
  } else {
    return `http=${addr};https=${addr}`;
  }
}

function buildCliProxySwitch(proxyUrl: string): string | null {
  const parsed = parseProxyUrl(proxyUrl);
  if (!parsed) return null;

  const addr = `${parsed.host}:${parsed.port}`;

  if (parsed.type === 'socks5') {
    return `socks5://${addr}`;
  } else if (parsed.type === 'socks4') {
    return `socks4://${addr}`;
  } else {
    return `http://${addr}`;
  }
}

export function initProxyStartup(): void {
  const config = getProxyConfig();

  if (config.enabled && config.url) {
    const cliProxy = buildCliProxySwitch(config.url);
    if (cliProxy) {
      console.log(`[Proxy] Setting --proxy-server=${cliProxy}`);
      app.commandLine.appendSwitch('proxy-server', cliProxy);
    }

    const parsed = parseProxyUrl(config.url);
    if (parsed?.authUser) {
      storeProxyAuth(parsed.authUser, parsed.authPass || '');
    }
  }
}

export async function applyProxyToSession(
  ses: Electron.Session = session.defaultSession
): Promise<void> {
  const config = getProxyConfig();

  if (config.enabled && config.url) {
    const proxyRules = buildProxyRules(config.url);

    if (proxyRules) {
      console.log(`[Proxy] Applying proxyRules: ${proxyRules}`);
      await ses.setProxy({ proxyRules });
    } else {
      console.error(`[Proxy] Failed to parse proxy URL: ${config.url}`);
      await ses.setProxy({ mode: 'direct' });
    }
  } else {
    console.log('[Proxy] Disabled, using direct connection');
    await ses.setProxy({ mode: 'direct' });
  }

  applyProxyEnvVars(config);
}

export function applyProxyEnvVars(config?: ProxyConfig): void {
  if (!config) config = getProxyConfig();

  if (config.enabled && config.url) {
    process.env.HTTP_PROXY = config.url;
    process.env.HTTPS_PROXY = config.url;
    console.log(`[Proxy] Set HTTP_PROXY/HTTPS_PROXY = ${config.url}`);
  } else {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    console.log('[Proxy] Cleared HTTP_PROXY/HTTPS_PROXY');
  }
}

function setupProxyAuthHandler(): void {
  app.on('login', (event, _webContents, _request, authInfo, callback) => {
    if (authInfo.isProxy && proxyAuthUser && proxyAuthPass) {
      console.log(`[Proxy] Providing auth for proxy as: ${proxyAuthUser}`);
      event.preventDefault();
      callback(proxyAuthUser, proxyAuthPass);
    }
  });
}

export async function initProxy(): Promise<void> {
  setupProxyAuthHandler();
  await applyProxyToSession();
  console.log('[Proxy] Initialization complete');
}
