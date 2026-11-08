import { useState } from "react";

const STORAGE_KEY = "stash-box.cropGuides";

/**
 * Whether crop guides are drawn, remembered for the session
 *
 * Shared rather than per-view: judging a crop means moving between the gallery
 * lightbox and an image's own page, and having to switch the guides back on at
 * each stop reads as the setting not having taken
 */
export const useCropGuides = () => {
  const [showGuides, setShowGuides] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "1",
  );

  const toggleGuides = () => {
    const next = !showGuides;
    sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    setShowGuides(next);
  };

  return { showGuides, toggleGuides };
};
