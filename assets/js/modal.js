(function () {
  'use strict';
  var privacyModal = document.getElementById('privacyModal');
  var changelogModal = document.getElementById('changelogModal');
  var roadmapModal = document.getElementById('roadmapModal');
  function openModal(m) { if (m) m.classList.add('open'); }
  function closeModals() {
    [privacyModal, changelogModal, roadmapModal].forEach(function (m) { if (m) m.classList.remove('open'); });
  }
  window.dev4revCloseModals = closeModals;

  var openPrivacy = document.getElementById('openPrivacy');
  var noticePrivacy = document.getElementById('noticePrivacy');
  if (openPrivacy) openPrivacy.addEventListener('click', function (e) { e.preventDefault(); openModal(privacyModal); });
  if (noticePrivacy) noticePrivacy.addEventListener('click', function (e) { e.preventDefault(); openModal(privacyModal); });

  var PRODUCTS = ['tv', 'proxymetr', 'frackoff', 'zoobukvy', 'figma'];
  var TITLES = { tv: 'TV', proxymetr: 'Proxymetr', frackoff: 'Frackoff', zoobukvy: 'Зообуквы', figma: 'Figma' };
  var STATUS_LABELS = { done: 'сделано', 'in-progress': 'в работе', planned: 'планируется' };
  var STATUS_CLASS = { done: 'done', 'in-progress': 'progress', planned: 'planned' };
  var STATUS_ORDER = { planned: 0, 'in-progress': 1, done: 2 };

  // Преобразование "2026-Q4" / "2026-10" в число для сортировки
  function etaValue(eta) {
    if (!eta) return 0;
    var m = String(eta).match(/^(\d{4})-(?:Q([1-4])|(\d{2}))$/);
    if (!m) return 0;
    var year = parseInt(m[1], 10);
    var q = m[2] ? parseInt(m[2], 10) : Math.ceil(parseInt(m[3], 10) / 3);
    return year * 10 + q;
  }

  function buildTabs(tabsRoot, activeId, onSelect) {
    tabsRoot.innerHTML = '';
    PRODUCTS.forEach(function (p) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab' + (p === activeId ? ' active' : '');
      btn.textContent = TITLES[p];
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', p === activeId ? 'true' : 'false');
      btn.dataset.id = p;
      btn.addEventListener('click', function () {
        tabsRoot.querySelectorAll('.tab').forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        onSelect(p);
      });
      tabsRoot.appendChild(btn);
    });
  }

  // ==================== CHANGELOG ====================

  function renderChangelogProduct(entries) {
    if (!entries || !entries.length) return '<p class="modal-empty">Пока нет записей.</p>';
    var html = '';
    entries.forEach(function (e) {
      html += '<div class="log-entry">' +
        '<span class="log-entry__date">' + (e.date || '') + '</span>' +
        '<div class="log-entry__body">' +
          '<span class="log-entry__type log-entry__type--' + (e.type || 'internal') + '">' + (e.type || 'internal') + '</span>' +
          '<p class="log-entry__text">' + (e.text || '') + '</p>' +
        '</div></div>';
    });
    return html;
  }

  function renderChangelogSearch(data, query) {
    var q = query.toLowerCase();
    var html = '';
    PRODUCTS.forEach(function (p) {
      var entries = (data[p] || []).filter(function (e) {
        var hay = ((e.text || '') + ' ' + (e.type || '') + ' ' + (e.date || '')).toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      if (!entries.length) return;
      html += '<h3>' + TITLES[p] + '</h3>' + renderChangelogProduct(entries);
    });
    return html || '<p class="modal-empty">Ничего не найдено.</p>';
  }

  var changelogCache = null;
  var changelogCurrent = PRODUCTS[0];
  var changelogSearchEl = document.getElementById('changelogSearch');
  var changelogTabsEl = document.getElementById('changelogTabs');
  var changelogPanelEl = document.getElementById('changelogPanel');

  function renderChangelogNow() {
    if (!changelogCache || !changelogPanelEl) return;
    var q = changelogSearchEl ? changelogSearchEl.value.trim() : '';
    if (q) {
      if (changelogTabsEl) changelogTabsEl.style.display = 'none';
      changelogPanelEl.innerHTML = renderChangelogSearch(changelogCache, q);
    } else {
      if (changelogTabsEl) changelogTabsEl.style.display = '';
      changelogPanelEl.innerHTML = renderChangelogProduct(changelogCache[changelogCurrent] || []);
    }
  }

  var openChangelog = document.getElementById('openChangelog');
  if (openChangelog) {
    openChangelog.addEventListener('click', function () {
      openModal(changelogModal);
      if (!changelogPanelEl) return;
      if (changelogCache) {
        if (changelogTabsEl && !changelogTabsEl.dataset.built) {
          buildTabs(changelogTabsEl, changelogCurrent, function (p) {
            changelogCurrent = p;
            if (changelogSearchEl) changelogSearchEl.value = '';
            renderChangelogNow();
          });
          changelogTabsEl.dataset.built = '1';
        }
        renderChangelogNow();
        return;
      }
      changelogPanelEl.innerHTML = '<p style="color:var(--faint);">Загружаем…</p>';
      fetch('/changelog/index.json')
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (data) {
          changelogCache = data;
          if (changelogTabsEl) {
            buildTabs(changelogTabsEl, changelogCurrent, function (p) {
              changelogCurrent = p;
              if (changelogSearchEl) changelogSearchEl.value = '';
              renderChangelogNow();
            });
            changelogTabsEl.dataset.built = '1';
          }
          renderChangelogNow();
        })
        .catch(function () { changelogPanelEl.innerHTML = '<p class="modal-empty">Не удалось загрузить changelog.</p>'; });
    });
  }

  if (changelogSearchEl) {
    changelogSearchEl.addEventListener('input', renderChangelogNow);
  }

  // ==================== ROADMAP ====================

  function sortRoadmap(items) {
    return items.slice().sort(function (a, b) {
      var sa = STATUS_ORDER[a.status] != null ? STATUS_ORDER[a.status] : 3;
      var sb = STATUS_ORDER[b.status] != null ? STATUS_ORDER[b.status] : 3;
      if (sa !== sb) return sa - sb;
      var ea = etaValue(a.eta), eb = etaValue(b.eta);
      // planned/in-progress: ближайшие первыми (по возрастанию)
      // done: свежие первыми (по убыванию)
      if (a.status === 'done') return eb - ea;
      return ea - eb;
    });
  }

  function renderRoadmapItems(items) {
    if (!items || !items.length) return '<p class="modal-empty">Пока нет планов.</p>';
    var html = '<div class="rm-timeline">';
    items.forEach(function (item) {
      var status = item.status || 'planned';
      var cls = STATUS_CLASS[status] || 'planned';
      var text = (typeof item === 'string') ? item : (item.text || '');
      var eta = (typeof item === 'object' && item.eta) ? item.eta : '';
      html += '<div class="rm-item rm-item--' + cls + '">' +
        '<div class="rm-marker"><span class="rm-dot"></span></div>' +
        '<div class="rm-body">' +
          '<p class="rm-text">' + text + '</p>' +
          '<span class="rm-status">' + (STATUS_LABELS[status] || status) +
            (eta ? '<span class="rm-eta">' + eta + '</span>' : '') +
          '</span>' +
        '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function renderRoadmapProduct(items) {
    return renderRoadmapItems(sortRoadmap(items || []));
  }

  function renderRoadmapSearch(data, query) {
    var q = query.toLowerCase();
    var html = '';
    PRODUCTS.forEach(function (p) {
      var items = (data[p] || []).filter(function (item) {
        var text = (typeof item === 'string') ? item : (item.text || '');
        var hay = (text + ' ' + (item.eta || '') + ' ' + (item.status || '')).toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      if (!items.length) return;
      html += '<h3>' + TITLES[p] + '</h3>' + renderRoadmapItems(sortRoadmap(items));
    });
    return html || '<p class="modal-empty">Ничего не найдено.</p>';
  }

  var roadmapCache = null;
  var roadmapCurrent = PRODUCTS[0];
  var roadmapSearchEl = document.getElementById('roadmapSearch');
  var roadmapTabsEl = document.getElementById('roadmapTabs');
  var roadmapPanelEl = document.getElementById('roadmapPanel');

  function renderRoadmapNow() {
    if (!roadmapCache || !roadmapPanelEl) return;
    var q = roadmapSearchEl ? roadmapSearchEl.value.trim() : '';
    if (q) {
      if (roadmapTabsEl) roadmapTabsEl.style.display = 'none';
      roadmapPanelEl.innerHTML = renderRoadmapSearch(roadmapCache, q);
    } else {
      if (roadmapTabsEl) roadmapTabsEl.style.display = '';
      roadmapPanelEl.innerHTML = renderRoadmapProduct(roadmapCache[roadmapCurrent] || []);
    }
  }

  var openRoadmap = document.getElementById('openRoadmap');
  if (openRoadmap) {
    openRoadmap.addEventListener('click', function () {
      openModal(roadmapModal);
      if (!roadmapPanelEl) return;
      if (roadmapCache) {
        if (roadmapTabsEl && !roadmapTabsEl.dataset.built) {
          buildTabs(roadmapTabsEl, roadmapCurrent, function (p) {
            roadmapCurrent = p;
            if (roadmapSearchEl) roadmapSearchEl.value = '';
            renderRoadmapNow();
          });
          roadmapTabsEl.dataset.built = '1';
        }
        renderRoadmapNow();
        return;
      }
      roadmapPanelEl.innerHTML = '<p style="color:var(--faint);">Загружаем…</p>';
      fetch('/roadmap/index.json')
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (data) {
          roadmapCache = data;
          if (roadmapTabsEl) {
            buildTabs(roadmapTabsEl, roadmapCurrent, function (p) {
              roadmapCurrent = p;
              if (roadmapSearchEl) roadmapSearchEl.value = '';
              renderRoadmapNow();
            });
            roadmapTabsEl.dataset.built = '1';
          }
          renderRoadmapNow();
        })
        .catch(function () { roadmapPanelEl.innerHTML = '<p class="modal-empty">Не удалось загрузить дорожную карту.</p>'; });
    });
  }

  if (roadmapSearchEl) {
    roadmapSearchEl.addEventListener('input', renderRoadmapNow);
  }

  // ==================== MODAL CONTROLS ====================

  document.querySelectorAll('[data-close-modal]').forEach(function (btn) { btn.addEventListener('click', closeModals); });
  [privacyModal, changelogModal, roadmapModal].forEach(function (m) {
    if (!m) return;
    m.addEventListener('click', function (e) { if (e.target === m) closeModals(); });
  });
})();