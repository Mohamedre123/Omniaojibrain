"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, Play, Pause, Download, Loader2, Volume2, Info } from "lucide-react";

type SpeechVoice = {
  name: string;
  lang: string;
  default: boolean;
};

export default function VoiceOverPage() {
  const [text, setText] = useState("");
  const [provider, setProvider] = useState<"browser" | "elevenlabs">("browser");
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function load() {
      const list = window.speechSynthesis.getVoices()
        .filter((v) => v.lang.startsWith("ar") || v.lang.startsWith("en"))
        .map((v) => ({ name: v.name, lang: v.lang, default: v.default }));
      setVoices(list);
      const arabic = list.find((v) => v.lang.startsWith("ar"));
      if (arabic) setSelectedVoice(arabic.name);
      else if (list[0]) setSelectedVoice(list[0].name);
    }
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  async function generate() {
    if (!text.trim()) { toast.error("اكتب النص"); return; }
    setGenerating(true);
    setAudioUrl("");

    if (provider === "browser") {
      // Web Speech API - مجاني
      const u = new SpeechSynthesisUtterance(text);
      const voice = window.speechSynthesis.getVoices().find((v) => v.name === selectedVoice);
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = pitch;
      u.lang = voice?.lang || "ar-EG";

      u.onstart = () => setPlaying(true);
      u.onend = () => { setPlaying(false); setGenerating(false); };
      u.onerror = () => { setPlaying(false); setGenerating(false); toast.error("تعذّر التشغيل"); };

      setUtterance(u);
      window.speechSynthesis.speak(u);
    } else {
      // ElevenLabs
      try {
        const res = await fetch("/api/voice-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "تعذّر التوليد"); setGenerating(false); return; }
        const url = `data:${data.mimeType};base64,${data.audioBase64}`;
        setAudioUrl(url);
        toast.success("تمّ التوليد");
      } catch {
        toast.error("تعذّر الاتصال");
      } finally {
        setGenerating(false);
      }
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mic className="size-7 text-primary" />
          Voice-over
        </h1>
        <p className="text-muted-foreground mt-2">
          تعليق صوتي احترافي لإعلاناتك بأيّ صوت
        </p>
      </div>

      <Card className="p-3 mb-4 flex gap-2">
        <button
          onClick={() => setProvider("browser")}
          className={`flex-1 p-3 rounded-md text-sm transition-all ${provider === "browser" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          🎙️ صوت المتصفّح <span className="text-[10px] block opacity-80">مجاني • فوري</span>
        </button>
        <button
          onClick={() => setProvider("elevenlabs")}
          className={`flex-1 p-3 rounded-md text-sm transition-all ${provider === "elevenlabs" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          🎵 ElevenLabs <span className="text-[10px] block opacity-80">احترافي • مدفوع</span>
        </button>
      </Card>

      <Card className="p-5 space-y-4">
        {provider === "elevenlabs" && (
          <Card className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 flex items-start gap-2 text-sm">
            <Info className="size-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-emerald-900 dark:text-emerald-200">
              ✅ ElevenLabs مفعّل. اكتب النصّ واضغط &quot;تشغيل/توليد&quot; للحصول على صوت احترافي يدعم العربية.
            </div>
          </Card>
        )}

        <div>
          <Label htmlFor="text">النصّ</Label>
          <Textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب النصّ الذي تريد تحويله لصوت..."
            rows={6}
            className="mt-1"
          />
          <div className="text-xs text-muted-foreground mt-1">{text.length} / 3000</div>
        </div>

        {provider === "browser" && voices.length > 0 && (
          <>
            <div>
              <Label htmlFor="voice">الصوت</Label>
              <select
                id="voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rate">السرعة: {rate.toFixed(1)}</Label>
                <input id="rate" type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="w-full mt-2" />
              </div>
              <div>
                <Label htmlFor="pitch">طبقة الصوت: {pitch.toFixed(1)}</Label>
                <input id="pitch" type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value))} className="w-full mt-2" />
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2">
          {!playing ? (
            <Button onClick={generate} disabled={generating} variant="gradient" className="flex-1">
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Volume2 className="size-4" />}
              تشغيل / توليد
            </Button>
          ) : (
            <Button onClick={stop} variant="destructive" className="flex-1">
              <Pause className="size-4" /> إيقاف
            </Button>
          )}
        </div>

        {audioUrl && (
          <Card className="p-4">
            <audio src={audioUrl} controls className="w-full" />
            <a href={audioUrl} download="oji-voiceover.mp3" className="inline-flex items-center gap-1 text-sm text-primary mt-2">
              <Download className="size-3" /> تنزيل MP3
            </a>
          </Card>
        )}
      </Card>
    </div>
  );
}
