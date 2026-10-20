(function () {
  try {
    var t = localStorage.getItem('dev4rev.theme') || 'auto';
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) {}
})();