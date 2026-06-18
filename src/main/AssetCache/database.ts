import { ClassicLevel } from 'classic-level';
import { net } from 'electron';
import { getCachePath, relocateCachePath } from './cachePath';
import { PendingAccess } from '../utility';
import { isCacheEnabled } from "./enabled";
import { recordHit, recordMiss } from './stats';

interface CachedResponse {
  content: Blob;
  type: string | null;
  response: Response;
  version?: string;
}

interface CacheItem {
  base64Data: string;
  version: string;
  type: string | null;
  cacheTime: number;
  // Byte size of the original asset. Optional for backward compatibility with
  // entries written before this field existed; falls back to base64 length.
  size?: number;
}

function createDatabase() {
  return new ClassicLevel<string, CacheItem>(getCachePath(), {
    valueEncoding: 'json',
  });
}

let access: PendingAccess<ClassicLevel<string, CacheItem>> | undefined =
  undefined;

export async function initAccess() {
  access = new PendingAccess(createDatabase());
  await access.aquire();
}

export async function storeAsset(
  key: string,
  version: string,
  data: Buffer,
  type: string | null
) {
  if (!isCacheEnabled()) return;

  const db = await access!.aquire();

  return db
    .put(key, {
      base64Data: data.toString('base64'),
      version,
      type,
      cacheTime: Date.now(),
      size: data.length,
    })
    .catch(error => {
      console.error(`Failed to store asset ${key}: ${error}`);
    });
}

export async function fetchAsset(url: string): Promise<CachedResponse> {
  const response = await net.fetch(url, { bypassCustomProtocolHandlers: true });
  const clonedResponse = response.clone();
  return {
    content: await response.blob(),
    type: response.headers.get('Content-Type'),
    response: clonedResponse,
  };
}

function createResponse(
  content: Blob,
  type: string | null,
  version?: string,
  permanent = false
) {
  const headers: HeadersInit = {
    'Content-Length': content.size.toString(),
  };
  if (type) headers['Content-Type'] = type;
  if (version) {
    headers['X-Ebc-Cache'] = 'HIT';
    headers['X-Ebc-Cache-Version'] = version;
    if (permanent) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
  }
  return new Response(content, { status: 200, statusText: 'OK', headers });
}

export async function requestAsset(
  url: string,
  key: string,
  version: string,
  permanent = false
): Promise<CachedResponse> {
  if (!isCacheEnabled()) {
    return fetchAsset(url);
  }

  const db = await access!.aquire();
  const data = await db.get(key);
  if (data && data.version === version) {
    const content = new Blob([Buffer.from(data.base64Data, 'base64')]);
    const saved =
      typeof data.size === 'number'
        ? data.size
        : Math.floor(data.base64Data.length * 0.75);
    recordHit(saved);
    return {
      content,
      type: data.type,
      version: data.version,
      response: createResponse(content, data.type, data.version, permanent),
    };
  } else {
    recordMiss();
    const { content, type, response } = await fetchAsset(url);
    if (response.status === 200) {
      storeAsset(key, version, Buffer.from(await content.arrayBuffer()), type);
    }
    return { content, type, response };
  }
}

export async function aquire() {
  const db = await access!.aquire();
  return db;
}

export async function clear() {
  const db = await access!.aquire();
  return db.clear();
}

export async function relocate(
  newPath: string,
  copyStart: () => void,
  copyConfirm: () => boolean | PromiseLike<boolean>
) {
  const olddb = access!.invalidate();
  copyStart();
  if (olddb) await olddb.close();
  await relocateCachePath(newPath, copyConfirm);
  access!.release(createDatabase());
}

export function available() {
  return access!.test();
}
