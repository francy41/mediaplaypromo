import "server-only";
import { createHash, randomBytes } from "node:crypto";
import WebSocket from "ws";

/**
 * Cliente de Microsoft Edge "Read Aloud" TTS — voces neuronales GRATIS, sin API key.
 * Habla el mismo protocolo WebSocket que usa el navegador Edge. No requiere GPU.
 *
 * Auth: token de cliente de confianza público + firma Sec-MS-GEC (SHA-256 del
 * timestamp en "ticks" redondeado a 5 min + el token). Es el mismo esquema que
 * usa la herramienta `edge-tts`.
 */
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_VERSION = "143.0.3650.96";
const WSS = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";

/** Firma Sec-MS-GEC: SHA-256(ticks_redondeados_5min + TRUSTED_CLIENT_TOKEN) en HEX mayúsculas. */
function secMsGec(): string {
  const ticks = Math.floor(Date.now() / 1000) + 11644473600; // epoch Windows en segundos
  const rounded = ticks - (ticks % 300);                     // redondea a 5 min
  const windowsTicks = rounded * 10000000;                   // a "ticks" de 100 ns
  return createHash("sha256").update(`${windowsTicks}${TRUSTED_CLIENT_TOKEN}`, "ascii").digest("hex").toUpperCase();
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export interface EdgeProsody { rate?: string; pitch?: string; volume?: string }

/** Sintetiza `text` con la voz Edge indicada (p.ej. "es-MX-DaliaNeural") y devuelve MP3. */
export async function edgeTTS(voice: string, text: string, prosody: EdgeProsody = {}, timeoutMs = 45000): Promise<Buffer> {
  const lang = voice.split("-").slice(0, 2).join("-") || "es-MX";
  const reqId = randomBytes(16).toString("hex");
  const url = `${WSS}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec()}&Sec-MS-GEC-Version=1-${CHROMIUM_VERSION}&ConnectionId=${reqId}`;
  const ws = new WebSocket(url, {
    headers: {
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
    },
  });

  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let done = false;
    const finish = (fn: () => void) => { if (done) return; done = true; clearTimeout(timer); try { ws.close(); } catch {} fn(); };
    const timer = setTimeout(() => finish(() => reject(new Error("edge tts timeout"))), timeoutMs);

    ws.on("open", () => {
      ws.send(`X-Timestamp:${new Date().toString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`);
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voice}'><prosody pitch='${prosody.pitch || "+0Hz"}' rate='${prosody.rate || "+0%"}' volume='${prosody.volume || "+0%"}'>${xmlEscape(text)}</prosody></voice></speak>`;
      ws.send(`X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toString()}Z\r\nPath:ssml\r\n\r\n${ssml}`);
    });

    ws.on("message", (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        if (data.length < 2) return;
        const headerLen = data.readUInt16BE(0);
        const audio = data.subarray(2 + headerLen);
        if (audio.length) chunks.push(Buffer.from(audio));
      } else if (data.toString("utf8").includes("Path:turn.end")) {
        finish(() => resolve(Buffer.concat(chunks)));
      }
    });

    ws.on("error", (e: Error) => finish(() => reject(e)));
    ws.on("close", () => finish(() => (chunks.length ? resolve(Buffer.concat(chunks)) : reject(new Error("edge tts: sin audio")))));
  });
}
