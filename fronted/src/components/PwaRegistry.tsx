"use client";

import { useEffect } from "react";

export function PwaRegistry() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PWA Service Worker registrado con éxito:", registration.scope);
        })
        .catch((error) => {
          console.error("Error al registrar el Service Worker:", error);
        });
    }
  }, []);

  return null;
}
