const ForwardedEvent = [
  'fetching-bc-start',
  'fetching-bc-done',
  'fetching-bc-fb',

  'fetching-bc-error',

  'fetching-bc-fallback-start',
  'fetching-bc-fallback-try',
  'fetching-bc-fallback-miss',
  'fetching-bc-fallback-hit',
  'fetching-bc-fallback-unverified',
  
  "error",
] as const;

export { ForwardedEvent };
