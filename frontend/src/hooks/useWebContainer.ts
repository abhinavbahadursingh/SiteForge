import { useEffect, useState } from "react";
import { WebContainer } from "@webcontainer/api";

export function useWebContainer() {
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);

  useEffect(() => {
  let mounted = true;

  const init = async () => {
    if ((window as any).webcontainerInstance) return; // Prevent double boot

    try {
      (window as any).process = {};
      const instance = await WebContainer.boot();
      (window as any).webcontainerInstance = instance;

      if (mounted) setWebContainer(instance);
      console.log("WebContainer started ✅");
    } catch (err) {
      console.error("WebContainer failed ❌", err);
    }
  };

  init();
  return () => { mounted = false; };
}, []);

  return webContainer; // 🔥 IMPORTANT
}