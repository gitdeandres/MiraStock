import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { getCurrentWindow } from '@tauri-apps/api/window';

window.addEventListener('keydown', async (e) => {
  if (e.key === 'F11') {
    e.preventDefault(); // Evita comportamiento por defecto
    const isFullscreen = await getCurrentWindow().isFullscreen();
    await getCurrentWindow().setFullscreen(!isFullscreen);
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
