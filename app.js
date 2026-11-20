(function () {
  'use strict';
  var CTA = 'https://calendly.com/academiadepian/30min';
  var BTN = 'Rezervă sesiunea gratuită';

  /* headlines: [plain part, emphasised part] */
  var VERSIONS = {
    a: [['Pianul te așteaptă ', 'de ani de zile.'], ['Nu e prea târziu. ', 'Nu a fost niciodată.'], ['Fără partituri. ', 'După ureche.'], ['Melodia ta preferată. ', 'Cântată de tine.']],
    b: [['Bați ritmul cu degetele ', 'pe birou?'], ['Mâinile tale știu deja ', 'ce vor.'], ['Fără partituri. ', 'După ureche.'], ['Melodia ta preferată. ', 'Cântată de tine.']]
  };
  var OFFER = {
    a: 'Lecții live, fără partituri, pornind de la melodiile pe care le iubești. Prima sesiune durează 30 de minute și e gratuită.',
    b: 'Lecții de pian live pentru adulți, fără partituri, pornind de la melodiile tale. Prima sesiune durează 30 de minute și e gratuită.'
  };
  var SCENES = {
    a: ['01 · Pianul te așteaptă', '02 · Nu e prea târziu', '03 · Fără partituri', '04 · Melodia ta'],
    b: ['01 · Bați ritmul', '02 · Mâinile tale știu', '03 · Fără partituri', '04 · Melodia ta']
  };
  var NAV = {
    a: [['#metoda', 'Metoda'], ['#andreea', 'Andreea'], ['#intrebari', 'Întrebări']],
    b: [['#incearca', 'Încearcă'], ['#metoda', 'Metoda'], ['#andreea', 'Andreea']]
  };
  /* Playhead ranges (0..1) in which each headline is visible, then the short
     script lines that appear between them while a scene is playing. */
  var RANGES = [[0, .10], [.215, .30], [.60, .70], [.94, 1]];
  var LINES = {
    a: [['Ai zis „într-o zi”. De multe ori.', .125, .20],
        ['Începi cu melodia care ți-e dragă. Nu cu game.', .34, .45],
        ['Mâinile ezită o clipă. E normal.', .49, .575],
        ['Cineva din casă se oprește în ușă să asculte.', .76, .90]],
    b: [['În ședințe. La semafor. Pe volan, când prinzi piesa aia la radio.', .125, .20],
        ['Muzica a fost mereu acolo. Doar clapele au lipsit.', .34, .45],
        ['Laptopul poate să aștepte zece minute.', .49, .575],
        ['Seara, acasă, nu mai e liniște. E melodia ta.', .76, .90]]
  };

  var q = new URLSearchParams(location.search).get('v');
  var ver = (q === 'b') ? 'b' : 'a';
  var texts = VERSIONS[ver];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('v-' + ver);
  if (reduced) document.body.classList.add('reduced');

  document.querySelectorAll('.switcher a').forEach(function (a) {
    if (a.dataset.v === ver) a.classList.add('on');
  });

  /* ---------- page below the film: one template per version ---------- */
  var tpl = document.getElementById('tpl-' + ver);
  document.getElementById('page').appendChild(tpl.content.cloneNode(true));
  document.querySelectorAll('template').forEach(function (t) { t.remove(); });
  var nav = document.getElementById('nav');
  NAV[ver].forEach(function (l) {
    var a = document.createElement('a'); a.href = l[0]; a.textContent = l[1]; nav.appendChild(a);
  });

  function headline(el, t) {
    el.appendChild(document.createTextNode(t[0]));
    var em = document.createElement('em'); em.textContent = t[1]; el.appendChild(em);
  }
  function ctaLink(cls) {
    var a = document.createElement('a');
    a.className = cls; a.href = CTA; a.target = '_blank'; a.rel = 'noopener'; a.textContent = BTN;
    return a;
  }
  /* beat 1 offer: eyebrow above the headline, sub-paragraph, button and facts below */
  function offer(box, h) {
    var eb = document.createElement('p');
    eb.className = 'beat__eyebrow'; eb.textContent = 'Pian pentru adulți · online · după ureche';
    box.insertBefore(eb, h);
    var sub = document.createElement('p');
    sub.className = 'beat__sub'; sub.textContent = OFFER[ver];
    box.appendChild(sub);
    var row = document.createElement('div');
    row.className = 'beat__cta';
    row.appendChild(ctaLink('btn btn--big'));
    var s = document.createElement('span'); s.textContent = '30 de minute · online · fără obligații';
    row.appendChild(s);
    box.appendChild(row);
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- hero ---------- */
  var hero = document.getElementById('hero');
  var canvas = document.getElementById('film');
  var ctx = canvas.getContext('2d');
  var beatsEl = document.getElementById('beats');
  var hint = document.getElementById('hint');
  var loadline = document.getElementById('loadline');
  var base = 'frames/' + ver + '/';
  var manifest = null, frames = [], loaded = 0, curFrame = -1;
  var target = 0, cur = 0, running = false, cw = 0, ch = 0;
  var beatEls = [];

  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function frameUrl(i) { return base + manifest.pattern.replace('%04d', pad(i + 1, 4)); }

  function buildBeats() {
    texts.forEach(function (t, i) {
      var d = document.createElement('div');
      d.className = 'beat';
      var h = document.createElement(i === 0 ? 'h1' : 'h2');
      headline(h, t);
      d.appendChild(h);
      if (i === 0) { d.classList.add('beat--offer'); offer(d, h); }
      if (i === 3) d.appendChild(ctaLink('btn btn--big'));
      beatsEl.appendChild(d);
      beatEls.push(d);
    });
    LINES[ver].forEach(function (l) {
      var d = document.createElement('div');
      d.className = 'beat beat--line';
      var p = document.createElement('p'); p.textContent = l[0];
      d.appendChild(p);
      beatsEl.appendChild(d);
      beatEls.push(d);
      RANGES.push([l[1], l[2]]);
    });
  }

  /* scene progress strip: bar i fills while the playhead travels from stop i-1 to stop i */
  var stripBars = [], stripN = null, stripScene = -1;
  function buildStrip() {
    var box = document.getElementById('strip');
    var bars = document.createElement('div'); bars.className = 'strip__bars';
    SCENES[ver].forEach(function (label) {
      var it = document.createElement('div'); it.className = 'strip__item';
      var bar = document.createElement('i'); var fill = document.createElement('b');
      bar.appendChild(fill); it.appendChild(bar);
      var sp = document.createElement('span'); sp.textContent = label; it.appendChild(sp);
      bars.appendChild(it); stripBars.push(fill);
    });
    box.appendChild(bars);
    var cap = document.createElement('p'); cap.className = 'strip__cap';
    cap.innerHTML = 'Scena <span>1</span> din 4 · derulează';
    stripN = cap.querySelector('span');
    box.appendChild(cap);
  }
  function strip(p) {
    if (!stripBars.length) return;
    var scene = 0;
    for (var i = 0; i < 4; i++) {
      var f = i === 0 ? 1 : Math.min(1, Math.max(0, (p - STOPS[i - 1]) / (STOPS[i] - STOPS[i - 1])));
      stripBars[i].style.transform = 'scaleX(' + f.toFixed(4) + ')';
      if (p >= STOPS[i] - 0.001) scene = i;
    }
    if (scene !== stripScene) { stripScene = scene; stripN.textContent = scene + 1; }
  }

  function buildStills() {
    var box = document.getElementById('stills');
    hero.hidden = true; box.hidden = false;
    fetch(base + 'manifest.json').then(function (r) { return r.json(); }).then(function (m) {
      manifest = m;
      texts.forEach(function (t, i) {
        var idx = Math.round(i * (m.count - 1) / 3);
        var f = document.createElement('figure');
        f.style.backgroundImage = 'url(' + frameUrl(idx) + ')';
        var c = document.createElement('figcaption');
        var h = document.createElement(i === 0 ? 'h1' : 'h2');
        headline(h, t);
        c.appendChild(h);
        if (i === 0) offer(c, h);
        if (i === 3) c.appendChild(ctaLink('btn btn--big'));
        f.appendChild(c); box.appendChild(f);
      });
    });
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w !== cw || h !== ch) { canvas.width = cw = w; canvas.height = ch = h; curFrame = -1; }
  }

  function draw(i) {
    // nearest already-loaded frame at or below i, else above
    var im = frames[i], k = i;
    while ((!im || !im.complete || !im.naturalWidth) && k > 0) { k--; im = frames[k]; }
    if (!im || !im.naturalWidth) { k = i; while (k < frames.length && (!frames[k] || !frames[k].naturalWidth)) k++; im = frames[k]; }
    if (!im || !im.naturalWidth) return;
    var iw = im.naturalWidth, ih = im.naturalHeight;
    var s = Math.max(cw / iw, ch / ih);
    var dw = iw * s, dh = ih * s;
    var focus = window.innerWidth < 768 ? 0.74 : 0.5;     // mobile: right-centre of the frame
    var dx = -(dw - cw) * focus, dy = -(dh - ch) * 0.5;
    ctx.drawImage(im, dx, dy, dw, dh);
  }

  function beatStyle(p) {
    var e = .04;
    for (var i = 0; i < RANGES.length; i++) {
      var s = RANGES[i][0], en = RANGES[i][1], o = 0, y = 0;
      if (p >= s - e && p <= en + e) {
        var inn = s === 0 ? 1 : Math.min(1, Math.max(0, (p - s) / e));
        var out = en === 1 ? 1 : Math.min(1, Math.max(0, (en - p) / e));
        o = Math.min(inn, out);
        y = inn < 1 ? (1 - inn) * 28 : (out < 1 ? -(1 - out) * 28 : 0);
      }
      var el = beatEls[i];
      el.style.opacity = o.toFixed(3);
      var mob = window.innerWidth < 768;
      el.style.transform = mob ? 'translateY(' + y + 'px)' : 'translateY(calc(-50% + ' + y + 'px))';
      el.style.visibility = o < .01 ? 'hidden' : 'visible';
      el.style.pointerEvents = o > .6 ? 'auto' : 'none';
    }
    strip(p);
  }

  function progress() {
    var r = hero.getBoundingClientRect();
    var total = hero.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / total));
  }

  /* The film plays itself, one scene per scroll gesture. While it is still
     playing, downward scrolling is held: the page only moves on after the
     last scene. Impatient scrolling fast-forwards the film instead. */
  var STOPS = [ver === 'a' ? 20 / 504 : 0, 120 / 504, 312 / 504, 1];   // A skips its slow first frames
  var vel = 0, lastT = 0, arrivedAt = 0;
  var SPEED = 1.35;                            // x real time while cruising
  var energy = 0, energyT = 0;                 // how hard the visitor is pushing
  function push(amount) {
    var now = performance.now();
    energy = energy * Math.pow(0.5, (now - energyT) / 450) + Math.abs(amount);
    energyT = now;
  }
  function hurry() {
    var e = energy * Math.pow(0.5, (performance.now() - energyT) / 450);
    return 1 + Math.min(11, Math.max(0, e - 260) / 170);
  }
  function locked() { return window.scrollY <= 2 && cur < 1; }
  function nextStop() { for (var i = 0; i < 4; i++) if (STOPS[i] > cur + 0.001) return STOPS[i]; return 1; }
  function prevStop() { for (var i = 3; i >= 0; i--) if (STOPS[i] < cur - 0.001) return STOPS[i]; return STOPS[0]; }
  function intent(delta) {                     // returns true when the input was used by the film
    if (!manifest) return false;
    if (delta > 0 && locked()) {
      push(delta);
      var settled = cur === target && (hurry() > 2.2 || performance.now() - arrivedAt > 450);
      if (settled) target = nextStop();
      if (hurry() > 3.4) target = 1;             // clearly wants out: run to the end, fast
      kick();
      return true;
    }
    if (delta < 0 && window.scrollY <= 2 && cur > STOPS[0] + 0.001) {
      if (cur === target || target > cur) target = prevStop();
      kick();
      return true;
    }
    return false;
  }
  function tick(now) {
    var n = manifest.count;
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
    lastT = now;
    var dist = target - cur;
    var cruise = SPEED * 24 / (n - 1);                       // playhead units per second
    var vmax = cruise * (dist < 0 ? 2.6 : hurry());
    var want = Math.max(-vmax, Math.min(vmax, dist * 2.4 * (dist < 0 ? 1 : Math.sqrt(hurry()))));
    vel += (want - vel) * (1 - Math.exp(-dt / 0.2));         // gentle start, gentle stop
    cur += vel * dt;
    if ((dist > 0 && cur >= target) || (dist < 0 && cur <= target)) { cur = target; vel = 0; }
    if (Math.abs(target - cur) < 0.0006 && Math.abs(vel) < 0.004) { cur = target; vel = 0; }
    var f = Math.min(n - 1, Math.max(0, Math.round(cur * (n - 1))));
    if (f !== curFrame) { curFrame = f; draw(f); }
    beatStyle(cur);
    window.plFilm = { cur: cur };           // read by audio.js
    hint.style.opacity = (cur === target && cur < 1 && window.scrollY <= 2) ? 1 : 0;
    if (cur !== target) requestAnimationFrame(tick);
    else { running = false; lastT = 0; arrivedAt = performance.now(); }
  }
  function kick() { if (!running && manifest) { running = true; lastT = 0; requestAnimationFrame(tick); } }
  function bindInput() {
    window.addEventListener('wheel', function (e) {
      var d = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (intent(d)) e.preventDefault();
    }, { passive: false });
    var ty = null;
    window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (ty === null) return;
      var y = e.touches[0].clientY, d = (ty - y) * 2.2; ty = y;
      if (Math.abs(d) > 1 && intent(d) && e.cancelable) e.preventDefault();
    }, { passive: false });
    window.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
      var d = { ArrowDown: 120, PageDown: 400, ' ': 400, End: 4000, ArrowUp: -120, PageUp: -400 }[e.key];
      if (d && intent(d)) e.preventDefault();
    });
    // scrollbar drag, anchor links, restored scroll position: just finish the film
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10 && target < 1) { push(4000); target = 1; kick(); }
    }, { passive: true });
  }

  function preload() {
    var n = manifest.count, next = 1, active = 0, MAX = 6;
    frames = new Array(n);
    function done() {
      loaded++;
      loadline.firstChild.style.width = (loaded / n * 100) + '%';
      if (loaded >= n) loadline.classList.add('done');
      if (loaded % 8 === 0) { curFrame = -1; kick(); }
      pump();
    }
    function load(i) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = im.onerror = function () { active--; done(); };
      active++;
      im.src = frameUrl(i); frames[i] = im;
      return im;
    }
    function pump() { while (active < MAX && next < n) load(next++); }
    var first = load(0);
    var go = function () { resize(); target = cur = (window.scrollY > 10 ? 1 : STOPS[0]); arrivedAt = performance.now(); curFrame = -1; draw(Math.round(cur * (n - 1))); beatStyle(cur); pump(); };
    if (first.complete && first.naturalWidth) go(); else first.addEventListener('load', go, { once: true });
  }

  if (reduced) {
    buildStills();
  } else {
    buildBeats();
    buildStrip();
    beatStyle(STOPS[0]);                     // offer, button and strip visible on first paint
    fetch(base + 'manifest.json').then(function (r) { return r.json(); }).then(function (m) {
      manifest = m; preload();
    });
    bindInput();
    window.addEventListener('resize', function () { resize(); curFrame = -1; kick(); });
  }

  /* ---------- piano ---------- */
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var WHITE_SEMI = [0, 2, 4, 5, 7, 9, 11];
  var WKEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'];
  var BKEYS = { 0: 'w', 1: 'e', 3: 't', 4: 'y', 5: 'u', 7: 'o', 8: 'p', 10: '[', 11: ']', 12: '\\' };
  // black key after white index i, where it exists
  var BLACK_AFTER = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];

  var NOTE_RO = ['Do', 'Do diez', 'Re', 'Re diez', 'Mi', 'Fa', 'Fa diez', 'Sol', 'Sol diez', 'La', 'La diez', 'Si'];
  var HINT = ver === 'a' ? { 60: 1, 64: 1, 67: 1 } : {};   // A: Do, Mi, Sol tinted pink as a hint

  var pianoEl = document.getElementById('piano');
  var keysWrap = document.createElement('div');
  keysWrap.className = 'piano__keys';
  pianoEl.appendChild(keysWrap);
  var keyEls = {};          // midi -> element
  var keyMap = {};          // keyboard key -> midi

  function midiOf(oct, semi) { return 12 * (oct + 1) + semi; }
  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* two octaves on desktop, one on phones so the keys stay tappable */
  var phone = window.matchMedia('(max-width: 767px)');
  function buildKeys() {
    releaseAll();
    keysWrap.textContent = ''; keyEls = {}; keyMap = {};
    var nW = phone.matches ? 7 : 14;
    var whites = [];
    for (var w = 0; w < nW; w++) whites.push(midiOf(4 + Math.floor(w / 7), WHITE_SEMI[w % 7]));
    function label(d, m) { d.setAttribute('aria-label', NOTE_RO[m % 12] + (m >= 72 ? ', octava a doua' : '')); }
    whites.forEach(function (m, i) {
      var d = document.createElement('div');
      d.className = 'k k--w' + (HINT[m] ? ' k--hint' : ''); d.dataset.m = m; label(d, m);
      d.textContent = WKEYS[i] ? (WKEYS[i] === 'Enter' ? '↵' : WKEYS[i].toUpperCase()) : '';
      keysWrap.appendChild(d); keyEls[m] = d;
      if (WKEYS[i]) keyMap[WKEYS[i].toLowerCase()] = m;
    });
    BLACK_AFTER.forEach(function (wi) {
      if (wi >= nW - 1) return;
      var m = whites[wi] + 1;
      var d = document.createElement('div');
      d.className = 'k k--b'; d.dataset.m = m; label(d, m);
      d.style.left = 'calc(' + ((wi + 1) * 100 / nW) + '% - ' + (100 / nW * .3) + '%)';
      d.style.width = 'calc(100% / ' + nW + ' * .6)';
      var ks = BKEYS[wi];
      d.textContent = ks ? ks.toUpperCase() : '';
      keysWrap.appendChild(d); keyEls[m] = d;
      if (ks) keyMap[ks] = m;
    });
    if (whites[11]) keyMap['enter'] = whites[11];
  }

  /* audio: soft piano-ish voice from detuned triangle + sine partials, lowpassed, fast decay */
  var AC = null, master = null, voices = {};
  function audio() {
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      AC = new C();
      master = AC.createGain(); master.gain.value = .55;
      var comp = AC.createDynamicsCompressor();
      master.connect(comp); comp.connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function noteOn(m, vel) {
    var ac = audio(); if (!ac) return;
    if (voices[m]) noteOff(m, true);
    var t = ac.currentTime, f = freq(m);
    var g = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(7000, f * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2.2), t + 1.2);
    var peak = (vel || .8) * .36;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + .006);
    g.gain.exponentialRampToValueAtTime(peak * .38, t + .35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    var oscs = [['triangle', 0, 1], ['triangle', 5, .55], ['sine', -4, .5], ['sine', 1200, .22]].map(function (o) {
      var os = ac.createOscillator(), og = ac.createGain();
      os.type = o[0]; os.frequency.value = f; os.detune.value = o[1]; og.gain.value = o[2];
      os.connect(og); og.connect(lp); os.start(t); os.stop(t + 3.3);
      return os;
    });
    lp.connect(g); g.connect(master);
    voices[m] = { g: g, oscs: oscs };
  }
  function noteOff(m, quick) {
    var v = voices[m]; if (!v || !AC) return;
    var t = AC.currentTime;
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0001), t);
    v.g.gain.exponentialRampToValueAtTime(0.0001, t + (quick ? .05 : .42));
    delete voices[m];
  }

  var down = {};   // midi -> count of sources
  function press(m, src) {
    var el = keyEls[m]; if (!el) return;
    if (!down[m]) { down[m] = {}; }
    if (down[m][src]) return;
    down[m][src] = 1;
    if (Object.keys(down[m]).length === 1) { el.classList.add('on'); noteOn(m); }
  }
  function release(m, src) {
    if (!down[m] || !down[m][src]) return;
    delete down[m][src];
    if (!Object.keys(down[m]).length) { delete down[m]; if (keyEls[m]) keyEls[m].classList.remove('on'); noteOff(m); }
  }
  function releaseAll(only) {
    Object.keys(down).forEach(function (m) { Object.keys(down[m]).forEach(function (s) { if (!only || s === only) release(+m, s); }); });
  }
  buildKeys();
  var onPhone = function () { ptr = {}; buildKeys(); };
  if (phone.addEventListener) phone.addEventListener('change', onPhone); else if (phone.addListener) phone.addListener(onPhone);

  // pointer (mouse + touch), with glide across keys
  var ptr = {};   // pointerId -> midi
  function keyAt(x, y) {
    var el = document.elementFromPoint(x, y);
    el = el && el.closest ? el.closest('.k') : null;
    return el ? +el.dataset.m : null;
  }
  pianoEl.addEventListener('pointerdown', function (e) {
    var m = keyAt(e.clientX, e.clientY); if (m == null) return;
    e.preventDefault();
    ptr[e.pointerId] = m; press(m, 'p' + e.pointerId);
  });
  window.addEventListener('pointermove', function (e) {
    if (ptr[e.pointerId] == null) return;
    var m = keyAt(e.clientX, e.clientY);
    if (m !== ptr[e.pointerId]) {
      release(ptr[e.pointerId], 'p' + e.pointerId);
      if (m != null) { ptr[e.pointerId] = m; press(m, 'p' + e.pointerId); } else delete ptr[e.pointerId];
    }
  });
  function pend(e) {
    if (ptr[e.pointerId] != null) { release(ptr[e.pointerId], 'p' + e.pointerId); delete ptr[e.pointerId]; }
  }
  window.addEventListener('pointerup', pend);
  window.addEventListener('pointercancel', pend);

  // computer keyboard
  window.addEventListener('keydown', function (e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    var m = keyMap[k]; if (m == null) return;
    // do not hijack Enter on a focused link/button
    if (k === 'enter' && /^(A|BUTTON)$/.test(document.activeElement.tagName)) return;
    e.preventDefault(); press(m, 'k' + k);
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase(), m = keyMap[k]; if (m == null) return;
    release(m, 'k' + k);
  });
  window.addEventListener('blur', function () { releaseAll(); });

  /* "Ascultă un exemplu": C, F, G, C, each lightly arpeggiated, lighting the keys as they sound.
     Voicings stay inside one octave (C4-B4) so they also light the phone keyboard. */
  var DEMO = [[60, 64, 67], [60, 65, 69], [62, 67, 71], [60, 64, 67]];
  var demoBtn = document.getElementById('demo'), demoLbl = demoBtn.querySelector('.demo__lbl'), demoT = [], playing = false;
  function stopDemo() { demoT.forEach(clearTimeout); demoT = []; playing = false; demoLbl.textContent = 'Ascultă un exemplu'; demoBtn.classList.remove('is-playing'); releaseAll('demo'); }
  demoBtn.addEventListener('click', function () {
    if (playing) { stopDemo(); return; }
    audio(); playing = true; demoLbl.textContent = 'Oprește'; demoBtn.classList.add('is-playing');
    var t = 120, CHORD = 1150, ARP = 90;
    DEMO.forEach(function (ch, ci) {
      var hold = ci === DEMO.length - 1 ? 1700 : CHORD - 80;
      ch.forEach(function (m, ni) {
        (function (m, at, end) {
          demoT.push(setTimeout(function () { press(m, 'demo'); }, at));
          demoT.push(setTimeout(function () { release(m, 'demo'); }, end));
        })(m, t + ni * ARP, t + hold);
      });
      t += CHORD;
    });
    demoT.push(setTimeout(stopDemo, t + 700));
  });

  /* chord chips (B): each plays its chord and lights the seam keyboard */
  document.querySelectorAll('.chip[data-chord]').forEach(function (chip) {
    var notes = chip.dataset.chord.split(',').map(Number), timer = null;
    chip.addEventListener('click', function () {
      audio();
      if (timer) { clearTimeout(timer); releaseAll('chip'); }
      document.querySelectorAll('.chip.on').forEach(function (c) { c.classList.remove('on'); });
      chip.classList.add('on');
      notes.forEach(function (m, i) { setTimeout(function () { press(m, 'chip'); }, i * 40); });
      timer = setTimeout(function () { releaseAll('chip'); chip.classList.remove('on'); timer = null; }, 1400);
    });
  });
})();

/* header CTA: pink over the film, magenta (A) or gold (B) once the page section covers it */
(function () {
  var cover = document.querySelector('[data-cover]');
  if (!cover) return;
  var off = +cover.getAttribute('data-cover') || 0;
  var hero = document.getElementById('hero'), beats = document.getElementById('beats');
  var isB = document.body.classList.contains('v-b');
  function upd() {
    document.body.classList.toggle('past-film', cover.getBoundingClientRect().top + off < 70);
    // B: the keyboard stops half on the film, so fade the last headline out
    // as it rises instead of leaving fragments beside the keys (layer opacity only)
    if (isB && beats && !hero.hidden) {
      var pin = hero.offsetHeight - window.innerHeight;
      var k = pin > 0 ? Math.min(1, Math.max(0, (window.scrollY / pin - 0.3) / 0.45)) : 0;
      beats.style.opacity = (1 - k).toFixed(3);
    }
  }
  window.addEventListener('scroll', upd, { passive: true });
  window.addEventListener('resize', upd);
  if ('ResizeObserver' in window) new ResizeObserver(upd).observe(document.body);   // stills load late in reduced motion
  upd();
})();
