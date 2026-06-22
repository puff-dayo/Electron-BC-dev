import { once } from 'events';
import fs from 'fs';
import readline from 'readline';
import { pipeline } from 'stream/promises';
import { createGunzip, createGzip } from 'zlib';
import { ClassicLevel } from 'classic-level';
import { net } from 'electron';
import { getCachePath, relocateCachePath } from './cachePath';
import { PendingAccess } from '../utility';
import { isCacheEnabled } from './enabled';
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

export interface CacheTransferSummary {
  entries: number;
  bytes: number;
}

interface CacheExportHeader {
  type: 'header';
  format: typeof CACHE_EXPORT_FORMAT;
  version: typeof CACHE_EXPORT_VERSION;
  exportedAt: string;
}

interface CacheExportEntry {
  type: 'entry';
  key: string;
  value: CacheItem;
}

interface ImportOptions {
  clearFirst?: boolean;
}

const CACHE_EXPORT_FORMAT = 'electron-bc.asset-cache';
const CACHE_EXPORT_VERSION = 1;
const EXPORT_BATCH_SIZE = 500;
const MAX_IMPORT_LINE_LENGTH = 128 * 1024 * 1024;
const MAX_CACHE_KEY_LENGTH = 16 * 1024;
const MAX_BASE64_DATA_LENGTH = 128 * 1024 * 1024;

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

function estimateCacheItemSize(item: CacheItem) {
  if (typeof item.size === 'number' && Number.isFinite(item.size)) {
    return item.size;
  }

  return Math.floor(item.base64Data.length * 0.75);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateCacheKey(key: unknown, lineNumber?: number): string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error(`Invalid cache key${lineNumber ? ` on line ${lineNumber}` : ''}`);
  }

  if (key.length > MAX_CACHE_KEY_LENGTH) {
    throw new Error(
      `Cache key is too long${lineNumber ? ` on line ${lineNumber}` : ''}`
    );
  }

  return key;
}

function validateCacheItem(value: unknown, lineNumber?: number): CacheItem {
  if (!isObject(value)) {
    throw new Error(`Invalid cache item${lineNumber ? ` on line ${lineNumber}` : ''}`);
  }

  if (typeof value.base64Data !== 'string') {
    throw new Error(
      `Invalid cache item data${lineNumber ? ` on line ${lineNumber}` : ''}`
    );
  }

  if (value.base64Data.length > MAX_BASE64_DATA_LENGTH) {
    throw new Error(
      `Cache item is too large${lineNumber ? ` on line ${lineNumber}` : ''}`
    );
  }

  if (typeof value.version !== 'string' || value.version.length === 0) {
    throw new Error(
      `Invalid cache item version${lineNumber ? ` on line ${lineNumber}` : ''}`
    );
  }

  if (value.type !== null && typeof value.type !== 'string') {
    throw new Error(
      `Invalid cache item content type${lineNumber ? ` on line ${lineNumber}` : ''}`
    );
  }

  const cacheTime =
    typeof value.cacheTime === 'number' && Number.isFinite(value.cacheTime)
      ? value.cacheTime
      : Date.now();
  const contentType = typeof value.type === 'string' ? value.type : null;

  const item: CacheItem = {
    base64Data: value.base64Data,
    version: value.version,
    type: contentType,
    cacheTime,
  };

  if (typeof value.size === 'number' && Number.isFinite(value.size) && value.size >= 0) {
    item.size = value.size;
  } else {
    item.size = estimateCacheItemSize(item);
  }

  return item;
}

async function writeLine(stream: NodeJS.WritableStream, value: unknown) {
  const line = JSON.stringify(value) + '\n';

  if (!stream.write(line)) {
    await once(stream, 'drain');
  }
}

export async function exportToFile(filePath: string): Promise<CacheTransferSummary> {
  const db = await access!.aquire();
  const gzip = createGzip();
  const output = fs.createWriteStream(filePath);
  const finished = pipeline(gzip, output);
  const summary: CacheTransferSummary = { entries: 0, bytes: 0 };

  try {
    const header: CacheExportHeader = {
      type: 'header',
      format: CACHE_EXPORT_FORMAT,
      version: CACHE_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
    };

    await writeLine(gzip, header);

    for await (const [key, value] of db.iterator()) {
      const entry: CacheExportEntry = { type: 'entry', key, value };

      await writeLine(gzip, entry);

      summary.entries += 1;
      summary.bytes += estimateCacheItemSize(value);
    }

    gzip.end();
    await finished;

    return summary;
  } catch (error) {
    gzip.destroy();
    output.destroy();

    try {
      await fs.promises.unlink(filePath);
    } catch {
      // Best effort cleanup only.
    }

    throw error;
  }
}

function parseExportLine(line: string, lineNumber: number): CacheExportEntry | null {
  const parsed = JSON.parse(line) as unknown;

  if (!isObject(parsed)) {
    throw new Error(`Invalid cache export record on line ${lineNumber}`);
  }

  if (parsed.type === 'header') {
    if (
      parsed.format !== CACHE_EXPORT_FORMAT ||
      parsed.version !== CACHE_EXPORT_VERSION
    ) {
      throw new Error('Unsupported cache export file format');
    }

    return null;
  }

  if (parsed.type === 'entry') {
    return {
      type: 'entry',
      key: validateCacheKey(parsed.key, lineNumber),
      value: validateCacheItem(parsed.value, lineNumber),
    };
  }

  // Backward-compatible shape for early one-off exports: { key, value }.
  if ('key' in parsed && 'value' in parsed) {
    return {
      type: 'entry',
      key: validateCacheKey(parsed.key, lineNumber),
      value: validateCacheItem(parsed.value, lineNumber),
    };
  }

  throw new Error(`Invalid cache export record on line ${lineNumber}`);
}

export async function importFromFile(
  filePath: string,
  options: ImportOptions = {}
): Promise<CacheTransferSummary> {
  const db = await access!.aquire();
  const gunzip = createGunzip();
  const input = fs.createReadStream(filePath).pipe(gunzip);
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  const summary: CacheTransferSummary = { entries: 0, bytes: 0 };
  const batch: Array<{ type: 'put'; key: string; value: CacheItem }> = [];
  let lineNumber = 0;

  const flush = async () => {
    if (batch.length === 0) return;

    await db.batch(batch.splice(0, batch.length));
  };

  if (options.clearFirst) {
    await db.clear();
  }

  try {
    for await (const line of rl) {
      lineNumber += 1;

      if (!line.trim()) continue;

      if (line.length > MAX_IMPORT_LINE_LENGTH) {
        throw new Error(`Cache export line ${lineNumber} is too large`);
      }

      const record = parseExportLine(line, lineNumber);

      if (!record) continue;

      batch.push({ type: 'put', key: record.key, value: record.value });
      summary.entries += 1;
      summary.bytes += estimateCacheItemSize(record.value);

      if (batch.length >= EXPORT_BATCH_SIZE) {
        await flush();
      }
    }

    await flush();

    return summary;
  } finally {
    rl.close();
  }
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
