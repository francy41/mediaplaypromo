"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Play, Square, Sparkles, Crown, Volume2, Gift } from "lucide-react";
import Link from "next/link";

const SAMPLE_TEXTS = [
  "Bienvenidos a MediaPlayPromo, tu plataforma de creación con inteligencia artificial.",
  "Hoy te presento el producto más vendido de nuestra tienda digital.",
  "No olvides suscribirte y activar la campana para más contenido.",
  "Oferta por tiempo limitado: aprovecha el 30% de descuento hoy mismo.",
];

interface Voice { name: string; lang: string; voiceURI: string; }

export function FreeVoiceStudio({ gradient = "from-cyan-400 to-blue-600" }: { gradient?: string }) {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    const load = () => {
      const list = window.speechSynthesis.getVoices().map((v) => ({ name: v.name, lang: v.lang, voiceURI: v.voiceURI }));
      setVoices(list);
      // Preferir una voz en español
      const es = list.find((v) => v.lang.toLowerCase().startsWith("es"));
      if (es && !selectedVoice) setSelectedVoice(es.voiceURI);
      else if (list[0] && !selectedVoice) setSelectedVoice(list[0].voiceURI);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speak = () => {
    if (!text.trim() || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = window.speechSynthesis.getVoices().find((x) => x.voiceURI === selectedVoice);
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("es"));
  const otherVoices = voices.filter((v) => !v.lang.toLowerCase().startsWith("es"));

  return (
    <div className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ring-1 ring-white/20`}>
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Estudio de Voz</h3>
            <p className="text-white/45 text-xs">Vista previa de voz en tu navegador</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
          <Gift className="w-3 h-3" /> 100% GRATIS
        </span>
      </div>

      {!supported ? (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-4 text-sm text-yellow-200/80">
          Tu navegador no soporta síntesis de voz. Prueba con Chrome o Edge.
        </div>
      ) : (
        <>
          {/* Sample texts */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {SAMPLE_TEXTS.map((t, i) => (
              <button key={i} onClick={() => setText(t)}
                className="flex-shrink-0 bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 hover:text-white text-[11px] px-3 py-1.5 rounded-full transition-all max-w-[240px] truncate">
                {t.slice(0, 42)}...
              </button>
            ))}
          </div>

          {/* Text */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Escribe el texto que quieres convertir en voz..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-none"
          />

          {/* Voice selector */}
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              Voz · {voices.length} disponibles en tu sistema
            </label>
            <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40">
              {esVoices.length > 0 && (
                <optgroup label="Español" className="bg-[#0f1219]">
                  {esVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI} className="bg-[#0f1219]">{v.name} ({v.lang})</option>)}
                </optgroup>
              )}
              {otherVoices.length > 0 && (
                <optgroup label="Otros idiomas" className="bg-[#0f1219]">
                  {otherVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI} className="bg-[#0f1219]">{v.name} ({v.lang})</option>)}
                </optgroup>
              )}
            </select>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Velocidad · {rate.toFixed(1)}x</label>
              <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-cyan-500" />
            </div>
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Tono · {pitch.toFixed(1)}</label>
              <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(+e.target.value)} className="w-full accent-cyan-500" />
            </div>
          </div>

          {/* CTA */}
          {speaking ? (
            <button onClick={stop} className="w-full inline-flex items-center justify-center gap-2 bg-red-500/90 hover:bg-red-500 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-all">
              <Square className="w-4 h-4" /> Detener
            </button>
          ) : (
            <button onClick={speak} disabled={!text.trim()}
              className={`shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${gradient} hover:opacity-95 text-white font-bold text-sm px-5 py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50`}>
              <Play className="w-4 h-4" /> Reproducir voz (gratis)
            </button>
          )}

          {/* Upsell a voz HD descargable */}
          <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 border border-violet-500/25 rounded-2xl p-4 flex items-start gap-3">
            <Crown className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm">¿Quieres voz HD descargable + clonación?</p>
              <p className="text-white/55 text-xs mt-0.5 mb-2">La voz gratis del navegador es solo para escuchar. Para voces ultra-realistas, clonación y archivos MP3 descargables, sube a Pro.</p>
              <Link href="/pricing" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow shadow-violet-500/30 transition-all hover:-translate-y-0.5">
                <Sparkles className="w-3 h-3" /> Ver planes Pro
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
