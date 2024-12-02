import { useEffect } from "react";

export const useBeforeUnload = () => {
  const unloadListener = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = true;
  };
  useEffect(() => {
    window.addEventListener("beforeunload", unloadListener);
  }, []);
  return () => window.removeEventListener("beforeunload", unloadListener);
};
