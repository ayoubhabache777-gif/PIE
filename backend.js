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
  function normCode(c) { return String(c || '').trim().toUpperCase(); }
  function codeOk(code) { return code ? D.collection('teacherCodes').doc(code).get().then(function (d) { return d.exists; }, function () { return false; }) : Promise.resolve(false); }
  function sha(x) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(x)).then(function (b) { return Array.from(new Uint8Array(b)).map(function (y) { return ('0' + y.toString(16)).slice(-2); }).join(''); }); }
  /* تطبيع الاسم: بلا تشكيل ولا همزات ولا لواحق لاتينية، وترتيب الكلمات أبجديا ليتطابق "أيوب حباش" مع "حباش أيوب" */
  function nk(name) {
    var x = String(name || '').toLowerCase();
    try { x = x.normalize('NFD'); } catch (e) {}
    x = x.replace(/[\u064B-\u065F\u0640\u0300-\u036f]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9\u0600-\u06ff ]+/g, ' ');
    return x.split(/\s+/).filter(Boolean).sort().join(' ');
  }
  function idxRef(h, sid, rid) { return D.collection('rosterIdx').doc(h).collection('e').doc(sid + '_' + rid); }
  var tidied = {};
  function wipeStudent(sid, id, asTeacher) {
    var sc = D.collection('sections').doc(sid), pd = sc.collection('pdfs').doc(id);
    return Promise.all([pd.get(), asTeacher ? sc.collection('students').doc(id).get() : Promise.resolve(null)]).then(function (r) {
      var m = r[0], sd = r[1], n = m.exists ? (m.data().n || 0) : 0;
      var hp = sd && sd.exists && !sd.data().linked ? sha(nk(sd.data().name)) : Promise.resolve(null);
      return hp.then(function (h) {
        var bt = D.batch(), i;
        for (i = 0; i < n; i++) bt.delete(pd.collection('c').doc(String(i)));
        bt.delete(pd); bt.delete(sc.collection('answers').doc(id)); bt.delete(sc.collection('students').doc(id));
        if (asTeacher) bt.delete(sc.collection('grades').doc(id));
        if (h) bt.delete(idxRef(h, sid, id));
        return bt.commit();
      });
    });
  }
  function reauth() {
    var u = A.currentUser, pid = (u.providerData[0] || {}).providerId;
    if (pid === 'google.com') return u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
    var pw = prompt('اكتب كلمة السر لتأكيد العملية'); if (!pw) return Promise.reject(new Error(''));
    return u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, pw)).catch(function () { throw new Error('كلمة السر غير صحيحة'); });
  }
  function docs(q) { return q.get().then(function (s) { return s.docs.map(function (d) { var o = d.data(); o.id = d.id; return o; }); }); }
  var PB = {
    init: init,
    onAuth: function (cb) { A.onAuthStateChanged(cb); },
    signUp: function (email, pw, name, role, code) {
      code = normCode(code);
      return A.createUserWithEmailAndPassword(email, pw).then(function (c) {
        function make() { return D.collection('users').doc(c.user.uid).set(role === 'teacher' ? { role: role, name: name, email: email, code: code } : { role: role, name: name, email: email }); }
        function mail() { try { A.languageCode = 'ar'; c.user.sendEmailVerification().catch(function () {}); } catch (e) {} }
        if (role !== 'teacher') return make().then(mail);
        return codeOk(code).then(function (ok) {
          if (ok) return make().then(mail);
          var bad = function () { throw new Error('رمز الأساتذة غير صحيح'); };
          return c.user.delete().then(bad, bad);
        });
      });
    },
    signIn: function (e, p, keep) {
      var P = firebase.auth.Auth.Persistence;
      return A.setPersistence(keep === false ? P.SESSION : P.LOCAL).then(function () { return A.signInWithEmailAndPassword(e, p); });
    },
    googleSignIn: function () {
      var P = firebase.auth.Auth.Persistence, pr = new firebase.auth.GoogleAuthProvider();
      pr.setCustomParameters({ prompt: 'select_account' });
      function fail(e) {
        var c = e && e.code || '';
        if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return new Error('');
        if (c === 'auth/unauthorized-domain') return new Error('هذا النطاق غير مضاف في Firebase (Authentication ← Settings ← Authorized domains)');
        if (c === 'auth/network-request-failed') return new Error('تعذر الاتصال بالإنترنت');
        if (c === 'auth/account-exists-with-different-credential') return new Error('هذا البريد مسجّل بكلمة سر. ادخل بها أولا');
        return new Error('تعذر الدخول عبر Google');
      }
      return A.setPersistence(P.LOCAL).then(function () { return A.signInWithPopup(pr); }).catch(function (e) {
        var c = e && e.code || '';
        if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') return A.signInWithRedirect(pr);
        throw fail(e);
      });
    },
    completeProfile: function (name, role, code) {
      code = normCode(code);
      function make() { return D.collection('users').doc(uid()).set(role === 'teacher' ? { role: role, name: name, email: A.currentUser.email || '', code: code } : { role: role, name: name, email: A.currentUser.email || '' }); }
      if (role !== 'teacher') return make();
      return codeOk(code).then(function (ok) { if (!ok) throw new Error('رمز الأساتذة غير صحيح'); return make(); });
    },
    isVerified: function () { var u = A.currentUser; return !u || u.emailVerified || (u.providerData[0] || {}).providerId === 'google.com'; },
    resendVerify: function () { A.languageCode = 'ar'; return A.currentUser.sendEmailVerification(); },
    checkVerified: function () { return A.currentUser.reload().then(function () { return A.currentUser.getIdToken(true); }).then(function () { return A.currentUser.emailVerified; }); },
    member: function (sid) { return D.collection('sections').doc(sid).collection('students').doc(uid()).get().then(function (d) { return d.exists; }); },
    unlink: function () { return D.collection('users').doc(uid()).update({ sectionId: firebase.firestore.FieldValue.delete() }); },
    leave: function (sid) { return wipeStudent(sid, uid(), false).then(function () { return PB.unlink(); }); },
    removeStudent: function (sid, id) { return wipeStudent(sid, id, true); },
    renameSection: function (sid, code, name) {
      var b = D.batch();
      b.update(D.collection('sections').doc(sid), { name: name });
      if (code) b.update(D.collection('codes').doc(code), { name: name });
      return b.commit();
    },
    deleteSection: function (sid, code) {
      var sc = D.collection('sections').doc(sid);
      return sc.collection('students').get().then(function (q) {
        return q.docs.reduce(function (p, d) { return p.then(function () { return wipeStudent(sid, d.id, true); }); }, Promise.resolve());
      }).then(function () { return sc.collection('grades').get(); }).then(function (q) {
        var b = D.batch(); q.docs.forEach(function (d) { b.delete(d.ref); }); return q.size ? b.commit() : null;
      }).then(function () { return sc.collection('private').doc('lock').delete(); }).then(function () {
        var b = D.batch(); b.delete(sc); if (code) b.delete(D.collection('codes').doc(code)); return b.commit();
      });
    },
    deleteAccount: function () {
      var u = A.currentUser, id = u.uid;
      return reauth().then(function () { return D.collection('users').doc(id).get(); }).then(function (d) {
        var p = d.exists ? d.data() : {};
        if (p.role === 'teacher') {
          return D.collection('sections').where('teacher', '==', id).get().then(function (q) {
            return q.docs.reduce(function (pr, x) { return pr.then(function () { return PB.deleteSection(x.id, x.data().code); }); }, Promise.resolve());
          });
        }
        return p.sectionId ? wipeStudent(p.sectionId, id, false).catch(function () {}) : null;
      }).then(function () { return D.collection('users').doc(id).delete(); }).then(function () { return u.delete(); });
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
    students: function (sid) {
      var sc = D.collection('sections').doc(sid);
      return docs(sc.collection('students')).then(function (list) {
        var linked = {}; list.forEach(function (x) { if (x.linked) linked[nk(x.name)] = 1; });
        var dups = list.filter(function (x) { return !x.linked && linked[nk(x.name)]; });
        var keep = list.filter(function (x) { return dups.indexOf(x) < 0; });
        var job = Promise.resolve();
        if (dups.length) job = Promise.all(dups.map(function (x) { return sha(nk(x.name)); })).then(function (hs) { var bt = D.batch(); dups.forEach(function (x, i) { bt.delete(sc.collection('students').doc(x.id)); bt.delete(idxRef(hs[i], sid, x.id)); }); return bt.commit(); });
        var rest = keep.filter(function (x) { return !x.linked; });
        if (!tidied[sid] && rest.length) {
          tidied[sid] = 1;
          job = job.then(function () { return sc.get(); }).then(function (s0) {
            var sn = s0.exists ? s0.data().name : '';
            return Promise.all(rest.map(function (x) { return sha(nk(x.name)); })).then(function (hs) { var bt = D.batch(); rest.forEach(function (x, i) { bt.set(idxRef(hs[i], sid, x.id), { sid: sid, rid: x.id, sn: sn || '' }); }); return bt.commit(); });
          });
        }
        return job.then(function () { return keep; }, function () { return keep; });
      });
    },
    addRosterMany: function (sid, sn, names, existing) {
      var have = {}, seen = {}, list = [];
      (existing || []).forEach(function (x) { have[nk(x.name)] = 1; });
      names.forEach(function (n) { n = String(n || '').trim().slice(0, 60); var k = nk(n); if (!k || have[k] || seen[k]) return; seen[k] = 1; list.push({ n: n, k: k }); });
      if (!list.length) return Promise.resolve(0);
      return Promise.all(list.map(function (x) { return sha(x.k); })).then(function (hs) {
        var sc = D.collection('sections').doc(sid).collection('students'), p = Promise.resolve(), i;
        for (i = 0; i < list.length; i += 200) (function (a) {
          p = p.then(function () {
            var bt = D.batch();
            list.slice(a, a + 200).forEach(function (x, j) { var rf = sc.doc(); bt.set(rf, { name: x.n, linked: false, at: Date.now() }); bt.set(idxRef(hs[a + j], sid, rf.id), { sid: sid, rid: rf.id, sn: sn || '' }); });
            return bt.commit();
          });
        })(i);
        return p.then(function () { return list.length; });
      });
    },
    findRoster: function (name) {
      var k = nk(name); if (!k) return Promise.resolve([]);
      return sha(k).then(function (h) { return D.collection('rosterIdx').doc(h).collection('e').get(); }).then(function (q) { return q.docs.map(function (d) { return d.data(); }); });
    },
    claim: function (sid, name, sn) {
      return D.collection('sections').doc(sid).collection('students').doc(uid()).set({ name: name, linked: true, at: Date.now(), sn: sn || '' })
        .then(function () { return D.collection('users').doc(uid()).update({ sectionId: sid }); }).then(function () { return sid; });
    },
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
