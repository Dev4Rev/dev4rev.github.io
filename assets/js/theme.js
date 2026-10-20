(function () {
  'use strict';
  var THEME_KEY = 'dev4rev.theme';
  var buttons = document.querySelectorAll('[data-theme-value]');
  function getTheme() { return document.documentElement.dataset.theme || 'auto'; }
  window.dev4revGetTheme = getTheme;
  window.dev4revSetTheme = function (value) {
    var v = (value === 'light' || value === 'dark') ? value : 'auto';
    document.documentElement.dataset.theme = v;
    try { localStorage.setItem(THEME_KEY, v); } catch (e) {}
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.themeValue === v ? 'true' : 'false');
    });
    if (typeof window.dev4revUpdateSession === 'function') window.dev4revUpdateSession();
  };
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { window.dev4revSetTheme(b.dataset.themeValue); });
  });
  window.dev4revSetTheme(getTheme());
})();