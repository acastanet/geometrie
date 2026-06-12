import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";

type GgbStatus = "pending" | "ready" | "error";

const GGB_CDN = "https://www.geogebra.org/apps/deployggb.js";

export default function App() {
  const [ggbStatus, setGgbStatus] = useState<GgbStatus>("pending");

  useEffect(() => {
    // Inject the Outfit font if not already present
    if (!document.getElementById("google-fonts-outfit")) {
      const link = document.createElement("link");
      link.id = "google-fonts-outfit";
      link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    if (document.querySelector(`script[src="${GGB_CDN}"]`)) {
      setGgbStatus("ready");
      return;
    }

    const script = document.createElement("script");
    script.src = GGB_CDN;
    script.async = true;
    script.onload = () => setGgbStatus("ready");
    script.onerror = () => setGgbStatus("error");
    document.head.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Outfit'] relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-klein/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-mimo-red/5 blur-[120px] pointer-events-none"></div>

      <header className="glass px-8 py-4 flex items-center gap-4 shadow-sm z-10 sticky top-0">
        <div className="w-10 h-10 bg-klein flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-klein/30 transform transition hover:scale-105">
          M
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800 tracking-tight">Tuteur Maths</p>
          <p className="text-sm font-medium text-slate-500">Droites affines — Seconde</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto py-4 z-10 relative">
        {ggbStatus === "error" ? (
          <div className="flex justify-center items-center h-40 text-mimo-red text-sm font-medium bg-red-50 mx-4 p-4 border border-red-200">
            Impossible de charger GeoGebra. Vérifiez votre connexion internet.
          </div>
        ) : (
          <ChatWindow ggbReady={ggbStatus === "ready"} />
        )}
      </main>
    </div>
  );
}
