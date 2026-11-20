/* كل ما يخص الخادم (Firebase) في هذا الملف فقط. لتغيير الخادم لاحقا أعد كتابة هذه الدوال وحدها. */
(function () {
  var A, D, boot = null, V = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-';
  function load(s) { return new Promise(function (ok, no) { var e = document.createElement('script'); e.src = s; e.onload = ok; e.onerror = function () { no(new Error('تعذر الاتصال بالإنترنت')); }; document.head.appendChild(e); }); }
  function init() {
    if (boot) return boot;
    var c = window.PIE_FIREBASE;
    if (!c || !c.apiKey || c.apiKey.indexOf('PASTE') === 0) return (boot = Promise.reject(new Error('config')));
    boot = load(V + 'app-compat.js').then(function () { return load(V + 'auth-compat.js'); }).then(function () { return load(V + 'firestore-compat.js'); })
      .then(function () { firebase.initializeApp(c); A = firebase.auth(); D = firebase.firestore(); });
    boot.catch(function () { boot = null; });
    return boot;
  }
  function hash(pw, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, k, 256);
    }).then(function (b) { return Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
  }
  function rnd() { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = '', r = crypto.getRandomValues(new Uint8Array(6)); for (var i = 0; i < 6; i++) o += a[r[i] % a.length]; return o; }
  function uid() { return A.currentUser.uid; }
  function docs(q) { return q.get().then(function (s) { return s.docs.map(function (d) { var o = d.data(); o.id = d.id; return o; }); }); }
  var PB = {
    init: init,
    onAuth: function (cb) { A.onAuthStateChanged(cb); },
    signUp: function (email, pw, name, role, code) {
      return A.createUserWithEmailAndPassword(email, pw).then(function (c) { return D.collection('users').doc(c.user.uid).set(role === 'teacher' ? { role: role, name: name, email: email, code: code } : { role: role, name: name, email: email }); });
    },
    signIn: function (e, p, keep) {
      var P = firebase.auth.Auth.Persistence;
      return A.setPersistence(keep === false ? P.SESSION : P.LOCAL).then(function () { return A.signInWithEmailAndPassword(e, p); });
    },
    signOut: function () { return A.signOut(); },
    reset: function (e) { return A.sendPasswordResetEmail(e); },
    profile: function () { return D.collection('users').doc(uid()).get().then(function (d) { var o = d.exists ? d.data() : null; if (o) o.uid = uid(); return o; }); },
    createSection: function (name, pw) {
      var ref = D.collection('sections').doc(), code = rnd(), b = D.batch();
      return hash(pw, ref.id).then(function (h) {
        b.set(ref, { name: name, teacher: uid(), code: code, at: Date.now() });
        b.set(ref.collection('private').doc('lock'), { h: h });
        b.set(D.collection('codes').doc(code), { sid: ref.id, teacher: uid(), name: name });
        return b.commit();
      });
    },
    sections: function () { return docs(D.collection('sections').where('teacher', '==', uid())); },
    section: function (sid) { return D.collection('sections').doc(sid).get().then(function (d) { var o = d.data(); o.id = d.id; return o; }); },
    students: function (sid) { return docs(D.collection('sections').doc(sid).collection('students')); },
    addRoster: function (sid, name) { return D.collection('sections').doc(sid).collection('students').add({ name: name, linked: false, at: Date.now() }); },
    verifyLock: function (sid, pw) {
      return Promise.all([hash(pw, sid), D.collection('sections').doc(sid).collection('private').doc('lock').get()]).then(function (r) { return r[1].exists && r[1].data().h === r[0]; });
    },
    setLock: function (sid, pw) { return hash(pw, sid).then(function (h) { return D.collection('sections').doc(sid).collection('private').doc('lock').set({ h: h }); }); },
    lockMail: function (email, sid) {
      try { localStorage.setItem('pie-lock-email', email); } catch (e) {}
      return A.sendSignInLinkToEmail(email, { url: location.origin + location.pathname + '?lock=' + sid, handleCodeInApp: true });
    },
    finishLink: function () {
      if (!A.isSignInWithEmailLink(location.href)) return Promise.resolve(null);
      var sid = new URLSearchParams(location.search).get('lock'), em = ''; try { em = localStorage.getItem('pie-lock-email') || ''; } catch (e) {}
      if (!em) em = prompt('اكتب بريدك الإلكتروني للتأكيد') || '';
      return A.signInWithEmailLink(em, location.href).then(function () { history.replaceState(null, '', location.pathname); return sid; }, function () { return null; });
    },
    join: function (code, name) {
      return D.collection('codes').doc(code.trim().toUpperCase()).get().then(function (d) {
        if (!d.exists) throw new Error('رمز القسم غير صحيح');
        var sid = d.data().sid, sn = d.data().name || '';
        return D.collection('sections').doc(sid).collection('students').doc(uid()).set({ name: name, linked: true, at: Date.now(), sn: sn })
          .then(function () { return D.collection('users').doc(uid()).update({ sectionId: sid }); }).then(function () { return sid; });
      });
    },
    mySection: function (sid) {
      return D.collection('sections').doc(sid).collection('students').doc(uid()).get().then(function (d) { return d.exists ? (d.data().sn || '') : ''; });
    },
    nameSync: function (sid, name, list) {
      var b = D.batch(), n = 0;
      list.forEach(function (x) { if (x.linked && x.sn !== name) { b.set(D.collection('sections').doc(sid).collection('students').doc(x.id), { sn: name }, { merge: true }); x.sn = name; n++; } });
      return n ? b.commit() : Promise.resolve();
    },
    push: function (sid, sum, pack) {
      var sc = D.collection('sections').doc(sid), me = uid(), now = Date.now(), w = [sc.collection('students').doc(me).set({ sum: sum, up: now }, { merge: true })];
      if (pack) w.push(sc.collection('answers').doc(me).set({ pack: JSON.stringify(pack), up: now }));
      return Promise.all(w);
    },
    sendPdf: function (sid, u8, fname) {
      var MAX = 900000, n = Math.ceil(u8.length / MAX), base = D.collection('sections').doc(sid).collection('pdfs').doc(uid());
      if (n > 7) return Promise.reject(new Error('big'));
      return base.get().then(function (old) {
        var on = old.exists ? (old.data().n || 0) : 0, b = D.batch(), i;
        for (i = 0; i < n; i++) b.set(base.collection('c').doc(String(i)), { d: firebase.firestore.Blob.fromUint8Array(u8.slice(i * MAX, (i + 1) * MAX)) });
        for (i = n; i < on; i++) b.delete(base.collection('c').doc(String(i)));
        b.set(base, { n: n, size: u8.length, name: fname, up: Date.now() });
        return b.commit();
      });
    },
    pdfMeta: function (sid, stu) {
      return D.collection('sections').doc(sid).collection('pdfs').doc(stu).get().then(function (d) { return d.exists ? d.data() : null; });
    },
    getPdf: function (sid, stu, n) {
      var base = D.collection('sections').doc(sid).collection('pdfs').doc(stu), l = [], i;
      for (i = 0; i < n; i++) l.push(base.collection('c').doc(String(i)).get());
      return Promise.all(l).then(function (ds) { return new Blob(ds.map(function (d) { return d.data().d.toUint8Array(); }), { type: 'application/pdf' }); });
    },
    getPack: function (sid, stu) {
      return D.collection('sections').doc(sid).collection('answers').doc(stu).get().then(function (d) {
        if (!d.exists) return null;
        var o = d.data(), p = null; try { p = JSON.parse(o.pack); } catch (e) {}
        if (p) p.up = o.up; return p;
      });
    },
    grades: function (sid) {
      return docs(D.collection('sections').doc(sid).collection('grades')).then(function (l) { var m = {}; l.forEach(function (x) { m[x.id] = x; }); return m; });
    },
    setGrade: function (sid, stu, score, comment) {
      return D.collection('sections').doc(sid).collection('grades').doc(stu).set({ score: score, comment: comment, at: Date.now() });
    },
    myGrade: function (sid) {
      return D.collection('sections').doc(sid).collection('grades').doc(uid()).get().then(function (d) { return d.exists ? d.data() : null; });
    }
  };
  window.PB = PB;
})();
