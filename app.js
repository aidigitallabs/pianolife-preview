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
    a: ['01 · Într-o zi', '02 · Te așezi', '03 · Fără partituri', '04 · Melodia ta'],
    b: ['01 · Bați ritmul', '02 · Mâinile tale știu', '03 · Fără partituri', '04 · Melodia ta']
  };
  var NAV = {
    a: [['#metoda', 'Metoda'], ['#andreea', 'Andreea'], ['#intrebari', 'Întrebări']],
    b: [['#incearca', 'Încearcă'], ['#metoda', 'Metoda'], ['#andreea', 'Andreea']]
  };
  /* The film text is one paragraph that writes itself word by word as the
     playhead advances. Each sentence: [text, from, to] = playhead span over which
     its words appear; *stars* mark emphasised words. The first sentence types
     itself on load. The hero offer (headline + button) appears at the end and stays. */
  var RANGES = [[.955, 1]];
  var STORY = {
    a: [['Ai zis *„într-o zi”* de atâtea ori.', -1, -1],
        ['Pianul a rămas acolo, răbdător.', .07, .19],
        ['Într-o seară te așezi.', .23, .30],
        ['Începi cu *melodia care ți-e dragă*, nu cu game.', .33, .47],
        ['Mâinile ezită o clipă, apoi găsesc drumul.', .52, .66],
        ['Și cineva din casă se oprește în ușă *să asculte*.', .72, .86]],
    b: [['Bați ritmul cu degetele *pe birou*.', -1, -1],
        ['În ședințe. La semafor. Pe volan.', .04, .19],
        ['Muzica a fost mereu acolo.', .23, .30],
        ['Doar *clapele* au lipsit.', .33, .45],
        ['Laptopul poate să aștepte zece minute.', .52, .66],
        ['Seara, acasă, nu mai e liniște. E *melodia ta*.', .72, .89]]
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
    eb.className = 'beat__eyebrow'; eb.textContent = 'Pian pentru adulți · online · fără partituri';
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

  /* ---------- back to top (shown once the film is out of view) ---------- */
  var topBtn = document.createElement('button');
  topBtn.type = 'button'; topBtn.className = 'totop'; topBtn.setAttribute('aria-label', 'Înapoi sus');
  topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
  document.body.appendChild(topBtn);

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

  /* Typewriter story. Every sentence is its own line and every letter its own
     span, hidden until typed. One scroll = the next sentence: the film plays on
     to that sentence's moment (STORY[..][2]) while the letters are tapped out at
     a human rhythm. Older sentences roll upwards and dim, like film credits. */
  var sents = [], chars = [], storyEl = null, rollEl = null, typed = 0, due = 0, typing = false, sentIdx = 0;
  function buildBeats() {
    var d = document.createElement('div');
    d.className = 'beat beat--offer';
    var h = document.createElement('h1');
    headline(h, texts[0]);
    d.appendChild(h);
    offer(d, h);
    beatsEl.appendChild(d);
    beatEls.push(d);

    storyEl = document.createElement('div');
    storyEl.className = 'story';
    rollEl = document.createElement('div');
    rollEl.className = 'story__roll';
    storyEl.appendChild(rollEl);
    STORY[ver].forEach(function (sn) {
      var line = document.createElement('p'); line.className = 's';
      var em = false;
      sn[0].split(' ').forEach(function (w) {
        if (w.charAt(0) === '*') em = true;
        var close = /\*[.,]?$/.test(w);
        var sp = document.createElement('span');
        sp.className = 'w' + (em ? ' w--em' : '');
        w.replace(/\*/g, '').split('').forEach(function (ch) {
          var c = document.createElement('span'); c.className = 'c'; c.textContent = ch;
          sp.appendChild(c); chars.push(c);
        });
        line.appendChild(sp);
        line.appendChild(document.createTextNode(' '));
        if (close) em = false;
      });
      rollEl.appendChild(line);
      sents.push({ el: line, end: chars.length, stop: sn[2] < 0 ? STOPS[0] : sn[2] });
    });
    beatsEl.appendChild(storyEl);
    window.addEventListener('resize', function () { focusSent(sentIdx); });
  }
  function focusSent(i) {                      // roll so that sentence i sits on the reading line
    if (!rollEl) return;
    var line = sents[i].el;
    var anchor = storyEl.clientHeight * (window.innerWidth < 768 ? .8 : .66);
    rollEl.style.transform = 'translateY(' + Math.round(anchor - (line.offsetTop + line.offsetHeight)) + 'px)';
    sents.forEach(function (sn, k) { sn.el.classList.toggle('old', k < i); });
  }
  function typeNext() {
    if (typed >= due) { typing = false; return; }
    var c = chars[typed];
    if (typed > 0) chars[typed - 1].classList.remove('last');
    c.classList.add('on', 'last');
    typed++;
    var behind = due - typed, ch = c.textContent;
    var wait = behind > 110 ? 6 : behind > 60 ? 20 : 34 + Math.random() * 58;
    if (behind <= 60 && /[.,]/.test(ch)) wait += 190;        // a breath after punctuation
    setTimeout(typeNext, wait);
  }
  function typeTo(n) {
    if (n > due) due = n;
    if (!typing && typed < due) { typing = true; typeNext(); }
  }
  function typeIntro() {                       // first sentence types itself on load
    focusSent(0);
    setTimeout(function () { typeTo(sents[0].end); }, 2000);
    setTimeout(function () { document.body.classList.add('story-ready'); }, 5200);
  }
  function story(p) {
    if (!storyEl) return;
    var o = p < .93 ? 1 : Math.max(0, 1 - (p - .93) / .03);
    storyEl.style.opacity = o.toFixed(3);
    storyEl.style.visibility = o < .01 ? 'hidden' : 'visible';
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

  function draw(i, alpha) {
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
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(im, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
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
    story(p);
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
  /* One scroll gesture = the next sentence. The film then plays by itself, with
     eased starts and stops, up to that sentence's moment; the amount of scroll
     does not matter and wheel inertia is ignored. Forward only. After a sentence
     the picture keeps drifting very slowly, and if nobody scrolls the next
     sentence arrives on its own. Five gestures in quick succession skip to the end. */
  var DRIFT = .1;
  var started = false, finish = false, filmGest = false, lastIn = 0, lastMag = 0, gestStart = 0, gestures = [];
  function newGesture(delta) {
    var now = performance.now(), mag = Math.abs(delta);
    var fresh = now - lastIn > 130 || (mag > 30 && mag > lastMag * 2.5 && now - gestStart > 300);
    lastIn = now; lastMag = mag;
    if (fresh) gestStart = now;
    return fresh;
  }
  function locked() { return window.scrollY <= 2 && cur < 1; }
  function advance() {
    if (!started) { started = true; document.body.classList.add('film-started'); }
    if (sentIdx < sents.length - 1) {
      sentIdx++;
      focusSent(sentIdx);
      typeTo(sents[sentIdx].end);
      target = Math.max(target, sents[sentIdx].stop);
    } else {
      target = 1;                              // after the last sentence: the hero offer
    }
    kick();
  }
  function nextStop() { return sentIdx < sents.length - 1 ? sents[sentIdx + 1].stop : 1; }
  function intent(delta) {                     // returns true when the input was used by the film
    if (!manifest) return false;
    if (delta > 0 && window.scrollY <= 2 && cur >= 1) {   // tail of the gesture that ended the film: do not leak into the page
      if (newGesture(delta)) filmGest = false;
      return filmGest;
    }
    if (delta > 0 && locked()) {
      filmGest = true;
      if (newGesture(delta)) {
        var now = performance.now();
        gestures = gestures.filter(function (t) { return now - t < 2600; });
        gestures.push(now);
        if (gestures.length >= 5) { finish = true; target = 1; typeTo(chars.length); kick(); }
        else advance();
      }
      return true;
    }
    return false;
  }
  function tick(now) {
    var n = manifest.count;
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
    lastT = now;
    var unit = 24 / (n - 1);                                 // playhead units per second at real time
    var r = finish ? 7 : 1;
    var drift = (started && cur < 1) ? unit * DRIFT : 0;
    var dist = target - cur;
    var want = dist > 0 ? Math.min(SPEED * unit * r, Math.max(drift, dist * 2.2 * Math.sqrt(r))) : drift;
    vel += (want - vel) * (1 - Math.exp(-dt / 0.28));        // gentle start, gentle change of pace
    cur += vel * dt;
    if (!finish && dist <= 0 && started && cur < 1) {        // drifting: nobody scrolled for a while
      var here = sents[sentIdx].stop, nx = nextStop();
      if (cur > here + (nx - here) * .45 && typed >= due) advance();
    }
    if (cur >= 1) { cur = 1; vel = 0; target = 1; finish = false; document.body.classList.add('film-done'); }
    var pos = cur * (n - 1), f = Math.min(n - 1, Math.floor(pos)), frac = pos - f;
    var key = Math.round(pos * 16);
    if (key !== curFrame) {
      curFrame = key; draw(f);
      if (frac > 0.04 && f < n - 1 && frames[f + 1] && frames[f + 1].naturalWidth) draw(f + 1, frac);
    }
    beatStyle(cur);
    window.plFilm = { cur: cur };           // read by audio.js
    hint.style.opacity = (!started && cur < 1 && window.scrollY <= 2) ? 1 : 0;
    if ((started && cur < 1) || Math.abs(vel) > 0.0005) requestAnimationFrame(tick);
    else { running = false; lastT = 0; vel = 0; }
  }
  function kick() { if (!running && manifest) { running = true; lastT = 0; requestAnimationFrame(tick); } }
  function bindInput() {
    window.addEventListener('wheel', function (e) {
      var d = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (intent(d)) e.preventDefault();
    }, { passive: false });
    var ty = null;
    window.addEventListener('touchstart', function (e) { ty = e.touches[0].clientY; lastIn = 0; }, { passive: true });
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
      if (window.scrollY > 10 && target < 1) { finish = true; target = 1; started = true; document.body.classList.add('film-started'); kick(); }
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
    var go = function () { resize(); target = cur = (window.scrollY > 10 ? 1 : STOPS[0]); arrivedAt = performance.now(); curFrame = -1; draw(Math.round(cur * (n - 1))); beatStyle(cur); if (cur >= 1) document.body.classList.add('film-done'); else typeIntro(); pump(); };
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
