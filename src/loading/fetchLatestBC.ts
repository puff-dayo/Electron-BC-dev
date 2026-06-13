import { net } from 'electron';

export type FallbackProgress =
  | { type: 'start' }
  | { type: 'try'; version: string }
  | { type: 'miss'; version: string }
  | { type: 'hit'; version: string }
  | { type: 'unverified'; version: string };

function buildFallbackVersions(version: string): BCVersion[] {
  return [
    {
      version,
      url: `https://www.bondageprojects.elementfx.com/${version}/BondageClub/`,
    },
    {
      version,
      url: `https://www.bondage-europe.com/${version}/BondageClub/`,
    },
    {
      version,
      url: `https://www.bondage-asia.com/club/${version}/`,
    },
  ];
}

export function fetchLatestBC(): Promise<BCVersion[]> {
  return new Promise<BCVersion[]>((resolve, reject) => {
    net
      .fetch('https://bondageprojects.com/club_game/', {
        bypassCustomProtocolHandlers: true,
        cache: 'no-store',
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const html = await response.text();

        const matches = html.match(
          /onclick="window\.location='(https:\/\/www.bondage[^']+)'/g
        );

        if (!matches || matches.length === 0) {
          throw new Error('No valid bc versions found');
        }

        const versions: BCVersion[] = matches
          .map(match => {
            const url = match.match(/'(https:\/\/www\.bondage[^']+)'/)?.[1];
            const version = url?.match(/R\d+/)?.[0];
            if (url && version) {
              return { url, version };
            }
            return undefined;
          })
          .filter(Boolean) as BCVersion[];
        resolve(versions);
      })
      .catch(reject);
  });
}

function estimateFallbackVersion(): string {
  const dateTime = new Date();
  const year = dateTime.getUTCFullYear();
  const month = dateTime.getUTCMonth();
  const day = dateTime.getUTCDate();

  const vNumber =
    Math.floor((year - 2025) * 12 + month) + 111 + (day >= 16 ? 1 : 0);

  return `R${vNumber}`;
}

function isInvalidFallbackHtml(html: string): boolean {
  return (
    html.includes('<h1>Object not found!</h1>') ||
    html.includes("You're trying to load an outdated version of the Bondage Club")
  );
}

async function canLoadFallbackVersion(version: string): Promise<boolean> {
  const url = `https://www.bondageprojects.elementfx.com/${version}/BondageClub/`;

  try {
    const response = await net.fetch(url, {
      bypassCustomProtocolHandlers: true,
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const html = await response.text();
    return !isInvalidFallbackHtml(html);
  } catch {
    return false;
  }
}

export async function fallback(
  onProgress?: (progress: FallbackProgress) => void
): Promise<BCVersion[]> {
  const estimatedVersion = estimateFallbackVersion();
  const estimatedNumber = Number(estimatedVersion.slice(1));

  const versionsToTry = [
    estimatedNumber,
    estimatedNumber + 1,
    estimatedNumber - 1,
  ];

  onProgress?.({ type: 'start' });

  for (const versionNumber of versionsToTry) {
    const version = `R${versionNumber}`;

    console.log(`Testing fallback version: ${version}`);
    onProgress?.({ type: 'try', version });

    if (await canLoadFallbackVersion(version)) {
      console.log(`Using fallback version: ${version}`);
      onProgress?.({ type: 'hit', version });
      return buildFallbackVersions(version);
    }

    onProgress?.({ type: 'miss', version });
  }

  console.log(`Using unverified fallback version: ${estimatedVersion}`);
  onProgress?.({ type: 'unverified', version: estimatedVersion });

  return buildFallbackVersions(estimatedVersion);
}
