// Service worker for "عاداتي اليومية": keeps the app working offline.
// الإصدار الظاهر للمستخدم (PIE_VERSION في index.html) = رقم v هنا: v26 = 2.6
// Bump CACHE when you change index.html so installed copies pick up the update.
var CACHE = 'adati-v26';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './logo-pie.svg', './ikigai.pdf', './holidays.js', './firebase-config.js', './backend.js', './portal.js', './extras.js', './privacy.html', './auth.css', './vendor/html-to-image.js', './vendor/pdf-lib.min.js'];

try { importScripts('./holidays.js'); } catch (err) {}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== 'pie-meta'; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

// Serve from cache first, refresh the cache in the background.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('cdn.jsdelivr.net') >= 0) return; // أداة قراءة الصور: من الشبكة دائما
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});

/* ---------- holiday alerts (two days before each holiday) ---------- */
function holidayCheck() {
  if (!self.PIE_HOL || !self.Notification || self.Notification.permission !== 'granted') return Promise.resolve();
  return PIE_HOL.meta.get().then(function (m) {
    if (!m.on) return;
    var lang = m.lang || 'ar', seen = m.seen || {};
    var fresh = PIE_HOL.due(new Date(), lang).filter(function (d) { return !seen[d.id]; });
    if (!fresh.length) return;
    return Promise.all(fresh.map(function (d) {
      seen[d.id] = 1;
      return self.registration.showNotification(d.title, PIE_HOL.opts(d, lang));
    })).then(function () { m.seen = seen; return PIE_HOL.meta.set(m); });
  }).catch(function () {});
}

/* ---------- daily habit reminder (time chosen in settings) ---------- */
var DAILY_TXT = {
  ar: 'لم تنجز عاداتك اليوم بعد. دقيقة واحدة تكفي.',
  en: 'You haven\u2019t finished today\u2019s habits yet. One minute is enough.',
  fr: 'Tu n\u2019as pas encore termin\u00e9 tes habitudes du jour. Une minute suffit.'
};
function dailyCheck() {
  if (!self.PIE_HOL || !self.Notification || self.Notification.permission !== 'granted') return Promise.resolve();
  return PIE_HOL.meta.get().then(function (m) {
    var d = m.daily; if (!d || !d.on) return;
    var n = new Date(), p = (d.t || '20:00').split(':'), pad = function (x) { return (x < 10 ? '0' : '') + x; };
    var k = n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate());
    if (d.last === k) return;
    if (n.getHours() * 60 + n.getMinutes() < (+p[0]) * 60 + (+p[1])) return;
    var lang = d.lang || 'ar';
    d.last = k; m.daily = d;
    return self.registration.showNotification('PIE', { body: DAILY_TXT[lang] || DAILY_TXT.ar, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'pie-daily', lang: lang, dir: lang === 'ar' ? 'rtl' : 'ltr', data: { url: './index.html' } })
      .then(function () { return PIE_HOL.meta.set(m); });
  }).catch(function () {});
}

// Chrome (installed PWA) wakes the service worker periodically, even when the app is closed.
self.addEventListener('periodicsync', function (e) {
  if (e.tag === 'pie-hol') e.waitUntil(holidayCheck());
  if (e.tag === 'pie-daily') e.waitUntil(dailyCheck());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
      return self.clients.openWindow('./index.html');
    })
  );
});
