/* ==========================================================================
   TONIGHT, JUST US. — PERSONALIZATION
   Everything you might want to change lives in this one file.
   ========================================================================== */
window.CONFIG = {
  // Used in Scene 4: "So, <nickname>…"  (neutral default)
  NICKNAME: "beautiful",

  // Optional. If set, Scene 1 shows a small dedication: "A short film for <name>".
  // Leave as "" to hide it.
  DISPLAY_NAME: "",

  // YOUR WhatsApp number, international format, digits only (no +, spaces or dashes).
  // Example: India 919876543210  |  US 15551234567  |  UK 447123456789
  // Left empty on purpose — the WhatsApp button will explain how to set it.
  WHATSAPP_NUMBER: "",

  // Default reminder before the movie, in minutes. Choices offered: 5, 10, 15, 30
  // (any other value you set here is added to the list automatically).
  DEFAULT_REMINDER_MINUTES: 15,

  // Length of the calendar event, in minutes (120 = two hours).
  EVENT_DURATION_MINUTES: 120,

  // Optional background music. Path or URL to an mp3/m4a/ogg file, e.g. "assets/theme.mp3".
  // If empty, no music toggle is shown. Music only starts after she taps the toggle.
  MUSIC_URL: "",

  // Optional photographic backgrounds, one per scene (scene 1 → 5).
  // Leave "" to use the built-in cinematic light-and-bokeh backgrounds.
  // Example: ["assets/s1.jpg", "assets/s2.jpg", "", "assets/s4.jpg", ""]
  // Use photos you own or have the rights to use.
  BACKGROUND_IMAGES: ["", "", "", "", ""]
};
