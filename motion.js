/* =====================================================================
   BPS Hodoňovice – hlídání pohybu přední kamerou + noční ztmavení
   - drží displej zapnutý (Wake Lock API, Chrome 84+)
   - bez pohybu X minut => stránka se ztmaví (černá + malé hodiny)
   - pohyb před kamerou nebo dotyk => plný přehled
   Psáno v ES5 kvůli Androidu 6. Nastavení je v MOTION_CFG.
   ===================================================================== */
(function () {
  var MOTION_CFG = {
    sleepAfterMin: 10,      // po kolika minutách bez pohybu ztmavit
    checkMs: 400,           // jak často porovnávat snímky z kamery
    pixelDiff: 28,          // rozdíl jasu pixelu (0–255), který se počítá jako změna
    areaPct: 1.2,           // kolik % obrazu se musí změnit = pohyb
    nightClock: true        // ve tmě ukazovat malé tlumené hodiny
  };
  // parametry z adresy, např. info.html?spanek=5  (5 minut)
  var m = /[?&]spanek=(\d+)/.exec(location.search);
  if (m) MOTION_CFG.sleepAfterMin = +m[1];

  var lastMotion = Date.now(), sleeping = false, prev = null, video, canvas, ctx, dot, ov, ovClock, camState = 'off';
  var W = 64, H = 48;

  function css() {
    var s = document.createElement('style');
    s.innerHTML =
      '#mdOv{position:fixed;left:0;top:0;right:0;bottom:0;background:#000;z-index:9999;display:none;cursor:none}' +
      '#mdOv.on{display:block}' +
      '#mdClk{position:absolute;color:#2a3440;font-size:46px;font-weight:300;font-family:Roboto,Arial,sans-serif;white-space:nowrap}' +
      '#mdDot{position:fixed;right:6px;bottom:6px;width:12px;height:12px;border-radius:50%;background:#33404d;z-index:9998;border:2px solid #0b1118}' +
      '#mdDot.ok{background:#1f5b3a}#mdDot.hit{background:#2fbf71}#mdDot.err{background:#7a2a2a}' +
      '#mdVid{position:fixed;width:2px;height:2px;opacity:0;left:0;top:0;pointer-events:none}';
    document.getElementsByTagName('head')[0].appendChild(s);
  }
  function build() {
    ov = document.createElement('div'); ov.id = 'mdOv';
    ovClock = document.createElement('div'); ovClock.id = 'mdClk'; ov.appendChild(ovClock);
    dot = document.createElement('div'); dot.id = 'mdDot'; dot.title = 'Hlídání pohybu';
    video = document.createElement('video'); video.id = 'mdVid';
    video.setAttribute('autoplay', ''); video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.muted = true;
    canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    ctx = canvas.getContext('2d');
    document.body.appendChild(ov); document.body.appendChild(dot); document.body.appendChild(video);
  }

  /* ---------- displej nesmí usnout ---------- */
  var wl = null;
  function wakeLock() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request && !wl) {
        navigator.wakeLock.request('screen').then(function (l) {
          wl = l; l.addEventListener('release', function () { wl = null; });
        }, function () {});
      }
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { wakeLock(); activity(); }
  });

  /* ---------- spánek / probuzení ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function drawNightClock() {
    if (!sleeping || !MOTION_CFG.nightClock) { ovClock.innerHTML = ''; return; }
    var d = new Date();
    ovClock.innerHTML = pad(d.getHours()) + ':' + pad(d.getMinutes());
    // každou minutu jinde – ochrana displeje
    var x = 5 + ((d.getMinutes() * 37) % 70), y = 10 + ((d.getMinutes() * 53) % 70);
    ovClock.style.left = x + '%'; ovClock.style.top = y + '%';
  }
  function sleep() { if (sleeping) return; sleeping = true; ov.className = 'on'; drawNightClock(); }
  function wake() {
    if (!sleeping) return;
    sleeping = false; ov.className = '';
    // po probuzení překreslit grafy (velikosti se mohly změnit)
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }
  function activity() { lastMotion = Date.now(); wake(); }

  /* ---------- kamera ---------- */
  function setDot(c) { if (dot) dot.className = c; }
  function startCam() {
    var c = { audio: false, video: { facingMode: 'user', width: { ideal: 160 }, height: { ideal: 120 }, frameRate: { ideal: 5 } } };
    function ok(stream) {
      try { video.srcObject = stream; } catch (e) { video.src = (window.URL || window.webkitURL).createObjectURL(stream); }
      var p = video.play(); if (p && p.catch) p.catch(function () {});
      camState = 'on'; setDot('ok');
      setInterval(check, MOTION_CFG.checkMs);
    }
    function fail() { camState = 'err'; setDot('err'); }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) navigator.mediaDevices.getUserMedia(c).then(ok, fail);
      else {
        var g = navigator.getUserMedia || navigator.webkitGetUserMedia;
        if (g) g.call(navigator, { video: true, audio: false }, ok, fail); else fail();
      }
    } catch (e) { fail(); }
  }
  var hitTimer = null;
  function check() {
    if (!video.videoWidth) return;
    try { ctx.drawImage(video, 0, 0, W, H); } catch (e) { return; }
    var d = ctx.getImageData(0, 0, W, H).data, n = W * H, cur = new Uint8Array(n), changed = 0, i, j;
    for (i = 0, j = 0; i < n; i++, j += 4) cur[i] = (d[j] * 3 + d[j + 1] * 6 + d[j + 2]) / 10;
    if (prev) {
      for (i = 0; i < n; i++) if (Math.abs(cur[i] - prev[i]) > MOTION_CFG.pixelDiff) changed++;
      // při rozsvícení/zhasnutí světla v místnosti se změní skoro vše – to taky bereme jako „někdo je tu“
      if (changed / n * 100 > MOTION_CFG.areaPct) {
        activity(); setDot('hit');
        clearTimeout(hitTimer); hitTimer = setTimeout(function () { setDot('ok'); }, 800);
      }
    }
    prev = cur;
  }

  /* ---------- start ---------- */
  function init() {
    css(); build();
    wakeLock();
    var ev = ['touchstart', 'mousedown', 'keydown'];
    for (var i = 0; i < ev.length; i++) document.addEventListener(ev[i], function () { activity(); wakeLock(); }, true);
    setInterval(function () {
      if (!sleeping && Date.now() - lastMotion > MOTION_CFG.sleepAfterMin * 60000) sleep();
      drawNightClock();
      wakeLock();
    }, 5000);
    setTimeout(startCam, 1500);
    window.bpsMotion = { cfg: MOTION_CFG, sleep: sleep, wake: wake, state: function () { return { sleeping: sleeping, cam: camState, idleSec: Math.round((Date.now() - lastMotion) / 1000) }; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
