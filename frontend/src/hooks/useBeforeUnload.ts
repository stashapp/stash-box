import { useEffect } from "react";

const unloadListener = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = true;
};

export const useBeforeUnload = () => {
  useEffect(() => {
    window.addEventListener("beforeunload", unloadListener);
    return () => window.removeEventListener("beforeunload", unloadListener);
  }, []);
};
