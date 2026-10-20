(function () {
  'use strict';
  function log(section, e) { console.error('[dev4rev/' + section + ']', e); }

  var SEARCH_INDEX = [
    { id:'tv', name:'TV — IPTV-плейлисты M3U для VLC и браузера', alias:'tv тв плейлисты iptv vlc m3u m3u8 каналы телевидение epg', url:'https://tv.dev4rev.ru/', tag:'iptv · vlc', external:true, kind:'link', key:'1' },
    { id:'proxymetr', name:'Proxymetr — агрегатор MTProto прокси для Telegram', alias:'proxymetr проксиметр агрегатор прокси proxy mtproto telegram тг кабинет', url:'https://proxymetr.dev4rev.ru/', tag:'proxy · cabinet', external:false, kind:'link', key:'2' },
    { id:'tg-bot', name:'Proxymetr в Telegram', alias:'проксиметр telegram tg бот bot прокси mtproto агрегатор', url:'https://t.me/proxymetrbot', tag:'proxymetr · telegram', external:true, kind:'link' },
    { id:'vk-bot', name:'Proxymetr во ВКонтакте', alias:'проксиметр vk вконтакте прокси', url:'https://vk.me/proxymetr', tag:'proxymetr · vk', external:true, kind:'link' },
    { id:'proxymetr-site', name:'Proxymetr · веб-кабинет', alias:'проксиметр веб web сайт прокси кабинет агрегатор mtproto', url:'https://proxymetr.dev4rev.ru/', tag:'proxymetr · web', external:false, kind:'link' },
    { id:'frackoff', name:'Frackoff — элегантные послания', alias:'frackoff послания элегантные красивые сообщения', url:'https://frackoff.ru', tag:'frackoff', external:true, kind:'link' },
    { id:'zoo', name:'Зообуквы — учим буквы для детей', alias:'зообуквы zoobukvy rustore буквы алфавит азбука дети приложение', url:'https://www.rustore.ru/catalog/app/ru.dev4rev.kids.zoobukvy', tag:'android · kids', external:true, kind:'link' },
    { id:'figma', name:'Обучение Figma — индивидуально', alias:'figma фигма обучение курс репетитор ментор встреча индивидуально уроки', url:'https://dev4rev.ru/figma/', tag:'education', external:false, kind:'link' },
    { id:'sec-services', name:'Сервисы', alias:'сервисы services каталог продукты', url:'#services', tag:'section', external:false, kind:'section' },
    { id:'sec-contact', name:'Контакты', alias:'контакты contact telegram instagram email почта dev4rev', url:'#contact', tag:'section', external:false, kind:'section' },
    { id:'sec-mission', name:'Миссия', alias:'миссия mission about о нас', url:'#mission', tag:'section', external:false, kind:'section' },
    { id:'sec-principles', name:'Принципы', alias:'принципы values правила ценности', url:'#principles', tag:'section', external:false, kind:'section' },
    { id:'sec-history', name:'История', alias:'история history storyline студия', url:'#history', tag:'section', external:false, kind:'section' },
    { id:'sec-metrics', name:'Метрики', alias:'метрики stats пользователи статистика', url:'#metrics', tag:'section', external:false, kind:'section' },
    { id:'sec-faq', name:'FAQ', alias:'faq вопросы частые как что такое инструкции', url:'#faq', tag:'section', external:false, kind:'section' },
    { id:'sec-changelog', name:'Что нового', alias:'changelog обновления roadmap дорожная карта', url:'#changelog', tag:'section', external:false, kind:'section' }
  ];

  var TRANSLIT_MAP = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
  var LAYOUT_MAP = {
    'q':'й','w':'ц','e':'у','r':'к','t':'е','y':'н','u':'г','i':'ш','o':'щ','p':'з','[':'х',']':'ъ',
    'a':'ф','s':'ы','d':'в','f':'а','g':'п','h':'р','j':'о','k':'л','l':'д',';':'ж',"'":'э',
    'z':'я','x':'ч','c':'с','v':'м','b':'и','n':'т','m':'ь',',':'б','.':'ю','/':'.',
    'й':'q','ц':'w','у':'e','к':'r','е':'t','н':'y','г':'u','ш':'i','щ':'o','з':'p','х':'[','ъ':']',
    'ф':'a','ы':'s','в':'d','а':'f','п':'g','р':'h','о':'j','л':'k','д':'l','ж':';','э':"'",
    'я':'z','ч':'x','с':'c','м':'v','и':'b','т':'n','ь':'m','б':',','ю':'.','.':'/'
  };

  function normalize(s) {
    return String(s).toLowerCase().split('').map(function (c) {
      return TRANSLIT_MAP[c] !== undefined ? TRANSLIT_MAP[c] : c;
    }).join('').replace(/\s+/g, ' ').trim();
  }
  function switchLayout(s) {
    return String(s).split('').map(function (c) {
      return LAYOUT_MAP[c] !== undefined ? LAYOUT_MAP[c] : c;
    }).join('');
  }
  function levenshtein(a, b) {
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var m = [];
    for (var i = 0; i <= b.length; i++) m[i] = [i];
    for (var j = 0; j <= a.length; j++) m[0][j] = j;
    for (var i = 1; i <= b.length; i++) {
      for (var j = 1; j <= a.length; j++) {
        m[i][j] = b.charAt(i-1) === a.charAt(j-1) ? m[i-1][j-1] :
          Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
      }
    }
    return m[b.length][a.length];
  }
  function scoreMatch(item, q) {
    if (!q) return 1;
    var nName = normalize(item.name), nAlias = normalize(item.alias), nq = normalize(q);
    if (nName.indexOf(nq) === 0) return 100;
    if (nName.indexOf(nq) !== -1) return 50;
    if (nAlias.indexOf(nq) === 0) return 30;
    if (nAlias.indexOf(nq) !== -1) return 20;
    var nSwitched = normalize(switchLayout(q));
    if (nSwitched !== nq) {
      if (nName.indexOf(nSwitched) !== -1) return 60;
      if (nAlias.indexOf(nSwitched) !== -1) return 25;
    }
    var words = (nName + ' ' + nAlias).split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i].length > 2 && levenshtein(words[i], nq) <= 2) return 15;
    }
    return 0;
  }
  function iconFor(item) {
    var g = item.id;
    if (g === 'tv') return '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M12 18v3"/><path d="m9 10 3 2 3-2"/>';
    if (g === 'proxymetr' || g === 'tg-bot' || g === 'vk-bot' || g === 'proxymetr-site') return '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>';
    if (g === 'frackoff') return '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>';
    if (g === 'zoo') return '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>';
    if (g === 'figma') return '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>';
    if (g && g.indexOf('sec-') === 0) return '<path d="M4 6h16M4 12h16M4 18h10"/>';
    return '<circle cx="12" cy="12" r="9"/>';
  }

  var RECENT_KEY = 'dev4rev.search.recent';
  var MAX_RECENT = 5;
  var searchInput = document.getElementById('inlineSearch');
  var suggestPanel = document.getElementById('suggestPanel');
  var searchWrap = document.getElementById('searchWrap');
  if (!searchInput || !suggestPanel || !searchWrap) return;
  var activeIndex = -1;

  function getRecent() {
    try { var raw = localStorage.getItem(RECENT_KEY); return raw ? JSON.parse(raw).slice(0, MAX_RECENT) : []; }
    catch (e) { return []; }
  }
  function pushRecent(id) {
    try {
      var list = getRecent().filter(function (x) { return x !== id; });
      list.unshift(id);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
    } catch (e) {}
  }
  window.dev4revPushRecent = pushRecent;

  function renderItem(item, idx) {
    var target = item.external ? ' target="_blank" rel="noopener"' : '';
    var hint = item.key ? '<span class="suggest__hint">' + item.key + '</span>' : '<span class="suggest__arrow">→</span>';
    return '<a class="suggest__item" data-id="' + item.id + '" data-kind="' + item.kind + '" href="' + item.url + '"' + target + '>' +
      '<svg class="suggest__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + iconFor(item) + '</svg>' +
      '<span class="suggest__body"><span class="suggest__name">' + item.name + '</span><span class="suggest__tag">' + item.tag + '</span></span>' + hint + '</a>';
  }

  function renderSuggestions(query) {
    var q = query.toLowerCase().trim();
    var recentIds = getRecent();
    var html = '';
    if (!q && recentIds.length) {
      var recentItems = recentIds.map(function (id) { return SEARCH_INDEX.find(function (x) { return x.id === id; }); }).filter(Boolean);
      var allItems = SEARCH_INDEX.filter(function (x) { return recentIds.indexOf(x.id) === -1; });
      html += '<div class="suggest__group"><div class="suggest__label">недавние</div>';
      recentItems.forEach(function (it, i) { html += renderItem(it, i); });
      html += '</div>';
      if (allItems.length) {
        html += '<div class="suggest__group"><div class="suggest__label">всё остальное</div>';
        allItems.forEach(function (it, i) { html += renderItem(it, recentItems.length + i); });
        html += '</div>';
      }
    } else if (q) {
      var results = SEARCH_INDEX.map(function (item) {
        return { item: item, score: scoreMatch(item, q) };
      }).filter(function (x) { return x.score > 0; })
        .sort(function (a, b) { return b.score - a.score; })
        .map(function (x) { return x.item; });
      if (!results.length) {
        html = '<div class="suggest__empty">Ничего не найдено<span class="mono">попробуйте «прокси», «iptv», «figma»</span></div>';
      } else {
        html += '<div class="suggest__group"><div class="suggest__label">найдено · ' + results.length + '</div>';
        results.forEach(function (it, i) { html += renderItem(it, i); });
        html += '</div>';
      }
    } else {
      html += '<div class="suggest__group"><div class="suggest__label">всё в одном месте</div>';
      SEARCH_INDEX.forEach(function (it, i) { html += renderItem(it, i); });
      html += '</div>';
    }
    suggestPanel.innerHTML = html;
    activeIndex = -1;
  }
  function openSuggest() { renderSuggestions(searchInput.value); suggestPanel.classList.add('open'); }
  function closeSuggest() { suggestPanel.classList.remove('open'); activeIndex = -1; }

  searchInput.addEventListener('focus', openSuggest);
  searchInput.addEventListener('input', openSuggest);
  searchInput.addEventListener('keydown', function (e) {
    if (searchInput.value === '' && (e.key === '1' || e.key === '2')) {
      e.preventDefault();
      var map = { '1': 'tv', '2': 'proxymetr' };
      var item = SEARCH_INDEX.find(function (x) { return x.id === map[e.key]; });
      if (item) { if (item.external) window.open(item.url, '_blank', 'noopener'); else window.location.href = item.url; }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var opts = suggestPanel.querySelectorAll('.suggest__item');
      if (!opts.length) return;
      activeIndex = (activeIndex + 1) % opts.length;
      opts.forEach(function (o) { o.classList.remove('active'); });
      opts[activeIndex].classList.add('active');
      opts[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      var opts2 = suggestPanel.querySelectorAll('.suggest__item');
      if (!opts2.length) return;
      activeIndex = (activeIndex - 1 + opts2.length) % opts2.length;
      opts2.forEach(function (o) { o.classList.remove('active'); });
      opts2[activeIndex].classList.add('active');
      opts2[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) { e.preventDefault(); var t = suggestPanel.querySelectorAll('.suggest__item')[activeIndex]; if (t) t.click(); }
    } else if (e.key === 'Escape') { closeSuggest(); searchInput.blur(); }
  });

  suggestPanel.addEventListener('click', function (e) {
    var link = e.target.closest('.suggest__item');
    if (!link) return;
    if (link.dataset.id) pushRecent(link.dataset.id);
    if (link.dataset.kind === 'section') {
      e.preventDefault();
      var target = document.querySelector(link.getAttribute('href'));
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); closeSuggest(); searchInput.blur(); }
    }
  });
  document.addEventListener('click', function (e) { if (!searchWrap.contains(e.target)) closeSuggest(); });

  // Палитра (⌘K / K)
  var overlay = document.getElementById('overlay');
  var overlaySearch = document.getElementById('overlaySearch');
  var overlayList = document.getElementById('overlayList');
  var paletteIndex = -1;

  function renderPalette(filter) {
    filter = filter || '';
    var q = filter.toLowerCase().trim();
    var items = SEARCH_INDEX.filter(function (it) { return !q || scoreMatch(it, q) > 0; });
    overlayList.innerHTML = items.map(function (it) {
      var target = it.external ? ' target="_blank" rel="noopener"' : '';
      return '<li><a class="overlay__item" href="' + it.url + '"' + target + ' data-id="' + it.id + '" data-kind="' + it.kind + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + iconFor(it) + '</svg>' +
        '<span>' + it.name + '</span><small>' + it.tag.split(' · ').pop() + '</small></a></li>';
    }).join('');
    paletteIndex = -1;
  }
  function openPalette() {
    overlay.classList.add('open');
    overlaySearch.value = '';
    renderPalette('');
    overlaySearch.focus();
  }
  function closePalette() { overlay.classList.remove('open'); paletteIndex = -1; }
  window.dev4revOpenPalette = openPalette;
  window.dev4revClosePalette = closePalette;

  var openPaletteBtn = document.getElementById('openPalette');
  if (openPaletteBtn) openPaletteBtn.addEventListener('click', openPalette);
  overlaySearch.addEventListener('input', function (e) { renderPalette(e.target.value); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closePalette(); });
  overlayList.addEventListener('click', function (e) {
    var link = e.target.closest('.overlay__item');
    if (!link) return;
    if (link.dataset.id) pushRecent(link.dataset.id);
    if (link.dataset.kind === 'section') {
      e.preventDefault();
      closePalette();
      var target = document.querySelector(link.getAttribute('href'));
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    }
  });
  overlaySearch.addEventListener('keydown', function (e) {
    var items = Array.from(overlayList.querySelectorAll('.overlay__item'));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      paletteIndex = (paletteIndex + 1) % items.length;
      items.forEach(function (i) { i.classList.remove('active'); });
      if (items[paletteIndex]) { items[paletteIndex].classList.add('active'); items[paletteIndex].scrollIntoView({ block: 'nearest' }); }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      paletteIndex = (paletteIndex - 1 + items.length) % items.length;
      items.forEach(function (i) { i.classList.remove('active'); });
      if (items[paletteIndex]) { items[paletteIndex].classList.add('active'); items[paletteIndex].scrollIntoView({ block: 'nearest' }); }
    }
    if (e.key === 'Enter' && paletteIndex >= 0 && items[paletteIndex]) { e.preventDefault(); items[paletteIndex].click(); }
  });

  document.addEventListener('keydown', function (e) {
    var active = document.activeElement;
    var inInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    var paletteOpen = overlay.classList.contains('open');
    var modalOpen = document.querySelector('.modal.open');
    var isK = (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л');
    if (e.key === 'Escape') {
      if (modalOpen) { if (window.dev4revCloseModals) window.dev4revCloseModals(); return; }
      if (paletteOpen) { closePalette(); return; }
    }
    if ((e.metaKey || e.ctrlKey) && isK) {
      e.preventDefault();
      if (paletteOpen) closePalette();
      else openPalette();
      return;
    }
    if (e.key === '/' && !inInput && !paletteOpen) {
      e.preventDefault();
      if (searchInput) searchInput.focus();
      return;
    }
    if (!inInput && !e.metaKey && !e.ctrlKey && !e.altKey && isK && !modalOpen) {
      e.preventDefault();
      if (paletteOpen) closePalette();
      else openPalette();
      return;
    }
  });
})();