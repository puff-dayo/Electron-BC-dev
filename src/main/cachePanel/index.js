const api = window.cachePanel;

if (!api) {
  document.body.innerHTML =
    '<pre style="padding:16px;color:#ffb4b4">Disk Cache panel API failed to load.</pre>';
  throw new Error('Disk Cache panel API failed to load');
}

let i18n = {};

// Keys returned by the cache-panel:get-i18n handler (short camelCase).
// The data-i18n attributes in index.html use these same keys.
const I18N_KEYS = {
  title: 'title',
  statistics: 'statistics',
  hits: 'hits',
  misses: 'misses',
  hitRate: 'hitRate',
  trafficSaved: 'trafficSaved',
  noData: 'noData',
  cacheSettings: 'cacheSettings',
  enableCache: 'enableCache',
  openCacheDir: 'openCacheDir',
  relocateCacheDir: 'relocateCacheDir',
  preloadUI: 'preloadUI',
  preloadUILoading: 'preloadUILoading',
  cacheSize: 'cacheSize',
  currentSize: 'currentSize',
  refresh: 'refresh',
  clearCache: 'clearCache',
  statusRelocateStart: 'statusRelocateStart',
  statusRelocateDone: 'statusRelocateDone',
  statusPreloadStart: 'statusPreloadStart',
  statusPreloadDone: 'statusPreloadDone',
  statusCleared: 'statusCleared',
  statusError: 'statusError',
  alertClearConfirm: 'alertClearConfirm'
};

async function loadI18n() {
  i18n = await api.getI18n();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[key]) el.textContent = i18n[key];
  });

  document.title = i18n[I18N_KEYS.title] || 'Disk Cache';

  renderCacheInfo(lastCacheInfo);
}

function t(key, fallback) {
  return i18n[key] || fallback || key;
}

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !isFinite(bytes)) return '—';
  if (bytes === 0) return '0 bytes';
  const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }
  return value.toFixed(2) + ' ' + units[index];
}

function status(message, isError) {
  const el = document.getElementById('status');
  el.textContent = message || '';
  el.classList.toggle('error', !!isError);
}

const HIT_COLOR = '#4caf50';
const MISS_COLOR = '#ff9800';
const TRACK_COLOR = '#3a3a3a';

function renderPieChart(hits, misses) {
  const svg = document.getElementById('pieChart');
  const total = hits + misses;

  const r = 40;
  const circumference = 2 * Math.PI * r;

  if (total === 0) {
    svg.innerHTML =
      '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' +
      TRACK_COLOR + '" stroke-width="20" />';
    document.getElementById('chartCenterRate').textContent = '—';
    return;
  }

  const hitLen = (hits / total) * circumference;
  const missLen = circumference - hitLen;


  svg.innerHTML =
    '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' +
    MISS_COLOR + '" stroke-width="20" />' +
    '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' +
    HIT_COLOR + '" stroke-width="20" stroke-dasharray="' +
    hitLen + ' ' + missLen +
    '" transform="rotate(-90 50 50)" />';
}

function renderStats(stats) {
  const hits = stats && stats.hits ? stats.hits : 0;
  const misses = stats && stats.misses ? stats.misses : 0;
  const bytesSaved = stats && stats.bytesSaved ? stats.bytesSaved : 0;
  const total = hits + misses;
  const rate = total === 0 ? null : (hits / total) * 100;

  renderPieChart(hits, misses);

  document.getElementById('hitsValue').textContent = String(hits);
  document.getElementById('missesValue').textContent = String(misses);
  document.getElementById('chartCenterRate').textContent =
    rate === null ? '—' : rate.toFixed(1) + '%';
  document.getElementById('trafficSaved').textContent = formatBytes(bytesSaved);
}

let lastCacheInfo = null;

function renderCacheInfo(info) {
  if (info) lastCacheInfo = info;
  if (!lastCacheInfo) return;
  const data = lastCacheInfo;

  document.getElementById('enableCache').checked = !!data.cacheEnabled;
  document.getElementById('cacheSize').textContent =
    data.sizeStr || (data.sizeBytes ? formatBytes(data.sizeBytes) : '—');

  const available = !!data.available;
  document.getElementById('relocateDir').disabled = !available;
  document.getElementById('clearCache').disabled = !available;

  const canPreload = !!data.canPreload;
  document.getElementById('preloadUI').disabled = !canPreload;
  document.getElementById('preloadUI').textContent = canPreload
    ? t(I18N_KEYS.preloadUI, 'Preload UI Resources')
    : t(I18N_KEYS.preloadUILoading, 'Loading, close window to abort');
}

let pollTimer = null;

async function refreshStats() {
  try {
    const stats = await api.getStats();
    renderStats(stats);
  } catch (error) {
    console.error(error);
  }
}

async function refreshCacheInfo() {
  try {
    const info = await api.getCacheInfo();
    renderCacheInfo(info);
  } catch (error) {
    console.error(error);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(refreshStats, 1000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function runAction(label, fn) {
  try {
    if (label) status(label, false);
    await fn();
  } catch (error) {
    console.error(error);
    const msg = error && error.message ? error.message : String(error);
    status(t(I18N_KEYS.statusError, 'Error: $reason').replace('$reason', msg), true);
  }
}

document.getElementById('enableCache').onchange = event => {
  const next = event.target.checked;
  runAction(null, async () => {
    await api.setCacheEnabled(next);
    await refreshCacheInfo();
  });
};

document.getElementById('openDir').onclick = () => {
  runAction(null, async () => {
    await api.openCacheDir();
  });
};

document.getElementById('relocateDir').onclick = () => {
  runAction(t(I18N_KEYS.statusRelocateStart, 'Relocating...'), async () => {
    await api.relocateCacheDir();
    await refreshCacheInfo();
    status(t(I18N_KEYS.statusRelocateDone, 'Cache directory updated.'), false);
  });
};

document.getElementById('preloadUI').onclick = () => {
  runAction(t(I18N_KEYS.statusPreloadStart, 'Preloading...'), async () => {
    await api.preloadUI();
    await refreshCacheInfo();
    status(t(I18N_KEYS.statusPreloadDone, 'UI resources preloaded.'), false);
  });
};

document.getElementById('refreshSize').onclick = () => {
  runAction(null, async () => {
    await api.refreshSize();
    await refreshCacheInfo();
  });
};

document.getElementById('clearCache').onclick = () => {
  runAction(null, async () => {
    const ok = window.confirm(
      t(I18N_KEYS.alertClearConfirm, 'Confirm to clear cache?')
    );
    if (!ok) return;
    await api.clearCache();
    await refreshCacheInfo();
    status(t(I18N_KEYS.statusCleared, 'Cache cleared.'), false);
  });
};

if (api.onLanguageChanged) {
  api.onLanguageChanged(() => {
    loadI18n().catch(error => console.error(error));
  });
}

window.addEventListener('beforeunload', stopPolling);

loadI18n()
  .then(async () => {
    await Promise.all([refreshStats(), refreshCacheInfo()]);
    startPolling();
  })
  .catch(error => {
    console.error(error);
    status(error && error.message ? error.message : String(error), true);
  });
