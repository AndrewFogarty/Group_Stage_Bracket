import React from "react";
import { createRoot } from "react-dom/client";
import WatchBoxes from "./WatchBoxes.jsx";
import "./index.css";

/* Each placeholder node keeps its React root so repeated fills (the schedule
   re-renders on every ~45s live poll) re-render in place instead of leaking a
   new root each time. */
const ROOT = Symbol("wcbroadcasts-root");

/* Mount/update the "watch on" boxes for every node matching `selector`.
   Mirrors window.WCWeather.fill — called from renderSchedule() after the
   schedule strip's HTML is (re)built. Exported as the bundle's IIFE global so
   it is reachable as window.WCBroadcasts.fill in the page. */
export function fill(selector) {
  const nodes = document.querySelectorAll(selector);
  nodes.forEach((node) => {
    const home = node.dataset.home;
    const away = node.dataset.away;
    const group = node.dataset.group;
    if (!home || !away) return;
    let root = node[ROOT];
    if (!root) {
      root = createRoot(node);
      node[ROOT] = root;
    }
    root.render(<WatchBoxes home={home} away={away} group={group} />);
  });
}
