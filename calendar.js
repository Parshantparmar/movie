/* ==========================================================================
   Calendar (.ics) + WhatsApp helpers. Pure functions, no DOM access.
   Uses "floating" local time (no Z, no TZID, no fixed UTC offset): the event
   appears at the same wall-clock time on her device, in her own timezone,
   with DST handled by her calendar app. Wall-clock arithmetic is done in UTC
   space so the browser's DST rules can never shift the result.
   ========================================================================== */
(function (root) {
  'use strict';

  var pad = function (n) { return String(n).padStart(2, '0'); };

  function parseParts(dateStr, timeStr) {
    var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    var t = /^(\d{2}):(\d{2})/.exec(timeStr);
    if (!d || !t) throw new Error('Invalid date or time');
    return { y: +d[1], mo: +d[2], d: +d[3], h: +t[1], mi: +t[2] };
  }

  function addMinutes(p, mins) {
    var t = new Date(Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) + mins * 60000);
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes() };
  }

  function fmtLocal(p) {
    return p.y + pad(p.mo) + pad(p.d) + 'T' + pad(p.h) + pad(p.mi) + '00';
  }

  function icsEscape(s) {
    return String(s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n');
  }

  // RFC 5545: lines max 75 octets; continuation lines start with one space.
  function fold(line) {
    var enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;
    var out = [], cur = '', len = 0;
    for (var ch of line) {
      var l = enc.encode(ch).length;
      if (len + l > 75) { out.push(cur); cur = ' '; len = 1; }
      cur += ch; len += l;
    }
    out.push(cur);
    return out.join('\r\n');
  }

  function utcStamp(date) {
    return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  }

  /**
   * b: { date:'YYYY-MM-DD', time:'HH:MM', movie:string, decide:boolean,
   *      reminderMinutes:number, durationMinutes:number }
   */
  function buildICS(b, now) {
    now = now || new Date();
    var start = parseParts(b.date, b.time);
    var end = addMinutes(start, b.durationMinutes || 120);
    var movie = (!b.decide && b.movie && b.movie.trim()) ? b.movie.trim() : '';
    var movieLine = movie ? 'Movie: ' + movie : "Movie: we'll decide together";
    var uid = 'tonight-just-us-' + now.getTime() + '-' + Math.random().toString(36).slice(2, 10) + '@movie-date';
    var mins = Math.max(0, Math.round(b.reminderMinutes));

    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tonight Just Us//Movie Date//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + utcStamp(now),
      'DTSTART:' + fmtLocal(start),
      'DTEND:' + fmtLocal(end),
      'SUMMARY:' + icsEscape('Tonight, Just Us'),
      'DESCRIPTION:' + icsEscape('Our little movie date.\n' + movieLine + '\nReserved for two.'),
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + icsEscape('Tonight, Just Us starts in ' + mins + ' minutes'),
      'TRIGGER:-PT' + mins + 'M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  function whatsappDigits(number) {
    var digits = String(number || '').replace(/\D/g, '');
    return (digits.length >= 8 && digits.length <= 15) ? digits : '';
  }

  function buildWhatsAppURL(number, dateText, timeText, movieText) {
    var digits = whatsappDigits(number);
    if (!digits) return '';
    var text = 'Looks like we have a date \u2764\uFE0F\n\n' +
      'Date: ' + dateText + '\n' +
      'Time: ' + timeText + '\n' +
      'Movie: ' + movieText + '\n\n' +
      'See you then.';
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text);
  }

  var api = { buildICS: buildICS, buildWhatsAppURL: buildWhatsAppURL, whatsappDigits: whatsappDigits, icsEscape: icsEscape, fold: fold };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TonightCalendar = api;
})(typeof window !== 'undefined' ? window : globalThis);
