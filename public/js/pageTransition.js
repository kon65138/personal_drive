// Fades page content out before navigating away, and in on arrival.
// The wallpaper is painted on <body> itself, so only body's children move —
// the background image stays put across the transition.
(function () {
  const DURATION = 100; // keep in sync with the timings in style.css

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // a page restored from the bfcache comes back with whatever classes it had
  // when it left, which would leave it stuck invisible
  window.addEventListener('pageshow', () => {
    document.body.classList.remove('leaving');
  });

  function leave(href) {
    document.body.classList.add('leaving');
    setTimeout(() => {
      window.location.href = href;
    }, DURATION);
  }

  document.addEventListener('click', (event) => {
    if (reduced.matches) return;
    if (event.defaultPrevented || event.button !== 0) return;
    // modifier-clicks open new tabs/windows, so leave them alone
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;

    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.hasAttribute('download')) return;
    if (link.target && link.target !== '_self') return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;
    // in-page anchors scroll rather than navigate
    if (url.pathname === window.location.pathname && url.hash) return;

    event.preventDefault();
    leave(url.href);
  });

  // forms navigate on their own once the server responds; adding the class
  // without preventing the submit lets the fade run during the round trip
  document.addEventListener('submit', () => {
    if (reduced.matches) return;
    document.body.classList.add('leaving');
  });
})();
