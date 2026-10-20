(function () {
  'use strict';
  function log(section, e) { console.error('[dev4rev/' + section + ']', e); }

  // Reveal
  try {
    var revealEls = document.querySelectorAll('.reveal');
    var reduceMotion = false;
    try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (!reduceMotion && revealEls.length) {
      revealEls.forEach(function (el) { el.classList.add('is-pending'); });
      function checkReveal() {
        var limit = window.innerHeight - 80;
        document.querySelectorAll('.reveal.is-pending:not(.is-visible)').forEach(function (el) {
          if (el.getBoundingClientRect().top < limit) el.classList.add('is-visible');
        });
      }
      checkReveal();
      window.addEventListener('scroll', checkReveal, { passive: true });
      window.addEventListener('resize', checkReveal);
      setTimeout(function () {
        document.querySelectorAll('.reveal.is-pending:not(.is-visible)').forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight + 400) el.classList.add('is-visible');
        });
      }, 2000);
      setTimeout(function () {
        document.querySelectorAll('.reveal.is-pending:not(.is-visible)').forEach(function (el) { el.classList.add('is-visible'); });
      }, 4000);
    }
  } catch (e) { log('reveal', e); }

  // Year
  try {
    var sinceEl = document.getElementById('since');
    var yEl = document.getElementById('y');
    if (sinceEl) sinceEl.textContent = '2023';
    if (yEl) yEl.textContent = new Date().getFullYear();
  } catch (e) { log('year', e); }

  // Metrics — demo, без подстановки цифр
  try {
    var usersEl = document.getElementById('metric-users');
    var todayEl = document.getElementById('metric-today');
    var noteEl = document.getElementById('metric-note');
    if (usersEl) usersEl.textContent = '—';
    if (todayEl) todayEl.textContent = '—';
    if (noteEl) noteEl.textContent = 'demo · счётчик в разработке';
  } catch (e) { log('metrics', e); }

  // Topbar + hero bottom + back-to-top
  try {
    var topbar = document.getElementById('topbar');
    var heroBottom = document.getElementById('heroBottom');
    var backToTop = document.getElementById('backToTop');
    var raf = null;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var y = window.scrollY;
        if (topbar) topbar.classList.toggle('scrolled', y > 8);
        if (heroBottom) heroBottom.classList.toggle('hidden', y > 80);
        if (backToTop) backToTop.hidden = y < 600;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (backToTop) {
      backToTop.addEventListener('click', function () {
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, 0);
        }
      });
    }
  } catch (e) { log('topbar', e); }

  // Notice
  try {
    var NOTICE_KEY = 'dev4rev.notice.dismissed';
    var notice = document.getElementById('notice');
    var dismissed = false;
    try { dismissed = localStorage.getItem(NOTICE_KEY) === '1'; } catch (e) {}
    if (!dismissed && notice) {
      var show = function () { if (notice.hidden) notice.hidden = false; };
      setTimeout(show, 4000);
      ['scroll', 'keydown', 'click'].forEach(function (ev) { window.addEventListener(ev, show, { once: true, passive: true }); });
    }
    var noticeClose = document.getElementById('noticeClose');
    if (noticeClose) {
      noticeClose.addEventListener('click', function () {
        if (notice) notice.hidden = true;
        try { localStorage.setItem(NOTICE_KEY, '1'); } catch (e) {}
      });
    }
  } catch (e) { log('notice', e); }

  setTimeout(function () {
    try {
      var sessionCount = document.getElementById('sessionCount');
      console.log('[dev4rev] diagnostic:', {
        revealTotal: document.querySelectorAll('.reveal').length,
        revealPending: document.querySelectorAll('.reveal.is-pending:not(.is-visible)').length,
        sessionCount: sessionCount ? sessionCount.textContent : 'missing',
        theme: document.documentElement.dataset.theme
      });
    } catch (e) { log('diagnostic', e); }
  }, 3000);
})();