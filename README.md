# Tonight, Just Us.

A five-scene cinematic invitation: opening credits → story → personal moment → reveal → booking
(date, time, movie, reminder) → ticket, `.ics` calendar file and WhatsApp confirmation.

Plain HTML/CSS/JS. No build step, no backend.

## Files
- `index.html` – the five scenes and the ticket/modal markup
- `style.css` – all visuals, transitions, responsive and reduced-motion rules
- `app.js` – scene timeline, navigation, form validation, ticket, downloads
- `calendar.js` – `.ics` generator and WhatsApp URL builder (pure functions)
- `config.js` – **the only file you need to edit** (nickname, WhatsApp number, reminder, duration, music, photos)
- `render.yaml` – optional Render blueprint

## Run locally
```
cd tonight-just-us
python3 -m http.server 8080      # or: npx serve .
```
Open http://localhost:8080 (on your phone: http://<your-computer-ip>:8080 on the same Wi-Fi).

## Deploy to Render (static site)
1. Push this folder to a GitHub repo.
2. Render → New → **Static Site** → pick the repo.
3. Build command: *(leave empty)* · Publish directory: `.` (or the folder containing `index.html`).
4. Deploy, then send her the URL. (`render.yaml` does the same if you use Blueprints.)

## Configure WhatsApp
In `config.js` set `WHATSAPP_NUMBER` to your number, international format, digits only:
`"919876543210"` (no `+`, spaces or dashes). If it is empty, the button shows how to set it.
WhatsApp opens with the message pre-filled; she still has to tap send.

## How the calendar reminder works
"Add to calendar" downloads `our-movie-date.ics` (2-hour event "Tonight, Just Us", movie in the
description, a `VALARM` set to her chosen minutes before). The time is saved as *floating local time*,
so it lands on the same wall-clock time in her own timezone, DST included. She must **open the
downloaded file and confirm adding it** to her calendar; the site cannot save it automatically,
and whether the alert fires depends on her calendar app and device settings.

## Photos and music
Drop files in an `assets/` folder and reference them in `config.js`
(`BACKGROUND_IMAGES`, `MUSIC_URL`). Without them the built-in light/bokeh backgrounds are used.
Music only starts when she taps the note icon.
