"use client";
import { useEffect } from "react";

export function ServiceWorkerProvider() {
    useEffect(() => {
        if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
            void navigator.serviceWorker.register("/service-worker.js", { scope: "/", updateViaCache: "none" })
                .catch((error) => console.error("Service worker registration failed", error));
        }
    }, []);
    return null;
}
