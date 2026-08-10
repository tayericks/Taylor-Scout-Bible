// New Bible isolation guard.
// The main app saves each Bible correctly to its location-scoped document, but
// the in-memory logistics state can still point at the previously open Bible
// during the first render after Create Bible. When the first save completes,
// reload once so the new location-scoped record becomes the only source of
// truth for logistics.
(() => {
  let pendingNewBible = false;
  let reloading = false;
  const originalReplaceState = history.replaceState.bind(history);

  history.replaceState = function(state, unused, url) {
    const creatingBible = Boolean(document.querySelector('#newBibleForm'));
    const result = originalReplaceState(state, unused, url);
    if (creatingBible) {
      try {
        const next = new URL(String(url || location.href), location.href);
        if (next.searchParams.get('bibleId') && next.searchParams.get('locationId')) {
          pendingNewBible = true;
        }
      } catch {}
    }
    return result;
  };

  const maybeReload = () => {
    if (!pendingNewBible || reloading) return;
    const status = document.querySelector('#cloudStatus')?.textContent || '';
    if (/connected\s*·\s*saved|saved locally/i.test(status)) {
      reloading = true;
      pendingNewBible = false;
      location.reload();
    }
  };

  new MutationObserver(maybeReload).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Also catch very fast saves where the status may already be updated before
  // the observer sees the final mutation.
  setInterval(maybeReload, 250);
})();
