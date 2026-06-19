import React from "react";

/* Where to watch a World Cup 2026 match in the US, plus where to bet it and
   what the crowd's brackets imply. ESPN tells us which networks carry each
   game; English coverage is the FOX family (FOX / FS1 / FOX One) and Spanish
   coverage is Telemundo, which streams on Peacock. We show one box per
   broadcaster, deep-linking to its World Cup hub (ESPN does not expose
   per-match stream URLs). The second row deep-links DraftKings and Polymarket
   to their World Cup hubs (neither exposes stable per-match URLs) and shows a
   "bracket-made" moneyline derived from everyone's submitted predictions.
   Constants are kept here so the destinations are easy to swap. */
const PEACOCK_URL = "https://www.peacocktv.com/watch/sports-La-Copa-Mundial-de-la-FIFA-2026";
const FOX_URL = "https://www.foxsports.com/soccer/fifa-world-cup";
const DRAFTKINGS_URL = "https://sportsbook.draftkings.com/leagues/soccer/world-cup";
const POLYMARKET_URL = "https://polymarket.com/sports/soccer";

/* Fall back to sensible WC2026 defaults when ESPN has not yet announced the
   exact channel for an upcoming match (every game airs on both carriers). */
const DEFAULTS = { peacock: "Peacock", fox: "FOX" };

function lookup(home, away) {
  const map = (typeof window !== "undefined" && window.WC_BROADCASTS) || {};
  return map[`${home}|${away}`] || map[`${away}|${home}`] || null;
}

/* Consensus odds from submitted brackets (computed in app.js). */
function bracketOdds(group, home, away) {
  const api = typeof window !== "undefined" && window.WCOdds;
  if (!api || !group) return null;
  try {
    return api.forMatch(group, home, away);
  } catch (e) {
    return null;
  }
}

function Box({ href, brand, label, title }) {
  return (
    <a
      className={`watch-box watch-box--${brand}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title || label}
    >
      <span className="watch-box__label">{label}</span>
    </a>
  );
}

/* The bracket-made moneyline pill. Shows the consensus favourite + its American
   moneyline; the tooltip carries the full three-way line, each outcome's share
   of brackets, the average predicted goal difference, and the sample size. */
function OddsBox({ odds, home, away }) {
  const pct = (x) => Math.round(x * 100);
  const gd = odds.gd >= 0 ? `+${odds.gd.toFixed(1)}` : odds.gd.toFixed(1);
  const title =
    `Bracket-made odds from ${odds.n} ${odds.n === 1 ? "pick" : "picks"} — ` +
    `${home} ${pct(odds.p.home)}% (${odds.ml.home > 0 ? "+" : ""}${odds.ml.home}) · ` +
    `Draw ${pct(odds.p.draw)}% (${odds.ml.draw > 0 ? "+" : ""}${odds.ml.draw}) · ` +
    `${away} ${pct(odds.p.away)}% (${odds.ml.away > 0 ? "+" : ""}${odds.ml.away}) · ` +
    `avg GD ${gd} (${home} view)`;
  return (
    <a className="watch-box watch-box--odds" href="#leaderboard-section" title={title}>
      <span className="watch-box__tag">📊</span>
      <span className="watch-box__label">
        {odds.favCode} {odds.favMl}
      </span>
    </a>
  );
}

export default function WatchBoxes({ home, away, group }) {
  const bc = lookup(home, away);
  // No ESPN data yet → still offer both carriers with default labels, since
  // every WC2026 match is available on the FOX family and on Peacock.
  const peacockTitle = bc && bc.peacock && bc.peacock.network
    ? `${DEFAULTS.peacock} (${bc.peacock.network})`
    : DEFAULTS.peacock;
  const foxTitle = bc && bc.fox && bc.fox.network
    ? `${DEFAULTS.fox} (${bc.fox.network})`
    : DEFAULTS.fox;
  const odds = bracketOdds(group, home, away);
  return (
    <>
      <div className="watch-row">
        <Box href={PEACOCK_URL} brand="peacock" label={DEFAULTS.peacock} title={`Watch on ${peacockTitle}`} />
        <Box href={FOX_URL} brand="fox" label={DEFAULTS.fox} title={`Watch on ${foxTitle}`} />
      </div>
      <div className="watch-row">
        <Box href={DRAFTKINGS_URL} brand="draftkings" label="DraftKings" title="Bet on DraftKings (World Cup)" />
        <Box href={POLYMARKET_URL} brand="polymarket" label="Polymarket" title="Trade on Polymarket (World Cup)" />
        {odds ? <OddsBox odds={odds} home={home} away={away} /> : null}
      </div>
    </>
  );
}
