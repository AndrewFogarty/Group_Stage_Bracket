/* =================================================================
   Live match-day weather (Open-Meteo — free, no API key).
   Resolves each host city to coordinates, fetches the HOURLY forecast
   in °F, and exposes a tiny API the schedule strip uses to show a
   weather emoji + temperature AT KICKOFF for each upcoming match.

   Why hourly-at-kickoff and not the daily high: every WC2026 match has
   an evening or midday slot, and the day's high (often a mid-afternoon
   number) badly overstates what it's like at a 9pm kickoff. Reading the
   hourly value at the venue-local kickoff hour is far more relevant and
   costs nothing extra on the same free API.

   Indoor / closed-roof venues (Atlanta, Dallas, Houston, Vancouver)
   are climate-controlled, so we label them "Indoor" instead of showing
   an irrelevant outdoor forecast.
   ================================================================= */
(function () {
  "use strict";

  /* Fixed coordinates for the 16 WC 2026 host cities. Keyed by the
     "City, COUNTRY" string that appears in each venue (the part in
     parentheses), so lookups are exact and never ambiguous. */
  const CITY_COORDS = {
    "Atlanta, USA": [33.755, -84.401],
    "Boston, USA": [42.091, -71.264], // Gillette Stadium, Foxborough
    "Dallas, USA": [32.748, -97.093], // AT&T Stadium, Arlington
    "Houston, USA": [29.685, -95.411],
    "Kansas City, USA": [39.049, -94.484],
    "Los Angeles, USA": [33.953, -118.339], // SoFi Stadium, Inglewood
    "Miami, USA": [25.958, -80.239], // Hard Rock Stadium
    "New York/New Jersey, USA": [40.814, -74.074], // MetLife Stadium
    "Philadelphia, USA": [39.901, -75.168],
    "San Francisco Bay Area, USA": [37.403, -121.97], // Levi's Stadium, Santa Clara
    "Seattle, USA": [47.595, -122.332],
    "Guadalajara, MEX": [20.681, -103.463],
    "Mexico City, MEX": [19.303, -99.15], // Estadio Azteca
    "Monterrey, MEX": [25.669, -100.244],
    "Toronto, CAN": [43.633, -79.418],
    "Vancouver, CAN": [49.277, -123.112],
  };

  /* Closed/retractable-roof venues that play climate-controlled — the
     forecast is irrelevant, so we show an "Indoor" badge instead.
     (SoFi in LA has a fixed roof but open sides, so it stays outdoor.) */
  const INDOOR_CITIES = new Set([
    "Atlanta, USA", // Mercedes-Benz Stadium
    "Dallas, USA", // AT&T Stadium
    "Houston, USA", // NRG Stadium
    "Vancouver, CAN", // BC Place
  ]);

  /* WMO weather code -> { emoji, label } */
  function describe(code) {
    if (code === 0) return { emoji: "☀️", label: "Clear" };
    if (code === 1) return { emoji: "🌤️", label: "Mainly clear" };
    if (code === 2) return { emoji: "⛅", label: "Partly cloudy" };
    if (code === 3) return { emoji: "☁️", label: "Overcast" };
    if (code === 45 || code === 48) return { emoji: "🌫️", label: "Fog" };
    if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Drizzle" };
    if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "Rain" };
    if (code >= 71 && code <= 77) return { emoji: "🌨️", label: "Snow" };
    if (code >= 80 && code <= 82) return { emoji: "🌧️", label: "Rain showers" };
    if (code === 85 || code === 86) return { emoji: "🌨️", label: "Snow showers" };
    if (code >= 95) return { emoji: "⛈️", label: "Thunderstorm" };
    return { emoji: "🌡️", label: "" };
  }

  /* "Estadio Azteca (Mexico City, MEX)" -> "Mexico City, MEX" */
  function cityFromVenue(venue) {
    const m = /\(([^)]+)\)\s*$/.exec(venue || "");
    return m ? m[1].trim() : null;
  }

  /* openfootball kickoff string "20:30 UTC-4" -> the venue-local hour (20).
     The clock part is already in venue-local time, so we just take the hour
     (rounding 30+ minutes up to the nearer hour). Returns null if unparsable. */
  function kickoffHour(kickoff) {
    const m = /(\d{1,2}):(\d{2})/.exec(kickoff || "");
    if (!m) return null;
    let h = parseInt(m[1], 10);
    if (parseInt(m[2], 10) >= 30) h += 1;
    return ((h % 24) + 24) % 24;
  }

  /* In-flight / completed fetches per city. Each resolves to a map of
     hourly readings keyed by "YYYY-MM-DDTHH:00" so the kickoff hour
     indexes in O(1). */
  const cache = new Map();

  function fetchCity(city, startDate, endDate) {
    const key = `${city}|${startDate}|${endDate}`;
    if (cache.has(key)) return cache.get(key);
    const coords = CITY_COORDS[city];
    if (!coords) {
      const empty = Promise.resolve(null);
      cache.set(key, empty);
      return empty;
    }
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${coords[0]}&longitude=${coords[1]}` +
      "&hourly=temperature_2m,weather_code,precipitation_probability" +
      "&temperature_unit=fahrenheit&timezone=auto" +
      `&start_date=${startDate}&end_date=${endDate}`;
    const p = fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const h = j && j.hourly;
        if (!h || !h.time) return null;
        const byHour = {};
        h.time.forEach((t, i) => {
          byHour[t] = {
            temp: h.temperature_2m[i],
            code: h.weather_code[i],
            pop: h.precipitation_probability ? h.precipitation_probability[i] : null,
          };
        });
        return byHour;
      })
      .catch(() => null);
    cache.set(key, p);
    return p;
  }

  /* Open-Meteo's free hourly forecast reaches ~16 days ahead. */
  function withinForecastWindow(date) {
    const ms = new Date(date + "T00:00:00").getTime() - Date.now();
    return ms <= 16 * 864e5 && ms >= -864e5; // up to 16 days out, or today
  }

  /* Pad to two digits for the hourly key. */
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  /* Fill every element matching `selector` that carries data-city +
     data-date (+ optional data-kickoff) with an emoji and °F at kickoff.
     Indoor venues get a static badge; outdoor ones fetch the forecast. */
  function fill(selector) {
    const els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return;

    // Indoor venues never need a fetch — label and bail out for those.
    els.forEach((el) => {
      if (el.dataset.city && INDOOR_CITIES.has(el.dataset.city)) {
        el.innerHTML =
          `<span class="wx-emoji">🏟️</span><span class="wx-temp">Indoor</span>`;
        el.title = "Climate-controlled (closed/retractable roof)";
        el.dataset.wxDone = "indoor";
      }
    });

    // Group requested dates per outdoor city so each city is fetched once
    // over the full span of dates it needs.
    const spans = {}; // city -> [minDate, maxDate]
    els.forEach((el) => {
      const city = el.dataset.city;
      const date = el.dataset.date;
      if (el.dataset.wxDone === "indoor") return;
      if (!city || !date || !CITY_COORDS[city] || !withinForecastWindow(date)) return;
      const s = spans[city] || [date, date];
      if (date < s[0]) s[0] = date;
      if (date > s[1]) s[1] = date;
      spans[city] = s;
    });

    Object.keys(spans).forEach((city) => {
      const [start, end] = spans[city];
      fetchCity(city, start, end).then((byHour) => {
        if (!byHour) return;
        els
          .filter((el) => el.dataset.city === city && el.dataset.wxDone !== "indoor")
          .forEach((el) => {
            const hr = kickoffHour(el.dataset.kickoff);
            // Fall back to a representative afternoon hour if kickoff is unknown.
            const hourKey = `${el.dataset.date}T${pad2(hr == null ? 18 : hr)}:00`;
            const w = byHour[hourKey];
            if (!w || w.temp == null) return;
            const info = describe(w.code);
            el.innerHTML =
              `<span class="wx-emoji">${info.emoji}</span>` +
              `<span class="wx-temp">${Math.round(w.temp)}°F</span>`;
            const rain = w.pop != null && w.pop >= 30 ? ` · ${w.pop}% rain` : "";
            el.title =
              `${info.label}${info.label ? " · " : ""}${Math.round(w.temp)}°F at kickoff${rain} (Open-Meteo)`;
          });
      });
    });
  }

  window.WCWeather = { cityFromVenue, describe, fill };
})();
