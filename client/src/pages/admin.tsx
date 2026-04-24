import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type SiteSettings, type Hotspot } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Plus, Trash2, Save, ChevronLeft, Video, MapPin, Settings2,
  Clock, Move, Tag, AlignLeft, Globe, Play, Pause, Upload,
  Sparkles, Loader2, CheckCircle2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getVimeoPlayerUrl, isDirectVideoSource, isVimeoUrl, normalizeVideoInput } from "@/lib/media";
import { loadVimeoPlayerApi, type VimeoPlayer } from "@/lib/vimeo";

type Tab = "hotspots" | "hero";

// ─── Video Scrubber ────────────────────────────────────────────────────────────
function VideoScrubber({
  videoUrl,
  onTimeSelect,
}: {
  videoUrl: string;
  onTimeSelect: (t: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const vimeoIframeRef = useRef<HTMLIFrameElement>(null);
  const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isVimeoSource = isVimeoUrl(videoUrl);
  const canScrubLocally = isDirectVideoSource(videoUrl) && !isVimeoSource;
  const vimeoPlayerUrl = getVimeoPlayerUrl(videoUrl);

  useEffect(() => {
    setPlaying(false);
    setCur(0);
    setDur(0);
    setLoadError(null);
  }, [videoUrl]);

  useEffect(() => {
    if (!isVimeoSource || !vimeoPlayerUrl || !vimeoIframeRef.current) return;

    let cancelled = false;
    let handleTimeUpdate: ((payload?: { seconds?: number }) => void) | null = null;

    loadVimeoPlayerApi()
      .then(() => {
        if (cancelled || !window.Vimeo?.Player || !vimeoIframeRef.current) return;

        const player = new window.Vimeo.Player(vimeoIframeRef.current);
        vimeoPlayerRef.current = player;

        player.getDuration()
          .then((duration) => setDur(duration))
          .catch(() => setLoadError("This Vimeo video could not be loaded."));

        handleTimeUpdate = (payload?: { seconds?: number }) => {
          setCur(payload?.seconds ?? 0);
        };

        player.on("timeupdate", handleTimeUpdate);
      })
      .catch(() => setLoadError("This Vimeo video could not be loaded."));

    return () => {
      cancelled = true;
      if (handleTimeUpdate && vimeoPlayerRef.current) {
        vimeoPlayerRef.current.off("timeupdate", handleTimeUpdate);
      }
      vimeoPlayerRef.current = null;
    };
  }, [isVimeoSource, vimeoPlayerUrl]);

  const toggle = async () => {
    if (loadError) return;

    if (isVimeoSource && vimeoPlayerRef.current) {
      try {
        if (playing) {
          await vimeoPlayerRef.current.pause();
          setPlaying(false);
        } else {
          await vimeoPlayerRef.current.play();
          setPlaying(true);
        }
      } catch {
        setPlaying(false);
        setLoadError("This Vimeo video could not be played.");
      }
      return;
    }

    if (!ref.current || !canScrubLocally) return;

    if (playing) {
      ref.current.pause();
      setPlaying(false);
      return;
    }

    try {
      await ref.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setLoadError("This video could not be played. Please upload a valid MP4/WebM file.");
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-sm overflow-hidden">
      <div className="relative bg-black">
        {canScrubLocally ? (
          <video
            ref={ref}
            src={videoUrl}
            className="w-full aspect-video object-cover"
            onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              setDur(e.currentTarget.duration);
              setLoadError(null);
            }}
            onLoadedData={() => setLoadError(null)}
            onEnded={() => setPlaying(false)}
            onError={() => {
              setPlaying(false);
              setDur(0);
              setCur(0);
              setLoadError("This video file could not be loaded. Re-upload the hero video and try again.");
            }}
            muted
            playsInline
          />
        ) : isVimeoSource && vimeoPlayerUrl ? (
          <iframe
            ref={vimeoIframeRef}
            src={vimeoPlayerUrl}
            className="w-full aspect-video"
            allow="autoplay; fullscreen; picture-in-picture"
            title="Vimeo video scrubber"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center p-6 text-center">
            <p className="max-w-sm text-sm text-white/70">
              This time picker only works with direct video files such as MP4/WebM or valid Vimeo links.
            </p>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="max-w-sm text-sm text-white/70">{loadError}</p>
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <input
          type="range"
          min={0}
          max={dur || 0}
          step={0.1}
          value={cur}
          disabled={!dur || !!loadError || (!canScrubLocally && !isVimeoSource)}
          onChange={(e) => {
            const t = parseFloat(e.target.value);
            setCur(t);
            if (isVimeoSource && vimeoPlayerRef.current) {
              vimeoPlayerRef.current.setCurrentTime(t).catch(() => undefined);
            } else if (ref.current) {
              ref.current.currentTime = t;
            }
          }}
          className="w-full accent-amber-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        />
        <div className="flex items-center justify-between">
          <button onClick={toggle} disabled={!dur || !!loadError || (!canScrubLocally && !isVimeoSource)} className="text-white/60 hover:text-white transition-colors disabled:opacity-40 disabled:hover:text-white/60">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <span className="font-mono text-xs text-amber-400">{cur.toFixed(1)}s</span>
          <button
            onClick={() => onTimeSelect(parseFloat(cur.toFixed(1)))}
            disabled={!dur || !!loadError || (!canScrubLocally && !isVimeoSource)}
            className="text-[10px] font-montserrat uppercase tracking-widest text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400 px-2 py-1 rounded-sm transition-all"
          >
            Use This Time
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hotspot Card ──────────────────────────────────────────────────────────────
function HotspotCard({
  hotspot,
  videoUrl,
  onUpdate,
  onDelete,
}: {
  hotspot: Hotspot;
  videoUrl: string;
  onUpdate: (id: string, data: Partial<Hotspot>) => void;
  onDelete: (id: string) => void;
}) {
  const supportsScrubbing = isDirectVideoSource(videoUrl) || isVimeoUrl(videoUrl);
  const [local, setLocal] = useState({ ...hotspot });
  const [scrubTarget, setScrubTarget] = useState<"start" | "end" | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dirty) return;
    setLocal({ ...hotspot });
    setDirty(false);
  }, [hotspot, dirty]);

  const set = (key: keyof Hotspot, val: any) => {
    setLocal((p) => ({ ...p, [key]: val }));
    setDirty(true);
  };

  const save = () => {
    onUpdate(hotspot.id, local);
    setDirty(false);
  };

  const saveIfDirty = () => {
    if (!dirty) return;
    save();
  };

  return (
    <div className="border border-white/10 rounded-sm bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <input
          value={local.title}
          onChange={(e) => set("title", e.target.value)}
          onBlur={saveIfDirty}
          className="bg-transparent font-cinzel text-white text-base font-bold w-full focus:outline-none placeholder:text-white/30"
          placeholder="Place Name"
        />
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {dirty && (
            <Button size="sm" onClick={save} className="bg-amber-400 text-black hover:bg-amber-300 h-7 text-xs gap-1">
              <Save className="w-3 h-3" /> Save
            </Button>
          )}
          <button onClick={() => onDelete(hotspot.id)} className="text-white/30 hover:text-red-400 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1"><Tag className="w-3 h-3" /> Label</Label>
              <Input value={local.label} onChange={(e) => set("label", e.target.value)} onBlur={saveIfDirty} className="bg-white/5 border-white/10 text-sm h-8" placeholder="e.g. UNESCO Heritage" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1"><Globe className="w-3 h-3" /> Location</Label>
              <Input value={local.location} onChange={(e) => set("location", e.target.value)} onBlur={saveIfDirty} className="bg-white/5 border-white/10 text-sm h-8" placeholder="City, State" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Description</Label>
            <Textarea value={local.description} onChange={(e) => set("description", e.target.value)} onBlur={saveIfDirty} className="bg-white/5 border-white/10 text-sm resize-none h-24" placeholder="Short description shown on hover..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Start (s)</Label>
              <div className="flex gap-1">
                <Input type="number" value={local.timeStart} onChange={(e) => set("timeStart", parseFloat(e.target.value))} onBlur={saveIfDirty} className="bg-white/5 border-white/10 text-sm h-8" />
                <button disabled={!supportsScrubbing} onClick={() => setScrubTarget(scrubTarget === "start" ? null : "start")} className={`px-2 rounded-sm border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${scrubTarget === "start" ? "bg-amber-400 border-amber-400 text-black" : "border-white/10 text-white/40 hover:text-white"}`}>
                  <Video className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> End (s)</Label>
              <div className="flex gap-1">
                <Input type="number" value={local.timeEnd} onChange={(e) => set("timeEnd", parseFloat(e.target.value))} onBlur={saveIfDirty} className="bg-white/5 border-white/10 text-sm h-8" />
                <button disabled={!supportsScrubbing} onClick={() => setScrubTarget(scrubTarget === "end" ? null : "end")} className={`px-2 rounded-sm border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${scrubTarget === "end" ? "bg-amber-400 border-amber-400 text-black" : "border-white/10 text-white/40 hover:text-white"}`}>
                  <Video className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1"><Move className="w-3 h-3" /> X Position</Label>
              <Input value={local.x} onChange={(e) => set("x", e.target.value)} onBlur={saveIfDirty} className="bg-white/5 border-white/10 text-sm h-8" placeholder="50%" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1"><Move className="w-3 h-3" /> Y Position</Label>
              <Input value={local.y} onChange={(e) => set("y", e.target.value)} onBlur={saveIfDirty} className="bg-white/5 border-white/10 text-sm h-8" placeholder="50%" />
            </div>
          </div>
        </div>

        {/* Scrubber */}
        <div>
          {scrubTarget ? (
            <div className="space-y-2">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest">Picking {scrubTarget === "start" ? "Start" : "End"} time</p>
              <VideoScrubber videoUrl={videoUrl} onTimeSelect={(t) => { set(scrubTarget === "start" ? "timeStart" : "timeEnd", t); setScrubTarget(null); }} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-sm">
              <Video className="w-6 h-6 text-white/20 mb-2" />
              <p className="text-white/30 text-xs">
                {supportsScrubbing
                  ? <>Click the <span className="text-amber-400">video icon</span> next to Start or End to scrub and pick the exact moment.</>
                  : "Enter start and end times manually. Scrubbing works with direct video files and valid Vimeo links."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="px-4 pb-3">
        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="absolute h-full bg-amber-400/60 rounded-full" style={{ left: `${(local.timeStart / 120) * 100}%`, width: `${Math.max(((local.timeEnd - local.timeStart) / 120) * 100, 0.5)}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-white/20 font-mono">0s</span>
          <span className="text-[9px] text-amber-400/60 font-mono">{local.timeStart}s → {local.timeEnd}s</span>
          <span className="text-[9px] text-white/20 font-mono">120s</span>
        </div>
      </div>
    </div>
  );
}

// ─── Detected Scene Card ───────────────────────────────────────────────────────
type DetectedScene = {
  timeStart: number; timeEnd: number; thumbnail: string;
  x: string; y: string; label: string; title: string; location: string; description: string;
};

function SceneCard({ scene, onAdd }: { scene: DetectedScene; onAdd: (s: DetectedScene) => void }) {
  const [local, setLocal] = useState({ ...scene });
  const set = (k: keyof DetectedScene, v: string) => setLocal((p) => ({ ...p, [k]: v }));

  return (
    <div className="border border-white/10 rounded-sm bg-white/[0.02] overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-black/40 flex-shrink-0">
        <img src={local.thumbnail} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 rounded-sm px-2 py-0.5">
          <Clock className="w-2.5 h-2.5 text-amber-400" />
          <span className="font-mono text-[10px] text-amber-400">{local.timeStart}s – {local.timeEnd}s</span>
        </div>
      </div>

      <div className="p-3 space-y-2.5 flex-1">
        <Input value={local.title} onChange={(e) => set("title", e.target.value)} className="bg-white/5 border-white/10 text-sm h-8 font-semibold" placeholder="Place Name *" />
        <Input value={local.label} onChange={(e) => set("label", e.target.value)} className="bg-white/5 border-white/10 text-xs h-7" placeholder="Label (e.g. UNESCO Heritage)" />
        <Input value={local.location} onChange={(e) => set("location", e.target.value)} className="bg-white/5 border-white/10 text-xs h-7" placeholder="Location, State" />
        <Textarea value={local.description} onChange={(e) => set("description", e.target.value)} className="bg-white/5 border-white/10 text-xs resize-none h-16" placeholder="Short description..." />
      </div>

      <div className="px-3 pb-3">
        <Button
          onClick={() => onAdd(local)}
          disabled={!local.title.trim()}
          className="w-full bg-amber-400 text-black hover:bg-amber-300 h-8 text-xs gap-1.5 disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Add as Hotspot
        </Button>
      </div>
    </div>
  );
}

// ─── Video Upload ──────────────────────────────────────────────────────────────
function VideoUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const handleFile = async (file: File) => {
    setProgress(0);
    setDone(false);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload-video");
    xhr.setRequestHeader("X-Filename", file.name);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const { url } = JSON.parse(xhr.responseText);
        setDone(true);
        setProgress(null);
        onUploaded(url);
        toast({ title: "Video uploaded successfully" });
      } else {
        setProgress(null);
        toast({ title: "Upload failed", variant: "destructive" });
      }
    };
    xhr.onerror = () => { setProgress(null); toast({ title: "Upload error", variant: "destructive" }); };
    xhr.send(file);
  };

  return (
    <div
      className="border-2 border-dashed border-white/20 hover:border-amber-400/50 rounded-sm p-6 text-center cursor-pointer transition-colors"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
    >
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      {progress !== null ? (
        <div className="space-y-3">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Uploading… {progress}%</p>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      ) : done ? (
        <div className="space-y-1">
          <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
          <p className="text-emerald-400 text-sm">Uploaded!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="w-7 h-7 text-white/30 mx-auto" />
          <p className="text-white/50 text-sm">Drag & drop or click to upload a video</p>
          <p className="text-white/25 text-xs">MP4, WebM, MOV — any size</p>
        </div>
      )}
    </div>
  );
}

// ─── Hero Tab ──────────────────────────────────────────────────────────────────
function HeroTab() {
  const { toast } = useToast();
  const { data: settings } = useQuery<SiteSettings>({ queryKey: ["/api/site-settings"] });
  const [videoInput, setVideoInput] = useState("");
  const [imageInput, setImageInput] = useState("");

  const update = useMutation({
    mutationFn: async (data: Partial<SiteSettings>) => {
      const res = await apiRequest("PATCH", "/api/site-settings", data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] }); toast({ title: "Saved" }); },
  });

  useEffect(() => {
    if (!settings) return;
    setVideoInput(settings.heroVideoUrl ?? "");
    setImageInput(settings.heroImageUrl ?? "");
  }, [settings]);

  if (!settings) return null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Upload */}
      <div className="p-5 border border-white/10 rounded-sm space-y-4">
        <p className="text-[10px] text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><Upload className="w-3 h-3" /> Upload Video</p>
        <VideoUpload onUploaded={(url) => update.mutate({ heroVideoUrl: url, heroMediaType: "video" })} />
        {settings.heroVideoUrl && (
          <p className="text-[10px] text-white/30 font-mono truncate">Current: {settings.heroVideoUrl}</p>
        )}
        <p className="text-[10px] text-white/25">
          You can also skip uploads and paste a Vimeo link below, like `https://vimeo.com/123456789`.
        </p>
      </div>

      {/* Media type */}
      <div className="p-5 border border-white/10 rounded-sm space-y-5">
        <p className="text-[10px] text-amber-400 uppercase tracking-widest">Media Type</p>
        <RadioGroup defaultValue={settings.heroMediaType} onValueChange={(v) => update.mutate({ heroMediaType: v })} className="flex gap-6">
          <div className="flex items-center gap-2"><RadioGroupItem value="video" id="r-video" /><Label htmlFor="r-video">Video</Label></div>
          <div className="flex items-center gap-2"><RadioGroupItem value="image" id="r-image" /><Label htmlFor="r-image">Image</Label></div>
        </RadioGroup>
        {settings.heroMediaType === "video" ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Video URL or path</Label>
            <Input
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              onBlur={(e) => {
                const normalized = normalizeVideoInput(e.target.value);
                setVideoInput(normalized);
                update.mutate({ heroVideoUrl: normalized });
              }}
              className="bg-white/5 border-white/10"
              placeholder="https://vimeo.com/123456789 or /hero.mp4"
            />
            <p className="text-[10px] text-white/25">
              Vimeo works for the hero background. Hotspot time scrubbing is only available for direct video files.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Image URL</Label>
            <Input
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onBlur={(e) => update.mutate({ heroImageUrl: e.target.value })}
              className="bg-white/5 border-white/10"
            />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="p-5 border border-white/10 rounded-sm space-y-5">
        <p className="text-[10px] text-amber-400 uppercase tracking-widest">Hero Text</p>
        {(["showHeroTitle", "showHeroSubtitle", "showHeroDescription"] as const).map((key) => {
          const labelMap = { showHeroTitle: "Title", showHeroSubtitle: "Subtitle", showHeroDescription: "Description" };
          const textKey = ({ showHeroTitle: "heroTitle", showHeroSubtitle: "heroSubtitle", showHeroDescription: "heroDescription" } as const)[key];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{labelMap[key]}</Label>
                <Switch checked={settings[key]} onCheckedChange={(v) => update.mutate({ [key]: v })} />
              </div>
              {settings[key] && <Input defaultValue={settings[textKey] ?? ""} onBlur={(e) => update.mutate({ [textKey]: e.target.value })} className="bg-white/5 border-white/10" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Admin Page ────────────────────────────────────────────────────────────────
export default function Admin() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("hotspots");
  const [detectedScenes, setDetectedScenes] = useState<DetectedScene[] | null>(null);
  const [detecting, setDetecting] = useState(false);

  const { data: settings } = useQuery<SiteSettings>({ queryKey: ["/api/site-settings"] });
  const { data: hotspots } = useQuery<Hotspot[]>({ queryKey: ["/api/hotspots"] });
  const sorted = [...(hotspots ?? [])].sort((a, b) => a.timeStart - b.timeStart);
  const videoUrl = settings?.heroVideoUrl || "";
  const supportsSceneDetection = isDirectVideoSource(videoUrl);

  const create = useMutation({
    mutationFn: async (data?: Partial<Hotspot>) => {
      const res = await apiRequest("POST", "/api/hotspots", {
        timeStart: 0, timeEnd: 5, x: "50%", y: "50%",
        label: "", title: "New Place", location: "", description: "",
        ...data,
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] }); toast({ title: "Hotspot added" }); },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Hotspot> }) => {
      const res = await apiRequest("PATCH", `/api/hotspots/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] }); toast({ title: "Saved" }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/hotspots/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] }); toast({ title: "Deleted" }); },
  });

  const detectScenes = async () => {
    setDetecting(true);
    setDetectedScenes(null);
    try {
      const res = await apiRequest("POST", "/api/detect-scenes", {});
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error(data.error || "Detection failed");
      setDetectedScenes(data);
      toast({ title: `${data.length} scenes detected` });
    } catch (e: any) {
      toast({ title: "Detection failed", description: e.message, variant: "destructive" });
    } finally {
      setDetecting(false);
    }
  };

  const addSceneAsHotspot = (scene: DetectedScene) => {
    create.mutate(scene);
    setDetectedScenes((prev) => prev?.filter((s) => s !== scene) ?? null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-black/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/"><button className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5 text-xs"><ChevronLeft className="w-3.5 h-3.5" /> Back to site</button></Link>
            <div className="h-4 w-px bg-white/10" />
            <span className="font-cinzel text-sm tracking-widest">Admin Panel</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/10">
          {([
            { id: "hotspots", label: "Hotspot Markers", icon: MapPin },
            { id: "hero", label: "Hero Settings", icon: Settings2 },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-xs font-montserrat uppercase tracking-widest border-b-2 transition-all -mb-px ${tab === id ? "border-amber-400 text-amber-400" : "border-transparent text-white/40 hover:text-white"}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* ── Hotspots tab ── */}
        {tab === "hotspots" && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => create.mutate({})} className="bg-white/10 hover:bg-white/15 text-white h-8 text-xs gap-1.5 border border-white/10">
                <Plus className="w-3.5 h-3.5" /> Add Manually
              </Button>
              <Button
                onClick={detectScenes}
                disabled={detecting || !videoUrl || !supportsSceneDetection}
                className="bg-amber-400 text-black hover:bg-amber-300 h-8 text-xs gap-1.5 disabled:opacity-50"
              >
                {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {detecting ? "Detecting scenes…" : "Auto-detect Scenes"}
              </Button>
              {detecting && <p className="text-white/30 text-xs">Analysing video, this takes ~15s…</p>}
              <div className="ml-auto text-white/30 text-xs">{sorted.length} hotspot{sorted.length !== 1 ? "s" : ""}</div>
            </div>

            {/* Auto-detected scenes */}
            {detectedScenes && detectedScenes.length > 0 && (
              <div className="border border-amber-400/20 rounded-sm p-4 space-y-4 bg-amber-400/5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> {detectedScenes.length} detected scenes — fill in details and add
                  </p>
                  <button onClick={() => setDetectedScenes(null)} className="text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {detectedScenes.map((scene, i) => (
                    <SceneCard key={i} scene={scene} onAdd={addSceneAsHotspot} />
                  ))}
                </div>
              </div>
            )}

            {/* Existing hotspots */}
            <div className="space-y-3">
              {sorted.map((h) => (
                <HotspotCard
                  key={h.id}
                  hotspot={h}
                  videoUrl={videoUrl}
                  onUpdate={(id, data) => update.mutate({ id, data })}
                  onDelete={(id) => remove.mutate(id)}
                />
              ))}
              {sorted.length === 0 && !detectedScenes && (
                <div className="text-center py-16 text-white/20 text-sm border border-dashed border-white/10 rounded-sm">
                  No hotspots yet — add one manually or auto-detect from the video.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Hero tab ── */}
        {tab === "hero" && <HeroTab />}
      </div>
    </div>
  );
}
