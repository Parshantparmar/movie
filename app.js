/* ==========================================================================
   TONIGHT, JUST US. — scene engine, booking, ticket, calendar, WhatsApp
   ========================================================================== */
(function () {
  'use strict';

  var DEFAULTS = {
    NICKNAME: 'beautiful', DISPLAY_NAME: '', WHATSAPP_NUMBER: '', DEFAULT_REMINDER_MINUTES: 15,
    EVENT_DURATION_MINUTES: 120, MUSIC_URL: '', BACKGROUND_IMAGES: []
  };
  var C = Object.assign({}, DEFAULTS, window.CONFIG || {});
  var Cal = window.TonightCalendar;

  var TOTAL = 5;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPEED = reduceMotion ? 0.6 : 1;

  var scenes = $$('.scene');
  var current = 0;               // 1-based; 0 = not started
  var visited = new Set();       // scenes whose animation finished (revisits show instantly)
  var runId = 0;                 // cancels an in-flight scene timeline
  var flush = null;              // resolves the current wait early (tap to speed up)
  var booking = null;            // confirmed booking

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function localDate(dateStr, timeStr) {
    var p = dateStr.split('-').map(Number), t = (timeStr || '00:00').split(':').map(Number);
    return new Date(p[0], p[1] - 1, p[2], t[0], t[1], 0, 0);
  }
  function fmtDate(b) { return localDate(b.date, b.time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function fmtTime(b) { return localDate(b.date, b.time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function movieText(b, forWhatsApp) {
    var m = (!b.decide && b.movie && b.movie.trim()) ? b.movie.trim() : '';
    return m || (forWhatsApp ? 'Let\u2019s decide together' : 'We\u2019ll decide together');
  }

  /* ---------- timing: waits that a tap can cut short ---------- */
  function wait(ms, skippable) {
    if (skippable === undefined) skippable = true;
    return new Promise(function (resolve) {
      var t = setTimeout(fin, ms * SPEED);
      function fin() { clearTimeout(t); if (flush === fin) flush = null; resolve(); }
      if (skippable) flush = fin;
    });
  }
  function cancelRun() { runId++; if (flush) flush(); }

  /* ---------- scene timeline ---------- */
  function resetScene(scene) {
    $$('.beat', scene).forEach(function (b) { b.classList.remove('active', 'out'); });
    $$('.line', scene).forEach(function (l) { l.classList.remove('in'); });
    var more = $('#moreMsg'), inv = $('#inviteBtns');
    if (scene.classList.contains('s4')) { more.classList.remove('in'); inv.classList.remove('hide'); }
  }

  function finishInstant(scene) {
    var beats = $$('.beat', scene);
    resetScene(scene);
    var last = beats[beats.length - 1];
    if (last) { last.classList.add('active'); $$('.line', last).forEach(function (l) { l.classList.add('in'); }); }
    $$('.footer .line', scene).forEach(function (l) { l.classList.add('in'); });
  }

  async function play(scene) {
    var id = ++runId;
    resetScene(scene);
    await wait(+scene.dataset.start || 700);
    if (id !== runId) return;
    var beats = $$('.beat', scene);
    for (var i = 0; i < beats.length; i++) {
      var b = beats[i];
      b.classList.add('active');
      var lines = $$('.line', b);
      for (var j = 0; j < lines.length; j++) {
        await wait(+lines[j].dataset.delay || 0);
        if (id !== runId) return;
        if (!lines[j].hidden) lines[j].classList.add('in');
      }
      if (i < beats.length - 1) {
        await wait(+b.dataset.hold || 2200);
        if (id !== runId) return;
        b.classList.add('out');
        await wait(850, false);
        if (id !== runId) return;
        b.classList.remove('active', 'out');
      }
    }
    var foot = $$('.footer .line', scene);
    for (var k = 0; k < foot.length; k++) {
      await wait(+foot[k].dataset.delay || 0);
      if (id !== runId) return;
      foot[k].classList.add('in');
    }
    visited.add(+scene.dataset.scene);
  }

  /* ---------- navigation ---------- */
  function updateHud() {
    $('#sceneIndicator').textContent = 'Scene ' + pad(current) + ' / ' + pad(TOTAL);
    $('#backBtn').style.visibility = current > 1 ? 'visible' : 'hidden';
    document.body.dataset.scene = current;
  }

  function goTo(n, opts) {
    var push = !opts || opts.push !== false;
    if (n < 1 || n > TOTAL || n === current) return;
    cancelRun();
    var prev = scenes[current - 1], next = scenes[n - 1];
    if (prev) { prev.classList.remove('active'); prev.setAttribute('aria-hidden', 'true'); }
    next.classList.add('active');
    next.removeAttribute('aria-hidden');
    next.scrollTop = 0;
    current = n;
    updateHud();
    if (push) history.pushState({ scene: n }, '', '#scene-' + n);
    if (visited.has(n)) finishInstant(next); else play(next);
  }

  window.addEventListener('popstate', function (e) {
    goTo((e.state && e.state.scene) || 1, { push: false });
  });

  /* ---------- decorative backgrounds ---------- */
  function rand(a, b) { return a + Math.random() * (b - a); }
  function makeBokeh(host, count) {
    var colors = ['#e8b66a', '#d9c08a', '#c9843f', '#a8324f', '#f3d9a4', '#7d1a36'];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var el = document.createElement('i'), size = rand(24, 120);
      el.style.cssText = 'left:' + rand(-5, 100) + '%;top:' + rand(25, 105) + '%;width:' + size + 'px;height:' + size + 'px;' +
        '--c:' + colors[Math.floor(rand(0, colors.length))] + ';--o:' + rand(.14, .5).toFixed(2) + ';--b:' + rand(4, 14).toFixed(1) + 'px;' +
        '--t:' + rand(9, 22).toFixed(1) + 's;--dl:-' + rand(0, 14).toFixed(1) + 's;--dx:' + rand(-30, 30).toFixed(0) + 'px;--dy:' + rand(-40, 20).toFixed(0) + 'px';
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }
  function makeDust(host, count) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var el = document.createElement('i'), s = rand(1, 2.6);
      el.style.cssText = 'left:' + rand(0, 100) + '%;top:' + rand(30, 100) + '%;width:' + s + 'px;height:' + s + 'px;' +
        '--t:' + rand(14, 28).toFixed(0) + 's;--dl:-' + rand(0, 20).toFixed(0) + 's;--o:' + rand(.2, .5).toFixed(2) + ';--dx:' + rand(-40, 40).toFixed(0) + 'px';
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }
  function setupBackgrounds() {
    $$('.bokeh').forEach(function (h) { makeBokeh(h, h.classList.contains('soft') ? 14 : 26); });
    $$('.dust').forEach(function (h) { makeDust(h, 16); });
    (C.BACKGROUND_IMAGES || []).forEach(function (url, i) {
      if (!url || !scenes[i]) return;
      var layer = $('.layer', scenes[i]);
      layer.style.backgroundImage = 'url(' + JSON.stringify(url) + ')';
      layer.style.backgroundSize = 'cover';
    });
  }

  /* ---------- personalization ---------- */
  function applyPersonalization() {
    var nick = (C.NICKNAME || '').trim() || DEFAULTS.NICKNAME;
    $$('[data-nick]').forEach(function (n) { n.textContent = nick; });
    var name = (C.DISPLAY_NAME || '').trim();
    var ded = $('#dedication');
    if (name) { ded.textContent = 'A short film for ' + name; ded.hidden = false; }
  }

  /* ---------- music (optional, starts only after a tap) ---------- */
  function setupMusic() {
    if (!C.MUSIC_URL) return;
    var btn = $('#musicBtn'), audio = new Audio();
    audio.src = C.MUSIC_URL; audio.loop = true; audio.volume = 0.5; audio.preload = 'none';
    btn.hidden = false;
    btn.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().then(function () { btn.setAttribute('aria-pressed', 'true'); })
          .catch(function () { btn.hidden = true; });
      } else { audio.pause(); btn.setAttribute('aria-pressed', 'false'); }
    });
  }

  /* ---------- scene 4: invitation ---------- */
  function setupInvitation() {
    var inv = $('#inviteBtns'), more = $('#moreMsg'), timer = null;
    $('#yesBtn').addEventListener('click', function () { goTo(5); });
    $('#moreBtn').addEventListener('click', function () {
      clearTimeout(timer);
      inv.classList.add('hide');
      more.classList.add('in');
      timer = setTimeout(function () { more.classList.remove('in'); inv.classList.remove('hide'); }, 5200 * SPEED);
    });
  }

  /* ---------- scene 5: booking ---------- */
  var form, dateIn, timeIn, movieIn, decideIn, remSel;

  function setupForm() {
    form = $('#bookForm'); dateIn = $('#dateInput'); timeIn = $('#timeInput');
    movieIn = $('#movieInput'); decideIn = $('#decideTogether'); remSel = $('#reminderSelect');

    dateIn.min = todayStr(); dateIn.value = todayStr();
    if (new Date().getHours() < 19) timeIn.value = '20:00';

    var opts = [5, 10, 15, 30];
    var def = Math.round(+C.DEFAULT_REMINDER_MINUTES) || 15;
    if (opts.indexOf(def) === -1) { opts.push(def); opts.sort(function (a, b) { return a - b; }); }
    remSel.innerHTML = opts.map(function (m) { return '<option value="' + m + '">' + m + ' minutes before</option>'; }).join('');
    remSel.value = String(def);

    $$('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () { timeIn.value = chip.dataset.time; syncChips(); clearErr(timeIn, 'timeErr'); });
    });
    timeIn.addEventListener('input', function () { syncChips(); clearErr(timeIn, 'timeErr'); });
    dateIn.addEventListener('input', function () { clearErr(dateIn, 'dateErr'); });
    dateIn.addEventListener('focus', function () { dateIn.min = todayStr(); });
    decideIn.addEventListener('change', function () { movieIn.disabled = decideIn.checked; if (decideIn.checked) movieIn.value = ''; });
    syncChips();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var b = readBooking(), errs = validate(b);
      showErrors(errs);
      if (errs.date) { dateIn.focus(); return; }
      if (errs.time) { timeIn.focus(); return; }
      booking = b;
      renderTicket();
      var scene = scenes[4];
      scene.classList.add('booked');
      scene.scrollTop = 0;
      $('#statusNote').textContent = '';
    });

    $('#editBtn').addEventListener('click', function () { scenes[4].classList.remove('booked'); scenes[4].scrollTop = 0; });
    $('#replayBtn').addEventListener('click', function () { visited.clear(); goTo(1); });
  }

  function syncChips() { $$('.chip').forEach(function (c) { c.classList.toggle('on', c.dataset.time === timeIn.value); }); }
  function clearErr(input, id) { input.classList.remove('bad'); $('#' + id).textContent = ''; }
  function readBooking() {
    return {
      date: dateIn.value, time: timeIn.value, movie: movieIn.value.trim(), decide: decideIn.checked,
      reminderMinutes: +remSel.value, durationMinutes: Math.round(+C.EVENT_DURATION_MINUTES) || 120
    };
  }
  function validate(b) {
    var errs = {}, today = todayStr();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || isNaN(localDate(b.date, '00:00'))) errs.date = 'Choose a date for our evening.';
    else if (b.date < today) errs.date = 'That date has already passed \u2014 pick today or later.';
    if (!/^\d{2}:\d{2}$/.test(b.time)) errs.time = 'Choose a start time.';
    else if (!errs.date && b.date === today && localDate(b.date, b.time) <= new Date()) errs.time = 'That time has already passed \u2014 pick a little later tonight.';
    if (!(b.reminderMinutes > 0)) b.reminderMinutes = 15;
    return errs;
  }
  function showErrors(errs) {
    $('#dateErr').textContent = errs.date || ''; dateIn.classList.toggle('bad', !!errs.date);
    $('#timeErr').textContent = errs.time || ''; timeIn.classList.toggle('bad', !!errs.time);
  }

  /* ---------- ticket ---------- */
  function ticketHTML(b) {
    return '<div class="ticket">' +
      '<div class="t-main">' +
        '<p class="t-kick">A short film for two</p>' +
        '<h3 class="t-title">Tonight, Just Us.</h3>' +
        '<p class="t-sub">Our little movie date</p>' +
        '<dl class="t-rows">' +
          '<div><dt>Date</dt><dd>' + esc(fmtDate(b)) + '</dd></div>' +
          '<div><dt>Time</dt><dd>' + esc(fmtTime(b)) + '</dd></div>' +
          '<div><dt>Movie</dt><dd>' + esc(movieText(b)) + '</dd></div>' +
        '</dl>' +
      '</div>' +
      '<div class="t-stub"><p class="t-res">Reserved for: Two.</p><div class="t-bar" aria-hidden="true"></div></div>' +
    '</div>';
  }
  function renderTicket() {
    var mount = $('#ticketMount');
    mount.innerHTML = ticketHTML(booking);
    // restart the entrance animation on re-confirm
    mount.classList.remove('reveal'); void mount.offsetWidth; mount.classList.add('reveal');
  }
  function openModal() {
    if (!booking) return;
    $('#modalMount').innerHTML = ticketHTML(booking);
    $('#ticketModal').hidden = false;
    $('#closeModal').focus();
  }
  function closeModal() { $('#ticketModal').hidden = true; $('#viewBtn').focus(); }

  /* ---------- calendar + WhatsApp ---------- */
  function downloadICS() {
    if (!booking) return;
    var note = $('#statusNote');
    try {
      var ics = Cal.buildICS(booking);
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'our-movie-date.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      note.textContent = 'Your calendar file (our-movie-date.ics) is downloading. Open it from your downloads or notifications and confirm adding it to your calendar. It includes a reminder ' +
        booking.reminderMinutes + ' minutes before, but alerts depend on your calendar app and device settings.';
    } catch (err) {
      console.error(err);
      note.textContent = 'Something went wrong creating the calendar file. Please check the date and time and try again.';
    }
  }
  function openWhatsApp() {
    if (!booking) return;
    var note = $('#statusNote');
    var url = Cal.buildWhatsAppURL(C.WHATSAPP_NUMBER, fmtDate(booking), fmtTime(booking), movieText(booking, true));
    if (!url) {
      note.textContent = 'WhatsApp isn\u2019t set up yet. Open config.js and set WHATSAPP_NUMBER to the number in international format, digits only (for example 15551234567), then reload.';
      return;
    }
    note.textContent = 'Opening WhatsApp \u2014 the message is ready, you just need to tap send.';
    var a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- init ---------- */
  function init() {
    applyPersonalization();
    setupBackgrounds();
    setupMusic();
    setupInvitation();
    setupForm();

    $$('[data-next]').forEach(function (btn) { btn.addEventListener('click', function () { goTo(current + 1); }); });
    $('#backBtn').addEventListener('click', function () {
      if (history.state && history.state.scene > 1) history.back(); else goTo(current - 1, { push: false });
    });
    $('#calBtn').addEventListener('click', downloadICS);
    $('#waBtn').addEventListener('click', openWhatsApp);
    $('#viewBtn').addEventListener('click', openModal);
    $('#closeModal').addEventListener('click', closeModal);
    $('#ticketModal').addEventListener('click', function (e) { if (e.target.id === 'ticketModal' || e.target.id === 'modalMount') closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#ticketModal').hidden) closeModal(); });

    // tap anywhere (not on a control) to move the current moment along
    scenes.forEach(function (s) {
      s.addEventListener('click', function (e) {
        if (e.target.closest('button, a, input, select, label, form')) return;
        if (flush) flush();
      });
    });

    // start at scene 1
    scenes.forEach(function (s) { s.classList.remove('active'); s.setAttribute('aria-hidden', 'true'); });
    history.replaceState({ scene: 1 }, '', location.pathname + location.search);
    goTo(1, { push: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
