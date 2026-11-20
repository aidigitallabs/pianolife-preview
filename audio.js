/* Background music: off until the visitor turns it on (browsers require a click).
   Version A has four sections that follow the story; version B has one loop.
   Reads the film playhead from window.plFilm = { cur: 0..1 } when app.js provides it. */
(function () {
  'use strict';
  var ver = /[?&]v=b\b/.test(location.search) ? 'b' : 'a';
  var TRACKS = {
    a: [
      { src: 'audio/a1.mp3', overlap: 1.2 },   // covered piano, sheet falls
      { src: 'audio/a2.mp3', overlap: 1.2 },   // she sits down, hands on keys
      { src: 'audio/a3.mp3', overlap: 0.9 },   // she plays; first sections of the page
      { src: 'audio/a4.mp3', overlap: 1.2 }    // towards the booking call to action
    ],
    b: [                                          // Für Elise, exact musical loops (no overlap)
      { src: 'audio/b1.wav', overlap: 0 },     // hand taps the desk: theme, slow and soft
      { src: 'audio/b2.wav', overlap: 0 },     // keys appear: theme continues
      { src: 'audio/b3.wav', overlap: 0 },     // he plays at home; first sections of the page
      { src: 'audio/b4.wav', overlap: 0 }      // towards the booking call to action: full theme
    ]
  }[ver];
  var VOLUME = 0.55, FADE = 2.4;

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'snd snd--invite';
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Muzică de fundal: pornește sau oprește');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/>' +
    '<g class="snd__waves"><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path d="M18 6.8a7.5 7.5 0 0 1 0 10.4"/></g>' +
    '<g class="snd__x"><path d="M16 9.5l5 5M21 9.5l-5 5"/></g></svg><span>Sunet</span>';
  document.body.appendChild(btn);

  var ctx = null, master = null, on = false, cur = -1, loading = null;
  var buffers = [], voices = [];               // voices[i] = { gain, timer, sources }

  function load() {
    if (loading) return loading;
    loading = Promise.all(TRACKS.map(function (t, i) {
      return fetch(t.src).then(function (r) { return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (ok, bad) { ctx.decodeAudioData(ab, ok, bad); }); })
        .then(function (buf) { buffers[i] = buf; });
    }));
    return loading;
  }

  function stage() {
    if (TRACKS.length === 1) return 0;
    var film = window.plFilm ? window.plFilm.cur : (window.scrollY > 10 ? 1 : 0);
    if (film < (ver === 'a' ? 0.42 : 0.2)) return 0;
    if (film < 0.999) return 1;
    var doc = document.documentElement;
    var p = window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight);
    return p < 0.62 ? 2 : 3;
  }

  function startVoice(i) {
    var buf = buffers[i], t = TRACKS[i];
    var v = { gain: ctx.createGain(), sources: [], timer: null, stopped: false };
    v.gain.gain.value = 0; v.gain.connect(master);
    if (!t.overlap) {
      var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(v.gain); s.start(); v.sources.push(s);
    } else {
      var period = buf.duration - t.overlap;
      var next = ctx.currentTime + 0.05;
      (function schedule() {
        if (v.stopped) return;
        while (next < ctx.currentTime + 3) {          // each pass fades in and out over the overlap
          var src = ctx.createBufferSource(), g = ctx.createGain();
          src.buffer = buf; src.connect(g); g.connect(v.gain);
          g.gain.setValueAtTime(0, next);
          g.gain.linearRampToValueAtTime(1, next + t.overlap);
          g.gain.setValueAtTime(1, next + period);
          g.gain.linearRampToValueAtTime(0, next + buf.duration);
          src.start(next); src.stop(next + buf.duration + 0.05);
          v.sources.push(src);
          if (v.sources.length > 6) v.sources.shift();
          next += period;
        }
        v.timer = setTimeout(schedule, 1000);
      })();
    }
    return v;
  }
  function fadeTo(v, level, secs) {
    var g = v.gain.gain, now = ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(level, now + secs);
  }
  function stopVoice(v, secs) {
    fadeTo(v, 0, secs);
    setTimeout(function () {
      v.stopped = true; clearTimeout(v.timer);
      v.sources.forEach(function (s) { try { s.stop(); } catch (e) {} });
      try { v.gain.disconnect(); } catch (e) {}
    }, secs * 1000 + 200);
  }
  function update() {
    if (!on || !buffers.length) return;
    var s = stage();
    if (s === cur || !buffers[s]) return;
    if (voices[cur]) { stopVoice(voices[cur], FADE); voices[cur] = null; }
    voices[s] = startVoice(s); fadeTo(voices[s], 1, cur < 0 ? 1.2 : FADE);
    cur = s;
  }

  function ramp(level, secs) {
    var n = ctx.currentTime;
    master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(master.gain.value, n);
    master.gain.linearRampToValueAtTime(level, n + secs);
  }
  function setOn(want) {
    on = want;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.classList.remove('snd--invite');
    if (on) {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      }
      ctx.resume();
      load().then(function () { if (on) { ramp(VOLUME, 0.8); update(); } });
    } else if (ctx) {
      ramp(0, 0.5);
      setTimeout(function () { if (!on) ctx.suspend(); }, 650);
    }
  }
  btn.addEventListener('click', function () { setOn(!on); });
  setInterval(update, 300);
  document.addEventListener('visibilitychange', function () {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  /* step back while the visitor plays the on-page keyboard */
  var duckT = null;
  document.addEventListener('pointerdown', function (e) {
    if (!ctx || !on || !e.target.closest) return;
    if (!e.target.closest('#piano, .piano, [data-chord], #demo')) return;
    ramp(VOLUME * 0.18, 0.25);
    clearTimeout(duckT);
    duckT = setTimeout(function () { if (on) ramp(VOLUME, 1.5); }, 4500);
  });

  window.plMusic = { stage: function () { return cur; }, isOn: function () { return on; } };
})();
