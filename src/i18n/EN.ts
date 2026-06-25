const translation: Record<TextTag, string> = {
  'MenuItem::Tools': 'File',
  'MenuItem::Tools::LocalCache': 'Local Disk Cache',
  'MenuItem::Tools::OpenCacheDir': 'Open Cache Directory',
  'MenuItem::Tools::ProximateCacheSize':
    'Proximate Cache Size (Click to Refresh)',
  'MenuItem::Tools::RelocateCacheDir': 'Relocate Cache Directory',
  'MenuItem::Tools::StartUICacheUpdate::Loading':
    'Loading, close window to abort',
  'MenuItem::Tools::ClearCache': 'Clear Cache',
  'MenuItem::Tools::DevTools': 'Dev Tools',
  'MenuItem::Tools::Refresh': 'Refresh Page',
  'MenuItem::Tools::FullScreen': 'Full Screen Mode',
  'MenuItem::Tools::Exit': 'Exit',
  'MenuItem::Tools::Language': 'Interface Language',
  'MenuItem::Tools::Language::Follow': 'Follow game',

  'MenuItem::Tools::OpenDoHConfigFile': 'Open DoH Config File',
  'MenuItem::Tools::DoHConfigTips': 'DNS over HTTPS',

  'MenuItem::Network': 'Network',
  'MenuItem::Network::Proxy': 'Proxy',
  'MenuItem::Network::DoH': 'DNS over HTTPS',
  'MenuItem::Network::DiskCache': 'Disk Cache',

  'MenuItem::Tools::EnableProxy': 'Enable Proxy',
  'MenuItem::Tools::EnableProxy::Info':
    'Route all connections through an HTTP proxy',
  'MenuItem::Tools::SetProxy': 'Config HTTP/SOCKS5 Proxy',
  'MenuItem::Tools::SetProxy::Placeholder': 'http://127.0.0.1:7890',
  'MenuItem::Tools::SetProxy::Title': 'Set Proxy Server URL',
  'MenuItem::Tools::SetProxy::InvalidUrl':
    "Please input a valid proxy URL, e.g. 'http://127.0.0.1:7890' or 'socks5://127.0.0.1:1080'",
  'MenuItem::Tools::ProxyStatus': 'Proxy Status',
  'MenuItem::Tools::ProxyStatus::Disabled': 'Disabled',

  'MenuItem::Script': 'Script',
  'MenuItem::Script::NeedRefresh': 'Need Refresh to Apply Changes',
  'MenuItem::Script::SubMenu::Switch': 'Switch Script',
  'MenuItem::Script::Load From URL': 'Load From URL',
  'MenuItem::Script::ProfileManager::Title': 'Script Profile Manager',
  'MenuItem::Script::ProfileManager::Profiles': 'Profiles',
  'MenuItem::Script::ProfileManager::NewEmpty': 'New Empty',
  'MenuItem::Script::ProfileManager::CloneActive': 'Clone Active',
  'MenuItem::Script::ProfileManager::Rename': 'Rename',
  'MenuItem::Script::ProfileManager::Delete': 'Delete',
  'MenuItem::Script::ProfileManager::SearchMods': 'Search mods',
  'MenuItem::Script::ProfileManager::EnableAll': 'Enable All',
  'MenuItem::Script::ProfileManager::DisableAll': 'Disable All',
  'MenuItem::Script::ProfileManager::Invert': 'Invert',
  'MenuItem::Script::ProfileManager::Save': 'Save',
  'MenuItem::Script::ProfileManager::ApplyReload': 'Apply & Reload',
  'MenuItem::Script::ProfileManager::UnsavedChanges': 'Unsaved changes',
  'MenuItem::Script::ProfileManager::ProfileName': 'Profile name',
  'MenuItem::Script::ProfileManager::NewProfileName': 'New profile name',
  'MenuItem::Script::ProfileManager::DeleteProfile': 'Delete profile',
  'MenuItem::Script::ProfileManager::Cancel': 'Cancel',
  'MenuItem::Script::ProfileManager::OK': 'OK',
  'MenuItem::Script::Open Script Folder': 'Open Script Folder',
  'MenuItem::Script::UpdateScript': 'Update Exisiting Script From URL',
  'MenuItem::Script::Author': 'Author',
  'MenuItem::Script::Version': 'Version',
  'MenuItem::Script::URL': 'URL',
  'MenuItem::Script::Unknown': 'Unknown',
  'MenuItem::Script::ExportPackage': 'Export Script Package',
  'MenuItem::Script::ExportPackageTips':
    'Export enabled scripts as a package file.',
  'MenuItem::Script::ImportPackage': 'Import Script Package',
  'MenuItem::Script::ImportPackageFromURL': 'Import Script Package from URL',
  'MenuItem::Script::ImportSuccess':
    'Import completed! Click confirm to refresh.',
  'MenuItem::Script::ImportFailed': 'Import failed: $reason',
  'ContextMenu::Cut': 'Cut',
  'ContextMenu::Copy': 'Copy',
  'ContextMenu::Paste': 'Paste',
  'Alert::LoadUrl::InputScriptURL': 'Input Script URL',
  'Alert::Confirm': 'Confirm',
  'Alert::Cancel': 'Cancel',
  'Alert::LoadUrl::PleaseInputCorrectUrl':
    "Please input correct url, which should be like 'https://example.com/script.user.js'",
  'Alert::Title': 'Alert',
  'MenuItem::About': 'About',
  'MenuItem::About::Suggestions': 'Suggestions or Feedback',
  'MenuItem::About::ChangeLog': 'Show BC Change Log',
  'MenuItem::About::GitHub': 'Visit GitHub Repo',
  'MenuItem::About::BCVersion': 'BondageClub Version',
  'MenuItem::About::ChooseBCURL': 'Choose BondageClub URL',
  'MenuItem::About::FallbackBCURL':
    'Unable to fetch version info, using calculated version',
  'MenuItem::About::ChooseBCURLInfo1':
    'Different URLs have different web storage',
  'MenuItem::About::ChooseBCURLInfo2':
    '  thus may have different scripts and settings',
  'MenuItem::About::InputURL': 'Input BondageClub URL',
  'MenuItem::About::InputURLInfo':
    '⚠️ Non-BondageClub URLs may not work properly',
  'MenuItem::About::Version': 'Electron-BC Version',
  'Alert::Credential::Title': 'Credential Support',
  'Alert::Credential::Change': 'Save the password change for user USERNAME?',
  'Alert::Credential::New': 'Save new user USERNAME?',
  'Alert::Credential::Saved': 'Credential saved for USERNAME.',
  'MenuItem::BuiltIns': 'Game',
  'MenuItem::BuiltIns::BMM': 'Mod Manager+',
  'MenuItem::BuiltIns::BMMInfo': 'Inject BMM tools',
  'MenuItem::BuiltIns::Intro': 'Click buttons below to toggle built-in support',
  'MenuItem::BuiltIns::CredentialSupport': 'Built-in Credential Support',
  'MenuItem::BuiltIns::CredentialSupport::Info':
    'OS credential manager',
  'Credential::SavedCredential': 'Saved Credentials🔑',
  'MenuItem::BuiltIns::AutoRelog': 'Auto Relog',
  'MenuItem::BuiltIns::AutoRelog::Info':
    'Requires credential on',
  'MenuItem::Script::InstallTips':
    'Can also install scripts by clicking links in game',
  'Alert::LoadPackage::InputPackageURL': 'Input script package URL',
  'Alert::LoadPackage::PleaseInputCorrectUrl':
    "Please input correct url, which should be like 'https://example.com/script-package.ebcspkg'",
  'Alert::Cache::ClearConfirm': 'Confirm to clear cache?',
  'Alert::Cache::ClearConfirmTips':
    '<p style="font-style:italic;">Note: Due to the nature of cache work, it may take some time for cache file size to reduce after clearing. If you need to release disk space immediately, please close the program and manually delete the cache directory.</p>',
  'MenuItem::Tools::StartUICacheUpdate': 'Preload UI Resources',
  'Alert::Cache::UpdateConfirm':
    '<p>Version update found, click confirm to start caching UI related resources immediately.</p><p style="font-style:italic;">Note: Initial loading will consume network traffic, preloading can avoid image loading delay in game. If you cancel loading now, you can also start loading via menu later.</p>',
  'Alert::Cache::RelocateConfirm':
    '<p>New cache directory is empty, old cache data can be moved to new directory.<br>Moving will read and write disk, and cache cannot be used, do you want to move?</p><p>(Cancel will not move, keep old cache and create empty cache in new directory)</p>',

  'Preload::FetchingBCVersion': 'Fetching BondageClub version information...',
  'Preload::FetchingBCVersionResult': 'BondageClub Version: {version}',
  'Preload::FetchingBCVersionFallback': 'Using calculated version: {version}',

  'Alert::Proxy::ClearConfirm': 'Disable proxy and clear proxy settings?',

  'Preload::FetchingBCVersionFallbackStart':
    'Unable to fetch version information, trying fallback versions...',
  'Preload::FetchingBCVersionFallbackTry': 'Trying fallback version: {version}',
  'Preload::FetchingBCVersionFallbackMiss':
    'Fallback version unavailable: {version}',
  'Preload::FetchingBCVersionFallbackHit':
    'Found available fallback version: {version}',
  'Preload::FetchingBCVersionFallbackUnverified':
    'Using unverified fallback version: {version}',

  'MenuItem::Tools::DiskCache': 'Disk Cache...',
  'CachePanel::Title': 'Disk Cache',
  'CachePanel::Statistics': 'Since startup',
  'CachePanel::Hits': 'Hits',
  'CachePanel::Misses': 'Misses',
  'CachePanel::HitRate': 'Hit Rate',
  'CachePanel::TrafficSaved': 'Traffic Saved',
  'CachePanel::NoData': 'No requests yet',
  'CachePanel::CacheSettings': 'Cache Settings',
  'CachePanel::EnableCache': 'Enable local disk cache',
  'CachePanel::OpenCacheDir': 'Open Cache Directory',
  'CachePanel::RelocateCacheDir': 'Relocate Cache Directory',
  'CachePanel::PreloadUI': 'Preload UI Resources',
  'CachePanel::PreloadUI::Loading': 'Loading, close window to abort',
  'CachePanel::CacheSize': 'Cache Size',
  'CachePanel::CurrentSize': 'Current size',
  'CachePanel::Refresh': 'Refresh',
  'CachePanel::ClearCache': 'Clear Cache',
  'CachePanel::ClearCacheDone': 'Cache cleared.',
  'CachePanel::Status::RelocateStart': 'Relocating cache directory...',
  'CachePanel::Status::RelocateDone': 'Cache directory updated.',
  'CachePanel::Status::PreloadStart': 'Preloading UI resources...',
  'CachePanel::Status::PreloadDone': 'UI resources preloaded.',
  'CachePanel::Status::Cleared': 'Cache cleared.',
  'CachePanel::Status::Error': 'Error: $reason',

  'MenuItem::Edit': 'Edit',
  'Edit::Copy': 'Copy',
  'Edit::Paste': 'Paste',
  'Edit::SelectAll': 'Select All'
};

export default translation;
