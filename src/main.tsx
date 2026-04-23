import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker — necessário apenas para Push Notifications.
// O SW NÃO faz cache de assets (ver public/sw.js).
//
// Estratégia anti-cache-travado:
// 1. No primeiro load após esta atualização, desregistra QUALQUER SW antigo
//    + limpa todos os caches da Cache API + recarrega 1x (controlado por
//    sessionStorage para nunca entrar em loop).
// 2. Em seguida, registra o SW novo (apenas em produção) para manter
//    push notifications funcionando.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const PURGE_KEY = "linkou-sw-purged-v3";
    const alreadyPurged = sessionStorage.getItem(PURGE_KEY) === "1";

    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const hadOldSw = regs.length > 0;

      if (!alreadyPurged && hadOldSw) {
        // Desregistra tudo + limpa caches + reload único
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
        } catch {}
        sessionStorage.setItem(PURGE_KEY, "1");
        location.reload();
        return;
      }

      sessionStorage.setItem(PURGE_KEY, "1");

      // Re-registra SW novo apenas em produção (necessário para push).
      if (import.meta.env.PROD) {
        const reg = await navigator.serviceWorker.register("/sw.js");
        reg.update().catch(() => {});
      }
    } catch {
      // Silencia — falha no SW nunca pode quebrar o app.
    }
  });
}
