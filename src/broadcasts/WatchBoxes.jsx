import React from "react";

/* Where to watch a World Cup 2026 match in the US. ESPN tells us which
   networks carry each game; English coverage is the FOX family (FOX / FS1 /
   FOX One) and Spanish coverage is Telemundo, which streams on Peacock. We
   show one box per available broadcaster, deep-linking to its World Cup hub
   (ESPN does not expose per-match stream URLs). Constants are kept here so the
   destinations are easy to swap. */
const PEACOCK_URL = "https://www.peacocktv.com/watch/sports-La-Copa-Mundial-de-la-FIFA-2026";
const FOX_URL = "https://www.foxsports.com/soccer/fifa-world-cup";

/* Fall back to sensible WC2026 defaults when ESPN has not yet announced the
   exact channel for an upcoming match (every game airs on both carriers). */
const DEFAULTS = { peacock: "Peacock", fox: "FOX" };

function lookup(home, away) {
  const map = (typeof window !== "undefined" && window.WC_BROADCASTS) || {};
  return map[`${home}|${away}`] || map[`${away}|${home}`] || null;
}

function Box({ href, brand, network, title }) {
  return (
    <a
      className={`watch-box watch-box--${brand}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Watch on ${title || network}`}
    >
      <span className="watch-box__label">{network}</span>
    </a>
  );
}

export default function WatchBoxes({ home, away }) {
  const bc = lookup(home, away);
  // No ESPN data yet → still offer both carriers with default labels, since
  // every WC2026 match is available on the FOX family and on Peacock. Both
  // boxes carry the brand label ("FOX" / "Peacock"); when ESPN reports the
  // specific carrier (e.g. an FS1 game, or Telemundo in Spanish) we surface it
  // in the tooltip rather than changing the label.
  const peacockTitle = bc && bc.peacock && bc.peacock.network
    ? `${DEFAULTS.peacock} (${bc.peacock.network})`
    : DEFAULTS.peacock;
  const foxTitle = bc && bc.fox && bc.fox.network
    ? `${DEFAULTS.fox} (${bc.fox.network})`
    : DEFAULTS.fox;
  return (
    <>
      <Box href={PEACOCK_URL} brand="peacock" network={DEFAULTS.peacock} title={peacockTitle} />
      <Box href={FOX_URL} brand="fox" network={DEFAULTS.fox} title={foxTitle} />
    </>
  );
}
