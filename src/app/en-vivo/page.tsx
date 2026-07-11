"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { computeNowPlaying, type LiveItem } from "@/lib/live-sync";
import { Radio, Volume2, VolumeX, Loader2, Maximize2 } from "lucide-react";

interface Config { title: string; block_minutes: number; enabled: boolean }

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export default function EnVivoPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [items, setItems] = useState<LiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [nowTitle, setNowTitle] = useState("");
  const [nextTitle, setNextTitle] = useState("");
  const [remaining, setRemaining] = useState(0);
  const currentId = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch("/api/live", { cache: "no-store" });
      const data = await r.json();
      setConfig(data.config);
      setItems(data.items ?? []);
    } catch {
      /* reintenta en el siguiente ciclo */
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial + refresco de la lista cada 60s (recoge cambios del admin).
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Motor de reproducción sincronizada.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !config || !config.enabled || items.length === 0) return;
    const blockSeconds = config.block_minutes * 60;

    const sync = () => {
      const np = computeNowPlaying(items, blockSeconds, Date.now());
      if (!np) return;
      setNowTitle(np.item.title);
      setNextTitle(np.next.title);
      setRemaining(np.remaining);

      if (currentId.current !== np.item.id) {
        // Cambiar de vídeo → cargar y saltar al segundo exacto.
        currentId.current = np.item.id;
        video.src = np.item.video_url;
        video.load();
        const onMeta = () => {
          try { video.currentTime = np.offset; } catch {}
          video.play().catch(() => {});
          video.removeEventListener("loadedmetadata", onMeta);
        };
        video.addEventListener("loadedmetadata", onMeta);
      } else {
        // Mismo vídeo → corrige la deriva si se aleja > 1.5s del reloj.
        const drift = Math.abs(video.currentTime - np.offset);
        if (drift > 1.5 && Number.isFinite(np.offset)) {
          try { video.currentTime = np.offset; } catch {}
        }
        if (video.paused) video.play().catch(() => {});
      }
    };

    sync();
    const tick = setInterval(sync, 2000);
    // Al volver a la pestaña, re-sincroniza de inmediato.
    const onVis = () => { if (!document.hidden) sync(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(tick); document.removeEventListener("visibilitychange", onVis); };
  }, [config, items]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  const goFull = () => {
    wrapRef.current?.requestFullscreen?.().catch(() => {});
  };

  const offAir = !loading && (!config?.enabled || items.length === 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div ref={wrapRef} className="w-full max-w-4xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> En directo
            </span>
            <span className="text-white/70 text-sm font-semibold">{config?.title ?? "Canal en Directo"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={goFull} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reproductor */}
        <div className="relative aspect-video bg-neutral-950 rounded-2xl overflow-hidden border border-white/10">
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            muted={muted}
            playsInline
            autoPlay
          />
          {loading && (
            <div className="absolute inset-0 grid place-items-center text-white/60">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
          {offAir && (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <Radio className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-white/70 font-bold">Fuera de emisión</p>
                <p className="text-white/40 text-sm mt-1">No hay contenido programado ahora mismo.</p>
              </div>
            </div>
          )}
          {muted && !offAir && !loading && (
            <button onClick={toggleMute}
              className="absolute bottom-4 left-4 inline-flex items-center gap-2 bg-white/90 text-black text-sm font-bold px-3 py-2 rounded-full hover:bg-white">
              <VolumeX className="w-4 h-4" /> Toca para activar el sonido
            </button>
          )}
        </div>

        {/* Info inferior */}
        {!offAir && (
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white/40 text-xs uppercase tracking-wider">Ahora</p>
              <p className="text-white font-semibold truncate">{nowTitle || "—"}</p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-white/40 text-xs uppercase tracking-wider">A continuación · en {fmt(remaining)}</p>
              <p className="text-white/70 text-sm truncate">{nextTitle || "—"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
