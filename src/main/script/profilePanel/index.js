const api = window.profilePanel;

if (!api) {
  document.body.innerHTML =
    '<pre style="padding:16px;color:#ffb4b4">Profile panel API failed to load.</pre>';
  throw new Error('Profile panel API failed to load');
}

let i18n = {};

async function loadI18n() {
  i18n = await api.getI18n();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[key]) el.textContent = i18n[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[key]) el.setAttribute('placeholder', i18n[key]);
  });
}

function t(key, fallback) {
  return i18n[key] || fallback || key;
}

let data = null;
let selectedProfile = '';
let draft = new Map();
let dirtyProfiles = new Set();
let searchText = '';

function status(message, isError) {
  const el = document.getElementById('status');
  el.textContent = message || '';
  el.style.color = isError ? '#ffb4b4' : '#cfcfcf';
}

function showInputModal(title, defaultValue) {
  return new Promise(resolve => {
    const mask = document.getElementById('inputModalMask');
    const titleEl = document.getElementById('inputModalTitle');
    const input = document.getElementById('inputModalValue');
    const ok = document.getElementById('inputModalOk');
    const cancel = document.getElementById('inputModalCancel');

    titleEl.textContent = title;
    input.value = defaultValue || '';
    mask.style.display = 'flex';

    let done = false;

    function close(value) {
      if (done) return;
      done = true;

      mask.style.display = 'none';

      ok.onclick = null;
      cancel.onclick = null;
      input.onkeydown = null;

      resolve(value);
    }

    ok.onclick = () => close(input.value.trim());
    cancel.onclick = () => close(null);

    input.onkeydown = event => {
      if (event.key === 'Enter') close(input.value.trim());
      if (event.key === 'Escape') close(null);
    };

    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  });
}

async function runAction(label, fn) {
  try {
    status(label + '...', false);
    await fn();
    status(label + ' done', false);
  } catch (error) {
    console.error(error);
    status(error && error.message ? error.message : String(error), true);
  }
}

function byName(name) {
  return data.profiles.find(profile => profile.name === name);
}

function selectedEnabledSet() {
  return (
    draft.get(selectedProfile) ||
    new Set(byName(selectedProfile)?.enabledScripts || [])
  );
}

function setDirty(profileName, value) {
  if (value) dirtyProfiles.add(profileName);
  else dirtyProfiles.delete(profileName);

  const currentDirty = dirtyProfiles.has(selectedProfile);
  document.getElementById('dirty').textContent = currentDirty
    ? 'Unsaved changes'
    : '';
}

function profileCount(profile) {
  const set = draft.get(profile.name) || new Set(profile.enabledScripts);
  return set.size;
}

function renderProfiles() {
  const root = document.getElementById('profiles');
  root.innerHTML = '';

  data.profiles.forEach(profile => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'profile' + (profile.name === selectedProfile ? ' active' : '');

    const dirtyMark = dirtyProfiles.has(profile.name) ? ' *' : '';
    const activeMark = profile.name === data.activeProfile ? ' ★' : '';

    button.innerHTML =
      '<div class="name">' +
      escapeHtml(profile.name + activeMark + dirtyMark) +
      '</div>' +
      '<div class="count">' +
      profileCount(profile) +
      ' mods enabled</div>';

    button.onclick = () => {
      selectedProfile = profile.name;
      render();
    };

    root.appendChild(button);
  });
}

function renderScripts() {
  const root = document.getElementById('scripts');
  root.innerHTML = '';

  const enabled = selectedEnabledSet();
  const lower = searchText.toLowerCase();

  data.scripts
    .filter(script => {
      return (
        !lower ||
        script.name.toLowerCase().includes(lower) ||
        String(script.author || '')
          .toLowerCase()
          .includes(lower) ||
        String(script.url || '')
          .toLowerCase()
          .includes(lower)
      );
    })
    .forEach(script => {
      const row = document.createElement('label');
      row.className = 'script-row';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = enabled.has(script.name);

      checkbox.onchange = () => {
        const current = selectedEnabledSet();
        const next = new Set(current);

        if (checkbox.checked) next.add(script.name);
        else next.delete(script.name);

        draft.set(selectedProfile, next);
        setDirty(selectedProfile, true);
        renderProfiles();
        renderHeader();
      };

      const info = document.createElement('div');
      info.innerHTML =
        '<div class="script-name">' +
        escapeHtml(script.name) +
        '</div>' +
        '<div class="script-meta">' +
        escapeHtml(
          [script.author, script.version].filter(Boolean).join(' · ') ||
            'Unknown author/version'
        ) +
        '</div>' +
        '<div class="script-meta">' +
        escapeHtml(script.url || '') +
        '</div>';

      row.appendChild(checkbox);
      row.appendChild(info);
      root.appendChild(row);
    });
}

function renderHeader() {
  const profile = byName(selectedProfile);

  document.getElementById('title').textContent = profile
    ? profile.name +
      ' — ' +
      profileCount(profile) +
      ' / ' +
      data.scripts.length +
      ' mods'
    : 'Profile';

  document.getElementById('deleteProfile').disabled =
    selectedProfile === 'Default' || !selectedProfile;
  document.getElementById('renameProfile').disabled = !selectedProfile;
  document.getElementById('save').disabled = !selectedProfile;
  document.getElementById('apply').disabled = !selectedProfile;
  document.getElementById('dirty').textContent =
    selectedProfile && dirtyProfiles.has(selectedProfile)
      ? t('unsavedChanges', 'Unsaved changes')
      : '';
}

function render() {
  renderHeader();
  renderProfiles();
  renderScripts();
}

function currentEnabledArray() {
  return Array.from(selectedEnabledSet());
}

async function refresh(nextData, preferredProfile) {
  data = nextData || (await api.getData());

  if (preferredProfile && byName(preferredProfile)) {
    selectedProfile = preferredProfile;
  }

  if (!selectedProfile || !byName(selectedProfile)) {
    selectedProfile = data.activeProfile || data.profiles[0]?.name || '';
  }

  render();
}

async function saveSelected() {
  await api.updateProfile(selectedProfile, currentEnabledArray());
  draft.delete(selectedProfile);
  setDirty(selectedProfile, false);
  await refresh(null, selectedProfile);
}

async function createProfile(mode) {
  const defaultName =
    mode === 'empty'
      ? 'New Empty Profile'
      : mode === 'clone-active'
        ? data.activeProfile + ' Copy'
        : 'New Profile';

  const name = await showInputModal(
    t('profileName', 'Profile name'),
    defaultName
  );
  if (!name) return;

  const before = new Set(data.profiles.map(profile => profile.name));
  const nextData = await api.createProfile(name, mode);

  const created = nextData.profiles.find(profile => !before.has(profile.name));
  const createdName = created ? created.name : name;

  draft.delete(createdName);
  dirtyProfiles.delete(createdName);

  await refresh(nextData, createdName);
}

function replaceDraftWith(names) {
  draft.set(selectedProfile, new Set(names));
  setDirty(selectedProfile, true);
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.getElementById('newEmpty').onclick = () =>
  runAction('Create profile', async () => {
    await createProfile('empty');
  });

document.getElementById('cloneActive').onclick = () =>
  runAction('Clone profile', async () => {
    await createProfile('clone-active');
  });

document.getElementById('renameProfile').onclick = () =>
  runAction('Rename profile', async () => {
    const oldName = selectedProfile;
    const nextName = await showInputModal('New profile name', oldName);

    if (!nextName || nextName === oldName) return;

    const nextData = await api.renameProfile(oldName, nextName);
    const renamed =
      nextData.profiles.find(profile => profile.name === nextName) ||
      nextData.profiles.find(profile => profile.name.startsWith(nextName));

    const realName = renamed ? renamed.name : nextName;

    if (draft.has(oldName)) {
      draft.set(realName, draft.get(oldName));
      draft.delete(oldName);
    }

    if (dirtyProfiles.has(oldName)) {
      dirtyProfiles.delete(oldName);
      dirtyProfiles.add(realName);
    }

    await refresh(nextData, realName);
  });

document.getElementById('deleteProfile').onclick = () =>
  runAction('Delete profile', async () => {
    if (selectedProfile === 'Default') return;

    const target = selectedProfile;
    const ok = window.confirm(t('deleteProfile', 'Delete profile') + ' "' + target + '"?');
    if (!ok) return;

    const nextData = await api.deleteProfile(target);

    draft.delete(target);
    dirtyProfiles.delete(target);

    await refresh(nextData);
  });

document.getElementById('enableAll').onclick = () => {
  replaceDraftWith(data.scripts.map(script => script.name));
};

document.getElementById('disableAll').onclick = () => {
  replaceDraftWith([]);
};

document.getElementById('invert').onclick = () => {
  const enabled = selectedEnabledSet();
  const next = data.scripts
    .map(script => script.name)
    .filter(name => !enabled.has(name));

  replaceDraftWith(next);
};

document.getElementById('save').onclick = () =>
  runAction('Save profile', async () => {
    await saveSelected();
  });

document.getElementById('apply').onclick = () =>
  runAction('Apply profile', async () => {
    const profileName = selectedProfile;

    const nextData = await api.applyProfile(profileName, currentEnabledArray());

    draft.delete(profileName);
    setDirty(profileName, false);

    await refresh(nextData, profileName);
  });

document.getElementById('search').oninput = event => {
  searchText = event.target.value;
  renderScripts();
};

refresh().catch(error => {
  console.error(error);
  status(error && error.message ? error.message : String(error), true);
});

loadI18n()
  .then(() => refresh())
  .catch(error => {
    console.error(error);
    status(error && error.message ? error.message : String(error), true);
  });
