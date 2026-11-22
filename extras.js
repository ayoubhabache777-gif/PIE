/* PIE — ميزات إضافية: التذكير اليومي، الإنجازات، الجولة التعريفية. الترجمة من قاموس index.html عبر PIE_T */
(function () {
  function T(s) { return window.PIE_T ? window.PIE_T(s) : s; }
  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function curLang() { var l = ls('adati-lang'); return l === 'en' || l === 'fr' ? l : 'ar'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------------- الإنجازات ---------------- */
  var ACH = [
    ['first', 'أول عادة', function (m) { return m.habits >= 1; }],
    ['t10', '10 إنجازات', function (m) { return m.total >= 10; }],
    ['s3', 'سلسلة 3 أيام', function (m) { return m.best >= 3; }],
    ['s7', 'سلسلة أسبوع', function (m) { return m.best >= 7; }],
    ['t50', '50 إنجازًا', function (m) { return m.total >= 50; }],
    ['s30', 'سلسلة 30 يومًا', function (m) { return m.best >= 30; }],
    ['t100', '100 إنجاز', function (m) { return m.total >= 100; }],
    ['read', 'أتممت تحدي 20 يومًا', function (m) { return m.read >= 20; }],
    ['month', 'أتممت تحدي الشهر', function (m) { return m.month >= 30; }]
  ];
  function cnt(o) { var n = 0; for (var k in (o || {})) if (o[k]) n++; return n; }
  function dayNum(k) { var p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; }
  function metrics(st) {
    var m = { habits: (st.habits || []).length, total: 0, best: 0, cur: 0, read: 0, month: 0 }, t0 = new Date(), today = key(t0);
    (st.habits || []).forEach(function (h) {
      var ks = Object.keys(h.days || {}).filter(function (k) { return h.days[k]; }).sort(), run = 0, prev = null;
      m.total += ks.length;
      ks.forEach(function (k) { var n = dayNum(k); run = prev !== null && n - prev === 1 ? run + 1 : 1; if (run > m.best) m.best = run; prev = n; });
      var d = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate()), c = 0;
      if (!h.days[today]) d.setDate(d.getDate() - 1);
      while (h.days[key(d)]) { c++; d.setDate(d.getDate() - 1); }
      if (c > m.cur) m.cur = c;
    });
    try { m.read = cnt(st.ch.read.r); m.month = cnt(st.ch.month.d); } catch (e) {}
    return m;
  }
  function renderAch() {
    var el = $('ach'); if (!el || !window.PIE_STATE) return;
    var st = window.PIE_STATE(); if (!st) return;
    var m = metrics(st), n = 0;
    var badges = ACH.map(function (a) {
      var on = !!a[2](m); if (on) n++;
      return '<div class="ach-b ' + (on ? 'on' : 'off') + '"><i aria-hidden="true">★</i><span>' + esc(T(a[1])) + '</span></div>';
    }).join('');
    el.innerHTML = '<div class="ach-top"><h2>' + esc(T('الإنجازات')) + '</h2><span class="ach-n" dir="ltr">' + n + '/' + ACH.length + '</span></div>' +
      '<p class="ach-sub">' + esc(T('أطول سلسلة حالية')) + ': <b>' + m.cur + '</b> ' + esc(T('يوم')) + '</p><div class="ach-g">' + badges + '</div>';
  }

  /* ---------------- التذكير اليومي ---------------- */
  var LS = 'pie-daily';
  function cfg() { try { var o = JSON.parse(ls(LS) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function supported() { return !!(window.PIE_HOL && 'Notification' in window && 'serviceWorker' in navigator); }
  function enabled() { var c = cfg(); return supported() && !!c.on && Notification.permission === 'granted'; }
  function mirror() {
    if (!window.PIE_HOL) return;
    var c = cfg(), on = enabled();
    PIE_HOL.meta.update(function (m) { var d = m.daily || {}; m.daily = { on: on, t: c.t || '20:00', last: (d.last && d.last > (c.last || '')) ? d.last : (c.last || ''), lang: curLang() }; });
  }
  function save(o) { ls(LS, JSON.stringify(o)); mirror(); }
  function periodic(on) {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.periodicSync) return;
      if (on) reg.periodicSync.register('pie-daily', { minInterval: 3 * 3600 * 1000 }).catch(function () {});
      else reg.periodicSync.unregister('pie-daily').catch(function () {});
    }).catch(function () {});
  }
  function msg(m) { var e = $('dailymsg'); if (e) e.textContent = m ? T(m) : ''; }
  function syncUi() {
    var sw = $('dailysw'), ti = $('dailyt'), c = cfg();
    if (sw) sw.setAttribute('aria-checked', enabled() ? 'true' : 'false');
    if (ti && document.activeElement !== ti) ti.value = c.t || '20:00';
  }
  function allDone(st) {
    var today = key(new Date()), hs = st.habits || [];
    return hs.length > 0 && hs.every(function (h) { return h.days && h.days[today]; });
  }
  function check() {
    if (!enabled() || !window.PIE_STATE) return;
    var st = window.PIE_STATE(); if (!st || !(st.habits || []).length) return;
    var c = cfg(), now = new Date(), today = key(now), p = (c.t || '20:00').split(':');
    if (allDone(st)) { if (c.last !== today) { c.last = today; save(c); } return; }
    PIE_HOL.meta.get().then(function (m) {
      var a = c.last || '', b = (m.daily && m.daily.last) || '', last = a > b ? a : b;
      if (last === today) return;
      if (now.getHours() * 60 + now.getMinutes() < (+p[0]) * 60 + (+p[1])) return;
      var lang = curLang();
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.showNotification('PIE', { body: T('لم تنجز عاداتك اليوم بعد. دقيقة واحدة تكفي.'), icon: 'icon-192.png', badge: 'icon-192.png', tag: 'pie-daily', lang: lang, dir: lang === 'ar' ? 'rtl' : 'ltr', data: { url: './index.html' } });
      }).then(function () { c.last = today; save(c); });
    }).catch(function () {});
  }
  function toggle() {
    msg('');
    var c = cfg();
    if (enabled()) { c.on = false; save(c); periodic(false); syncUi(); msg('تم إيقاف التذكير اليومي'); return; }
    if (!supported()) { msg('الإشعارات غير متاحة هنا. على آيفون ثبّت التطبيق على الشاشة الرئيسية أولًا.'); return; }
    if (Notification.permission === 'denied') { msg('الإشعارات محظورة من إعدادات المتصفح'); return; }
    new Promise(function (ok) { var r = Notification.requestPermission(ok); if (r && r.then) r.then(ok); }).then(function (perm) {
      if (perm === 'granted') {
        var ti = $('dailyt'); c.on = true; c.t = (ti && ti.value) || c.t || '20:00'; save(c); periodic(true); syncUi(); msg('تم تفعيل التذكير اليومي'); check();
      } else { syncUi(); msg(perm === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : 'لم يتم منح إذن الإشعارات'); }
    });
  }

  /* ---------------- الجولة التعريفية ---------------- */
  var STEPS = [
    ['M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6.0L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z', 'مرحبًا بك في PIE', 'أضف عاداتك، ثم اضغط على النجمة كل يوم عند إنجازها.'],
    ['M13 2L4 14h7l-1 8 9-12h-7z', 'حافظ على سلسلتك', 'ابدأ تحدي 20 يومًا، وراقب سلسلتك وإنجازاتك.'],
    ['M9 8a3 3 0 1 0 0-.1M3 19c.5-3.4 3-5 6-5s5.5 1.6 6 5M16 5.2a3 3 0 0 1 0 5.6M18 14.2c1.7.6 3 2 3.4 4.8', 'مع أستاذك', 'من الإعدادات ← الأساتذة والمتدربون انضم إلى قسمك وأرسل عملك PDF.']
  ];
  var onb = null, onbI = 0, prevFocus = null;
  function onbDraw() {
    var s = STEPS[onbI], last = onbI === STEPS.length - 1;
    onb.querySelector('.onb-card').innerHTML =
      '<button type="button" class="onb-skip" data-x="onb-skip">' + esc(T('تخطّي')) + '</button>' +
      '<div class="onb-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + s[0] + '"/></svg></div>' +
      '<h2 id="onbt">' + esc(T(s[1])) + '</h2><p>' + esc(T(s[2])) + '</p>' +
      '<div class="onb-dots" aria-hidden="true">' + STEPS.map(function (_, i) { return '<i' + (i === onbI ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
      (last && !user()
        ? '<button type="button" class="onb-next" data-x="onb-login">' + esc(T('تسجيل الدخول (متدرب أو أستاذ)')) + '</button><button type="button" class="onb-sec" data-x="onb-next">' + esc(T('ابدأ بدون حساب')) + '</button>'
        : '<button type="button" class="onb-next" data-x="onb-next">' + esc(T(last ? 'ابدأ' : 'التالي')) + '</button>');
    var nb = onb.querySelector('.onb-next'); if (nb) nb.focus();
  }
  function onbOpen() {
    if (onb) return;
    prevFocus = document.activeElement; onbI = 0;
    onb = document.createElement('div'); onb.className = 'onb'; onb.setAttribute('role', 'dialog'); onb.setAttribute('aria-modal', 'true'); onb.setAttribute('aria-labelledby', 'onbt');
    onb.dir = document.documentElement.dir || 'rtl';
    onb.innerHTML = '<div class="onb-card"></div>'; document.body.appendChild(onb); onbDraw();
  }
  function onbClose() {
    ls('pie-onb', '1'); if (!onb) return;
    onb.remove(); onb = null; try { if (prevFocus && prevFocus.focus) prevFocus.focus(); } catch (e) {}
  }

  /* ---------------- زر الحساب وبطاقة الدخول ---------------- */
  function user() { return ls('pie-user'); }
  function acct() {
    var b = $('acctbtn'); if (!b) return;
    var u = user(), i = b.querySelector('.ini');
    b.classList.toggle('has', !!u); if (i) i.textContent = u || '';
  }
  function renderGate() {
    var el = $('gate'); if (!el) return;
    if (user() || ls('pie-gate-x') === '1') { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="gate"><div class="gate-t"><b>' + esc(T('هل أنت متدرب في معهد؟')) + '</b><span>' + esc(T('سجّل الدخول لتنضم إلى قسمك ويتابع أستاذك تقدمك.')) + '</span></div>' +
      '<button type="button" class="gate-go" data-act="portal-open">' + esc(T('تسجيل الدخول')) + '</button>' +
      '<button type="button" class="gate-x" data-x="gate-x" aria-label="' + esc(T('إخفاء')) + '">&#10005;</button></div>';
  }

  /* ---------------- أحداث ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-x]') : null; if (!b) return;
    var a = b.dataset.x;
    if (a === 'daily-toggle') toggle();
    else if (a === 'onb-open') { var sc = $('scrim'); if (sc && !sc.hidden) sc.click(); onbOpen(); }
    else if (a === 'onb-skip') onbClose();
    else if (a === 'onb-login') { onbClose(); if (window.PIE_PORTAL) PIE_PORTAL.open(); }
    else if (a === 'gate-x') { ls('pie-gate-x', '1'); renderGate(); }
    else if (a === 'onb-next') { if (onbI >= STEPS.length - 1) onbClose(); else { onbI++; onbDraw(); } }
  });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'dailyt') { var c = cfg(); c.t = e.target.value || '20:00'; c.last = ''; save(c); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && onb) onbClose(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });

  var css = document.createElement('style');
  css.textContent =
    '#ach .ach-top{display:flex;align-items:center;justify-content:space-between;gap:8px}#ach h2{margin:0}' +
    '#ach .ach-n{font-weight:700;color:var(--accent);direction:ltr}#ach .ach-sub{margin:6px 0 12px;color:var(--ink-2);font-size:14px}' +
    '#ach .ach-g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}' +
    '#ach .ach-b{display:grid;justify-items:center;gap:6px;text-align:center;font-size:12.5px;line-height:1.35;color:var(--ink)}' +
    '#ach .ach-b i{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:21px;background:var(--surface-2);color:var(--ink-2);transition:transform .3s}' +
    '#ach .ach-b.on i{background:var(--accent);color:var(--accent-ink)}#ach .ach-b.off{opacity:.5}' +
    '#dailyt{font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:6px 10px;direction:ltr}' +
    '.onb{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:20px;background:rgba(8,12,34,.62);animation:onbIn .25s ease}' +
    '.onb-card{position:relative;width:min(380px,100%);box-sizing:border-box;padding:34px 24px 24px;border-radius:26px;background:var(--surface);color:var(--ink);text-align:center;display:grid;gap:14px;justify-items:center;box-shadow:0 20px 50px rgba(0,0,0,.35)}' +
    '.onb-card h2{margin:0;font-size:22px}.onb-card p{margin:0;color:var(--ink-2);line-height:1.7;font-size:15.5px}' +
    '.onb-ic{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--accent-ink)}' +
    '.onb-ic svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.onb-dots{display:flex;gap:7px}.onb-dots i{width:8px;height:8px;border-radius:50%;background:var(--line);transition:.25s}.onb-dots i.on{width:22px;border-radius:5px;background:var(--accent)}' +
    '.onb-next{width:100%;height:48px;border:0;border-radius:14px;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:700;cursor:pointer}' +
    '.onb-skip{position:absolute;top:12px;inset-inline-end:14px;border:0;background:none;color:var(--ink-2);font:inherit;font-size:14px;cursor:pointer;padding:6px}' +
    '.onb-sec{width:100%;height:44px;border:0;background:none;color:var(--ink-2);font:inherit;font-size:14.5px;cursor:pointer}' +
    '.head .acct{order:3;position:relative}.head .menu-btn:not(.acct){order:4}html[dir="ltr"] .head .acct{order:0}html[dir="ltr"] .head .menu-btn:not(.acct){order:0}' +
    '.acct .ini{display:none;font-style:normal;font-size:17px;font-weight:700}.acct.has{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}.acct.has svg{display:none}.acct.has .ini{display:block}' +
    '.gate{display:flex;align-items:center;gap:10px;padding:12px 14px;margin-bottom:12px;border-radius:16px;background:var(--surface);border:1px solid var(--line)}' +
    '.gate-t{flex:1;display:grid;gap:2px;min-width:0}.gate-t b{font-size:15px}.gate-t span{font-size:13px;color:var(--ink-2);line-height:1.5}' +
    '.gate-go{flex:none;height:38px;padding:0 16px;border:0;border-radius:11px;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:700;font-size:14px;cursor:pointer}' +
    '.gate-x{flex:none;width:30px;height:30px;border:0;background:none;color:var(--ink-2);font-size:15px;cursor:pointer}' +
    '@keyframes onbIn{from{opacity:0}}@media (prefers-reduced-motion:reduce){.onb{animation:none}}';
  document.head.appendChild(css);

  window.PIE_X = { acct: acct, today: function () { try { renderGate(); acct(); renderAch(); syncUi(); check(); } catch (e) {} } };
  mirror(); if (enabled()) periodic(true);
  window.PIE_X.today();
  setInterval(check, 10 * 60 * 1000);
  if (ls('pie-onb') !== '1') {
    var tries = 0, iv = setInterval(function () { tries++; if (!$('splash') || tries > 40) { clearInterval(iv); setTimeout(function () { if (ls('pie-onb') !== '1') onbOpen(); }, 400); } }, 400);
  }
})();
