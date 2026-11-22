(function () {
  var root, me = null, mode = 'login', unlocked = {}, cur = null, msg = '', ready = false, lastState = null, tm = null, pend = null, seq = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dk(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function cnt(o) { var n = 0; for (var k in (o || {})) if (o[k]) n++; return n; }
  function summary(s) {
    var t = new Date(), td = dk(t), done = 0, week = 0, i, hs = s.habits || [];
    hs.forEach(function (h) { if (h.days && h.days[td]) done++; for (i = 0; i < 7; i++) { var d = new Date(t); d.setDate(t.getDate() - i); if (h.days && h.days[dk(d)]) week++; } });
    return { habits: hs.length, today: done, week: week, read: cnt(s.ch && s.ch.read && s.ch.read.r), month: cnt(s.ch && s.ch.month && s.ch.month.d), notes: cnt(s.notes), lib: (s.lib || []).length };
  }
  function pack(st) { try { return window.PIE_PACK ? window.PIE_PACK(st) : null; } catch (e) { return null; } }
  window.PIE_SYNC = function (st) {
    lastState = st; if (!me || me.role !== 'student' || !me.sectionId || !window.PB) return;
    clearTimeout(tm); tm = setTimeout(function () { PB.push(me.sectionId, summary(lastState), pack(lastState)).catch(function () {}); }, 2500);
  };
  function build() {
    var st = document.createElement('style');
    st.textContent = "#pp{position:fixed;inset:0;z-index:99;overflow:auto;background:var(--bg);color:var(--ink);font:16px/1.6 var(--font-body);padding:max(14px,env(safe-area-inset-top,0px)) 16px max(24px,env(safe-area-inset-bottom,0px))}\n#pp[hidden]{display:none}\n#pp *{box-sizing:border-box}\n#pp .w{max-width:520px;margin:0 auto;display:grid;gap:14px}\n#pp .ph{display:flex;align-items:center;gap:12px}\n#pp .ph img{width:44px;height:auto;flex:none}\n#pp .ph div{flex:1;display:grid;line-height:1.25}\n#pp .ph b{font-family:var(--font-display);font-size:20px;letter-spacing:.06em}\n#pp .ph small{color:var(--ink-2);font-size:13px}\n#pp .x{width:40px;height:40px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font-size:16px;padding:0}\n#pp h2{margin:2px 0 0;font:700 22px/1.3 var(--font-display)}\n#pp h3{margin:0;font-size:16px}\n#pp p{margin:0}\n#pp .sub{color:var(--ink-2);font-size:14px}\n#pp .c{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:16px;display:grid;gap:12px}\n#pp label{display:grid;gap:6px;font-size:14px;font-weight:600;color:var(--ink-2)}\n#pp input,#pp textarea{width:100%;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:12px;padding:10px 14px;font:inherit;font-size:16px;font-weight:400}\n#pp input{height:48px}\n#pp textarea{min-height:90px;resize:vertical}\n#pp input:focus,#pp textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}\n#pp form{display:grid;gap:12px}\n#pp button{font:inherit;cursor:pointer}\n#pp .b{height:48px;padding:0 20px;border:0;border-radius:12px;background:var(--accent);color:var(--accent-ink);font-weight:600}\n#pp .b.g{background:none;border:1px solid var(--line);color:var(--ink)}\n#pp .b.s{height:40px;padding:0 14px;font-size:14px}\n#pp .b.dg{color:var(--danger)}\n#pp .row{display:flex;gap:8px;flex-wrap:wrap}\n#pp .row .b{flex:1}\n#pp .seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px;background:var(--surface-2);border-radius:14px}\n#pp .seg button{height:42px;border:0;border-radius:10px;background:none;color:var(--ink-2);font-weight:600}\n#pp .seg button[aria-pressed=true]{background:var(--surface);color:var(--accent);box-shadow:0 1px 4px rgba(0,0,0,.12)}\n#pp .pills{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n#pp .pills label{display:block;font-size:15px;color:var(--ink)}\n#pp .pills input{position:absolute;opacity:0;width:1px;height:1px}\n#pp .pills span{display:grid;place-items:center;height:46px;border:1px solid var(--line);border-radius:12px;background:var(--bg);cursor:pointer}\n#pp .pills input:checked+span{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:600}\n#pp .pills input:focus-visible+span{outline:3px solid var(--accent);outline-offset:2px}\n#pp .m{min-height:1.4em;color:var(--danger);text-align:center;font-size:14px}\n#pp .ub{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:8px 8px 8px 12px}\n#pp .av{width:38px;height:38px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font:700 17px var(--font-display);font-style:normal;flex:none}\n#pp .ub div{flex:1;min-width:0;display:grid;line-height:1.3}\n#pp .ub b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n#pp .ub small{color:var(--ink-2);font-size:12px}\n#pp .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n#pp .tile{background:var(--surface-2);border-radius:14px;padding:10px 6px;text-align:center}\n#pp .tile b{display:block;font:700 22px/1.2 var(--font-display);color:var(--accent)}\n#pp .tile span{font-size:12px;color:var(--ink-2)}\n#pp .hero{text-align:center;padding:22px 16px}\n#pp .hero .ok{width:54px;height:54px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:26px;margin:0 auto 4px}\n#pp .score{display:grid;place-items:center;gap:2px;text-align:center}\n#pp .sc{font:700 44px/1.1 var(--font-display);color:var(--accent);direction:ltr}\n#pp .sc small{font-size:18px;color:var(--ink-2)}\n#pp .note{background:var(--surface-2);border-radius:14px;padding:10px 12px;white-space:pre-wrap;text-align:start}\n#pp .code{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface-2);border-radius:14px;padding:10px 14px}\n#pp .code b{font:700 22px var(--font-display);letter-spacing:.14em;direction:ltr}\n#pp .st{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:14px;display:grid;gap:10px}\n#pp .sh{display:flex;align-items:center;justify-content:space-between;gap:8px}\n#pp .sh b{font-size:17px}\n#pp .pill{border-radius:999px;padding:2px 12px;font-size:13px;font-weight:600;background:var(--surface-2);color:var(--ink-2);white-space:nowrap}\n#pp .pill.on{background:var(--accent);color:var(--accent-ink);direction:ltr}\n#pp .pill.gold{background:var(--gold-bg);color:var(--gold-ink)}\n#pp .pg{display:grid;grid-template-columns:74px 1fr 46px;align-items:center;gap:8px;font-size:13px;color:var(--ink-2)}\n#pp .pg b{color:var(--ink);text-align:end;direction:ltr}\n#pp .bar{height:8px;border-radius:99px;background:var(--surface-2);overflow:hidden}\n#pp .bar i{display:block;height:100%;background:var(--accent);border-radius:99px}\n#pp .kp{display:flex;gap:14px;font-size:13px;color:var(--ink-2)}\n#pp .kp b{color:var(--ink)}\n#pp details{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:4px 14px}\n#pp summary{cursor:pointer;font-weight:700;padding:10px 0;display:flex;justify-content:space-between;align-items:center;gap:8px;list-style:none}\n#pp summary::-webkit-details-marker{display:none}\n#pp summary::after{content:'›';transform:rotate(90deg);color:var(--ink-2);font-size:20px;transition:transform .15s}\n#pp details[open] summary::after{transform:rotate(-90deg)}\n#pp details[open] summary{border-bottom:1px solid var(--line);margin-bottom:6px}\n#pp .q{font-weight:700;font-size:15px;margin:12px 0 4px}\n#pp .q.l{font-weight:500;color:var(--ink-2);font-size:13px;margin:8px 0 3px}\n#pp .a{background:var(--surface-2);border-radius:12px;padding:9px 12px;white-space:pre-wrap;margin-bottom:6px}\n#pp .r{border-top:1px dashed var(--line);margin-top:10px;padding-top:2px}\n#pp .pf{margin-top:6px;padding-top:14px;border-top:1px solid var(--line);text-align:center;font-size:12.5px;color:var(--ink-2);display:grid;gap:2px}\n#pp .pf b{font:700 14px var(--font-display);color:var(--ink);letter-spacing:.06em;direction:ltr}\n#pp .empty{text-align:center;color:var(--ink-2);padding:18px 6px}\n#pp{overflow-x:hidden}\n#pp .w>*{min-width:0}\n#pp .q,#pp .a,#pp .note,#pp h2,#pp .sub{overflow-wrap:anywhere}\n#pp .lst{display:grid;gap:8px}\n#pp .sr{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:6px 10px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:10px}\n#pp .sr .av{width:38px;height:38px;font-size:16px}\n#pp .sr .nm{font-weight:700;font-size:16px;overflow-wrap:anywhere;line-height:1.3}\n#pp .sr .ss{grid-column:1/-1;color:var(--ink-2);font-size:12.5px;padding-inline-start:48px}\n#pp .sr .b,#pp .sr .pill{flex:none}\n#pp .gr{display:grid;grid-template-columns:104px 1fr;gap:10px;align-items:end}\n#pp .gr .full{grid-column:1/-1}\n#pp .gr textarea{min-height:64px;height:64px;margin:0}\n#pp .chips{display:flex;gap:8px;flex-wrap:wrap}\n#pp .chip{background:var(--surface-2);border-radius:999px;padding:3px 12px;font-size:13px;color:var(--ink-2)}\n#pp .chip b{color:var(--ink)}\n#pp .fl{display:flex;align-items:center;gap:10px}\n#pp .fl .ic{flex:none;width:38px;height:38px;border-radius:12px;background:var(--surface-2);color:var(--accent);display:grid;place-items:center}\n#pp .fl .ic svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}\n#pp .fl .t{flex:1;min-width:0;display:grid;line-height:1.35}\n#pp .fl .t small{color:var(--ink-2);font-size:12px}\n#pp .sr{grid-template-columns:auto minmax(0,1fr) auto auto auto}\n#pp .sr .ss.warn{color:var(--danger)}\n#pp .warnbox{border-color:var(--danger);color:var(--danger)}\n#pp .pf a{color:inherit;text-decoration:underline}";
    document.head.appendChild(st);
    var gs = document.createElement('style'); gs.textContent = "/* زر Google + الفاصل */\n#pp .au .au-or { display: flex; align-items: center; gap: 12px; margin: 20px 4px 16px; color: var(--ns); font-size: 12.5px; }\n#pp .au .au-or::before, #pp .au .au-or::after { content: \"\"; flex: 1; height: 3px; border-radius: 3px; background: var(--nb); box-shadow: inset 1px 1px 2px var(--sd), inset -1px -1px 2px var(--sl); }\n#pp .au .au-g {\n  width: 100%; height: 55px; padding: 0 16px; border: 0; border-radius: 17px; background: var(--nb); color: var(--ni);\n  display: flex; align-items: center; justify-content: center; gap: 12px; font: 700 14.5px var(--font-body);\n  box-shadow: 8px 8px 16px var(--sd), -8px -8px 16px var(--sl); transition: .3s ease;\n}\n#pp .au .au-g .gg { width: 22px; height: 22px; flex: none; }\n#pp .au .au-g:hover, #pp .au .au-g:focus-visible { transform: translateY(-3px); box-shadow: 10px 12px 22px var(--sd), -8px -8px 16px var(--sl); }\n#pp .au .au-g:active { transform: scale(.98); box-shadow: inset 5px 5px 10px var(--sd), inset -5px -5px 10px var(--sl); }\n#pp .au .au-g:disabled { opacity: .6; pointer-events: none; }\n#pp .au .au-g:focus-visible { outline: 2px solid var(--na); outline-offset: 2px; }\n\n"; document.head.appendChild(gs);
    var lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = 'auth.css'; document.head.appendChild(lk);
    root = document.createElement('div'); root.id = 'pp'; root.dir = 'rtl'; root.hidden = true; document.body.appendChild(root);
    root.addEventListener('change', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-ocr')) { ocr(e.target); return; }
      if (e.target.name !== 'role') return;
      var rv = root.querySelector('.rv'), on = e.target.value === 'teacher';
      if (rv) { rv.classList.toggle('on', on); rv.querySelector('.rv-in').toggleAttribute('inert', !on); fitAuth(480); }
    });
    window.addEventListener('resize', function () { fitAuth(); });
    root.addEventListener('click', click); root.addEventListener('submit', function (e) { e.preventDefault(); submit(e.target); });
  }
  var IC = {
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4.5-6 8-6s7 2 8 6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeoff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6C3.7 9.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    google: '<svg viewBox="0 0 24 24" aria-hidden="true" class="gg" width="22" height="22"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.55H2.17v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.83 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.17a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 5.36c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.17 7.07l3.66 2.84C6.7 7.3 9.13 5.36 12 5.36z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg class="flip-ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
  };
  function ig(id, name, label, type, ac, dir, peek) {
    return '<div class="ig' + (peek ? ' pk' : '') + '"><i class="eg"></i><i class="eb"></i><input id="' + id + '" name="' + name + '" type="' + type + '" placeholder=" " autocomplete="' + ac + '" dir="' + dir + '"' + (name === 'tcode' ? '' : ' required') + '><label for="' + id + '">' + label + '</label>' +
      (peek ? '<button type="button" class="pt" data-a="peek" data-t="' + id + '" aria-label="إظهار كلمة السر" aria-pressed="false">' + IC.eye + '</button>' : '') + '</div>';
  }
  function gbtn(t) { return '<div class="au-or"><span>أو</span></div><button type="button" class="au-g" data-a="google">' + IC.google + '<span>' + t + '</span></button>'; }
  function pendView() {
    return '<div class="au-bg" aria-hidden="true"><i class="bgc b1"></i><i class="bgc b2"></i><i class="bgc b3"></i></div>' +
      '<div class="au"><div class="au-card" id="authCard"><section class="au-panel au-login"><div class="au-logo">' + IC.user + '</div><h1>أكمل حسابك</h1><p class="au-sub">خطوة أخيرة بعد الدخول عبر Google</p>' +
      '<form data-f="gcomplete">' + ig('gc-name', 'name', 'الاسم الكامل', 'text', 'name', 'auto') +
      '<div class="ig"><i class="eg"></i><i class="eb"></i><div class="role" role="radiogroup" aria-label="نوع الحساب"><label><input type="radio" name="role" value="student" checked><span>متدرب</span></label><label><input type="radio" name="role" value="teacher"><span>أستاذ</span></label></div><span class="rl">نوع الحساب</span></div>' +
      '<div class="rv"><div class="rv-in" inert>' + ig('gc-code', 'tcode', 'رمز الأساتذة', 'password', 'off', 'ltr') + '</div></div>' +
      '<button class="au-btn">متابعة</button></form>' +
      '<div class="au-switch"><button type="button" class="au-link" data-a="out">استخدام حساب آخر</button></div></section></div></div>';
  }
  function authView() {
    var su = mode === 'signup';
    return '<div class="au-bg" aria-hidden="true"><i class="bgc b1"></i><i class="bgc b2"></i><i class="bgc b3"></i></div>' +
      '<div class="au"><div class="au-card' + (su ? ' flipped' : '') + '" id="authCard">' +
      '<section class="au-panel au-login"' + (su ? ' inert aria-hidden="true"' : '') + '><div class="au-logo">' + IC.lock + '</div><h1>مرحبا بعودتك</h1><p class="au-sub">سجّل الدخول لمتابعة رحلتك</p>' +
      '<form data-f="login">' + ig('lg-email', 'email', 'البريد الإلكتروني', 'email', 'email', 'ltr') + ig('lg-pw', 'pw', 'كلمة السر', 'password', 'current-password', 'ltr', true) +
      '<div class="au-opt"><label class="au-chk"><input type="checkbox" name="remember" checked>تذكرني</label><button type="button" class="au-link" data-a="forgot">نسيت كلمة السر؟</button></div>' +
      '<button class="au-btn">دخول</button></form>' + gbtn('الدخول عبر Google') +
      '<div class="au-switch"><span>ليس لديك حساب؟</span><button type="button" class="au-circle" data-a="flip" aria-label="إنشاء حساب جديد">' + IC.plus + '</button></div></section>' +
      '<section class="au-panel au-signup"' + (su ? '' : ' inert aria-hidden="true"') + '><div class="au-logo">' + IC.user + '</div><h1>إنشاء حساب</h1><p class="au-sub">ابدأ رحلتك معنا</p>' +
      '<form data-f="signup">' + ig('su-name', 'name', 'الاسم الكامل', 'text', 'name', 'auto') + ig('su-email', 'email', 'البريد الإلكتروني', 'email', 'email', 'ltr') +
      ig('su-pw', 'pw', 'كلمة السر (6 أحرف على الأقل)', 'password', 'new-password', 'ltr', true) + ig('su-pw2', 'pw2', 'تأكيد كلمة السر', 'password', 'new-password', 'ltr') +
      '<div class="ig"><i class="eg"></i><i class="eb"></i><div class="role" role="radiogroup" aria-label="نوع الحساب"><label><input type="radio" name="role" value="student" checked><span>متدرب</span></label><label><input type="radio" name="role" value="teacher"><span>أستاذ</span></label></div><span class="rl">نوع الحساب</span></div>' +
      '<div class="rv"><div class="rv-in" inert>' + ig('su-code', 'tcode', 'رمز الأساتذة', 'password', 'off', 'ltr') + '</div></div>' +
      '<button class="au-btn">إنشاء الحساب</button></form>' + gbtn('التسجيل عبر Google') +
      '<div class="au-switch"><span>لديك حساب بالفعل؟</span><button type="button" class="au-circle" data-a="flip" aria-label="العودة إلى تسجيل الدخول">' + IC.back + '</button></div></section>' +
      '</div></div>';
  }
  function fitAuth(ms) {
    var c = root && root.querySelector('#authCard'); if (!c) return;
    var p = c.querySelector(c.classList.contains('flipped') ? '.au-signup' : '.au-login'), t0 = Date.now();
    (function step() { c.style.height = (p.scrollHeight + 8) + 'px'; if (Date.now() - t0 < (ms || 0)) requestAnimationFrame(step); })();
  }
  function showErr(t) {
    var m = root.querySelector('.m'); if (m) m.textContent = t || '';
    Array.prototype.forEach.call(root.querySelectorAll('.au-btn.busy'), function (x) { x.classList.remove('busy'); });
  }
  function busy(fm) { var b = fm.querySelector('.au-btn'); if (b) b.classList.add('busy'); showErrKeepBusy(); }
  function showErrKeepBusy() { var m = root.querySelector('.m'); if (m) m.textContent = ''; }
  function f(id, label, type, ph) { return '<label>' + label + '<input name="' + id + '" type="' + (type || 'text') + '" placeholder="' + (ph || '') + '" required></label>'; }
  function ver() { return esc(window.PIE_VERSION || ''); }
  function draw(h) {
    root.innerHTML = '<div class="w"><header class="ph"><img src="logo-pie.svg" alt=""><div><b>PIE</b><small>الأساتذة والمتدربون</small></div><button class="x" data-a="close" aria-label="إغلاق">✕</button></header>' + h +
      '<p class="m" role="status">' + esc(msg) + '</p><footer class="pf"><span>صُنع بواسطة</span><b>HABACHE &amp; DYNAR &amp; ESBITRY</b><span>الإصدار ' + ver() + '</span><a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a></footer></div>';
    msg = '';
  }
  function bar(n, max) { return '<div class="bar"><i style="width:' + Math.min(100, Math.round((n || 0) / max * 100)) + '%"></i></div>'; }
  function view() {
    if (!ready) { root.classList.remove('auth-on'); return draw('<div class="c hero"><h2>الأساتذة والمتدربون</h2><p class="sub">جارٍ التحميل…</p></div>'); }
    root.classList.toggle('auth-on', !me);
    if (!me && pend) { draw(pendView()); var gn = root.querySelector('#gc-name'); if (gn) gn.value = pend.name || ''; requestAnimationFrame(function () { fitAuth(); }); setTimeout(fitAuth, 400); return; }
    if (!me) { draw(authView()); requestAnimationFrame(function () { fitAuth(); }); setTimeout(fitAuth, 400); return; }
    var out = '<div class="ub"><i class="av">' + esc((me.name || '?').charAt(0).toUpperCase()) + '</i><div><b>' + esc(me.name) + '</b><small>' + (me.role === 'teacher' ? 'أستاذ' : 'متدرب') + '</small></div><button class="b g s" data-a="out">خروج</button></div>';
    var vb = me.verified === false ? '<div class="c"><h3>أكّد بريدك الإلكتروني</h3><p class="sub">أرسلنا رابط التأكيد إلى ' + esc(me.email || '') + (me.role === 'teacher' ? '. التأكيد مطلوب لإنشاء الأقسام.' : '.') + '</p><div class="row"><button class="b g s" data-a="resend">إعادة الإرسال</button><button class="b s" data-a="verified">لقد أكدت</button></div></div>' : '';
    var del = '<button class="b g s dg" data-a="delacc">حذف حسابي وبياناتي</button>';
    if (me.role === 'student') return draw(out + vb + vStudent() + del);
    return draw(out + vb + (cur ? vSection() : vTeacher() + del));
  }
  function matchesHtml() {
    return (me.matches || []).map(function (m, i) { return '<div class="c hero"><h2>وجدنا اسمك في قسم</h2><div class="code"><b dir="auto">' + esc(m.sn || 'القسم') + '</b></div><p class="sub">هل هذا قسمك؟</p><button class="b" data-a="claim" data-i="' + i + '">نعم، هذا قسمي</button></div>'; }).join('');
  }
  function vStudent() {
    if (!me.sectionId) return matchesHtml() + '<div class="c"><h2>الانضمام إلى قسم</h2><p class="sub">اطلب رمز القسم من أستاذك.</p><form data-f="join">' + f('code', 'رمز القسم', 'text', 'مثال: K7M2PQ') + '<button class="b">انضمام</button></form><button class="b g s" data-a="recheck">البحث عن اسمي في الأقسام</button></div>';
    var s = lastState ? summary(lastState) : null;
    return '<div class="c hero"><div class="ok">✓</div><h2>حسابك مربوط بقسمك</h2><p class="sub">يرى أستاذك تقدمك في العادات والتحديات والمذكرة، ويتحدث تلقائيا.</p></div>' +
      (s ? '<div class="tiles"><div class="tile"><b>' + s.today + '/' + s.habits + '</b><span>منجز اليوم</span></div><div class="tile"><b>' + s.week + '</b><span>هذا الأسبوع</span></div><div class="tile"><b>' + s.read + '</b><span>قراءة 20</span></div></div>' : '') +
      (me.grade ? '<div class="c score"><h3>تقييم أستاذك</h3><div class="sc">' + esc(me.grade.score) + '<small> / 20</small></div>' + (me.grade.comment ? '<div class="note">' + esc(me.grade.comment) + '</div>' : '') + '</div>'
        : '<div class="c empty">لم يقيّم أستاذك عملك بعد.</div>') + '<button class="b g s dg" data-a="leave">مغادرة القسم</button>';
  }
  function vTeacher() {
    var l = me.secs || [];
    return '<h2>أقسامي</h2>' + (l.length ? l.map(function (s) { return '<button class="c b g" style="height:auto;text-align:start;font-size:17px;padding:16px" data-a="sec" data-id="' + s.id + '">' + esc(s.name) + '</button>'; }).join('') : '<div class="c empty">لا توجد أقسام بعد. أنشئ قسمك الأول أسفله.</div>') +
      (me.verified === false ? '<div class="c empty">أكّد بريدك الإلكتروني أولا لتتمكن من إنشاء الأقسام.</div>' : '<div class="c"><h3>قسم جديد</h3><form data-f="newsec">' + f('name', 'اسم القسم') + f('pw', 'كلمة سر القسم (لك وحدك)', 'password') + '<button class="b">إضافة القسم</button></form></div>');
  }
  function vSection() {
    var s = cur;
    if (!unlocked[s.id]) return '<h2>' + esc(s.name) + '</h2><div class="c"><form data-f="unlock">' + f('pw', 'كلمة سر القسم', 'password') + '<button class="b">فتح</button></form><button class="b g s" data-a="lockmail">نسيت كلمة سر القسم (إرسال رابط إلى بريدي)</button></div><button class="b g" data-a="back">رجوع</button>';
    if (s.sel) return vDetail();
    var G = s.grades || {}, nAway = 0;
    var list = (s.stu || []).map(function (x) {
      var u = x.sum || {}, g = G[x.id], st = [];
      var dAgo = x.up ? Math.floor((Date.now() - x.up) / 864e5) : null, away = x.linked && (dAgo == null || dAgo >= 3);
      if (away) nAway++;
      if (x.linked && u.habits != null) st.push('اليوم ' + u.today + '/' + u.habits, 'نشاط ' + (u.habits ? Math.round((u.week || 0) / (u.habits * 7) * 100) : 0) + '%', 'قراءة ' + (u.read || 0) + '/20', 'شهر ' + (u.month || 0) + '/30');
      if (away) st.push(dAgo == null ? '⚠ لم يدخل بعد' : '⚠ لم يدخل منذ ' + dAgo + ' أيام');
      return '<div class="sr"><i class="av">' + esc((x.name || '?').charAt(0).toUpperCase()) + '</i><b class="nm" dir="auto">' + esc(x.name) + '</b>' +
        (x.linked ? (g ? '<span class="pill on">' + esc(g.score) + '/20</span>' : '') + '<button class="b s" data-a="stu" data-id="' + esc(x.id) + '">الأجوبة ‹</button>' : '<span class="pill gold">غير مربوط</span>') + '<button class="b g s dg" data-a="rmstu" data-id="' + esc(x.id) + '" aria-label="حذف المتدرب">✕</button><small class="ss' + (away ? ' warn' : '') + '">' + (x.linked ? esc(st.join(' · ') || 'لا توجد بيانات بعد') : 'لم يربط حسابه بعد') + '</small></div>';
    }).join('');
    return '<h2>' + esc(s.name) + '</h2><div class="code"><span class="sub">رمز انضمام المتدربين</span><b>' + esc(s.code) + '</b></div>' +
      (nAway ? '<div class="c warnbox"><b>⚠ ' + nAway + ' متدرب لم يدخلوا منذ 3 أيام فأكثر</b></div>' : '') +
      (list ? '<div class="lst">' + list + '</div><button class="b g" data-a="csv">تصدير النقط (Excel)</button>' : '<div class="c empty">لم ينضم أي متدرب بعد.</div>') +
      '<div class="c"><h3>إضافة متدرب</h3><form data-f="addstu">' + f('name', 'اسم المتدرب') + '<button class="b">إضافة</button></form></div>' +
      '<div class="c"><h3>إضافة من لائحة الحضور</h3><p class="sub">صوّر اللائحة أو ارفع صورتها، ثم راجع الأسماء قبل الإضافة. المتدرب الذي يسجل بنفس الاسم يُقترح عليه قسمك.</p><label class="b g" style="text-align:center;cursor:pointer">📷 تصوير أو رفع صورة<input type="file" accept="image/*" data-ocr hidden></label><p class="sub" id="ocrst" role="status"></p><form data-f="bulk"><label>الأسماء (اسم في كل سطر)<textarea id="ocrta" name="names" rows="6" dir="auto"></textarea></label><button class="b">إضافة الأسماء</button></form></div>' +
      '<div class="c"><h3>كلمة سر القسم</h3><form data-f="setlock">' + f('pw', 'كلمة سر جديدة', 'password') + '<button class="b g">تغيير كلمة السر</button></form></div><div class="c"><h3>اسم القسم</h3><form data-f="rensec"><label>الاسم الجديد<input name="name" value="' + esc(s.name) + '" required></label><button class="b g">تغيير الاسم</button></form></div><button class="b g dg" data-a="delsec">حذف القسم نهائيا</button><button class="b g" data-a="back">رجوع</button>';
  }
  function days(a) { return a && a.length ? a.join('، ') : '–'; }
  function vDetail() {
    var s = cur, x = (s.stu || []).filter(function (z) { return z.id === s.sel; })[0] || { name: '' }, P = s.pack, g = (s.grades || {})[s.sel] || {}, pm = s.pdf;
    var h = '<button class="b g s" style="justify-self:start" data-a="sback">→ رجوع إلى القائمة</button><div><h2>' + esc(x.name) + '</h2><p class="sub">القسم: ' + esc(s.name) + '</p></div>';
    if (P) h += '<div class="chips"><span class="chip">قراءة <b>' + P.read.days.length + '/20</b></span><span class="chip">الشهر <b>' + P.month.days.length + '/30</b></span><span class="chip">عادات <b>' + P.habits.length + '</b></span></div>';
    h += '<div class="c"><div class="fl"><i class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v4h4M12 11v6M9.5 14.5L12 17l2.5-2.5"/></svg></i><div class="t"><b>ملف PDF من المتدرب</b><small>' +
      (pm ? esc(new Date(pm.up).toLocaleDateString('ar-MA')) + ' · ' + '<span dir="ltr">' + (pm.size / 1048576).toFixed(1) + ' MB</span>' : (pm === undefined ? 'جارٍ التحميل…' : 'لم يُرسل بعد')) + '</small></div>' +
      (pm ? '<button class="b s" data-a="dlpdf">تنزيل</button>' : '') + '</div></div>';
    h += '<div class="c"><form data-f="grade" class="gr"><label>النقطة (من 20)<input name="score" type="number" inputmode="decimal" min="0" max="20" step="0.25" required value="' + esc(g.score == null ? '' : g.score) + '"></label><button class="b">حفظ التقييم</button>' +
      '<label class="full">ملاحظة للمتدرب (اختياري)<textarea name="comment" rows="2" maxlength="400">' + esc(g.comment || '') + '</textarea></label></form></div>';
    if (P === undefined) return h + '<div class="c empty">جارٍ التحميل…</div>';
    if (!P) return h + '<div class="c empty">لم يرسل المتدرب أجوبته بعد. تصل تلقائيا حين يفتح التطبيق وهو متصل بالإنترنت.</div>';
    h += '<p class="sub">آخر تحديث للأجوبة: ' + esc(new Date(P.up).toLocaleString('ar-MA')) + ' · قسم «حلمك» خاص ولا يُرسل.</p>';
    h += '<details><summary>العادات والتحديات</summary>' +
      '<div class="q">تحدي 20 يوما: قراءة التنمية الذاتية' + (P.read.field ? ' (' + esc(P.read.field) + ')' : '') + '</div><div class="a">أيام الإنجاز (' + P.read.days.length + '/20): ' + days(P.read.days) + '\nأيام المشاركة مع الغير: ' + days(P.read.shared) + (P.read.note ? '\n\nالملخص:\n' + esc(P.read.note) : '') + '</div>' +
      '<div class="q">تحدي الشهر: 30 يوما</div><div class="a">أيام الإنجاز (' + P.month.days.length + '/30): ' + days(P.month.days) + (P.month.note ? '\n\nالملخص:\n' + esc(P.month.note) : '') + '</div>' +
      '<div class="q">العادات اليومية</div>' + (P.habits.length ? '<div class="a">' + P.habits.map(function (z) { return esc(z.name) + ' — المجموع: ' + z.total + ' · آخر 7 أيام: ' + z.week; }).join('\n') + '</div>' : '<div class="a">–</div>') + '</details>';
    (P.secs || []).forEach(function (sec) {
      h += '<details><summary><span>' + esc(sec.title) + '</span><span class="pill">' + sec.items.length + '</span></summary>';
      sec.items.forEach(function (it) {
        h += '<div class="q">' + esc(it.q) + '</div>';
        if (it.rows) it.rows.forEach(function (r) { h += '<div class="r"><b>' + esc(r.r) + '</b>' + r.c.map(function (c) { return '<div class="q l">' + esc(c[0]) + '</div><div class="a">' + esc(c[1]) + '</div>'; }).join('') + '</div>'; });
        else h += '<div class="a">' + esc(it.a) + '</div>';
      });
      h += '</details>';
    });
    return h + '<button class="b g" data-a="sback">→ رجوع إلى القائمة</button>';
  }
  function run(p, ok) {
    p.then(function (r) { if (ok) return ok(r); }).catch(function (e) { msg = e && e.message || 'حدث خطأ'; }).then(function () {
      if (!me && root.querySelector('#authCard')) { if (msg) { showErr(msg); fitAuth(); } msg = ''; return; }
      view();
    });
  }
  function refresh() { return PB.sections().then(function (l) { me.secs = l; }); }
  function submit(fm) {
    var v = {}; Array.prototype.forEach.call(fm.elements, function (e) { if (e.name && !(e.type === 'radio' && !e.checked)) v[e.name] = e.type === 'checkbox' ? (e.checked ? '1' : '') : e.value.trim(); });
    var k = fm.dataset.f;
    if (k === 'login') { busy(fm); return run(PB.signIn(v.email, v.pw, v.remember === '1')); }
    if (k === 'signup' && v.pw !== v.pw2) return showErr('كلمتا السر غير متطابقتين');
    if (k === 'signup' && v.role === 'teacher' && !v.tcode) return showErr('أدخل رمز الأساتذة');
    if (k === 'signup') busy(fm);
    if (k === 'signup') return run(PB.signUp(v.email, v.pw, v.name, v.role, v.tcode).then(function () { return afterAuth(firebase.auth().currentUser); }));
    if (k === 'gcomplete') {
      if (!v.name) return showErr('اكتب اسمك');
      if (v.role === 'teacher' && !v.tcode) return showErr('أدخل رمز الأساتذة');
      busy(fm); return run(PB.completeProfile(v.name, v.role, v.tcode).then(function () { return afterAuth(firebase.auth().currentUser); }));
    }
    if (k === 'join') return run(PB.join(v.code, me.name).then(function (sid) { me.sectionId = sid; flag(true); syncNow(); return PB.mySection(sid).then(function (n) { me.sectionName = n; try { if (n) localStorage.setItem('pie-sn', n); } catch (e) {} }, function () {}); }));
    if (k === 'newsec') return run(PB.createSection(v.name, v.pw).then(refresh));
    if (k === 'unlock') return run(PB.verifyLock(cur.id, v.pw).then(function (ok) { if (!ok) throw new Error('كلمة سر القسم غير صحيحة'); unlocked[cur.id] = 1; return Promise.all([PB.students(cur.id), PB.grades(cur.id)]).then(function (r) { cur.stu = r[0]; cur.grades = r[1]; PB.nameSync(cur.id, cur.name, cur.stu).catch(function () {}); }); }));
    if (k === 'addstu') return run(PB.addRosterMany(cur.id, cur.name, [v.name], cur.stu || []).then(function () { return PB.students(cur.id); }).then(function (l) { cur.stu = l; }));
    if (k === 'bulk') {
      var ns = (v.names || '').split(/\r?\n/).map(function (z) { return z.trim(); }).filter(Boolean);
      if (!ns.length) return showErr('اكتب الأسماء أو ارفع صورة اللائحة');
      return run(PB.addRosterMany(cur.id, cur.name, ns, cur.stu || []).then(function (n) { msg = n ? 'تمت إضافة ' + n + ' متدرب' : 'كل هذه الأسماء موجودة مسبقا'; return PB.students(cur.id); }).then(function (l) { cur.stu = l; }));
    }
    if (k === 'grade') { var sc = parseFloat(v.score); if (isNaN(sc) || sc < 0 || sc > 20) { msg = 'اكتب نقطة بين 0 و 20'; return view(); } var sel = cur.sel; return run(PB.setGrade(cur.id, sel, sc, v.comment || '').then(function () { cur.grades = cur.grades || {}; cur.grades[sel] = { score: sc, comment: v.comment || '' }; msg = 'تم حفظ التقييم'; })); }
    if (k === 'rensec') return run(PB.renameSection(cur.id, cur.code, v.name).then(function () { cur.name = v.name; PB.nameSync(cur.id, v.name, cur.stu || []).catch(function () {}); msg = 'تم تغيير اسم القسم'; }));
    if (k === 'setlock') return run(PB.setLock(cur.id, v.pw).then(function () { msg = 'تم تغيير كلمة سر القسم'; }));
  }
  function click(e) {
    var b = e.target.closest('[data-a]'); if (!b) return; var a = b.dataset.a;
    if (a === 'close') { root.hidden = true; return; }
    if (a === 'flip') {
      var c = root.querySelector('#authCard'); if (!c) return;
      var to = !c.classList.contains('flipped'); c.classList.toggle('flipped', to); mode = to ? 'signup' : 'login';
      c.querySelector('.au-login').toggleAttribute('inert', to); c.querySelector('.au-signup').toggleAttribute('inert', !to);
      c.querySelector('.au-login').setAttribute('aria-hidden', to); c.querySelector('.au-signup').setAttribute('aria-hidden', !to);
      showErr(''); fitAuth(); return;
    }
    if (a === 'peek') { var inp = root.querySelector('#' + b.dataset.t); if (!inp) return; var sh = inp.type === 'password'; inp.type = sh ? 'text' : 'password'; b.innerHTML = sh ? IC.eyeoff : IC.eye; b.setAttribute('aria-pressed', sh ? 'true' : 'false'); return; }
    if (a === 'google') { var gp = PB.googleSignIn(); b.disabled = true; gp.then(function () { b.disabled = false; }, function () { b.disabled = false; }); return run(gp); }
    if (a === 'claim') { var mm = (me.matches || [])[+b.dataset.i]; if (!mm) return; return run(PB.claim(mm.sid, me.name, mm.sn).then(function (sid) { me.sectionId = sid; me.matches = []; flag(true); syncNow(); return PB.mySection(sid).then(function (n) { me.sectionName = n; try { if (n) localStorage.setItem('pie-sn', n); } catch (e) {} }, function () {}); })); }
    if (a === 'recheck') return run(PB.findRoster(me.name).then(function (m) { me.matches = m; if (!m.length) msg = 'لم نجد اسمك في أي قسم. اطلب رمز القسم من أستاذك'; }));
    if (a === 'resend') return run(PB.resendVerify(), function () { msg = 'أُرسل رابط التأكيد إلى بريدك'; });
    if (a === 'verified') return run(PB.checkVerified().then(function (v) { me.verified = v; msg = v ? 'تم تأكيد بريدك' : 'لم يتم التأكيد بعد. افتح الرابط من بريدك'; }));
    if (a === 'rmstu') { if (!confirm('حذف هذا المتدرب من القسم؟ ستُحذف أجوبته وملف PDF ونقطته.')) return; return run(PB.removeStudent(cur.id, b.dataset.id).then(function () { return Promise.all([PB.students(cur.id), PB.grades(cur.id)]); }).then(function (r) { cur.stu = r[0]; cur.grades = r[1]; msg = 'تم حذف المتدرب'; })); }
    if (a === 'delsec') { if (!confirm('حذف القسم «' + cur.name + '» نهائيا؟ ستُحذف أجوبة المتدربين وملفاتهم ونقطهم.')) return; return run(PB.deleteSection(cur.id, cur.code).then(function () { cur = null; return refresh(); }).then(function () { msg = 'تم حذف القسم'; })); }
    if (a === 'csv') {
      var rows = [['الاسم', 'النقطة /20', 'ملاحظة', 'عادات', 'منجز اليوم', 'نشاط الأسبوع %', 'قراءة 20', 'تحدي الشهر', 'آخر دخول']];
      (cur.stu || []).forEach(function (x) { var u = x.sum || {}, g = (cur.grades || {})[x.id] || {}; rows.push([x.name, g.score == null ? '' : g.score, g.comment || '', u.habits == null ? '' : u.habits, u.today == null ? '' : u.today, u.habits ? Math.round((u.week || 0) / (u.habits * 7) * 100) : '', u.read == null ? '' : u.read, u.month == null ? '' : u.month, x.up ? new Date(x.up).toISOString().slice(0, 10) : '']); });
      var csv = '\ufeff' + rows.map(function (r) { return r.map(function (c) { c = String(c); if (/^[=+\-@]/.test(c)) c = "'" + c; return '"' + c.replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
      saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'PIE-' + cur.name + '.csv'); msg = 'تم تنزيل ملف النقط'; return view();
    }
    if (a === 'leave') { if (!confirm('مغادرة القسم؟ ستُحذف أجوبتك وملف PDF المرسل إلى أستاذك.')) return; return run(PB.leave(me.sectionId).then(function () { me.sectionId = null; me.grade = null; flag(false); msg = 'غادرت القسم. يمكنك الانضمام إلى قسم آخر'; })); }
    if (a === 'delacc') { if (!confirm('حذف حسابك وكل بياناتك السحابية نهائيا؟ لا يمكن التراجع. بيانات التطبيق على هاتفك تبقى حتى تمسحها من إعدادات المتصفح.')) return; return run(PB.deleteAccount().then(function () { me = null; pend = null; cur = null; unlocked = {}; flag(false); msg = 'تم حذف حسابك وبياناتك السحابية'; })); }
    if (a === 'out') { pend = null; cur = null; unlocked = {}; flag(false); return run(PB.signOut()); }
    if (a === 'back') { cur = null; return view(); }
    if (a === 'sback') { cur.sel = null; cur.pack = undefined; cur.pdf = undefined; return view(); }
    if (a === 'dlpdf') { var m = cur.pdf; if (!m) return; return run(PB.getPdf(cur.id, cur.sel, m.n).then(function (bl) { saveBlob(bl, m.name || 'PIE.pdf'); msg = 'تم تنزيل الملف'; })); }
    if (a === 'stu') { cur.sel = b.dataset.id; cur.pack = undefined; view(); var sid = cur.id, who = cur.sel; cur.pdf = undefined; return Promise.all([PB.getPack(sid, who).then(function (p) { if (cur && cur.sel === who) cur.pack = p; }, function () { if (cur && cur.sel === who) cur.pack = null; }), PB.pdfMeta(sid, who).then(function (m) { if (cur && cur.sel === who) cur.pdf = m; }, function () { if (cur && cur.sel === who) cur.pdf = null; })]).then(function () { if (cur && cur.sel === who) view(); }); }
    if (a === 'sec') { cur = me.secs.filter(function (s) { return s.id === b.dataset.id; })[0]; return view(); }
    if (a === 'forgot') { var le = root.querySelector('#lg-email'), em = (le && le.value.trim()) || prompt('بريدك الإلكتروني'); if (em) run(PB.reset(em.trim()), function () { msg = 'أُرسل رابط إعادة التعيين إلى بريدك'; }); return; }
    if (a === 'lockmail') return run(PB.lockMail(me.email, cur.id), function () { msg = 'أُرسل رابط إلى بريدك. افتحه لتضع كلمة سر جديدة للقسم'; });
  }
  function mark() {
    try { if (me && me.name) localStorage.setItem('pie-user', String(me.name).trim().charAt(0).toUpperCase() || '?'); else localStorage.removeItem('pie-user'); } catch (e) {}
    try { if (window.PIE_X && window.PIE_X.acct) window.PIE_X.acct(); } catch (e) {}
  }
  function afterAuth(u) {
    if (!u) { me = null; pend = null; seq++; mark(); return Promise.resolve(); }
    var my = ++seq;
    function loadStu() {
      return Promise.all([PB.myGrade(me.sectionId).then(function (g) { me.grade = g; }, function () {}), PB.mySection(me.sectionId).then(function (n) { me.sectionName = n; try { if (n) localStorage.setItem('pie-sn', n); } catch (e) {} }, function () {})]);
    }
    return PB.profile().then(function (p) {
      if (my !== seq) return;
      if (p && p.role === 'student' && !p.sectionId) p.matches = [];
      me = p; pend = p ? null : { name: u.displayName || '', email: u.email || '' };
      if (me) me.verified = PB.isVerified();
      mark();
      if (me && me.role === 'teacher') return refresh();
      if (me && me.role === 'student' && !me.sectionId) return PB.findRoster(me.name).then(function (m) { me.matches = m; }, function () { me.matches = []; });
      if (me && me.role === 'student' && me.sectionId) {
        return PB.member(me.sectionId).then(function (ok) {
          if (!ok) { me.sectionId = null; me.grade = null; flag(false); PB.unlink().catch(function () {}); return; }
          return loadStu();
        }, function () { return loadStu(); });
      }
    });
  }
  var started = false;
  function show() { if (root && !root.hidden) view(); }
  function flag(on) { try { if (on) localStorage.setItem('pie-linked', '1'); else { localStorage.removeItem('pie-linked'); localStorage.removeItem('pie-sn'); } } catch (e) {} }
  function syncNow() {
    var linked = !!(me && me.role === 'student' && me.sectionId);
    flag(linked);
    if (!linked || !window.PIE_STATE) return;
    lastState = window.PIE_STATE();
    if (lastState) PB.push(me.sectionId, summary(lastState), pack(lastState)).catch(function () {});
  }
  function start() {
    if (started) return; started = true;
    PB.init().then(function () {
      PB.onAuth(function (u) {
        PB.finishLink().then(function (sid) {
          return afterAuth(u).then(function () {
            ready = true; syncNow();
            if (sid && me && me.secs) { cur = me.secs.filter(function (s) { return s.id === sid; })[0]; if (cur) { var np = prompt('اكتب كلمة سر جديدة للقسم'); if (np && np.length >= 4) return PB.setLock(sid, np).then(function () { msg = 'تم تعيين كلمة سر القسم الجديدة'; }); } }
          });
        }).catch(function () { ready = true; }).then(show);
      });
    }).catch(function (e) { started = false; if (root) draw('<h2>غير مفعّل بعد</h2><p>' + (e.message === 'config' ? 'ألصق إعدادات Firebase في firebase-config.js (انظر SETUP-FIREBASE.txt).' : esc(e.message)) + '</p>'); });
  }
  function open() {
    if (!root) build(); root.hidden = false; view();
    if (ready) { if (me && me.role === 'student' && me.sectionId) { syncNow(); PB.myGrade(me.sectionId).then(function (g) { me.grade = g; view(); }, function () {}); } return; }
    start();
  }
  /* متدرب مربوط بقسم: ابدأ بصمت لإرسال أجوبته وجلب نقطته دون فتح اللوحة */
  try { if (localStorage.getItem('pie-linked') === '1') window.addEventListener('load', function () { setTimeout(start, 1200); }); } catch (e) {}
  function whenReady() {
    start();
    return new Promise(function (ok, no) { var t0 = Date.now(); (function w() { if (ready) return ok(); if (Date.now() - t0 > 9000) return no(new Error('net')); setTimeout(w, 150); })(); });
  }
  function check() {
    return whenReady().then(function () {
      if (!me) throw new Error('nologin');
      if (me.role !== 'student') throw new Error('notstudent');
      if (!me.sectionId) throw new Error('nosection');
    });
  }
  function sendPdf(u8, fname) {
    return check().then(function () { return PB.sendPdf(me.sectionId, u8, fname); }).catch(function (e) { throw (e && /^(big|nologin|nosection|notstudent)$/.test(e.message)) ? e : new Error('net'); });
  }
  /* قراءة لائحة الحضور من صورة (Tesseract.js من CDN، تحتاج إنترنت) */
  var HEAD = /^(الاسم|الأسم|الاسماء|الحضور|التوقيع|ملاحظات|الملاحظات|رقم|الرقم|لائحة|قائمة|المجموعة|الفوج|التاريخ|nom|pr[ée]nom|pr[eé]sence|liste|signature|groupe|date|n°|num)(\s|$)/i;
  function loadTess() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = ok; s.onerror = function () { no(new Error('net')); }; document.head.appendChild(s); });
  }
  function prepImg(file) {
    return new Promise(function (ok, no) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () {
        var r = Math.min(1, 2200 / Math.max(im.width, im.height)), c = document.createElement('canvas'), x, d, q, i, g, lo = 255, hi = 0, k;
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
        d = x.getImageData(0, 0, c.width, c.height); q = d.data;
        for (i = 0; i < q.length; i += 4) { g = q[i] * 0.3 + q[i + 1] * 0.59 + q[i + 2] * 0.11; q[i] = g; if (g < lo) lo = g; if (g > hi) hi = g; }
        k = hi > lo ? 255 / (hi - lo) : 1;
        for (i = 0; i < q.length; i += 4) { g = Math.max(0, Math.min(255, (q[i] - lo) * k)); q[i] = q[i + 1] = q[i + 2] = g; }
        x.putImageData(d, 0, 0); URL.revokeObjectURL(u); ok(c);
      };
      im.onerror = function () { URL.revokeObjectURL(u); no(new Error('img')); };
      im.src = u;
    });
  }
  function parseNames(t) {
    var out = [], seen = {};
    String(t || '').split(/\r?\n/).forEach(function (l) {
      l = l.replace(/[|_\\\/<>=*~"\u201c\u201d\u00ab\u00bb\[\]{}()\u200e\u200f]/g, ' ').replace(/[0-9\u0660-\u0669]+/g, ' ').replace(/[.,;:!?\u061f\u060c\-\u2013\u2014\u2022\u00b7]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (l.length < 3 || l.length > 45 || HEAD.test(l) || !/[A-Za-z\u0600-\u06ff]{2}/.test(l)) return;
      var k = l.toLowerCase(); if (seen[k]) return; seen[k] = 1; out.push(l);
    });
    return out.slice(0, 80);
  }
  function ocr(inp) {
    var f = inp.files && inp.files[0], st = root.querySelector('#ocrst'), ta = root.querySelector('#ocrta'), w = null;
    if (!f) return;
    function say(t) { if (st) st.textContent = t; }
    say('جارٍ تحميل أداة القراءة… (تحتاج إنترنت، وقد تستغرق دقيقة في المرة الأولى)');
    loadTess().then(function () { say('جارٍ قراءة الصورة…'); return Promise.all([prepImg(f), Tesseract.createWorker(['ara', 'eng'])]); })
      .then(function (r) { w = r[1]; return w.recognize(r[0]); })
      .then(function (res) { var ns = parseNames(res.data.text); if (ta) ta.value = ns.join('\n'); say(ns.length ? 'وجدنا ' + ns.length + ' اسم. راجع الأسماء وصحّحها ثم اضغط «إضافة الأسماء».' : 'لم نجد أسماء واضحة. جرّب صورة أوضح أو اكتب الأسماء.'); })
      .catch(function (e) { say(e && e.message === 'net' ? 'تعذر تحميل أداة القراءة. تحقق من الإنترنت أو اكتب الأسماء يدويا.' : 'تعذرت قراءة الصورة. اكتب الأسماء يدويا.'); })
      .then(function () { try { if (w && w.terminate) w.terminate(); } catch (e) {} inp.value = ''; });
  }
  function saveBlob(blob, fname) {
    var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
  }
  function sectionName() { try { return (me && me.sectionName) || localStorage.getItem('pie-sn') || ''; } catch (e) { return (me && me.sectionName) || ''; } }
  window.PIE_PORTAL = { open: open, check: check, sendPdf: sendPdf, sectionName: sectionName };
})();
