import { useState } from "react";

const STORAGE_KEY = "stash-box.cropGuides";

/** Whether crop guides are drawn, remembered for the session across the lightbox and the image page */
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
