/* PIE: جدول عطل مؤسسات مكتب التكوين المهني وإنعاش الشغل (OFPPT) للسنة التكوينية 2026 - 2027.
   هذا الملف تستعمله الصفحة (index.html) والـ service worker (sw.js) معًا.
   - s = أول يوم من العطلة، e = آخر يوم (YYYY-MM-DD).
   - approx: true  => التاريخ تقريبي لأنه مرتبط برؤية الهلال. بدّله هنا ملي تتأكد التواريخ الرسمية.
   - dt  => نص عدد الأيام إلا كان ما يتحسبش (مثلا "3 أو 4").
   - n = [عربي, English, Français]، h = وصف هجري اختياري. */
(function (g) {
  var WINDOW = 2; /* كم يوم قبل العطلة يوصل الإشعار */

  var H = [
    { id: 'unity-2026', n: ['عيد الوحدة', 'Unity Day', 'Fête de l’Unité'], s: '2026-10-31', e: '2026-10-31' },
    { id: 'march-2026', n: ['ذكرى المسيرة الخضراء', 'Green March Anniversary', 'Anniversaire de la Marche verte'], s: '2026-11-06', e: '2026-11-06' },
    { id: 'indep-2026', n: ['عيد الاستقلال', 'Independence Day', 'Fête de l’Indépendance'], s: '2026-11-18', e: '2026-11-18' },
    { id: 'term1-2026', n: ['عطلة الطور الأول', 'First-term break', 'Vacances de la 1re période'], s: '2026-12-06', e: '2026-12-13' },
    { id: 'newyear-2027', n: ['فاتح يناير', 'New Year’s Day', 'Nouvel An'], s: '2027-01-01', e: '2027-01-01' },
    { id: 'manifesto-2027', n: ['ذكرى تقديم وثيقة الاستقلال', 'Independence Manifesto Anniversary', 'Anniversaire du Manifeste de l’Indépendance'], s: '2027-01-11', e: '2027-01-11' },
    { id: 'amazigh-2027', n: ['رأس السنة الأمازيغية', 'Amazigh New Year', 'Nouvel An amazigh'], s: '2027-01-14', e: '2027-01-14' },
    { id: 'mid-2027', n: ['عطلة منتصف السنة التكوينية', 'Mid-year break', 'Vacances de mi-année'], s: '2027-01-24', e: '2027-01-31' },
    { id: 'fitr-2027', n: ['عيد الفطر', 'Eid al-Fitr', 'Aïd al-Fitr'], s: '2027-03-08', e: '2027-03-11', approx: true,
      dt: ['3 أو 4 أيام', '3 or 4 days', '3 ou 4 jours'],
      h: ['من 29 رمضان إلى 2 شوال 1448', '29 Ramadan – 2 Shawwal 1448', 'du 29 Ramadan au 2 Chawwal 1448'] },
    { id: 'term2-2027', n: ['عطلة الطور الثاني', 'Second-term break', 'Vacances de la 2e période'], s: '2027-03-21', e: '2027-03-28' },
    { id: 'labour-2027', n: ['عيد الشغل', 'Labour Day', 'Fête du Travail'], s: '2027-05-01', e: '2027-05-01' },
    { id: 'term3-2027', n: ['عطلة الطور الثالث', 'Third-term break', 'Vacances de la 3e période'], s: '2027-05-09', e: '2027-05-16' },
    { id: 'adha-2027', n: ['عيد الأضحى', 'Eid al-Adha', 'Aïd al-Adha'], s: '2027-05-16', e: '2027-05-18', approx: true,
      h: ['من 9 إلى 11 ذي الحجة 1448', '9 – 11 Dhu al-Hijjah 1448', 'du 9 au 11 Dhou al-Hijja 1448'] },
    { id: 'muharram-1449', n: ['فاتح محرم 1449', 'Islamic New Year 1449', 'Nouvel An hégirien 1449'], s: '2027-06-06', e: '2027-06-06', approx: true }
  ];

  var DAYS = {
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  };
  var MONTHS = {
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  };

  function li(lang) { return lang === 'en' ? 1 : lang === 'fr' ? 2 : 0; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(k) { var p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function todayUtc(now) { return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()); }
  function span(h) { return Math.round((ymd(h.e) - ymd(h.s)) / 864e5) + 1; }

  function fmt(k, lang) {
    var p = k.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]), L = DAYS[lang] ? lang : 'ar';
    var wd = DAYS[L][d.getDay()], mo = MONTHS[L][d.getMonth()];
    if (L === 'en') return wd + ', ' + mo + ' ' + d.getDate() + ', ' + d.getFullYear();
    return wd + ' ' + d.getDate() + ' ' + mo + ' ' + d.getFullYear();
  }
  function dayWord(n, lang) {
    if (lang === 'en') return n + (n === 1 ? ' day' : ' days');
    if (lang === 'fr') return n + (n === 1 ? ' jour' : ' jours');
    if (n === 1) return 'يوم واحد';
    if (n === 2) return 'يومان';
    return n <= 10 ? n + ' أيام' : n + ' يومًا';
  }

  function title(h, diff, lang) {
    var nm = h.n[li(lang)];
    if (lang === 'en') return (diff === 0 ? 'Holiday today: ' : diff === 1 ? 'Holiday tomorrow: ' : 'Holiday in 2 days: ') + nm;
    if (lang === 'fr') return (diff === 0 ? 'Congé aujourd’hui : ' : diff === 1 ? 'Congé demain : ' : 'Congé dans 2 jours : ') + nm;
    return (diff === 0 ? 'اليوم عطلة: ' : diff === 1 ? 'عطلة غدًا: ' : 'عطلة بعد يومين: ') + nm;
  }
  function body(h, lang) {
    var i = li(lang), n = span(h), out;
    var days = h.dt ? h.dt[i] : dayWord(n, lang);
    if (h.s === h.e) out = fmt(h.s, lang);
    else if (lang === 'en') out = fmt(h.s, lang) + ' → ' + fmt(h.e, lang) + ' (' + days + ')';
    else if (lang === 'fr') out = 'Du ' + fmt(h.s, lang) + ' au ' + fmt(h.e, lang) + ' (' + days + ')';
    else out = 'من ' + fmt(h.s, lang) + ' إلى ' + fmt(h.e, lang) + ' (' + days + ')';
    if (h.h) out += ' · ' + h.h[i];
    if (h.approx) {
      out += lang === 'en' ? '. Date is approximate (depends on the moon sighting).'
        : lang === 'fr' ? '. Date approximative (selon l’observation de la lune).'
        : '. التاريخ تقريبي ويتأكد حسب رؤية الهلال.';
    }
    return out;
  }

  /* العطل التي تبدأ خلال اليوم الحالي أو الـ 2 أيام المقبلة */
  function due(now, lang) {
    var t = todayUtc(now), out = [];
    H.forEach(function (h) {
      var diff = Math.round((ymd(h.s) - t) / 864e5);
      if (diff >= 0 && diff <= WINDOW) out.push({ id: h.id, diff: diff, h: h, title: title(h, diff, lang), body: body(h, lang) });
    });
    return out;
  }

  /* سطر "العطلة القادمة" للإعدادات */
  function nextInfo(now, lang) {
    var t = todayUtc(now), h = null, i;
    for (i = 0; i < H.length; i++) { if (ymd(H[i].e) >= t) { h = H[i]; break; } }
    var L = DAYS[lang] ? lang : 'ar';
    if (!h) return L === 'en' ? 'No more holidays in this year’s schedule.' : L === 'fr' ? 'Plus de congés dans le calendrier de cette année.' : 'لا توجد عطل أخرى في جدول هذه السنة.';
    var diff = Math.round((ymd(h.s) - t) / 864e5), nm = h.n[li(L)], when;
    if (diff <= 0) when = L === 'en' ? 'happening now' : L === 'fr' ? 'en cours' : 'جارية الآن';
    else when = L === 'en' ? 'in ' + dayWord(diff, L) : L === 'fr' ? 'dans ' + dayWord(diff, L) : 'بعد ' + (diff === 2 ? 'يومين' : dayWord(diff, L));
    var dt = fmt(h.s, L) + (h.approx ? (L === 'en' ? ' (approx.)' : L === 'fr' ? ' (approx.)' : ' (تقريبي)') : '');
    return (L === 'en' ? 'Next holiday: ' : L === 'fr' ? 'Prochain congé : ' : 'العطلة القادمة: ') + nm + ' — ' + dt + ' · ' + when;
  }

  function opts(d, lang) {
    return {
      body: d.body, icon: 'icon-192.png', badge: 'icon-192.png',
      tag: 'pie-hol-' + d.id, lang: lang, dir: lang === 'ar' ? 'rtl' : 'ltr',
      data: { url: './index.html' }
    };
  }

  /* مخزن صغير مشترك بين الصفحة والـ service worker (Cache API): اللغة، هل التنبيهات مفعلة، وأي عطل تم إشعارها */
  var META = './pie-meta.json';
  function metaGet() {
    if (!g.caches) return Promise.resolve({});
    return g.caches.open('pie-meta').then(function (c) { return c.match(META); })
      .then(function (r) { return r ? r.json() : {}; }).catch(function () { return {}; });
  }
  function metaSet(o) {
    if (!g.caches) return Promise.resolve();
    return g.caches.open('pie-meta').then(function (c) {
      return c.put(META, new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } }));
    }).catch(function () {});
  }
  function metaUpdate(fn) { return metaGet().then(function (o) { fn(o); return metaSet(o); }); }

  g.PIE_HOL = { list: H, window: WINDOW, due: due, nextInfo: nextInfo, build: function (h, diff, lang) { return { id: h.id, diff: diff, h: h, title: title(h, diff, lang), body: body(h, lang) }; }, opts: opts, meta: { get: metaGet, set: metaSet, update: metaUpdate } };
})(typeof self !== 'undefined' ? self : this);
