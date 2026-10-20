(function () {
  'use strict';
  function log(section, e) { console.error('[dev4rev/' + section + ']', e); }

  var SESSION_START = Date.now();
  var si = function (id) { return document.getElementById(id); };
  function setText(id, value) { var el = si(id); if (el) el.textContent = String(value == null ? '—' : value); }
  function setClass(id, cls) { var el = si(id); if (el) el.className = cls; }
  function safeCall(fn, fallback) {
    try { var v = fn(); return (v === null || v === undefined || v === '') ? (fallback || '—') : v; }
    catch (e) { return fallback || '—'; }
  }
  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }
  function lsBytes() {
    var t = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); var v = localStorage.getItem(k); t += (k.length + (v ? v.length : 0)); } } catch (e) {}
    return t * 2;
  }
  function ssBytes() {
    var t = 0;
    try { for (var i = 0; i < sessionStorage.length; i++) { var k = sessionStorage.key(i); var v = sessionStorage.getItem(k); t += (k.length + (v ? v.length : 0)); } } catch (e) {}
    return t * 2;
  }
  function detectSystemTheme() { try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; } }
  function effectiveTheme() {
    var t = (window.dev4revGetTheme ? window.dev4revGetTheme() : 'auto');
    return t === 'auto' ? detectSystemTheme() : t;
  }
  function detectEngine() {
    try {
      var d = navigator.userAgentData;
      if (d && d.brands && d.brands.length) {
        var b = null;
        for (var i = 0; i < d.brands.length; i++) { if (!/Not/i.test(d.brands[i].brand)) { b = d.brands[i]; break; } }
        if (!b) b = d.brands[0];
        return b.brand + (b.version ? ' ' + b.version.split('.')[0] : '');
      }
    } catch (e) {}
    var ua = navigator.userAgent || '';
    if (ua.indexOf('Firefox') !== -1) return 'Firefox';
    if (ua.indexOf('Edg') !== -1) return 'Edge';
    if (ua.indexOf('Chrome') !== -1) return 'Chromium';
    if (ua.indexOf('Safari') !== -1) return 'WebKit';
    return 'unknown';
  }
  function detectRender() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) return 'no webgl';
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) { var r = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL); if (r) return r; }
      return gl.getParameter(gl.RENDERER) || 'webgl';
    } catch (e) { return '—'; }
  }

  // --- Время и дата с ПК (через new Date(), использует системное время) ---
  function fmtDate(d) {
    try {
      return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    } catch (e) {
      var dd = String(d.getDate()).padStart(2, '0');
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      return dd + '.' + mm + '.' + d.getFullYear();
    }
  }
  function fmtTime(d) {
    try {
      return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d);
    } catch (e) {
      var hh = String(d.getHours()).padStart(2, '0');
      var mi = String(d.getMinutes()).padStart(2, '0');
      var ss = String(d.getSeconds()).padStart(2, '0');
      return hh + ':' + mi + ':' + ss;
    }
  }

  // --- Локальный IP через WebRTC. Современные браузеры отдают mDNS-имена. ---
  function detectIP() {
    var el = si('si-ip');
    if (!el) return;
    var setIP = function (text, cls) { el.textContent = text; el.className = cls || ''; };

    if (!window.RTCPeerConnection) {
      setIP('недоступен без WebRTC', 'dim');
      return;
    }
    setIP('проверка…', 'dim');

    var ipv4s = [];
    var ipv6s = [];
    var mdnsSeen = false;
    var done = false;
    var pc = null;
    var watchdog = null;

    function finish() {
      if (done) return;
      done = true;
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
      try { if (pc) pc.close(); } catch (e) {}
      if (ipv4s.length) {
        var text = ipv4s[0];
        if (ipv4s.length > 1) text += ' +' + (ipv4s.length - 1);
        setIP(text + ' (local)', '');
      } else if (ipv6s.length) {
        setIP(ipv6s[0] + ' (local, IPv6)', '');
      } else if (mdnsSeen) {
        setIP('скрыт браузером (mDNS)', 'dim');
      } else {
        setIP('недоступен в этом браузере', 'dim');
      }
    }

    function gather() {
      try {
        pc = new RTCPeerConnection({
          iceServers: [],
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
        });
        pc.createDataChannel('x');
        pc.onicecandidate = function (e) {
          if (done || !e || !e.candidate) return;
          var c = e.candidate.candidate || '';
          var m4 = c.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/);
          if (m4) {
            var ip = m4[1];
            if (ip !== '0.0.0.0' && ip !== '255.255.255.255' && ipv4s.indexOf(ip) === -1) {
              ipv4s.push(ip);
            }
          }
          var m6 = c.match(/\b(fe80:[0-9a-f:]+)\b/i);
          if (m6 && ipv6s.indexOf(m6[1]) === -1) ipv6s.push(m6[1]);
          if (/\.local\b/i.test(c)) mdnsSeen = true;
          if (ipv4s.length || ipv6s.length) finish();
        };
        var offer = pc.createOffer();
        if (offer && offer.then) {
          offer.then(function (o) { return pc.setLocalDescription(o); }).catch(finish);
        }
      } catch (e) { finish(); }
    }

    gather();
    watchdog = setTimeout(finish, 2000);
  }

  function updateSession() {
    try {
      setText('si-theme', (window.dev4revGetTheme ? window.dev4revGetTheme() : 'auto') + ' → ' + effectiveTheme());
      var cs = '—'; try { cs = getComputedStyle(document.documentElement).colorScheme || '—'; } catch (e) {}
      setText('si-colorscheme', cs);
      setText('si-motion', safeCall(function () { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference'; }));
      setText('si-contrast', safeCall(function () {
        if (matchMedia('(prefers-contrast: more)').matches) return 'more';
        if (matchMedia('(prefers-contrast: less)').matches) return 'less';
        return 'no-preference';
      }));
      setText('si-engine', detectEngine());
      setText('si-platform', safeCall(function () { return navigator.platform; }) || safeCall(function () { return navigator.userAgentData.platform; }));
      setText('si-screen', screen.width + ' × ' + screen.height);
      setText('si-viewport', window.innerWidth + ' × ' + window.innerHeight);
      setText('si-dpr', (devicePixelRatio || 1).toFixed(2));
      setText('si-orientation', safeCall(function () { return screen.orientation.type; }));
      setText('si-colordepth', screen.colorDepth + ' bit');
      setText('si-lang', navigator.language || '—');
      setText('si-langs', (navigator.languages || []).join(', ') || '—');
      setText('si-tz', safeCall(function () { return Intl.DateTimeFormat().resolvedOptions().timeZone; }));
      var off = -new Date().getTimezoneOffset();
      var sgn = off >= 0 ? '+' : '−';
      var hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0');
      var mm = String(Math.abs(off) % 60).padStart(2, '0');
      setText('si-utc', 'UTC' + sgn + hh + ':' + mm);
      var now = new Date();
      setText('si-date', fmtDate(now));
      setText('si-time', fmtTime(now));
      setText('si-cores', safeCall(function () { return navigator.hardwareConcurrency; }));
      setText('si-memory', safeCall(function () { return navigator.deviceMemory ? navigator.deviceMemory + ' GB' : null; }));
      setText('si-gpuvendor', detectRender());
      setText('si-touch', safeCall(function () { return navigator.maxTouchPoints; }, '0'));
      var online = navigator.onLine;
      setText('si-online', online ? 'true' : 'false');
      setClass('si-online', online ? 'ok' : 'warn');
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        setText('si-conn', conn.type || '—');
        setText('si-efftype', conn.effectiveType || '—');
        setText('si-downlink', conn.downlink ? conn.downlink + ' Mbps' : '—');
        setText('si-rtt', conn.rtt != null ? conn.rtt + ' ms' : '—');
      } else {
        setText('si-conn', 'n/a'); setText('si-efftype', 'n/a');
        setText('si-downlink', 'n/a'); setText('si-rtt', 'n/a');
      }
      setText('si-cookies', navigator.cookieEnabled ? 'enabled' : 'disabled');
      setClass('si-cookies', navigator.cookieEnabled ? 'ok' : 'warn');
      setText('si-ls', fmtBytes(lsBytes()) + ' used');
      setText('si-ss', fmtBytes(ssBytes()) + ' used');
      setText('si-started', new Date(SESSION_START).toLocaleTimeString('ru-RU'));
      var dur = Math.floor((Date.now() - SESSION_START) / 1000);
      var m = Math.floor(dur / 60), s = dur % 60;
      setText('si-duration', m + 'm ' + String(s).padStart(2, '0') + 's');
      setText('si-referrer', safeCall(function () { return document.referrer || 'direct'; }));
      var count = document.querySelectorAll('#sessionBody .session__dl dt').length;
      setText('sessionCount', count + ' полей');
    } catch (e) { log('session-update', e); }
  }
  window.dev4revUpdateSession = updateSession;

  function init() {
    updateSession();
    detectIP();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  setInterval(updateSession, 1000);
  window.addEventListener('resize', updateSession);
  window.addEventListener('online', updateSession);
  window.addEventListener('offline', updateSession);

  function copyToClipboard(text, btn) {
    var done = function () {
      if (btn) { btn.classList.add('is-copied'); setTimeout(function () { btn.classList.remove('is-copied'); }, 1200); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    } catch (e) { log('copy-fallback', e); }
  }
  function collectBlock(block) {
    var lines = [];
    var title = block.querySelector('.session__block-title');
    if (title) lines.push('[' + title.textContent.toUpperCase() + ']');
    block.querySelectorAll('.session__dl dt').forEach(function (dt) {
      var key = dt.textContent;
      var dd = dt.nextElementSibling;
      lines.push(key + ': ' + (dd ? dd.textContent : '—'));
    });
    return lines.join('\n');
  }
  function collectAll(asJson) {
    var data = {};
    document.querySelectorAll('#sessionBody .session__block').forEach(function (block) {
      var blockKey = block.dataset.block || 'block';
      data[blockKey] = {};
      block.querySelectorAll('.session__dl dt').forEach(function (dt) {
        var key = dt.textContent;
        var dd = dt.nextElementSibling;
        data[blockKey][key] = dd ? dd.textContent : '—';
      });
    });
    data._meta = { captured: new Date().toISOString(), userAgent: navigator.userAgent, url: location.href };
    if (asJson) return JSON.stringify(data, null, 2);
    var lines = ['dev4rev — session data', 'captured: ' + data._meta.captured, ''];
    Object.keys(data).forEach(function (key) {
      if (key === '_meta') return;
      lines.push('[' + key.toUpperCase() + ']');
      Object.keys(data[key]).forEach(function (k) { lines.push('  ' + k + ': ' + data[key][k]); });
      lines.push('');
    });
    return lines.join('\n');
  }
  var copyAllBtn = document.getElementById('copyAll');
  if (copyAllBtn) copyAllBtn.addEventListener('click', function () { copyToClipboard(collectAll(false), copyAllBtn); });
  var copyJsonBtn = document.getElementById('copyJson');
  if (copyJsonBtn) copyJsonBtn.addEventListener('click', function () { copyToClipboard(collectAll(true), copyJsonBtn); });
  document.querySelectorAll('[data-copy-block]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.copyBlock;
      var block = document.querySelector('.session__block[data-block="' + key + '"]');
      if (!block) return;
      copyToClipboard(collectBlock(block), btn);
    });
  });
})();