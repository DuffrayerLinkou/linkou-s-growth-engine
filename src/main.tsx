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
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Força verificação de atualização do SW a cada carregamento.
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}
